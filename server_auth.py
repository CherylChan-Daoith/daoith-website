#!/usr/bin/env python3
"""WeChat OAuth helpers for local server.py development."""

import base64
import hashlib
import hmac
import json
import os
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
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
