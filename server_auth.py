#!/usr/bin/env python3
"""WeChat OAuth helpers for local server.py development."""

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

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
                      country TEXT,
                      province TEXT,
                      city TEXT,
                      phone TEXT,
                      last_login_at TIMESTAMPTZ,
                      login_count INTEGER NOT NULL DEFAULT 0,
                      last_login_ip TEXT,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid)")
                for col, ddl in (
                    ("country", "TEXT"),
                    ("province", "TEXT"),
                    ("city", "TEXT"),
                    ("phone", "TEXT"),
                    ("last_login_at", "TIMESTAMPTZ"),
                    ("login_count", "INTEGER NOT NULL DEFAULT 0"),
                    ("last_login_ip", "TEXT"),
                ):
                    cur.execute(
                        f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col} {ddl}"
                    )
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
              country TEXT,
              province TEXT,
              city TEXT,
              phone TEXT,
              last_login_at TEXT,
              login_count INTEGER NOT NULL DEFAULT 0,
              last_login_ip TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            )
            """
        )
        cols = {
            row[1]
            for row in conn.execute("PRAGMA table_info(users)").fetchall()
        }
        for col, ddl in (
            ("country", "TEXT"),
            ("province", "TEXT"),
            ("city", "TEXT"),
            ("phone", "TEXT"),
            ("last_login_at", "TEXT"),
            ("login_count", "INTEGER NOT NULL DEFAULT 0"),
            ("last_login_ip", "TEXT"),
        ):
            if col not in cols:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col} {ddl}")
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
            "country": row.get("country"),
            "province": row.get("province"),
            "city": row.get("city"),
            "phone": row.get("phone"),
            "lastLoginAt": row.get("last_login_at"),
            "loginCount": int(row.get("login_count") or 0),
            "lastLoginIp": row.get("last_login_ip"),
            "createdAt": row.get("created_at"),
            "updatedAt": row.get("updated_at"),
        }
    return {
        "id": row[0],
        "openid": row[1],
        "unionid": row[2],
        "nickname": row[3],
        "avatarUrl": row[4],
        "country": row[5] if len(row) > 5 else None,
        "province": row[6] if len(row) > 6 else None,
        "city": row[7] if len(row) > 7 else None,
        "phone": row[8] if len(row) > 8 else None,
        "lastLoginAt": row[9] if len(row) > 9 else None,
        "loginCount": int(row[10] or 0) if len(row) > 10 else 0,
        "lastLoginIp": row[11] if len(row) > 11 else None,
        "createdAt": row[12] if len(row) > 12 else None,
        "updatedAt": row[13] if len(row) > 13 else None,
    }


_USER_SELECT = (
    "id, openid, unionid, nickname, avatar_url, country, province, city, phone, "
    "last_login_at, login_count, last_login_ip, created_at, updated_at"
)


def upsert_wechat_user(
    openid,
    unionid=None,
    nickname=None,
    avatar_url=None,
    country=None,
    province=None,
    city=None,
    phone=None,
    login_ip=None,
    record_login=True,
):
    ensure_db()
    now = datetime.now(timezone.utc).isoformat()

    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""
                    INSERT INTO users (
                      openid, unionid, nickname, avatar_url,
                      country, province, city, phone,
                      last_login_at, login_count, last_login_ip,
                      created_at, updated_at
                    )
                    VALUES (
                      %s, %s, %s, %s,
                      %s, %s, %s, %s,
                      %s, %s, %s,
                      %s, %s
                    )
                    ON CONFLICT (openid) DO UPDATE SET
                      unionid = COALESCE(EXCLUDED.unionid, users.unionid),
                      nickname = COALESCE(EXCLUDED.nickname, users.nickname),
                      avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
                      country = COALESCE(EXCLUDED.country, users.country),
                      province = COALESCE(EXCLUDED.province, users.province),
                      city = COALESCE(EXCLUDED.city, users.city),
                      phone = COALESCE(EXCLUDED.phone, users.phone),
                      last_login_at = CASE
                        WHEN %s THEN EXCLUDED.last_login_at
                        ELSE COALESCE(users.last_login_at, EXCLUDED.last_login_at)
                      END,
                      login_count = CASE
                        WHEN %s THEN users.login_count + 1
                        ELSE users.login_count
                      END,
                      last_login_ip = COALESCE(EXCLUDED.last_login_ip, users.last_login_ip),
                      updated_at = EXCLUDED.updated_at
                    RETURNING {_USER_SELECT}
                    """,
                    (
                        openid,
                        unionid,
                        nickname,
                        avatar_url,
                        country,
                        province,
                        city,
                        phone,
                        now,
                        1 if record_login else 0,
                        login_ip,
                        now,
                        now,
                        record_login,
                        record_login,
                    ),
                )
                row = cur.fetchone()
            conn.commit()
        return _row_to_user(row)

    with sqlite3.connect(DB_PATH) as conn:
        existing = conn.execute(
            "SELECT login_count FROM users WHERE openid = ?", (openid,)
        ).fetchone()
        if existing:
            next_count = int(existing[0] or 0) + (1 if record_login else 0)
            conn.execute(
                """
                UPDATE users SET
                  unionid = COALESCE(?, unionid),
                  nickname = COALESCE(?, nickname),
                  avatar_url = COALESCE(?, avatar_url),
                  country = COALESCE(?, country),
                  province = COALESCE(?, province),
                  city = COALESCE(?, city),
                  phone = COALESCE(?, phone),
                  last_login_at = CASE WHEN ? THEN ? ELSE COALESCE(last_login_at, ?) END,
                  login_count = ?,
                  last_login_ip = COALESCE(?, last_login_ip),
                  updated_at = ?
                WHERE openid = ?
                """,
                (
                    unionid,
                    nickname,
                    avatar_url,
                    country,
                    province,
                    city,
                    phone,
                    1 if record_login else 0,
                    now,
                    now,
                    next_count if record_login else int(existing[0] or 0),
                    login_ip,
                    now,
                    openid,
                ),
            )
        else:
            conn.execute(
                """
                INSERT INTO users (
                  openid, unionid, nickname, avatar_url,
                  country, province, city, phone,
                  last_login_at, login_count, last_login_ip,
                  created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    openid,
                    unionid,
                    nickname,
                    avatar_url,
                    country,
                    province,
                    city,
                    phone,
                    now,
                    1 if record_login else 0,
                    login_ip,
                    now,
                    now,
                ),
            )
        row = conn.execute(
            f"SELECT {_USER_SELECT} FROM users WHERE openid = ?",
            (openid,),
        ).fetchone()
        conn.commit()
    return _row_to_user(row)


def update_user_phone_by_openid(openid: str, phone: str):
    if not openid or not phone:
        return None
    ensure_db()
    now = datetime.now(timezone.utc).isoformat()
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"""
                    UPDATE users
                    SET phone = %s, updated_at = %s
                    WHERE openid = %s
                    RETURNING {_USER_SELECT}
                    """,
                    (phone, now, openid),
                )
                row = cur.fetchone()
            conn.commit()
        return _row_to_user(row)

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "UPDATE users SET phone = ?, updated_at = ? WHERE openid = ?",
            (phone, now, openid),
        )
        row = conn.execute(
            f"SELECT {_USER_SELECT} FROM users WHERE openid = ?",
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
                    f"""
                    SELECT {_USER_SELECT}
                    FROM users
                    WHERE id = %s
                    """,
                    (user_id,),
                )
                row = cur.fetchone()
        return _row_to_user(row)

    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            f"SELECT {_USER_SELECT} FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return _row_to_user(row)


def get_user_by_openid(openid: str):
    ensure_db()
    if get_database_url():
        _, RealDictCursor = _import_psycopg()
        with _pg_connect() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    f"SELECT {_USER_SELECT} FROM users WHERE openid = %s",
                    (openid,),
                )
                row = cur.fetchone()
        return _row_to_user(row)
    with sqlite3.connect(DB_PATH) as conn:
        row = conn.execute(
            f"SELECT {_USER_SELECT} FROM users WHERE openid = ?",
            (openid,),
        ).fetchone()
    return _row_to_user(row)


# Bypass system HTTP proxy (common on Chinese cloud hosts; breaks WeChat API)
_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))

_PRIVATE_IP_RE = re.compile(
    r"^(?:127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80)",
    re.I,
)


def extract_client_ip(headers, client_address=None):
    candidates = []
    if headers:
        for key in (
            "X-Forwarded-For",
            "x-forwarded-for",
            "X-Real-IP",
            "x-real-ip",
            "CF-Connecting-IP",
            "cf-connecting-ip",
        ):
            raw = headers.get(key) if hasattr(headers, "get") else None
            if raw:
                candidates.extend([p.strip() for p in str(raw).split(",") if p.strip()])
                break
    if client_address:
        host = client_address[0] if isinstance(client_address, (list, tuple)) else client_address
        if host:
            candidates.append(str(host))
    for raw in candidates:
        ip = str(raw or "").replace("::ffff:", "").strip()
        if ip and not _PRIVATE_IP_RE.match(ip) and ip.lower() != "unknown":
            return ip
    return None


def _normalize_province(raw):
    if not raw:
        return None
    p = str(raw).strip().replace(" ", "")
    if not p or p in ("XX", "内网IP"):
        return None
    mapping = {
        "北京": "北京市",
        "上海": "上海市",
        "天津": "天津市",
        "重庆": "重庆市",
        "广东": "广东省",
        "广西": "广西壮族自治区",
        "内蒙古": "内蒙古自治区",
        "西藏": "西藏自治区",
        "宁夏": "宁夏回族自治区",
        "新疆": "新疆维吾尔自治区",
        "香港": "香港特别行政区",
        "澳门": "澳门特别行政区",
    }
    for short, full in mapping.items():
        if p == short or p.startswith(short):
            return full
    if re.search(r"(省|市|自治区|特别行政区)$", p):
        return p
    if re.match(r"^[\x00-\x7F]+$", p):
        return None
    return f"{p}省"


def _normalize_city(raw):
    if not raw:
        return None
    c = str(raw).strip().replace(" ", "")
    if not c or c == "XX":
        return None
    if re.search(r"(市|州|盟|地区|县|区)$", c):
        return c
    if re.match(r"^[\x00-\x7F]+$", c):
        return None
    return f"{c}市"


def lookup_ip_region(ip: str):
    """Best-effort IP → province/city. Never raises."""
    if not ip:
        return None
    try:
        url = (
            f"http://ip-api.com/json/{urllib.parse.quote(ip)}"
            "?lang=zh-CN&fields=status,country,regionName,city"
        )
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "daoith-auth/1.0"})
        with _NO_PROXY_OPENER.open(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("status") != "success":
            return None
        country = data.get("country")
        if country in ("China", "CN"):
            country = "中国"
        return {
            "country": country,
            "province": _normalize_province(data.get("regionName")),
            "city": _normalize_city(data.get("city")),
            "ip": ip,
        }
    except Exception:
        return None


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


def handle_wechat_login(body: dict, env_loader, client_ip: Optional[str] = None):
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
        region = {
            "country": user_info.get("country") or None,
            "province": user_info.get("province") or None,
            "city": user_info.get("city") or None,
        }
        if not region["province"] and not region["city"]:
            geo = lookup_ip_region(client_ip)
            if geo:
                region = {
                    "country": geo.get("country") or region["country"],
                    "province": geo.get("province"),
                    "city": geo.get("city"),
                }
        user = upsert_wechat_user(
            openid=user_info["openid"],
            unionid=user_info.get("unionid") or token_data.get("unionid"),
            nickname=user_info.get("nickname"),
            avatar_url=user_info.get("headimgurl"),
            country=region.get("country"),
            province=region.get("province"),
            city=region.get("city"),
            login_ip=client_ip,
            record_login=True,
        )
        try:
            sync_user_to_pm(user, env_loader, record_login=True)
        except Exception:
            pass
        jwt_token = sign_jwt(
            {
                "sub": str(user["id"]),
                "openid": user["openid"],
                "nickname": user.get("nickname"),
                "avatarUrl": user.get("avatarUrl"),
            },
            jwt_secret,
        )
        return 200, {
            "token": jwt_token,
            "user": {
                "id": user["id"],
                "openid": user["openid"],
                "nickname": user["nickname"],
                "avatarUrl": user["avatarUrl"],
                "phone": user.get("phone"),
                "country": user.get("country"),
                "province": user.get("province"),
                "city": user.get("city"),
                "lastLoginAt": user.get("lastLoginAt"),
                "loginCount": user.get("loginCount") or 0,
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
            "phone": user.get("phone"),
            "country": user.get("country"),
            "province": user.get("province"),
            "city": user.get("city"),
            "lastLoginAt": user.get("lastLoginAt"),
            "loginCount": user.get("loginCount") or 0,
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


def _verify_via_www_me(token: str, env_loader=None):
    """Accept Vercel-issued JWTs by validating against www /api/auth/wechat/me.

    Login JWT is signed on Vercel; notify APIs run on Aliyun. Secrets may differ,
    so we trust tokens that www.daoith.com still recognizes.
    """
    me_url = (
        load_env_value("WEBSITE_AUTH_ME_URL", env_loader)
        or "https://www.daoith.com/api/auth/wechat/me"
    )
    req = urllib.request.Request(
        me_url,
        method="GET",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": "daoith-auth/1.0",
            "Accept": "application/json",
        },
    )
    try:
        with _NO_PROXY_OPENER.open(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None
    user = data.get("user") or {}
    openid = (user.get("openid") or "").strip()
    if not openid:
        return None
    return {
        "payload": {
            "sub": str(user.get("id") or openid),
            "openid": openid,
            "nickname": user.get("nickname"),
            "avatarUrl": user.get("avatarUrl"),
            "via": "www",
        },
        "websiteOpenid": openid,
        "user": user,
    }


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
    if payload:
        website_openid = (payload.get("openid") or "").strip()
        if not website_openid and payload.get("sub"):
            # Stateless Vercel tokens may use openid as sub
            sub = str(payload.get("sub"))
            if not sub.isdigit():
                website_openid = sub
        if not website_openid:
            return None, (401, {"error": "登录信息不完整，请重新微信登录"})
        return {"payload": payload, "websiteOpenid": website_openid, "token": token}, None

    # Cross-host fallback: Vercel JWT_SECRET may differ from Aliyun
    adopted = _verify_via_www_me(token, env_loader)
    if adopted:
        adopted["token"] = token
        return adopted, None
    return None, (401, {"error": "登录已过期，请重新登录"})


def handle_notify_status(auth_header: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    # Best-effort: keep PM website user list in sync when notify status is checked
    try:
        payload = resolved.get("payload") or {}
        sync_user_to_pm(
            {
                "id": payload.get("sub") or resolved["websiteOpenid"],
                "openid": resolved["websiteOpenid"],
                "nickname": payload.get("nickname"),
                "avatarUrl": payload.get("avatarUrl"),
            },
            env_loader,
            record_login=False,
        )
    except Exception:
        pass
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


ALLOWED_INQUIRY_STATUS = {"已提交", "处理中", "已报价", "已成交", "已关闭"}
_INQUIRY_STATUS_ORDER = ["已提交", "处理中", "已报价"]
_INQUIRY_TERMINALS = {"已成交", "已关闭"}
# WeChat template const12 enums currently approved in the OA console
_WECHAT_TMPL_STATUSES = frozenset({"已提交", "处理中", "已报价", "已成交", "已关闭"})


def _inquiry_status_path(status: str) -> list:
    """Statuses from 已提交 up to and including `status` (终态二选一)."""
    if status in _INQUIRY_TERMINALS:
        return list(_INQUIRY_STATUS_ORDER) + [status]
    if status in _INQUIRY_STATUS_ORDER:
        idx = _INQUIRY_STATUS_ORDER.index(status)
        return list(_INQUIRY_STATUS_ORDER[: idx + 1])
    return ["已提交"]


def _parse_status_history(raw) -> dict:
    if isinstance(raw, dict):
        return {str(k): str(v) for k, v in raw.items() if k and v}
    if not raw:
        return {}
    try:
        data = json.loads(raw) if isinstance(raw, str) else {}
    except Exception:
        return {}
    if not isinstance(data, dict):
        return {}
    return {str(k): str(v) for k, v in data.items() if k and v}


def _merge_status_history(existing, status: str, at: str) -> dict:
    """Record times for newly reached nodes; keep earlier timestamps; drop other terminal."""
    history = dict(_parse_status_history(existing))
    for s in _inquiry_status_path(status):
        if s not in history:
            history[s] = at
    if status in _INQUIRY_TERMINALS:
        history[status] = history.get(status) or at
        other = "已关闭" if status == "已成交" else "已成交"
        history.pop(other, None)
    return history


def _synthesize_status_history(status: str, created_iso: str, raw_history=None) -> dict:
    """Build a complete timeline for API/UI; used for legacy rows with empty history."""
    history = _parse_status_history(raw_history)
    status = status or "已提交"
    at = created_iso or datetime.now(timezone.utc).isoformat()
    if "已提交" not in history:
        history = _merge_status_history(history, "已提交", at)
    if status not in history:
        history = _merge_status_history(history, status, at)
    # Ensure every reached node has a timestamp (including intermediates)
    for s in _inquiry_status_path(status):
        if s not in history:
            history[s] = at
    return history


def _backfill_empty_status_histories():
    """Persist synthesized timelines for rows still stored as {}."""
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, status, status_history_json, created_at
                    FROM website_inquiries
                    WHERE status_history_json IS NULL
                       OR status_history_json = ''
                       OR status_history_json = '{}'
                    """
                )
                rows = cur.fetchall()
                for inquiry_id, status, raw, created in rows:
                    created_iso = (
                        created.isoformat() if hasattr(created, "isoformat") else str(created or "")
                    )
                    history = _synthesize_status_history(status or "已提交", created_iso, raw)
                    cur.execute(
                        "UPDATE website_inquiries SET status_history_json = %s WHERE id = %s",
                        (json.dumps(history, ensure_ascii=False), inquiry_id),
                    )
            conn.commit()
        return

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT id, status, status_history_json, created_at
            FROM website_inquiries
            WHERE status_history_json IS NULL
               OR status_history_json = ''
               OR status_history_json = '{}'
            """
        ).fetchall()
        for r in rows:
            history = _synthesize_status_history(
                r["status"] or "已提交", r["created_at"] or "", r["status_history_json"]
            )
            conn.execute(
                "UPDATE website_inquiries SET status_history_json = ? WHERE id = ?",
                (json.dumps(history, ensure_ascii=False), r["id"]),
            )
        conn.commit()


_STATUS_HISTORY_BACKFILL_DONE = False


def _ensure_status_history_column(cur, *, postgres: bool):
    if postgres:
        cur.execute(
            "ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS status_history_json TEXT NOT NULL DEFAULT '{}'"
        )
    else:
        cols = {r[1] for r in cur.execute("PRAGMA table_info(website_inquiries)").fetchall()}
        if "status_history_json" not in cols:
            cur.execute(
                "ALTER TABLE website_inquiries ADD COLUMN status_history_json TEXT NOT NULL DEFAULT '{}'"
            )


def _ensure_inquiry_extra_columns(cur, *, postgres: bool):
    if postgres:
        cur.execute("ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS quoted_total DOUBLE PRECISION")
        cur.execute("ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS payment_slip_name TEXT")
        cur.execute("ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS payment_slip_path TEXT")
        cur.execute("ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS payment_slip_mime TEXT")
        cur.execute("ALTER TABLE website_inquiries ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ")
        return
    cols = {r[1] for r in cur.execute("PRAGMA table_info(website_inquiries)").fetchall()}
    specs = (
        ("quoted_total", "REAL"),
        ("payment_slip_name", "TEXT"),
        ("payment_slip_path", "TEXT"),
        ("payment_slip_mime", "TEXT"),
        ("paid_at", "TEXT"),
    )
    for name, typ in specs:
        if name not in cols:
            cur.execute(f"ALTER TABLE website_inquiries ADD COLUMN {name} {typ}")


SLIP_DIR = ROOT / "data" / "uploads" / "payment-slips"
MAX_SLIP_BYTES = 8 * 1024 * 1024
SLIP_MIME_EXT = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
}


def inquiry_item_count(items) -> int:
    total = 0
    for it in items or []:
        if not isinstance(it, dict):
            total += 1
            continue
        try:
            qty = int(float(it.get("qty") or 1))
        except (TypeError, ValueError):
            qty = 1
        total += max(qty, 1)
    return total


def inquiry_discount_rate(item_count: int) -> float:
    n = int(item_count or 0)
    if n >= 3:
        return 0.9
    if n == 2:
        return 0.95
    return 1.0


def compute_inquiry_totals(items, total=None):
    standard = 0.0
    for it in items or []:
        if not isinstance(it, dict):
            continue
        try:
            qty = float(it.get("qty") or 1)
        except (TypeError, ValueError):
            qty = 1.0
        try:
            price = float(it.get("priceValue") or 0)
        except (TypeError, ValueError):
            price = 0.0
        standard += qty * price
    if standard <= 0:
        try:
            standard = float(total or 0)
        except (TypeError, ValueError):
            standard = 0.0
    rate = inquiry_discount_rate(inquiry_item_count(items))
    quoted = round(standard * rate, 2)
    return round(standard, 2), quoted, rate


def _iso_or_str(value) -> str:
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _safe_inquiry_id(inquiry_id: str) -> str:
    return re.sub(r"[^A-Za-z0-9_-]", "", str(inquiry_id or ""))


def _parse_paid_at(value):
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def ensure_inquiry_db():
    global _STATUS_HISTORY_BACKFILL_DONE
    ensure_db()
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS website_inquiries (
                      id TEXT PRIMARY KEY,
                      website_openid TEXT,
                      company TEXT NOT NULL,
                      contact TEXT NOT NULL,
                      phone TEXT NOT NULL,
                      total DOUBLE PRECISION NOT NULL DEFAULT 0,
                      items_json TEXT NOT NULL DEFAULT '[]',
                      status TEXT NOT NULL DEFAULT '已提交',
                      status_history_json TEXT NOT NULL DEFAULT '{}',
                      notify_sent BOOLEAN NOT NULL DEFAULT FALSE,
                      pm_synced BOOLEAN NOT NULL DEFAULT FALSE,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    )
                    """
                )
                _ensure_status_history_column(cur, postgres=True)
                _ensure_inquiry_extra_columns(cur, postgres=True)
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_website_inquiries_openid ON website_inquiries(website_openid)"
                )
                cur.execute(
                    "CREATE INDEX IF NOT EXISTS idx_website_inquiries_created ON website_inquiries(created_at DESC)"
                )
            conn.commit()
        if not _STATUS_HISTORY_BACKFILL_DONE:
            try:
                _backfill_empty_status_histories()
                _STATUS_HISTORY_BACKFILL_DONE = True
            except Exception:
                pass
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS website_inquiries (
              id TEXT PRIMARY KEY,
              website_openid TEXT,
              company TEXT NOT NULL,
              contact TEXT NOT NULL,
              phone TEXT NOT NULL,
              total REAL NOT NULL DEFAULT 0,
              items_json TEXT NOT NULL DEFAULT '[]',
              status TEXT NOT NULL DEFAULT '已提交',
              status_history_json TEXT NOT NULL DEFAULT '{}',
              notify_sent INTEGER NOT NULL DEFAULT 0,
              pm_synced INTEGER NOT NULL DEFAULT 0,
              created_at TEXT NOT NULL
            )
            """
        )
        _ensure_status_history_column(conn, postgres=False)
        _ensure_inquiry_extra_columns(conn, postgres=False)
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_website_inquiries_openid ON website_inquiries(website_openid)"
        )
        conn.commit()
    if not _STATUS_HISTORY_BACKFILL_DONE:
        try:
            _backfill_empty_status_histories()
            _STATUS_HISTORY_BACKFILL_DONE = True
        except Exception:
            pass


_INQ_SEQ_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _two_char_seq(n: int) -> str:
    if n < 1:
        n = 1
    if n <= 99:
        return f"{n:02d}"
    rest = n - 100
    first = min(rest // 36, 25)
    second = rest % 36
    return chr(ord("A") + first) + _INQ_SEQ_CHARS[second]


def _inquiry_ids_starting(prefix: str) -> set:
    ensure_inquiry_db()
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM website_inquiries WHERE id LIKE %s", (prefix + "%",))
                return {row[0] for row in cur.fetchall() if row and row[0]}
    with sqlite3.connect(DB_PATH) as conn:
        rows = conn.execute(
            "SELECT id FROM website_inquiries WHERE id LIKE ?",
            (prefix + "%",),
        ).fetchall()
        return {row[0] for row in rows if row and row[0]}


def _new_inquiry_id() -> str:
    prefix = "INQ" + datetime.now().strftime("%y%m%d")
    existing = _inquiry_ids_starting(prefix)
    n = 1
    while n < 1300:
        cand = prefix + _two_char_seq(n)
        if cand not in existing:
            return cand
        n += 1
    return prefix + secrets.choice(_INQ_SEQ_CHARS) + secrets.choice(_INQ_SEQ_CHARS)


def save_inquiry(record: dict):
    ensure_inquiry_db()
    database_url = get_database_url()
    items_json = json.dumps(record.get("items") or [], ensure_ascii=False)
    created_at = record.get("createdAt") or datetime.now(timezone.utc).isoformat()
    status = record.get("status") or "已提交"
    history = record.get("statusHistory") or _merge_status_history({}, status, created_at)
    history_json = json.dumps(history, ensure_ascii=False)
    _, quoted, _ = compute_inquiry_totals(record.get("items") or [], record.get("total"))
    if record.get("quotedTotal") is not None:
        try:
            quoted = float(record.get("quotedTotal"))
        except (TypeError, ValueError):
            pass
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO website_inquiries
                      (id, website_openid, company, contact, phone, total, quoted_total, items_json, status, status_history_json, notify_sent, pm_synced, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        record["id"],
                        record.get("websiteOpenid"),
                        record["company"],
                        record["contact"],
                        record["phone"],
                        float(record.get("total") or 0),
                        quoted,
                        items_json,
                        status,
                        history_json,
                        bool(record.get("notifySent")),
                        bool(record.get("pmSynced")),
                    ),
                )
            conn.commit()
        return

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO website_inquiries
              (id, website_openid, company, contact, phone, total, quoted_total, items_json, status, status_history_json, notify_sent, pm_synced, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record["id"],
                record.get("websiteOpenid"),
                record["company"],
                record["contact"],
                record["phone"],
                float(record.get("total") or 0),
                quoted,
                items_json,
                status,
                history_json,
                1 if record.get("notifySent") else 0,
                1 if record.get("pmSynced") else 0,
                created_at,
            ),
        )
        conn.commit()


def update_inquiry_flags(inquiry_id: str, *, notify_sent=None, pm_synced=None):
    ensure_inquiry_db()
    database_url = get_database_url()
    fields = []
    vals = []
    if notify_sent is not None:
        fields.append("notify_sent")
        vals.append(bool(notify_sent) if database_url else (1 if notify_sent else 0))
    if pm_synced is not None:
        fields.append("pm_synced")
        vals.append(bool(pm_synced) if database_url else (1 if pm_synced else 0))
    if not fields:
        return
    if database_url:
        assignments = ", ".join(f"{f} = %s" for f in fields)
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    f"UPDATE website_inquiries SET {assignments} WHERE id = %s",
                    (*vals, inquiry_id),
                )
            conn.commit()
        return
    assignments = ", ".join(f"{f} = ?" for f in fields)
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            f"UPDATE website_inquiries SET {assignments} WHERE id = ?",
            (*vals, inquiry_id),
        )
        conn.commit()


def _inquiry_template_status(status: str):
    """WeChat const12 must match OA enum exactly; None means do not push."""
    if status in _WECHAT_TMPL_STATUSES:
        return status
    return None


def _format_wechat_time(value=None) -> str:
    dt = None
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, str) and value.strip():
        try:
            dt = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
        except ValueError:
            dt = None
    if dt is None:
        dt = datetime.now()
    if dt.tzinfo:
        dt = dt.astimezone()
    return dt.strftime("%Y年%m月%d日 %H:%M")


def send_inquiry_template(
    oa_openid: str,
    *,
    inquiry_id: str,
    status: str,
    created_at=None,
    env_loader=None,
):
    set_env_loader(env_loader)
    template_id = load_env_value("WECHAT_TMPL_INQUIRY", env_loader)
    if not template_id:
        raise RuntimeError("未配置 WECHAT_TMPL_INQUIRY")
    tmpl_status = _inquiry_template_status(status)
    if not tmpl_status:
        raise ValueError(f"微信模板未配置状态「{status}」")
    token = get_oa_access_token(env_loader)
    ordered_at = _format_wechat_time(created_at)
    due = datetime.now().strftime("%Y年%m月%d日")
    body = {
        "touser": oa_openid,
        "template_id": template_id,
        "url": "https://www.daoith.com/#hub",
        "data": {
            "thing3": {"value": "官网询价"},
            "time4": {"value": ordered_at},
            "character_string5": {"value": str(inquiry_id)[:32]},
            "const12": {"value": tmpl_status},
            "time29": {"value": due},
        },
    }
    return _post_json(
        f"https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={token}",
        body,
        timeout=15,
    )


def notify_inquiry_if_subscribed(
    website_openid: str,
    *,
    inquiry_id: str,
    status: str,
    created_at=None,
    env_loader=None,
):
    """Push OA template when the user has bound and enabled WeChat notify."""
    tmpl_status = _inquiry_template_status(status)
    if not tmpl_status:
        return {
            "sent": False,
            "skipped": True,
            "reason": f"模板未配置状态「{status}」",
        }
    if not website_openid:
        return {"sent": False, "skipped": True, "reason": "missing openid"}
    prefs = get_notify_prefs(website_openid)
    if not prefs or not prefs.get("enabled") or not prefs.get("oaOpenid"):
        return {"sent": False, "skipped": True, "reason": "未订阅微信通知"}
    try:
        wx = send_inquiry_template(
            prefs["oaOpenid"],
            inquiry_id=inquiry_id,
            status=tmpl_status,
            created_at=created_at,
            env_loader=env_loader,
        )
        return {
            "sent": True,
            "msgid": wx.get("msgid"),
            "status": tmpl_status,
        }
    except Exception as e:
        return {"sent": False, "error": str(e)}


def _pm_headers(env_loader=None):
    secret = load_env_value("PM_SYNC_SECRET", env_loader) or load_env_value(
        "WEBSITE_SYNC_SECRET", env_loader
    )
    if not secret:
        return None
    return {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "daoith-website/1.0",
        "x-website-sync-secret": secret,
        "x-order-sync-secret": secret,
    }


def sync_user_to_pm(user: dict, env_loader=None, *, record_login=False):
    """Best-effort push of website WeChat user to pm.daoith.com."""
    set_env_loader(env_loader)
    base = (load_env_value("PM_SYNC_URL", env_loader) or "https://pm.daoith.com").rstrip("/")
    headers = _pm_headers(env_loader)
    if not headers:
        return {"ok": False, "skipped": True, "reason": "missing PM_SYNC_SECRET"}
    openid = (user.get("openid") or "").strip()
    if not openid:
        return {"ok": False, "skipped": True, "reason": "missing openid"}
    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "recordLogin": bool(record_login),
        "users": [
            {
                "externalId": str(user.get("id") or openid),
                "openid": openid,
                "unionid": user.get("unionid"),
                "nickname": user.get("nickname"),
                "avatarUrl": user.get("avatarUrl") or user.get("avatar_url"),
                "phone": user.get("phone"),
                "country": user.get("country"),
                "province": user.get("province"),
                "city": user.get("city"),
                "registeredAt": user.get("registeredAt")
                or user.get("createdAt")
                or now,
                "lastSeenAt": user.get("lastLoginAt")
                or user.get("lastSeenAt")
                or now,
                "lastLoginIp": user.get("lastLoginIp") or user.get("last_login_ip"),
            }
        ],
    }
    url = f"{base}/api/website/users/sync"
    req = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers=headers,
    )
    with _NO_PROXY_OPENER.open(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sync_inquiry_to_pm(inquiry: dict, env_loader=None):
    set_env_loader(env_loader)
    base = (load_env_value("PM_SYNC_URL", env_loader) or "https://pm.daoith.com").rstrip("/")
    headers = _pm_headers(env_loader)
    if not headers:
        return {"ok": False, "skipped": True, "reason": "missing PM_SYNC_SECRET"}
    url = f"{base}/api/website/inquiries/sync"
    req = urllib.request.Request(
        url,
        data=json.dumps(inquiry, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers=headers,
    )
    with _NO_PROXY_OPENER.open(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def sync_diagnosis_to_pm(report: dict, env_loader=None):
    """Push finished diagnosis plan to pm.daoith.com website-diagnosis inbox."""
    set_env_loader(env_loader)
    base = (load_env_value("PM_SYNC_URL", env_loader) or "https://pm.daoith.com").rstrip("/")
    headers = _pm_headers(env_loader)
    if not headers:
        return {"ok": False, "skipped": True, "reason": "missing PM_SYNC_SECRET"}
    url = f"{base}/api/website/diagnosis/sync"
    req = urllib.request.Request(
        url,
        data=json.dumps(report, ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers=headers,
    )
    with _NO_PROXY_OPENER.open(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_service_progress_from_pm(openid: str, env_loader=None):
    """Pull PM service-flow projects/tasks for website hub (right panel)."""
    set_env_loader(env_loader)
    oid = (openid or "").strip()
    if not oid:
        return {"ok": False, "skipped": True, "reason": "missing openid", "services": []}
    base = (load_env_value("PM_SYNC_URL", env_loader) or "https://pm.daoith.com").rstrip("/")
    headers = _pm_headers(env_loader)
    if not headers:
        return {"ok": False, "skipped": True, "reason": "missing PM_SYNC_SECRET", "services": []}
    url = f"{base}/api/website/service-progress?openid={urllib.parse.quote(oid)}"
    req = urllib.request.Request(url, method="GET", headers=headers)
    with _NO_PROXY_OPENER.open(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    services = data.get("services") if isinstance(data, dict) else None
    return {
        "ok": True,
        "services": services if isinstance(services, list) else [],
    }


def update_inquiry_status(inquiry_id: str, status: str):
    ensure_inquiry_db()
    if status not in ALLOWED_INQUIRY_STATUS:
        raise ValueError(f"无效状态：{status}")
    now = datetime.now(timezone.utc).isoformat()
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT website_openid, status, status_history_json, created_at
                    FROM website_inquiries WHERE id = %s
                    """,
                    (inquiry_id,),
                )
                row = cur.fetchone()
                if not row:
                    return None
                prev_status = row[1] or "已提交"
                created_at = row[3]
                history = _merge_status_history(row[2], status, now)
                history_json = json.dumps(history, ensure_ascii=False)
                cur.execute(
                    """
                    UPDATE website_inquiries
                    SET status = %s, status_history_json = %s
                    WHERE id = %s
                    RETURNING id, website_openid, status, status_history_json, created_at
                    """,
                    (status, history_json, inquiry_id),
                )
                updated = cur.fetchone()
            conn.commit()
        return {
            "id": updated[0],
            "websiteOpenid": updated[1],
            "status": updated[2],
            "previousStatus": prev_status,
            "statusHistory": _parse_status_history(updated[3]),
            "createdAt": updated[4],
        }

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT website_openid, status, status_history_json, created_at
            FROM website_inquiries WHERE id = ?
            """,
            (inquiry_id,),
        ).fetchone()
        if not row:
            return None
        prev_status = row["status"] or "已提交"
        history = _merge_status_history(row["status_history_json"], status, now)
        history_json = json.dumps(history, ensure_ascii=False)
        conn.execute(
            "UPDATE website_inquiries SET status = ?, status_history_json = ? WHERE id = ?",
            (status, history_json, inquiry_id),
        )
        conn.commit()
    return {
        "id": inquiry_id,
        "websiteOpenid": row["website_openid"],
        "status": status,
        "previousStatus": prev_status,
        "statusHistory": history,
        "createdAt": row["created_at"],
    }


def _inquiry_row_to_dict(r, *, postgres: bool = False) -> dict:
    if postgres:
        items_raw, status, history_raw, created = r[6], r[7], r[8], r[9]
        quoted_raw = r[10] if len(r) > 10 else None
        slip_name = r[11] if len(r) > 11 else None
        slip_mime = r[12] if len(r) > 12 else None
        paid_at = r[13] if len(r) > 13 else None
        base = {
            "inquiryId": r[0],
            "websiteOpenid": r[1],
            "company": r[2],
            "contact": r[3],
            "phone": r[4],
            "total": float(r[5] or 0),
        }
    else:
        items_raw = r["items_json"]
        status = r["status"]
        history_raw = r["status_history_json"] if "status_history_json" in r.keys() else "{}"
        created = r["created_at"]
        quoted_raw = r["quoted_total"] if "quoted_total" in r.keys() else None
        slip_name = r["payment_slip_name"] if "payment_slip_name" in r.keys() else None
        slip_mime = r["payment_slip_mime"] if "payment_slip_mime" in r.keys() else None
        paid_at = r["paid_at"] if "paid_at" in r.keys() else None
        base = {
            "inquiryId": r["id"],
            "websiteOpenid": r["website_openid"],
            "company": r["company"],
            "contact": r["contact"],
            "phone": r["phone"],
            "total": float(r["total"] or 0),
        }
    try:
        items = json.loads(items_raw or "[]")
    except Exception:
        items = []
    created_iso = created.isoformat() if hasattr(created, "isoformat") else str(created or "")
    status = status or "已提交"
    history = _synthesize_status_history(status, created_iso, history_raw)
    standard, quoted_default, rate = compute_inquiry_totals(items, base["total"])
    if quoted_raw is None:
        quoted = quoted_default
    else:
        try:
            quoted = float(quoted_raw)
        except (TypeError, ValueError):
            quoted = quoted_default
    return {
        **base,
        "items": items,
        "standardTotal": standard,
        "quotedTotal": quoted,
        "discountRate": rate,
        "hasPaymentSlip": bool(slip_name),
        "paymentSlipName": slip_name or "",
        "paymentSlipMime": slip_mime or "",
        "paidAt": _iso_or_str(paid_at),
        "status": status,
        "statusHistory": history,
        "createdAt": created_iso,
    }


def list_inquiries_for_openid(website_openid: str, limit: int = 50):
    ensure_inquiry_db()
    limit = max(1, min(100, int(limit or 50)))
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, website_openid, company, contact, phone, total, items_json,
                           status, status_history_json, created_at,
                           quoted_total, payment_slip_name, payment_slip_mime, paid_at
                    FROM website_inquiries
                    WHERE website_openid = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (website_openid, limit),
                )
                rows = cur.fetchall()
        return [_inquiry_row_to_dict(r, postgres=True) for r in rows]

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute(
            """
            SELECT id, website_openid, company, contact, phone, total, items_json,
                   status, status_history_json, created_at,
                   quoted_total, payment_slip_name, payment_slip_mime, paid_at
            FROM website_inquiries
            WHERE website_openid = ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (website_openid, limit),
        ).fetchall()
    return [_inquiry_row_to_dict(r, postgres=False) for r in rows]


def _authorize_website_sync(headers, env_loader):
    secret = (
        (headers.get("X-Website-Sync-Secret") if headers else None)
        or (headers.get("x-website-sync-secret") if headers else None)
        or (headers.get("X-Order-Sync-Secret") if headers else None)
        or (headers.get("x-order-sync-secret") if headers else None)
        or ""
    ).strip()
    expected = load_env_value("PM_SYNC_SECRET", env_loader) or load_env_value(
        "WEBSITE_SYNC_SECRET", env_loader
    )
    if not expected or secret != expected:
        return False
    return True


def handle_inquiry_status_update(headers, body: dict, env_loader):
    """PM → website status sync (shared secret)."""
    set_env_loader(env_loader)
    if not _authorize_website_sync(headers, env_loader):
        return 401, {"error": "无效的同步密钥"}
    body = body or {}
    inquiry_id = (body.get("inquiryId") or body.get("id") or "").strip()
    status = (body.get("status") or "").strip()
    if not inquiry_id:
        return 400, {"error": "缺少 inquiryId"}
    if status not in ALLOWED_INQUIRY_STATUS:
        return 400, {"error": f"状态须为：{' / '.join(sorted(ALLOWED_INQUIRY_STATUS))}"}

    updated = update_inquiry_status(inquiry_id, status)
    if not updated:
        return 404, {"error": "询价不存在"}

    prev = updated.get("previousStatus") or ""
    if prev == status:
        notify = {"sent": False, "skipped": True, "reason": "状态未变化"}
    else:
        notify = notify_inquiry_if_subscribed(
            updated.get("websiteOpenid") or "",
            inquiry_id=inquiry_id,
            status=status,
            created_at=updated.get("createdAt"),
            env_loader=env_loader,
        )
        if notify.get("sent"):
            try:
                update_inquiry_flags(inquiry_id, notify_sent=True)
            except Exception:
                pass

    return 200, {
        "ok": True,
        "inquiryId": inquiry_id,
        "status": status,
        "statusHistory": updated.get("statusHistory") or {},
        "notify": notify,
    }


def handle_inquiry_list(auth_header: str, env_loader, limit: int = 50):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    items = list_inquiries_for_openid(resolved["websiteOpenid"], limit=limit)
    return 200, {"ok": True, "inquiries": items}


def _get_inquiry_row_owned(inquiry_id: str, website_openid: str):
    ensure_inquiry_db()
    oid = (website_openid or "").strip()
    iid = (inquiry_id or "").strip()
    if not oid or not iid:
        return None
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, website_openid, payment_slip_path, payment_slip_name, payment_slip_mime
                    FROM website_inquiries
                    WHERE id = %s AND website_openid = %s
                    """,
                    (iid, oid),
                )
                row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "websiteOpenid": row[1],
            "paymentSlipPath": row[2],
            "paymentSlipName": row[3],
            "paymentSlipMime": row[4],
        }

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute(
            """
            SELECT id, website_openid, payment_slip_path, payment_slip_name, payment_slip_mime
            FROM website_inquiries
            WHERE id = ? AND website_openid = ?
            """,
            (iid, oid),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "websiteOpenid": row["website_openid"],
        "paymentSlipPath": row["payment_slip_path"] if "payment_slip_path" in row.keys() else None,
        "paymentSlipName": row["payment_slip_name"] if "payment_slip_name" in row.keys() else None,
        "paymentSlipMime": row["payment_slip_mime"] if "payment_slip_mime" in row.keys() else None,
    }


def _decode_slip_content(raw: str):
    text = str(raw or "").strip()
    if not text:
        return None
    if "," in text and text.lower().startswith("data:"):
        text = text.split(",", 1)[1]
    try:
        return base64.b64decode(text, validate=False)
    except Exception:
        return None


def save_inquiry_slip(inquiry_id: str, website_openid: str, *, filename: str, mime: str, content: bytes, paid_at):
    owned = _get_inquiry_row_owned(inquiry_id, website_openid)
    if not owned:
        return None
    mime_key = (mime or "").split(";")[0].strip().lower()
    ext = SLIP_MIME_EXT.get(mime_key)
    if not ext:
        name = (filename or "").lower()
        if name.endswith(".pdf"):
            ext, mime_key = ".pdf", "application/pdf"
        elif name.endswith(".png"):
            ext, mime_key = ".png", "image/png"
        elif name.endswith(".webp"):
            ext, mime_key = ".webp", "image/webp"
        elif name.endswith(".gif"):
            ext, mime_key = ".gif", "image/gif"
        elif name.endswith(".jpg") or name.endswith(".jpeg"):
            ext, mime_key = ".jpg", "image/jpeg"
        else:
            raise ValueError("仅支持 JPG / PNG / WEBP / GIF / PDF 水单")
    if not content or len(content) > MAX_SLIP_BYTES:
        raise ValueError("水单文件过大或为空，请上传 8MB 以内的文件")

    safe_id = _safe_inquiry_id(inquiry_id)
    SLIP_DIR.mkdir(parents=True, exist_ok=True)
    dest = SLIP_DIR / f"{safe_id}{ext}"
    old_path = owned.get("paymentSlipPath") or ""
    dest.write_bytes(content)
    if old_path:
        try:
            old = Path(old_path)
            if old.resolve() != dest.resolve() and old.exists() and SLIP_DIR.resolve() in old.resolve().parents:
                old.unlink()
        except Exception:
            pass

    paid_iso = paid_at.isoformat() if paid_at else None
    paid_pg = paid_at
    display_name = Path(filename or f"payment-slip{ext}").name[:180]
    database_url = get_database_url()
    if database_url:
        with _pg_connect() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE website_inquiries
                    SET payment_slip_name = %s, payment_slip_path = %s, payment_slip_mime = %s, paid_at = %s
                    WHERE id = %s AND website_openid = %s
                    """,
                    (display_name, str(dest), mime_key, paid_pg, inquiry_id, website_openid),
                )
            conn.commit()
    else:
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                UPDATE website_inquiries
                SET payment_slip_name = ?, payment_slip_path = ?, payment_slip_mime = ?, paid_at = ?
                WHERE id = ? AND website_openid = ?
                """,
                (display_name, str(dest), mime_key, paid_iso, inquiry_id, website_openid),
            )
            conn.commit()
    return {
        "inquiryId": inquiry_id,
        "hasPaymentSlip": True,
        "paymentSlipName": display_name,
        "paymentSlipMime": mime_key,
        "paidAt": paid_iso or "",
    }


def handle_inquiry_slip_upload(auth_header: str, body: dict, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    body = body or {}
    inquiry_id = str(body.get("inquiryId") or "").strip()
    if not inquiry_id:
        return 400, {"error": "缺少询价单号"}
    paid_at = _parse_paid_at(body.get("paidAt") or body.get("paymentTime"))
    if not paid_at:
        return 400, {"error": "请填写水单上的支付时间"}
    content = _decode_slip_content(body.get("content") or body.get("file") or "")
    if not content:
        return 400, {"error": "请上传银行水单"}
    try:
        saved = save_inquiry_slip(
            inquiry_id,
            resolved["websiteOpenid"],
            filename=str(body.get("filename") or body.get("name") or "payment-slip"),
            mime=str(body.get("mimeType") or body.get("mime") or ""),
            content=content,
            paid_at=paid_at,
        )
    except ValueError as e:
        return 400, {"error": str(e)}
    if not saved:
        return 404, {"error": "询价单不存在"}
    return 200, {"ok": True, **saved}


def handle_inquiry_slip_get(auth_header: str, inquiry_id: str, env_loader):
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    owned = _get_inquiry_row_owned(inquiry_id, resolved["websiteOpenid"])
    if not owned or not owned.get("paymentSlipPath"):
        return 404, {"error": "尚未上传水单"}
    path = Path(owned["paymentSlipPath"])
    try:
        resolved_path = path.resolve()
        if SLIP_DIR.resolve() not in resolved_path.parents and resolved_path.parent != SLIP_DIR.resolve():
            return 404, {"error": "水单文件不存在"}
        data = resolved_path.read_bytes()
    except Exception:
        return 404, {"error": "水单文件不存在"}
    return 200, {
        "file": True,
        "body": data,
        "mime": owned.get("paymentSlipMime") or "application/octet-stream",
        "filename": owned.get("paymentSlipName") or path.name,
    }


def handle_service_progress(auth_header: str, env_loader):
    """Logged-in user: proxy PM service-flow nodes for hub right panel."""
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    try:
        data = fetch_service_progress_from_pm(resolved["websiteOpenid"], env_loader)
    except Exception as e:
        return 502, {"error": f"拉取服务进度失败：{e}", "services": []}
    if data.get("skipped"):
        return 200, {"ok": True, "services": [], "skipped": data.get("reason")}
    return 200, {"ok": True, "services": data.get("services") or []}


def handle_diagnosis_report_create(auth_header: str, body: dict, env_loader):
    """Logged-in user: accept diagnosis markdown and sync to PM inbox."""
    set_env_loader(env_loader)
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err

    body = body or {}
    report_markdown = str(body.get("reportMarkdown") or body.get("markdown") or "").strip()
    if len(report_markdown) < 80:
        return 400, {"error": "报告内容过短，未保存"}

    slots_raw = body.get("slots") if isinstance(body.get("slots"), dict) else {}
    slot_keys = (
        "platform",
        "entity",
        "shipping",
        "exportMode",
        "invoice",
        "productCategory",
        "revenue",
    )
    slots = {}
    for key in slot_keys:
        val = slots_raw.get(key)
        if val is not None and str(val).strip():
            slots[key] = str(val).strip()

    labels = [
        ("platform", "销售平台"),
        ("entity", "注册主体"),
        ("shipping", "发货方式"),
        ("exportMode", "出口方式"),
        ("invoice", "供应商发票"),
        ("productCategory", "产品类别"),
        ("revenue", "年销售额"),
    ]
    summary = "\n".join(
        f"{label}：{slots[k]}" for k, label in labels if slots.get(k)
    ) or str(body.get("businessSummary") or "").strip()

    report_id = str(body.get("reportId") or "").strip() or (
        f"diag_{int(time.time())}_{secrets.token_hex(4)}"
    )
    openid = resolved["websiteOpenid"]
    payload = resolved.get("payload") or {}
    nickname = (
        body.get("nickname")
        or payload.get("nickname")
        or None
    )
    try:
        user = get_user_by_openid(openid)
        if user and user.get("nickname"):
            nickname = nickname or user.get("nickname")
        external_user_id = str(user.get("id")) if user and user.get("id") is not None else str(
            payload.get("sub") or openid
        )
    except Exception:
        external_user_id = str(payload.get("sub") or openid)

    rec_ids = body.get("recommendedServiceIds")
    if not isinstance(rec_ids, list):
        rec_ids = []

    report = {
        "reportId": report_id,
        "websiteOpenid": openid,
        "externalUserId": external_user_id,
        "nickname": nickname,
        "slots": slots,
        "businessSummary": summary,
        "reportMarkdown": report_markdown,
        "conversationId": (
            str(body.get("conversationId")) if body.get("conversationId") else None
        ),
        "kind": "qa" if body.get("kind") == "qa" else "diagnosis",
        "recommendedServiceIds": [str(x) for x in rec_ids],
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    pm = {"ok": False}
    try:
        pm = sync_diagnosis_to_pm(report, env_loader)
        if pm.get("ok") or pm.get("report"):
            pm["ok"] = True
    except Exception as e:
        pm = {"ok": False, "error": str(e)}

    status = 200 if pm.get("ok") or pm.get("skipped") else 502
    return status, {
        "ok": bool(pm.get("ok") or pm.get("skipped")),
        "reportId": report_id,
        "pm": pm,
    }


def handle_inquiry_create(auth_header: str, body: dict, env_loader):
    """Persist quote request, sync to PM, optionally send OA template."""
    set_env_loader(env_loader)
    body = body or {}
    company = (body.get("company") or "").strip()
    contact = (body.get("contact") or "").strip()
    phone = (body.get("phone") or "").strip()
    items = body.get("items") if isinstance(body.get("items"), list) else []
    try:
        total = float(body.get("total") or 0)
    except (TypeError, ValueError):
        total = 0.0

    if not company or not contact or not phone:
        return 400, {"error": "请填写公司名字、联系人和联系电话"}
    if not items:
        return 400, {"error": "询价单为空，请先选择服务"}

    website_openid = None
    nickname = None
    resolved, err = _bearer_payload(auth_header, env_loader)
    if err:
        return err
    website_openid = resolved["websiteOpenid"]
    nickname = (resolved.get("payload") or {}).get("nickname")
    # Persist phone onto website user profile for analytics, then sync to PM
    user_for_pm = None
    try:
        user_for_pm = update_user_phone_by_openid(website_openid, phone)
        if not user_for_pm:
            user_for_pm = get_user_by_openid(website_openid)
        if not user_for_pm:
            user_for_pm = {
                "id": (resolved.get("payload") or {}).get("sub") or website_openid,
                "openid": website_openid,
                "nickname": nickname,
                "avatarUrl": (resolved.get("payload") or {}).get("avatarUrl"),
                "phone": phone,
            }
        else:
            user_for_pm["phone"] = user_for_pm.get("phone") or phone
        sync_user_to_pm(user_for_pm, env_loader, record_login=False)
    except Exception:
        pass

    inquiry_id = _new_inquiry_id()
    status = "已提交"
    created_at = datetime.now(timezone.utc).isoformat()
    status_history = {"已提交": created_at}
    standard_total, quoted_total, discount_rate = compute_inquiry_totals(items, total)
    record = {
        "id": inquiry_id,
        "websiteOpenid": website_openid,
        "company": company,
        "contact": contact,
        "phone": phone,
        "total": total,
        "quotedTotal": quoted_total,
        "items": items,
        "status": status,
        "statusHistory": status_history,
        "notifySent": False,
        "pmSynced": False,
        "createdAt": created_at,
        "nickname": nickname,
    }
    save_inquiry(record)

    notify = notify_inquiry_if_subscribed(
        website_openid,
        inquiry_id=inquiry_id,
        status=status,
        created_at=created_at,
        env_loader=env_loader,
    )
    if notify.get("sent"):
        try:
            update_inquiry_flags(inquiry_id, notify_sent=True)
        except Exception:
            pass

    pm = {"ok": False}
    try:
        pm = sync_inquiry_to_pm(
            {
                "inquiryId": inquiry_id,
                "company": company,
                "contact": contact,
                "phone": phone,
                "total": total,
                "items": items,
                "status": status,
                "websiteOpenid": website_openid,
                "nickname": nickname,
                "createdAt": record["createdAt"],
            },
            env_loader,
        )
        if pm.get("ok") or pm.get("inquiry"):
            update_inquiry_flags(inquiry_id, pm_synced=True)
            pm["ok"] = True
    except Exception as e:
        pm = {"ok": False, "error": str(e)}

    return 200, {
        "ok": True,
        "inquiryId": inquiry_id,
        "status": status,
        "quotedTotal": quoted_total,
        "standardTotal": standard_total,
        "discountRate": discount_rate,
        "notify": notify,
        "pm": pm,
    }
