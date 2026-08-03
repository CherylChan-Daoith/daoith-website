#!/usr/bin/env python3
"""WeChat OAuth helpers for local server.py development."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "daoith-auth.db"

WECHAT_TOKEN_URL = "https://api.weixin.qq.com/sns/oauth2/access_token"
WECHAT_USERINFO_URL = "https://api.weixin.qq.com/sns/userinfo"

_env_loader = lambda name: os.environ.get(name, "").strip()


def set_env_loader(loader):
    global _env_loader
    _env_loader = loader


def load_env_value(name, loader=None):
    fn = loader or _env_loader
    val = fn(name)
    if val:
        return val
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def get_database_url():
    return load_env_value("DATABASE_URL") or load_env_value("POSTGRES_URL")


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * ((4 - len(data) % 4) % 4)
    return base64.urlsafe_b64decode(data + padding)


def sign_jwt(payload: dict, secret: str, ttl_sec: int = 60 * 60 * 24 * 7) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    body = {**payload, "iat": now, "exp": now + ttl_sec}
    encoded_header = _b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = _b64url_encode(json.dumps(body, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    return f"{encoded_header}.{encoded_payload}.{_b64url_encode(signature)}"


def verify_jwt(token: str, secret: str):
    try:
        encoded_header, encoded_payload, signature = token.split(".")
    except ValueError:
        return None

    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    expected = hmac.new(secret.encode(), signing_input, hashlib.sha256).digest()
    try:
        actual = _b64url_decode(signature)
    except Exception:
        return None

    if not hmac.compare_digest(expected, actual):
        return None

    try:
        payload = json.loads(_b64url_decode(encoded_payload))
    except json.JSONDecodeError:
        return None

    if payload.get("exp", 0) < int(time.time()):
        return None
    return payload


def _import_psycopg():
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        return psycopg2, RealDictCursor
    except ImportError as err:
        raise RuntimeError(
            "已配置 DATABASE_URL，但未安装 psycopg2。请执行: pip install psycopg2-binary"
        ) from err


def _pg_connect():
    psycopg2, _ = _import_psycopg()
    url = get_database_url()
    if not url:
        raise RuntimeError("DATABASE_URL is not configured")
    return psycopg2.connect(url)


def ensure_db():
    database_url = get_database_url()
    if database_url:
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                      id SERIAL PRIMARY KEY,
                      openid TEXT NOT NULL UNIQUE,
                      unionid TEXT,
                      nickname TEXT,
                      avatar_url TEXT,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)")
            conn.commit()
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              openid TEXT NOT NULL UNIQUE,
              unionid TEXT,
              nickname TEXT,
              avatar_url TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)")
        conn.commit()


def _row_to_user(row):
    if not row:
        return None
    if isinstance(row, dict):
        return {
            "id": row["id"],
            "openid": row["openid"],
            "unionid": row.get("unionid"),
            "nickname": row.get("nickname"),
            "avatarUrl": row.get("avatar_url"),
            "createdAt": row.get("created_at"),
            "updatedAt": row.get("updated_at"),
        }
    return {
        "id": row[0],
        "openid": row[1],
        "unionid": row[2],
        "nickname": row[3],
        "avatarUrl": row[4],
        "createdAt": row[5],
        "updatedAt": row[6],
    }


def upsert_wechat_user(openid, unionid=None, nickname=None, avatar_url=None):
    ensure_db()
    now = datetime.now(timezone.utc).isoformat()

    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO users (openid, unionid, nickname, avatar_url, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (openid) DO UPDATE SET
                      unionid = EXCLUDED.unionid,
                      nickname = EXCLUDED.nickname,
                      avatar_url = EXCLUDED.avatar_url,
                      updated_at = EXCLUDED.updated_at
                    RETURNING id, openid, unionid, nickname, avatar_url, created_at, updated_at
                    """,
                    (openid, unionid, nickname, avatar_url, now, now),
                )
                row = cur.fetchone()
            conn.commit()
        return _row_to_user(row)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO users (openid, unionid, nickname, avatar_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(openid) DO UPDATE SET
              unionid = excluded.unionid,
              nickname = excluded.nickname,
              avatar_url = excluded.avatar_url,
              updated_at = excluded.updated_at
            """,
            (openid, unionid, nickname, avatar_url, now, now),
        )
        row = conn.execute(
            "SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at FROM users WHERE openid = ?",
            (openid,),
        ).fetchone()
        conn.commit()
    return _row_to_user(row)


def get_user_by_id(user_id: int):
    ensure_db()

    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at
                    FROM users
                    WHERE id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
        return _row_to_user(row)

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT id, openid, unionid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return _row_to_user(row)


# Bypass system HTTP proxy (common on Chinese cloud hosts; breaks WeChat API)
_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def _fetch_json(url: str, timeout: int = 8):
    req = urllib.request.Request(url, method="GET", headers={"User-Agent": "daoith-auth/1.0"})
    try:
        with _NO_PROXY_OPENER.open(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as err:
        raise TimeoutError(f"微信接口不可达或超时: {err}") from err
    if data.get("errcode"):
        raise ValueError(data.get("errmsg") or f"WeChat API error {data['errcode']}")
    return data


def _post_json(url: str, payload: dict, timeout: int = 15):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "User-Agent": "daoith-auth/1.0",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    try:
        with _NO_PROXY_OPENER.open(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as err:
        raise TimeoutError(f"微信接口不可达或超时: {err}") from err
    if data.get("errcode"):
        raise ValueError(data.get("errmsg") or f"WeChat API error {data['errcode']}")
    return data


_OA_TOKEN_CACHE = {"token": "", "expires_at": 0}


def get_oa_access_token(env_loader):
    now = time.time()
    if _OA_TOKEN_CACHE["token"] and _OA_TOKEN_CACHE["expires_at"] > now + 60:
        return _OA_TOKEN_CACHE["token"]

    app_id = load_env_value("WECHAT_OA_APP_ID", env_loader)
    app_secret = load_env_value("WECHAT_OA_APP_SECRET", env_loader)
    if not app_id or not app_secret:
        raise RuntimeError("未配置服务号凭证")

    params = urllib.parse.urlencode(
        {
            "grant_type": "client_credential",
            "appid": app_id,
            "secret": app_secret,
        }
    )
    data = _fetch_json(f"https://api.weixin.qq.com/cgi-bin/token?{params}", timeout=15)
    token = data.get("access_token") or ""
    if not token:
        raise ValueError("未获取到服务号 access_token")
    expires_in = int(data.get("expires_in") or 7200)
    _OA_TOKEN_CACHE["token"] = token
    _OA_TOKEN_CACHE["expires_at"] = now + expires_in
    return token


_OA_ARTICLES_CACHE = {"items": None, "fetched_at": 0, "total": 0}


def handle_oa_articles(env_loader, offset: int = 0, count: int = 20):
    """Return published OA articles for website list + open-in-WeChat links."""
    set_env_loader(env_loader)
    offset = max(0, int(offset or 0))
    count = max(1, min(int(count or 20), 20))
    cache_ttl = 600

    now = time.time()
    if (
        _OA_ARTICLES_CACHE["items"] is not None
        and now - _OA_ARTICLES_CACHE["fetched_at"] < cache_ttl
        and offset == 0
    ):
        items = _OA_ARTICLES_CACHE["items"][:count]
        return 200, {
            "source": "wechat_oa",
            "cached": True,
            "total": _OA_ARTICLES_CACHE["total"],
            "articles": items,
        }

    try:
        token = get_oa_access_token(env_loader)
        data = _post_json(
            f"https://api.weixin.qq.com/cgi-bin/freepublish/batchget?access_token={token}",
            {"offset": offset, "count": count, "no_content": 0},
            timeout=20,
        )
        articles = []
        for entry in data.get("item") or []:
            update_time = entry.get("update_time") or 0
            date_str = ""
            if update_time:
                date_str = datetime.fromtimestamp(int(update_time), tz=timezone.utc).astimezone().strftime("%Y-%m-%d")
            news_items = ((entry.get("content") or {}).get("news_item")) or []
            for idx, news in enumerate(news_items):
                if news.get("is_deleted"):
                    continue
                url = (news.get("url") or "").strip()
                if not url:
                    continue
                articles.append(
                    {
                        "id": f"{entry.get('article_id') or 'oa'}-{idx}",
                        "articleId": entry.get("article_id"),
                        "title": (news.get("title") or "").strip() or "未命名文章",
                        "digest": (news.get("digest") or "").strip(),
                        "author": (news.get("author") or "").strip() or "道一跨境咨询",
                        "url": url,
                        "thumbUrl": (news.get("thumb_url") or "").strip(),
                        "date": date_str,
                        "updateTime": update_time,
                    }
                )

        if offset == 0:
            _OA_ARTICLES_CACHE["items"] = articles
            _OA_ARTICLES_CACHE["fetched_at"] = now
            _OA_ARTICLES_CACHE["total"] = int(data.get("total_count") or len(articles))

        return 200, {
            "source": "wechat_oa",
            "cached": False,
            "total": int(data.get("total_count") or len(articles)),
            "articles": articles,
            "hint": "列表来自微信服务号已发布图文。"
            if articles
            else "暂未拉到已发布图文。请确认文章是通过公众号「发表」发布，且服务号已认证并开通发布接口权限。",
        }
    except RuntimeError as e:
        return 503, {"error": str(e), "articles": []}
    except ValueError as e:
        return 400, {"error": str(e), "articles": []}
    except Exception as e:
        return 502, {"error": str(e), "articles": []}


def exchange_wechat_code(code: str, app_id: str, app_secret: str):
    params = urllib.parse.urlencode(
        {
            "appid": app_id,
            "secret": app_secret,
            "code": code,
            "grant_type": "authorization_code",
        }
    )
    return _fetch_json(f"{WECHAT_TOKEN_URL}?{params}")


def fetch_wechat_userinfo(access_token: str, openid: str):
    params = urllib.parse.urlencode(
        {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN",
        }
    )
    return _fetch_json(f"{WECHAT_USERINFO_URL}?{params}")


def handle_wechat_login(body: dict, env_loader):
    set_env_loader(env_loader)
    code = (body.get("code") or "").strip()
    if not code:
        return 400, {"error": "缺少微信授权 code"}

    jwt_secret = load_env_value("JWT_SECRET", env_loader)
    if not jwt_secret:
        return 503, {"error": "未配置 JWT_SECRET", "hint": "请在 .env 中设置 JWT_SECRET"}

    app_id = load_env_value("WECHAT_APP_ID", env_loader)
    app_secret = load_env_value("WECHAT_APP_SECRET", env_loader)
    if not app_id or not app_secret:
        return 503, {
            "error": "未配置微信应用凭证",
            "hint": "请在 .env 中设置 WECHAT_APP_ID 和 WECHAT_APP_SECRET",
        }

    try:
        token_data = exchange_wechat_code(code, app_id, app_secret)
        user_info = fetch_wechat_userinfo(token_data["access_token"], token_data["openid"])
        user = upsert_wechat_user(
            openid=user_info["openid"],
            unionid=user_info.get("unionid") or token_data.get("unionid"),
            nickname=user_info.get("nickname"),
            avatar_url=user_info.get("headimgurl"),
        )
        jwt_token = sign_jwt({"sub": str(user["id"]), "openid": user["openid"]}, jwt_secret)
        return 200, {
            "token": jwt_token,
            "user": {
                "id": user["id"],
                "openid": user["openid"],
                "nickname": user["nickname"],
                "avatarUrl": user["avatarUrl"],
            },
        }
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        return 502, {"error": "微信接口请求失败", "detail": detail}
    except ValueError as e:
        return 400, {"error": str(e)}
    except Exception as e:
        return 502, {"error": str(e)}


def handle_wechat_me(auth_header: str, env_loader):
    set_env_loader(env_loader)
    jwt_secret = load_env_value("JWT_SECRET", env_loader)
    if not jwt_secret:
        return 503, {"error": "未配置 JWT_SECRET"}

    token = ""
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
    if not token:
        return 401, {"error": "未登录"}

    payload = verify_jwt(token, jwt_secret)
    if not payload or not payload.get("sub"):
        return 401, {"error": "登录已过期，请重新登录"}

    user = get_user_by_id(int(payload["sub"]))
    if not user:
        return 401, {"error": "用户不存在"}

    return 200, {
        "user": {
            "id": user["id"],
            "openid": user["openid"],
            "nickname": user["nickname"],
            "avatarUrl": user["avatarUrl"],
        }
    }


def ensure_notify_db():
    """Separate prefs table so website JWT users can bind OA without schema risk."""
    ensure_db()
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS wechat_notify (
                      website_openid TEXT PRIMARY KEY,
                      oa_openid TEXT,
                      unionid TEXT,
                      enabled BOOLEAN NOT NULL DEFAULT FALSE,
                      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_wechat_notify_oa ON wechat_notify(oa_openid)"
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS wechat_notify_ticket (
                      ticket TEXT PRIMARY KEY,
                      website_openid TEXT NOT NULL,
                      expires_at TIMESTAMPTZ NOT NULL,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
            conn.commit()
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS wechat_notify (
              website_openid TEXT PRIMARY KEY,
              oa_openid TEXT,
              unionid TEXT,
              enabled INTEGER NOT NULL DEFAULT 0,
              updated_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_wechat_notify_oa ON wechat_notify(oa_openid)"
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS wechat_notify_ticket (
              ticket TEXT PRIMARY KEY,
              website_openid TEXT NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _notify_row(row):
    if not row:
        return None
    if isinstance(row, dict):
        return {
            "websiteOpenid": row.get("website_openid"),
            "oaOpenid": row.get("oa_openid"),
            "unionid": row.get("unionid"),
            "enabled": bool(row.get("enabled")),
            "updatedAt": row.get("updated_at"),
        }
    return {
        "websiteOpenid": row[0],
        "oaOpenid": row[1],
        "unionid": row[2],
        "enabled": bool(row[3]),
        "updatedAt": row[4],
    }


def get_notify_prefs(website_openid: str):
    ensure_notify_db()
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT website_openid, oa_openid, unionid, enabled, updated_at
                    FROM wechat_notify WHERE website_openid = %s
                    """,
                    (website_openid,),
                )
                return _notify_row(cur.fetchone())

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            """
            SELECT website_openid, oa_openid, unionid, enabled, updated_at
            FROM wechat_notify WHERE website_openid = ?
            """,
            (website_openid,),
        ).fetchone()
    return _notify_row(row)


def upsert_notify_bind(website_openid: str, oa_openid: str, unionid=None, enabled=True):
    ensure_notify_db()
    now = datetime.now(timezone.utc).isoformat()
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    INSERT INTO wechat_notify (website_openid, oa_openid, unionid, enabled, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (website_openid) DO UPDATE SET
                      oa_openid = EXCLUDED.oa_openid,
                      unionid = COALESCE(EXCLUDED.unionid, wechat_notify.unionid),
                      enabled = EXCLUDED.enabled,
                      updated_at = EXCLUDED.updated_at
                    RETURNING website_openid, oa_openid, unionid, enabled, updated_at
                    """,
                    (website_openid, oa_openid, unionid, enabled, now),
                )
                row = cur.fetchone()
            conn.commit()
        return _notify_row(row)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO wechat_notify (website_openid, oa_openid, unionid, enabled, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(website_openid) DO UPDATE SET
              oa_openid = excluded.oa_openid,
              unionid = COALESCE(excluded.unionid, wechat_notify.unionid),
              enabled = excluded.enabled,
              updated_at = excluded.updated_at
            """,
            (website_openid, oa_openid, unionid, 1 if enabled else 0, now),
        )
        row = conn.execute(
            """
            SELECT website_openid, oa_openid, unionid, enabled, updated_at
            FROM wechat_notify WHERE website_openid = ?
            """,
            (website_openid,),
        ).fetchone()
        conn.commit()
    return _notify_row(row)


def set_notify_enabled(website_openid: str, enabled: bool):
    ensure_notify_db()
    prefs = get_notify_prefs(website_openid)
    if not prefs:
        return None
    now = datetime.now(timezone.utc).isoformat()
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    UPDATE wechat_notify
                    SET enabled = %s, updated_at = %s
                    WHERE website_openid = %s
                    RETURNING website_openid, oa_openid, unionid, enabled, updated_at
                    """,
                    (enabled, now, website_openid),
                )
                row = cur.fetchone()
            conn.commit()
        return _notify_row(row)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE wechat_notify SET enabled = ?, updated_at = ? WHERE website_openid = ?",
            (1 if enabled else 0, now, website_openid),
        )
        row = conn.execute(
            """
            SELECT website_openid, oa_openid, unionid, enabled, updated_at
            FROM wechat_notify WHERE website_openid = ?
            """,
            (website_openid,),
        ).fetchone()
        conn.commit()
    return _notify_row(row)


def create_notify_ticket(website_openid: str, ttl_seconds: int = 900):
    ensure_notify_db()
    ticket = secrets.token_urlsafe(24)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)
    created_at = datetime.now(timezone.utc)
    if get_database_url():
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM wechat_notify_ticket WHERE expires_at < NOW()"
                )
                cur.execute(
                    """
                    INSERT INTO wechat_notify_ticket (ticket, website_openid, expires_at, created_at)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (ticket, website_openid, expires_at.isoformat(), created_at.isoformat()),
                )
            conn.commit()
    else:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                "DELETE FROM wechat_notify_ticket WHERE expires_at < ?",
                (datetime.now(timezone.utc).isoformat(),),
            )
            conn.execute(
                """
                INSERT INTO wechat_notify_ticket (ticket, website_openid, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (
                    ticket,
                    website_openid,
                    expires_at.isoformat(),
                    created_at.isoformat(),
                ),
            )
            conn.commit()
    return ticket, ttl_seconds


def peek_notify_ticket(ticket: str):
    ensure_notify_db()
    if not ticket:
        return None
    now = datetime.now(timezone.utc)
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT ticket, website_openid, expires_at
                    FROM wechat_notify_ticket WHERE ticket = %s
                    """,
                    (ticket,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                expires = row["expires_at"]
                if hasattr(expires, "tzinfo") and expires.tzinfo is None:
                    expires = expires.replace(tzinfo=timezone.utc)
                if isinstance(expires, str):
                    expires = datetime.fromisoformat(expires.replace("Z", "+00:00"))
                if expires < now:
                    cur.execute("DELETE FROM wechat_notify_ticket WHERE ticket = %s", (ticket,))
                    conn.commit()
                    return None
                return row["website_openid"]

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            "SELECT ticket, website_openid, expires_at FROM wechat_notify_ticket WHERE ticket = ?",
            (ticket,),
        ).fetchone()
        if not row:
            return None
        expires = datetime.fromisoformat(row[2].replace("Z", "+00:00"))
        if expires < now:
            conn.execute("DELETE FROM wechat_notify_ticket WHERE ticket = ?", (ticket,))
            conn.commit()
            return None
        return row[1]


def delete_notify_ticket(ticket: str):
    ensure_notify_db()
    if get_database_url():
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM wechat_notify_ticket WHERE ticket = %s", (ticket,))
            conn.commit()
        return
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM wechat_notify_ticket WHERE ticket = ?", (ticket,))
        conn.commit()


def consume_notify_ticket(ticket: str):
    website_openid = peek_notify_ticket(ticket)
    if website_openid:
        delete_notify_ticket(ticket)
    return website_openid


def _bearer_payload(auth_header: str, env_loader):
    jwt_secret = load_env_value("JWT_SECRET", env_loader)
    if not jwt_secret:
        return None, (503, {"error": "未配置 JWT_SECRET"})
    token = ""
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()
    if not token:
        return None, (401, {"error": "未登录"})
    payload = verify_jwt(token, jwt_secret)
    if not payload:
        return None, (401, {"error": "登录已过期，请重新登录"})
    website_openid = (payload.get("openid") or "").strip()
    if not website_openid and payload.get("sub"):
        # Stateless Vercel tokens may use openid as sub
        sub = str(payload.get("sub"))
        if not sub.isdigit():
            website_openid = sub
    if not website_openid:
        return None, (401, {"error": "登录信息不完整，请重新微信登录"})
    return {"payload": payload, "websiteOpenid": website_openid}, None


def handle_notify_status(auth_header: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    prefs = get_notify_prefs(resolved["websiteOpenid"])
    return 200, {
        "enabled": bool(prefs and prefs.get("enabled")),
        "bound": bool(prefs and prefs.get("oaOpenid")),
        "oaOpenid": (prefs or {}).get("oaOpenid"),
    }


def handle_notify_ticket(auth_header: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    ticket, ttl = create_notify_ticket(resolved["websiteOpenid"])
    return 200, {
        "ticket": ticket,
        "expiresIn": ttl,
        "bindUrl": f"https://www.daoith.com/auth/wechat-oa-bind.html?ticket={urllib.parse.quote(ticket)}",
    }


def handle_notify_bind(auth_header: str, body: dict, env_loader):
    set_env_loader(env_loader)
    body = body or {}
    code = (body.get("code") or "").strip()
    ticket = (body.get("ticket") or "").strip()
    if not code:
        return 400, {"error": "缺少微信授权 code"}

    website_openid = None
    unionid_hint = None
    ticket_to_consume = None
    if ticket:
        website_openid = peek_notify_ticket(ticket)
        if not website_openid:
            return 401, {"error": "绑定链接已过期，请在电脑端重新开启订阅"}
        ticket_to_consume = ticket
    else:
        resolved, err = _bearer_payload(auth_header, env_loader)
        if err:
            return err
        website_openid = resolved["websiteOpenid"]
        unionid_hint = resolved["payload"].get("unionid")

    app_id = load_env_value("WECHAT_OA_APP_ID", env_loader)
    app_secret = load_env_value("WECHAT_OA_APP_SECRET", env_loader)
    if not app_id or not app_secret:
        return 503, {"error": "未配置服务号凭证"}

    try:
        params = urllib.parse.urlencode(
            {
                "appid": app_id,
                "secret": app_secret,
                "code": code,
                "grant_type": "authorization_code",
            }
        )
        data = _fetch_json(f"https://api.weixin.qq.com/sns/oauth2/access_token?{params}", timeout=15)
        oa_openid = data.get("openid")
        if not oa_openid:
            return 400, {"error": "未获取到公众号 openid"}
        prefs = upsert_notify_bind(
            website_openid=website_openid,
            oa_openid=oa_openid,
            unionid=data.get("unionid") or unionid_hint,
            enabled=True,
        )
        if ticket_to_consume:
            delete_notify_ticket(ticket_to_consume)
        return 200, {
            "enabled": True,
            "bound": True,
            "oaOpenid": prefs.get("oaOpenid"),
        }
    except ValueError as e:
        return 400, {"error": str(e)}
    except Exception as e:
        return 502, {"error": str(e)}


def handle_notify_enable(auth_header: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    prefs = get_notify_prefs(resolved["websiteOpenid"])
    if not prefs or not prefs.get("oaOpenid"):
        return 400, {"error": "尚未绑定公众号", "needBind": True}
    prefs = set_notify_enabled(resolved["websiteOpenid"], True)
    return 200, {
        "enabled": True,
        "bound": True,
        "oaOpenid": prefs.get("oaOpenid"),
    }


def handle_notify_disable(auth_header: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    prefs = set_notify_enabled(resolved["websiteOpenid"], False)
    if not prefs:
        return 200, {"enabled": False, "bound": False}
    return 200, {
        "enabled": False,
        "bound": bool(prefs.get("oaOpenid")),
        "oaOpenid": prefs.get("oaOpenid"),
    }
