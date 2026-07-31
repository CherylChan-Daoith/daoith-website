#!/usr/bin/env python3
"""One-off test: send inquiry template message via WeChat OA."""
import json
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ALLOWED_STATUS = {"已提交", "已受理", "已报价", "已成交", "已关闭"}


def load_env():
    env = {}
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_token(env):
    url = (
        "https://api.weixin.qq.com/cgi-bin/token"
        f"?grant_type=client_credential&appid={env['WECHAT_OA_APP_ID']}"
        f"&secret={env['WECHAT_OA_APP_SECRET']}"
    )
    data = json.load(urllib.request.urlopen(url, timeout=20))
    if "access_token" not in data:
        raise SystemExit(json.dumps(data, ensure_ascii=False))
    return data["access_token"]


def main():
    if len(sys.argv) < 2:
        print("Usage: send_inquiry_tmpl_test.py <oa_openid> [status]")
        raise SystemExit(2)

    openid = sys.argv[1].strip()
    status = (sys.argv[2] if len(sys.argv) > 2 else "已提交").strip()
    if status not in ALLOWED_STATUS:
        raise SystemExit(f"status must be one of {sorted(ALLOWED_STATUS)}")

    env = load_env()
    for key in ("WECHAT_OA_APP_ID", "WECHAT_OA_APP_SECRET", "WECHAT_TMPL_INQUIRY"):
        if not env.get(key):
            raise SystemExit(f"missing {key} in .env")

    now = datetime.now().strftime("%Y年%m月%d日 %H:%M")
    due = datetime.now().strftime("%Y年%m月%d日")
    body = {
        "touser": openid,
        "template_id": env["WECHAT_TMPL_INQUIRY"],
        "url": "https://www.daoith.com/#hub",
        "data": {
            "thing3": {"value": "官网询价"},
            "time4": {"value": now},
            "character_string5": {"value": "TEST" + datetime.now().strftime("%m%d%H%M%S")},
            "const12": {"value": status},
            "time29": {"value": due},
        },
    }

    token = get_token(env)
    req = urllib.request.Request(
        f"https://api.weixin.qq.com/cgi-bin/message/template/send?access_token={token}",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = json.load(urllib.request.urlopen(req, timeout=20))
    print(json.dumps(resp, ensure_ascii=False))


if __name__ == "__main__":
    main()
