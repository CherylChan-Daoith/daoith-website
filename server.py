#!/usr/bin/env python3
"""Static file server with DeepSeek and Dify API proxies for DAOITH website."""

import os
import json
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import server_auth

ROOT = Path(__file__).resolve().parent
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-chat"
DEFAULT_DIFY_BASE = "http://localhost/v1"

# Bypass system HTTP proxy (common cause of "Tunnel connection failed: 403")
_NO_PROXY_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def load_env_value(name):
    val = os.environ.get(name, "").strip()
    if val:
        return val
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(f"{name}="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def load_api_key():
    return load_env_value("DEEPSEEK_API_KEY")


def load_dify_key():
    return load_env_value("DIFY_API_KEY")


def load_dify_base():
    return load_env_value("DIFY_API_BASE") or DEFAULT_DIFY_BASE


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # CORS is handled by the public reverse proxy (api.daoith.com).
        # Do not emit Access-Control-* here, or browsers will see duplicate headers.
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            self.send_json(
                200,
                {
                    "ok": True,
                    "deepseek_configured": bool(load_api_key()),
                    "dify_configured": bool(load_dify_key()),
                    "wechat_configured": bool(
                        load_env_value("WECHAT_APP_ID") and load_env_value("WECHAT_APP_SECRET")
                    ),
                    "wechat_oa_configured": bool(
                        load_env_value("WECHAT_OA_APP_ID") and load_env_value("WECHAT_OA_APP_SECRET")
                    ),
                    "jwt_configured": bool(load_env_value("JWT_SECRET")),
                    "database_configured": bool(
                        load_env_value("DATABASE_URL") or load_env_value("POSTGRES_URL")
                    ),
                },
            )
            return
        if path == "/api/auth/wechat/me":
            status, data = server_auth.handle_wechat_me(
                self.headers.get("Authorization", ""),
                load_env_value,
            )
            self.send_json(status, data)
            return
        if path == "/api/auth/wechat/notify/status":
            status, data = server_auth.handle_notify_status(
                self.headers.get("Authorization", ""),
                load_env_value,
            )
            self.send_json(status, data)
            return
        if path == "/api/auth/wechat-oa/openid":
            self.handle_wechat_oa_openid(query)
            return
        if path == "/api/wechat-oa/articles":
            offset = int((query.get("offset") or ["0"])[0] or 0)
            count = int((query.get("count") or ["20"])[0] or 20)
            status, data = server_auth.handle_oa_articles(load_env_value, offset=offset, count=count)
            self.send_json(status, data)
            return
        return super().do_GET()

    def handle_wechat_oa_openid(self, query):
        code = (query.get("code") or [""])[0].strip()
        if not code:
            self.send_json(400, {"error": "缺少 code"})
            return

        app_id = load_env_value("WECHAT_OA_APP_ID")
        app_secret = load_env_value("WECHAT_OA_APP_SECRET")
        if not app_id or not app_secret:
            self.send_json(
                503,
                {
                    "error": "未配置服务号凭证",
                    "hint": "请在 .env 设置 WECHAT_OA_APP_ID 与 WECHAT_OA_APP_SECRET",
                },
            )
            return

        params = urllib.parse.urlencode(
            {
                "appid": app_id,
                "secret": app_secret,
                "code": code,
                "grant_type": "authorization_code",
            }
        )
        url = f"https://api.weixin.qq.com/sns/oauth2/access_token?{params}"
        try:
            with _NO_PROXY_OPENER.open(url, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except Exception as err:
            self.send_json(502, {"error": f"微信接口请求失败: {err}"})
            return

        if data.get("errcode"):
            self.send_json(
                400,
                {
                    "error": data.get("errmsg") or f"WeChat error {data.get('errcode')}",
                    "errcode": data.get("errcode"),
                },
            )
            return

        self.send_json(
            200,
            {
                "openid": data.get("openid"),
                "unionid": data.get("unionid"),
                "scope": data.get("scope"),
            },
        )

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/deepseek":
            self.handle_deepseek()
            return
        if path == "/api/dify":
            self.handle_dify()
            return
        if path == "/api/auth/wechat/login":
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except json.JSONDecodeError:
                self.send_json(400, {"error": "请求体必须是 JSON"})
                return
            status, data = server_auth.handle_wechat_login(body, load_env_value)
            self.send_json(status, data)
            return
        if path in (
            "/api/auth/wechat/notify/ticket",
            "/api/auth/wechat/notify/bind",
            "/api/auth/wechat/notify/enable",
            "/api/auth/wechat/notify/disable",
        ):
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length) or b"{}") if length else {}
            except json.JSONDecodeError:
                self.send_json(400, {"error": "请求体必须是 JSON"})
                return
            auth = self.headers.get("Authorization", "")
            if path.endswith("/ticket"):
                status, data = server_auth.handle_notify_ticket(auth, load_env_value)
            elif path.endswith("/bind"):
                status, data = server_auth.handle_notify_bind(auth, body, load_env_value)
            elif path.endswith("/enable"):
                status, data = server_auth.handle_notify_enable(auth, load_env_value)
            else:
                status, data = server_auth.handle_notify_disable(auth, load_env_value)
            self.send_json(status, data)
            return
        self.send_error(404)

    def handle_deepseek(self):
        api_key = load_api_key()
        if not api_key:
            self.send_json(
                503,
                {
                    "error": "未配置 DeepSeek API Key",
                    "hint": "请在项目根目录创建 .env 文件，写入 DEEPSEEK_API_KEY=你的密钥",
                },
            )
            return

        length = int(self.headers.get("Content-Length", 0))
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except json.JSONDecodeError:
            self.send_json(400, {"error": "请求体必须是 JSON"})
            return

        payload = {
            "model": body.get("model", DEFAULT_MODEL),
            "messages": body.get("messages", []),
            "temperature": body.get("temperature", 0.3),
            "max_tokens": body.get("max_tokens", 2000),
        }

        req = urllib.request.Request(
            DEEPSEEK_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            self.send_json(200, data)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            self.send_json(e.code, {"error": "DeepSeek API 错误", "detail": detail})
        except Exception as e:
            self.send_json(502, {"error": str(e)})

    def handle_dify(self):
        api_key = self.headers.get("X-Dify-API-Key", "").strip() or load_dify_key()
        if not api_key:
            self.send_json(
                503,
                {
                    "message": "未配置 Dify API Key",
                    "hint": "在页面「知识库设置」填写 API Key，或在 .env 写入 DIFY_API_KEY=app-...",
                },
            )
            return

        api_base = self.headers.get("X-Dify-API-Base", "").strip() or load_dify_base()
        endpoint = self.headers.get("X-Dify-Endpoint", "/chat-messages").strip()
        method = self.headers.get("X-Dify-Method", "POST").strip().upper()
        if not endpoint.startswith("/"):
            endpoint = "/" + endpoint

        url = api_base.rstrip("/") + endpoint

        if method == "GET":
            body = None
        else:
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except json.JSONDecodeError:
                self.send_json(400, {"message": "请求体必须是 JSON"})
                return

        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8") if body is not None else None,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            method=method,
        )

        try:
            with _NO_PROXY_OPENER.open(req, timeout=120) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            self.send_json(200, data)
        except urllib.error.HTTPError as e:
            detail = e.read().decode("utf-8", errors="replace")
            try:
                err_data = json.loads(detail)
            except json.JSONDecodeError:
                err_data = {"message": detail}
            if isinstance(err_data, dict) and "message" not in err_data:
                err_data["message"] = err_data.get("code") or detail[:200]
            self.send_json(e.code, err_data)
        except urllib.error.URLError as e:
            hint = "请检查 API 地址是否正确，末尾须带 /v1"
            if "Connection refused" in str(e.reason):
                hint = "无法连接 Dify 服务。请确认 Docker 已启动，地址如 http://localhost/v1"
            elif "403" in str(e.reason) or "Tunnel" in str(e.reason):
                hint = "网络代理拦截。自托管 Dify 请用 http://localhost/v1 或你的内网地址"
            self.send_json(502, {"message": str(e.reason), "hint": hint, "url": url})
        except Exception as e:
            self.send_json(502, {"message": str(e), "url": url})

    def send_json(self, status, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    port = int(os.environ.get("PORT", "8080"))
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"DAOITH server running at http://localhost:{port}")
    print("Exam prep:     http://localhost:{0}/exam-prep.html".format(port))
    print("DeepSeek proxy: POST /api/deepseek")
    print("Dify proxy:     POST /api/dify")
    if not load_api_key():
        print("Warning: DEEPSEEK_API_KEY not set")
    if not load_dify_key():
        print("Info: DIFY_API_KEY not in .env — configure in exam-prep settings")
    server.serve_forever()


if __name__ == "__main__":
    main()
