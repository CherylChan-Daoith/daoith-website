#!/usr/bin/env python3
import json
import os
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name: str) -> str:
    val = os.environ.get(name, "").strip()
    if val:
        return val
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def main() -> None:
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    appid = load("WECHAT_OA_APP_ID")
    secret = load("WECHAT_OA_APP_SECRET")
    print("appid_prefix", appid[:8] if appid else None, "secret_set", bool(secret))

    q = urllib.parse.urlencode(
        {"grant_type": "client_credential", "appid": appid, "secret": secret}
    )
    with opener.open(f"https://api.weixin.qq.com/cgi-bin/token?{q}", timeout=20) as resp:
        tok = json.loads(resp.read().decode("utf-8"))
    print("token_ok", bool(tok.get("access_token")), "errcode", tok.get("errcode"), "errmsg", tok.get("errmsg"))
    token = tok.get("access_token")
    if not token:
        return

    def post(path: str, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            f"https://api.weixin.qq.com{path}?access_token={token}",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with opener.open(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))

    fp = post("/cgi-bin/freepublish/batchget", {"offset": 0, "count": 20, "no_content": 1})
    print("\nFREEPUBLISH")
    print("errcode", fp.get("errcode"), "errmsg", fp.get("errmsg"))
    print(
        "total_count",
        fp.get("total_count"),
        "item_count",
        fp.get("item_count"),
        "items",
        len(fp.get("item") or []),
    )

    mat = post("/cgi-bin/material/batchget_material", {"type": "news", "offset": 0, "count": 20})
    print("\nMATERIAL_NEWS")
    print("errcode", mat.get("errcode"), "errmsg", mat.get("errmsg"))
    print(
        "total_count",
        mat.get("total_count"),
        "item_count",
        mat.get("item_count"),
        "items",
        len(mat.get("item") or []),
    )
    for i, entry in enumerate((mat.get("item") or [])[:5]):
        news = ((entry.get("content") or {}).get("news_item") or [{}])[0]
        print(
            f"  [{i}] title={str(news.get('title') or '')[:48]!r} "
            f"url_set={bool(news.get('url'))} deleted={news.get('is_deleted')}"
        )

    draft = post("/cgi-bin/draft/batchget", {"offset": 0, "count": 5, "no_content": 1})
    print("\nDRAFT")
    print("errcode", draft.get("errcode"), "errmsg", draft.get("errmsg"))
    print("total_count", draft.get("total_count"), "items", len(draft.get("item") or []))


if __name__ == "__main__":
    main()
