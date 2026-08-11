#!/usr/bin/env python3
"""Fix /v1/diagnosis/ CORS on the live nginx conf (run on the API server).

Does NOT use nginx `if` (that put proxy_pass in an invalid context when
the previous rewrite was truncated). Mirrors the working /v1/chatbot/ CORS
pattern: proxy_hide_header + add_header ... always.

Usage on server:
  docker cp docker-nginx-1:/etc/nginx/conf.d/zzz-api.daoith.com.conf /tmp/zzz-api.daoith.com.conf
  python3 fix-diagnosis-cors.py /tmp/zzz-api.daoith.com.conf
  docker cp /tmp/zzz-api.daoith.com.conf docker-nginx-1:/etc/nginx/conf.d/zzz-api.daoith.com.conf
  docker exec docker-nginx-1 nginx -t && docker exec docker-nginx-1 nginx -s reload
"""
from __future__ import annotations

import re
import sys
from pathlib import Path


def find_bearer_near(text: str, location: str) -> str | None:
    """First Bearer app-... after a location directive (even if braces are broken)."""
    idx = text.find(f"location {location}")
    if idx < 0:
        return None
    m = re.search(r'Bearer (app-[^"\s]+)', text[idx : idx + 4000])
    return m.group(1) if m else None


def diagnosis_block(key: str) -> str:
    return f"""    location /v1/diagnosis/ {{
        rewrite ^/v1/diagnosis/(.*)$ /v1/$1 break;
        proxy_pass http://api:5001;
        proxy_http_version 1.1;
        proxy_set_header Host api.daoith.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Authorization "Bearer {key}";
        proxy_buffering off;
        proxy_read_timeout 3600s;

        proxy_hide_header Access-Control-Allow-Origin;
        proxy_hide_header Access-Control-Allow-Methods;
        proxy_hide_header Access-Control-Allow-Headers;

        add_header Access-Control-Allow-Origin "$http_origin" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, Accept" always;
        add_header Access-Control-Max-Age 86400 always;
        add_header Vary "Origin" always;
    }}"""


def strip_location_block(text: str, location: str) -> str:
    """Remove a location block by brace matching from its start."""
    needle = f"location {location}"
    idx = text.find(needle)
    if idx < 0:
        return text
    # include leading whitespace / comments on same indent line start
    start = text.rfind("\n", 0, idx)
    start = 0 if start < 0 else start + 1
    brace = text.find("{", idx)
    if brace < 0:
        raise SystemExit(f"location {location}: missing {{")
    depth = 0
    i = brace
    while i < len(text):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(text) and text[end] == "\n":
                    end += 1
                return text[:start] + text[end:]
        i += 1
    raise SystemExit(f"location {location}: unclosed brace")


def insert_before(text: str, before_location: str, block: str) -> str:
    needle = f"location {before_location}"
    idx = text.find(needle)
    if idx < 0:
        raise SystemExit(f"找不到插入点 location {before_location}")
    start = text.rfind("\n", 0, idx)
    start = 0 if start < 0 else start + 1
    return text[:start] + block + "\n\n" + text[start:]


def main() -> int:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/zzz-api.daoith.com.conf")
    text = path.read_text(encoding="utf-8", errors="ignore")

    key = find_bearer_near(text, "/v1/diagnosis/")
    if not key:
        # last resort: any Bearer after the string "diagnosis"
        m = re.search(
            r"diagnosis.*?Bearer (app-[^\s\"]+)",
            text,
            flags=re.S | re.I,
        )
        key = m.group(1) if m else None
    if not key:
        print("ERROR: 找不到 diagnosis 的 Bearer app- 密钥", file=sys.stderr)
        return 1

    # Drop broken diagnosis block (brace-match). If braces are already broken,
    # cut from diagnosis start until next location /v1/chatbot or /v1/.
    if "location /v1/diagnosis/" in text:
        try:
            text = strip_location_block(text, "/v1/diagnosis/")
        except SystemExit:
            for nxt in ("/v1/chatbot/", "/v1/"):
                a = text.find("location /v1/diagnosis/")
                b = text.find(f"location {nxt}")
                if a >= 0 and b > a:
                    start = text.rfind("\n", 0, a)
                    start = 0 if start < 0 else start + 1
                    text = text[:start] + text[b:]
                    break
            else:
                print("ERROR: 无法切除损坏的 diagnosis 段", file=sys.stderr)
                return 1

    # Prefer insert before chatbot; else before /v1/
    if "location /v1/chatbot/" in text:
        text = insert_before(text, "/v1/chatbot/", diagnosis_block(key))
    elif "location /v1/" in text:
        text = insert_before(text, "/v1/", diagnosis_block(key))
    else:
        print("ERROR: 找不到 /v1/chatbot/ 或 /v1/ 插入点", file=sys.stderr)
        return 1

    out = path.with_suffix(".fixed.conf") if path.suffix else Path(str(path) + ".fixed")
    # default: write beside input as .fixed.conf, also overwrite only if --in-place
    if "--in-place" in sys.argv:
        path.write_text(text, encoding="utf-8")
        print(f"OK: fixed diagnosis CORS in {path} (key kept, no if)")
    else:
        # write sibling fixed file
        fixed = Path(str(path) + ".fixed")
        fixed.write_text(text, encoding="utf-8")
        print(f"OK: wrote {fixed} (key kept, no if). Review then copy over original.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
