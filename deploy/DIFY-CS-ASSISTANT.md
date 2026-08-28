# 全站智能客服（独立 Agent）

官网右下角「智能客服」与 AI 解决方案页的诊断助手是 **两个 Dify 应用、两把 API Key、两条 nginx 路径**。

| 入口 | 官网调用 | Dify 应用 |
|------|----------|-----------|
| AI解决方案左侧「道一合规助手」 | `/v1/diagnosis/chat-messages` | 道一财税诊断助手（不要改） |
| 全站右下角「智能客服」 | `/v1/cs/chat-messages` | **你新建的客服 Agent** |
| （旧）右下角咨询 | `/v1/chatbot/chat-messages` | 道一聊天机器人（官网已不再调用） |

前端：`js/cs-assistant.js` → `DAOITH_CONFIG.difyCsEndpoint`。快捷按钮不依赖 Dify；自由输入才打客服 Agent。

## 1. Dify 客服 Agent

1. 打开你新建的客服应用（不要打开诊断助手）
2. 指令粘贴 `deploy/dify-prompts/cs-assistant-system.md`
3. 开场白粘贴 `deploy/dify-prompts/cs-assistant-opening.md`
4. **不要**挂法规知识库，**不要**加 Question Classifier
5. 保存并 **发布**
6. **访问 API** → 复制该应用的 `app-...` 密钥（只放服务器）

## 2. 服务器 nginx：单独挂客服 Key

在 **443 server** 里、`location /v1/diagnosis/` **下面**增加（Key 换成客服 Agent 的，不要用诊断那把）：

```nginx
location /v1/cs/ {
    rewrite ^/v1/cs/(.*)$ /v1/$1 break;
    proxy_pass http://api:5001;
    proxy_http_version 1.1;
    proxy_set_header Host api.daoith.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Authorization "Bearer app-你的客服Agent密钥";
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
}
```

仓库模板：`deploy/nginx.api.daoith.com.conf`（Key 在模板里是注释，必须在服务器本地 conf 写上）。

重载：

```bash
docker exec -it <nginx容器名> nginx -t && docker exec -it <nginx容器名> nginx -s reload
```

## 3. 验收（必须看到两个不同应用名）

```bash
curl -s https://api.daoith.com/v1/diagnosis/info
# 应是「道一财税诊断助手」

curl -s https://api.daoith.com/v1/cs/info
# 应是你新建的客服 Agent 名称，且与上一行不同

curl -s -X POST https://api.daoith.com/v1/cs/chat-messages \
  -H 'Content-Type: application/json' \
  -d '{"inputs":{},"query":"我想注册香港公司","response_mode":"blocking","user":"cs-selftest"}'
```

客服应引导香港公司注册 / 询价，而不是展开税务诊断。

配好 `/v1/cs/info` 能返回客服应用名后告诉我即可。
