# 在 Dify 搭建「道一财税诊断助手」Agent

> 目标：多轮对话，**一次只问一个问题**，收集跨境财税关键信息后给出诊断与方案。  
> 提示词文件：`deploy/dify-prompts/diagnosis-agent-*.md`

## 0. 和现有应用的关系

| 应用 | 用途 | 官网入口 |
|------|------|----------|
| 道一聊天机器人 | 短问短答 / 知识检索 | `/v1/chatbot/*` 右下角咨询 |
| 道一合规方案助手 | 表单一次生成方案 | `/v1/chat-messages` |
| **道一财税诊断助手（新建）** | **逐步问诊式诊断** | 可先在 Dify 预览；确认后再接官网 |

建议：**新建独立 Agent**，不要直接改现有 Chatflow（现有分类器曾不稳定）。

## 1. 创建应用（推荐：Agent）

1. 打开 Dify 控制台 → **工作室** → **创建应用**
2. 选择 **Agent**（对话型，可挂知识库工具）
3. 名称：`道一财税诊断助手`
4. 描述：`逐步收集跨境业务信息，诊断财税风险并给出解决方案`

若你更习惯 Chatflow：可用「开始 → LLM → 知识检索 → LLM」两段式，**不要加 Question Classifier**（易 JSON 解析失败）。

## 2. 粘贴提示词

1. 打开 `deploy/dify-prompts/diagnosis-agent-system.md`  
   → 全文复制到 Agent **指令（Instruction）**
2. 打开 `deploy/dify-prompts/diagnosis-agent-opening.md`  
   → 填到 **开场白 / Opening Statement**，并勾选「开场白后进入对话」
3. （可选）`diagnosis-agent-kb-instruction.md`  
   → 填到知识检索节点的「查询说明」或 Agent 工具描述

## 3. 模型建议

| 节点 | 建议 | 说明 |
|------|------|------|
| 主对话 LLM | 中等偏强、稳定 | 问诊逻辑与方案结构 |
| 温度 | 0.2–0.4 | 少发挥、少编造税率 |
| 最大 Token | 2048–4096 | 正式方案够用即可 |

分类/小模型：**本 Agent 不需要分类器**。

## 4. 挂载知识库（按你库实际名称勾选）

优先挂：

- `DAOITH跨境电商知识库`（300问 / 平台税等）
- `出口退税法规和实操`（如有）
- `海关编码和出口退税率`（仅在用户问具体 HS 退税时依赖；回答时严守「退税率≠增值税」）
- 各国/平台税制库（按你现有库勾选，避免一次挂过多导致串库）

Agent 工具设置建议：

- Top K：`3`–`5`
- Score 阈值：按你环境调到「宁缺毋滥」
- **Rerank**：若 SiliconFlow rerank 曾 403，先关掉或换可用模型

## 5. 对话变量（可选，增强可控性）

在「变量」里可建（文本，默认空）：

- `platform` 电商平台  
- `shipping` 发货模式  
- `entity` 店铺主体  
- `country` 目的国  
- `export_mode` 出口方式  
- `invoice` 发票情况  
- `hs_code` HS/品类  
- `pain_point` 用户痛点  

在指令中加一句：「每确认一个槽位，在回复末尾用一行 JSON 更新（仅内部思考也可）：`{"slot":"platform","value":"..."}`」。  
若不想折腾变量，**只靠多轮记忆 + 系统提示也够用**。

## 6. 发布与自测

点 **发布** 后，用对话预览测这三条路径：

### A. 从零问诊
用户：`你好`  
期望：开场后只问平台。  
用户：`亚马逊`  
期望：只问发货模式（FBA 还是直发）。  
…直到主体+目的国齐全后再出「1）…5）」完整结构。

### B. 信息一次性给齐
用户：`中国公司，Amazon FBA 卖美国，供应商专票，想知道退税和美国销售税要注意什么`  
期望：**不再追问清单**，直接出诊断结构。

### C. 防幻觉
用户：`镶钻银饰出口退税是不是13%`  
期望：不把增值税当退税；引导查编码/知识库；不确定则说以官方文库为准。

## 7. 接到 API：`/v1/diagnosis/`（服务器 nginx）

原理与 `/v1/chatbot/` 相同：对外路径带前缀，nginx **改写**成 Dify 的 `/v1/...`，并注入该 Agent 的 `Authorization: Bearer app-...`。

| 对外（给官网用） | 实际打到 Dify |
|------------------|---------------|
| `POST https://api.daoith.com/v1/diagnosis/chat-messages` | `POST /v1/chat-messages` + 诊断 Agent Key |
| `GET  https://api.daoith.com/v1/diagnosis/info` | `GET /v1/info` + 诊断 Agent Key |

### 7.1 在 Dify 拿到 Key

1. 打开「道一财税诊断助手」→ **访问 API** / **API 密钥**  
2. 复制 `app-...`（只放服务器，不要提交到 Git）

### 7.2 SSH 上服务器改 nginx

```bash
# 按你平时的主机名，例如：
ssh daoith-pm

# 找到 api.daoith.com 的 conf（常见在 Dify 的 nginx conf.d）
# 示例路径，以你机器实际为准：
sudo find / -name '*api.daoith.com*' 2>/dev/null | head
# 或
docker ps | grep -i nginx
```

在 **443 server** 里、`location /v1/chatbot/` **上面**增加（Key 换成你的）：

```nginx
location /v1/diagnosis/ {
    rewrite ^/v1/diagnosis/(.*)$ /v1/$1 break;
    proxy_pass http://api:5001;
    proxy_http_version 1.1;
    proxy_set_header Host api.daoith.com;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Authorization "Bearer app-你的诊断Agent密钥";
    proxy_buffering off;
    proxy_read_timeout 3600s;

    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Allow-Headers;

    add_header Access-Control-Allow-Origin "$http_origin" always;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
    add_header Access-Control-Max-Age 86400 always;
    add_header Vary "Origin" always;
}
```

仓库模板见：`deploy/nginx.api.daoith.com.conf`（模板里 Key 是注释掉的）。

### 7.3 重载 nginx

```bash
# 若 nginx 在 Docker（Dify 常见）：
docker exec -it <nginx容器名> nginx -t && docker exec -it <nginx容器名> nginx -s reload

# 若是宿主机 nginx：
sudo nginx -t && sudo systemctl reload nginx
```

### 7.4 自测（本机或服务器）

```bash
curl -s https://api.daoith.com/v1/diagnosis/info
# 应看到你的诊断助手名称 / mode

curl -s -X POST https://api.daoith.com/v1/diagnosis/chat-messages \
  -H 'Content-Type: application/json' \
  -d '{"inputs":{},"query":"你好","response_mode":"blocking","user":"diag-selftest"}'
```

配好后跟我说「diagnosis 已通」，我再把官网前端接到 `/v1/diagnosis/`。

### 7.5 和现有入口的关系

| 路径 | 应用 |
|------|------|
| `/v1/chatbot/*` | 道一聊天机器人（右下角，可暂留） |
| `/v1/diagnosis/*` | 道一财税诊断助手（新建） |
| `/v1/*` | 道一合规方案助手（表单方案） |

## 8. 验收清单

- [ ] 一次只问一个问题  
- [ ] 不输出「请提供以下信息」长清单 / 通用框架灌水  
- [ ] 信息够时输出固定五段结构  
- [ ] 退税率不与增值税混淆  
- [ ] 知识库无关片段不会串台  
- [ ] 已 **发布**（草稿预览 ≠ 官网 API）

## 9. 我这边已为你准备的文件

```
deploy/DIFY-DIAGNOSIS-AGENT.md          ← 本文
deploy/dify-prompts/diagnosis-agent-system.md
deploy/dify-prompts/diagnosis-agent-opening.md
deploy/dify-prompts/diagnosis-agent-kb-instruction.md
```
