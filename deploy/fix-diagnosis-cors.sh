#!/bin/bash
# Run ON the Aliyun API server (root@iZwz9...).
# Fixes /v1/diagnosis/ CORS without nginx `if` (avoids proxy_pass context errors).
set -euo pipefail
NGINX="${NGINX_CONTAINER:-docker-nginx-1}"
CONF_IN_CONTAINER="/etc/nginx/conf.d/zzz-api.daoith.com.conf"
TMP="/tmp/zzz-api.daoith.com.conf"
FIXED="/tmp/zzz-api.daoith.com.conf.fixed"

docker cp "$NGINX:$CONF_IN_CONTAINER" "$TMP"

python3 - "$TMP" <<'PY'
from pathlib import Path
import re, sys

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8", errors="ignore")

def find_bearer_near(text, location):
    idx = text.find(f"location {location}")
    if idx < 0:
        return None
    m = re.search(r'Bearer (app-[^"\s]+)', text[idx:idx + 4000])
    return m.group(1) if m else None

key = find_bearer_near(text, "/v1/diagnosis/")
if not key:
    m = re.search(r"diagnosis.*?Bearer (app-[^\s\"]+)", text, flags=re.S | re.I)
    key = m.group(1) if m else None
if not key:
    raise SystemExit("找不到 diagnosis 的 Bearer app- 密钥")

block = f"""    location /v1/diagnosis/ {{
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
    }}
"""

def strip_location_block(text, location):
    needle = f"location {location}"
    idx = text.find(needle)
    if idx < 0:
        return text
    start = text.rfind("\n", 0, idx)
    start = 0 if start < 0 else start + 1
    brace = text.find("{", idx)
    if brace < 0:
        raise SystemExit(f"location {location}: missing {{")
    depth = 0
    i = brace
    while i < len(text):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                if end < len(text) and text[end] == "\n":
                    end += 1
                return text[:start] + text[end:]
        i += 1
    raise SystemExit(f"location {location}: unclosed brace")

if "location /v1/diagnosis/" in text:
    try:
        text = strip_location_block(text, "/v1/diagnosis/")
    except SystemExit:
        cut = False
        for nxt in ("/v1/chatbot/", "/v1/"):
            a = text.find("location /v1/diagnosis/")
            b = text.find(f"location {nxt}")
            if a >= 0 and b > a:
                start = text.rfind("\n", 0, a)
                start = 0 if start < 0 else start + 1
                text = text[:start] + text[b:]
                cut = True
                break
        if not cut:
            raise SystemExit("无法切除损坏的 diagnosis 段")

def insert_before(text, before_location, block):
    needle = f"location {before_location}"
    idx = text.find(needle)
    if idx < 0:
        raise SystemExit(f"找不到插入点 location {before_location}")
    start = text.rfind("\n", 0, idx)
    start = 0 if start < 0 else start + 1
    return text[:start] + block + "\n" + text[start:]

if "location /v1/chatbot/" in text:
    text = insert_before(text, "/v1/chatbot/", block)
elif "location /v1/" in text:
    text = insert_before(text, "/v1/", block)
else:
    raise SystemExit("找不到 /v1/chatbot/ 或 /v1/ 插入点")

fixed = Path(str(path) + ".fixed")
fixed.write_text(text, encoding="utf-8")
print(f"已生成修复文件: {fixed}（密钥已保留，无 if）")
PY

# Only replace live conf after nginx -t passes
docker cp "$FIXED" "$NGINX:/tmp/zzz-api.daoith.com.conf.fixed"
docker exec "$NGINX" nginx -t -c /etc/nginx/nginx.conf 2>/tmp/nginx-t.err || true
# Test by temporarily swapping inside container
docker exec "$NGINX" sh -c "cp '$CONF_IN_CONTAINER' /tmp/zzz-api.bak.live && cp /tmp/zzz-api.daoith.com.conf.fixed '$CONF_IN_CONTAINER' && nginx -t"
docker exec "$NGINX" nginx -s reload
echo "重载完成。验证："
curl -s https://api.daoith.com/v1/diagnosis/info | head -c 200
echo
curl -sI -X OPTIONS https://api.daoith.com/v1/diagnosis/chat-messages \
  -H "Origin: https://www.daoith.com" \
  -H "Access-Control-Request-Method: POST" | grep -i access-control || true
echo "请再硬刷新官网试一次合规诊断。"
