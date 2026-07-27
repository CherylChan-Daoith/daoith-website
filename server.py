#!/usr/bin/env python3
"""Static file server with DeepSeek and Dify API proxies for DAOITH website."""

import os
import json
import urllib.error
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
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type, X-Dify-API-Key, X-Dify-API-Base, X-Dify-Endpoint, Authorization",
        )
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self.send_json(
                200,
                {
                    "ok": True,
                    "deepseek_configured": bool(load_api_key()),
                    "dify_configured": bool(load_dify_key()),
                    "wechat_configured": bool(
                        load_env_value("WECHAT_APP_ID") and load_env_value("WECHAT_APP_SECRET")
                    ),
                    "jwt_configured": bool(load_env_value("JWT_SECRET")),
                },
            )
            return
        if self.path == "/api/auth/wechat/me":
            status, data = server_auth.handle_wechat_me(
                self.headers.get("Authorization", ""),
                load_env_value,
            )
            self.send_json(status, data)
            return
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/deepseek":
            self.handle_deepseek()
            return
        if self.path == "/api/dify":
            self.handle_dify()
            return
        if self.path == "/api/auth/wechat/login":
            length = int(self.headers.get("Content-Length", 0))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except json.JSONDecodeError:
                self.send_json(400, {"error": "请求体必须是 JSON"})
                return
            status, data = server_auth.handle_wechat_login(body, load_env_value)
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
