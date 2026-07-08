#!/usr/bin/env python3
"""Static file server with DeepSeek API proxy for DAOITH website."""

import json
import os
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-chat"


def load_api_key():
    key = os.environ.get("DEEPSEEK_API_KEY", "").strip()
    if key:
        return key
    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("DEEPSEEK_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
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
                },
            )
            return
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/deepseek":
            self.send_error(404)
            return
        self.handle_deepseek()

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
    print("DeepSeek proxy: POST /api/deepseek")
    if not load_api_key():
        print("Warning: DEEPSEEK_API_KEY not set — AI features will prompt for configuration")
    server.serve_forever()


if __name__ == "__main__":
    main()
