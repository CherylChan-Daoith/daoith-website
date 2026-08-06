# 官网咨询 vs Dify 预览答案不一致 — 排查结论与对齐步骤

> 更新：2026-08-06  
> 相关代码：`js/main.js`（浮动咨询）、`js/config.js`、`deploy/nginx.api.daoith.com.conf`

## 1. 两端实际打的不是同一个入口

| 入口 | 调用 | Dify 应用（`/v1/.../info`） | mode |
|------|------|---------------------------|------|
| 官网右下角「咨询」 | `https://api.daoith.com/v1/chatbot/chat-messages` | **道一聊天机器人** | `advanced-chat`（Chatflow） |
| 官网方案/HS/税负 | `https://api.daoith.com/v1/chat-messages` | **道一合规方案助手** | `advanced-chat` |
| Dify「工作流」预览 | 控制台里你打开的那个 Workflow | **往往不是上面两个** | `workflow` |

官网咨询站点标题为：`Question Classifier + Knowledge + Chatbot`。

**对齐原则**：对比官网咨询时，只能用 Dify 里的 **「道一聊天机器人」Chatflow → 已发布 → 对话预览**，不要用其它 Workflow。

## 2. 实测根因（已复现）

### A. 官网曾把长「系统规范」塞进 query → 分类器炸裂

Chatflow 含 **Question Classifier**。官网旧逻辑把下列内容拼进 `query`：

- 【回答规范】…
- 【出口退税硬规则】…
- 用户问题：…

实测结果：

```text
HTTP 400  could not find json block in the output
```

分类器要求模型输出 JSON，长包装导致解析失败。

### B. 官网前端 catch 后换成本地兜底 → 看起来像「另一个 AI」

`js/main.js` 在请求失败时会调用 `buildLocalChatReply()`。浏览器实测：

- 用户问：`Ozon俄罗斯VAT代收后还要注册吗`
- 页面展示：`我可以回答海关编码、出口方式…请先在左侧填写业务信息…`（本地脚本）
- 同时 Dify 控制台若跑的是另一条 Workflow / 或同一 Chatflow 的干净问句，答案完全不同

### C. 即便 Chatflow 成功，检索也可能串库

对干净问句 `Ozon俄罗斯VAT代收后还要注册吗`，Chatflow 有时返回与卫生检疫审批相关的片段（明显串台），说明知识检索节点绑定/路由仍需在 Dify 内校正。

### D. 「道一合规方案助手」另有故障

`/v1/chat-messages` 实测出现 SiliconFlow **rerank 403**，与咨询 Chatflow 无关，但会影响方案生成。

## 3. 已做代码修复（官网侧）

`js/main.js` 浮动咨询改为：

1. **`query` 尽量等于用户原话**（有左侧方案上下文时只追加一行短背景）
2. **不再**塞长系统规范进 query（规范应写在 Dify Chatflow 系统提示 / LLM 节点）
3. API/分类器失败时 **明示服务异常**，避免静默换成另一套本地答案

部署后需刷新 CDN/浏览器缓存（`main.js` 版本号）。

## 4. 你需要在 Dify 控制台完成的对齐（无法用 Dataset API 代操作）

对应用 **「道一聊天机器人」**（不是随便一个工作流）：

1. **发布**最新草稿（官网 API 只走已发布版）。
2. 知识检索 / 问题分类后续节点挂上：
   - `DAOITH跨境电商知识库`（300问 + 平台税汇总）
   - `出口退税法规和实操`（如咨询要答退税实操）
   - 以及原有的各国/平台库（按分类器分支）
3. 修复 Question Classifier：要求模型**只输出 JSON**；失败分支给默认类别，避免整条 Run failed。
4. 检查各 Knowledge 节点的 top_k、Rerank（方案助手的 SiliconFlow rerank 403 需换密钥或关掉 rerank）。
5. 用**同一句**干净问题在 Chatflow 对话预览与官网咨询各测一次，应基本一致。

## 5. 快速自测清单

```bash
# 应返回 advanced-chat + 道一聊天机器人
curl -s https://api.daoith.com/v1/chatbot/info

# 干净问句（官网修复后同款）
curl -s -X POST https://api.daoith.com/v1/chatbot/chat-messages \
  -H 'Content-Type: application/json' \
  -d '{"inputs":{},"query":"Ozon俄罗斯VAT代收后还要注册吗","response_mode":"blocking","user":"selftest"}'
```

## 6. 2026-08-06 复现：亚马逊 VAT 问句

官网与 API 实测同一已发布应用「道一聊天机器人」：

```bash
curl -s -X POST https://api.daoith.com/v1/chatbot/chat-messages \
  -H 'Content-Type: application/json' \
  -d '{"inputs":{},"query":"做亚马逊要注册vat税号吗","response_mode":"blocking","user":"selftest"}'
```

常见返回：

```json
{"code":"invalid_param","message":"Run failed: could not find json block in the output.","status":400}
```

对照：`你好` 往往能通；`亚马逊VAT` / VAT 实务问句更容易触发分类器 JSON 解析失败。

**结论**：不是官网把问题发错应用，而是**已发布 Chatflow 的 Question Classifier 不稳定**。控制台若打开的是草稿、或其它 Workflow，预览可以正常，与官网 API（只跑已发布版）不一致。

**你需要做的**：在「道一聊天机器人」里修好分类器（强制只输出 JSON、加失败默认类别），然后点 **发布**，再用同一句在官网复测。
