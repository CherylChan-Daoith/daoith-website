# 诊断报告 JSON Workflow（方案 A）

> 目标：报告格式由 **JSON Schema + 官网渲染器** 保证稳定；Agent 主提示词只保留问诊与业务规则，版式细节迁到 Workflow。

## 架构

```text
用户完成 7 问
  → 诊断 Agent 调用工具 generate_diagnosis_report
  → Workflow：检索 KB → LLM(Structured Output) → Code 校验
  → 返回 JSON（version: 1）
  → 官网 extractDiagnosisReportJson → renderDiagnosisReportJson
```

Markdown 四章仍可作为**过渡期 fallback**（旧报告 / 工具未挂载时）。

---

## 1. 创建 Workflow

1. Dify 控制台 → **工作室** → **创建应用** → **Workflow**
2. 名称：`generate_diagnosis_report`
3. 描述：`根据诊断档案生成结构化 JSON 报告`

### 开始节点 · 输入变量

| 变量 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `diagnosis_archive` | 文本 | 是 | `【诊断档案·必须逐字采信】` 全文 |
| `user_reply` | 文本 | 否 | 用户最后一轮答复 |
| `follow_up_changes` | 文本 | 否 | 追问变化点 JSON 字符串 |

### 节点链路

```text
开始
  → 知识检索（合规解决方案必读文件，Top K 4–6）
  → LLM（Structured Output / JSON Schema）
  → Code（校验 version、必填字段、中文字数）
  → 结束（输出 report_json）
```

---

## 2. LLM 节点配置

- **模型**：与诊断 Agent 同级或略强
- **温度**：0.2–0.35
- **最大 Token**：4096+
- **指令**：粘贴 `deploy/dify-prompts/diagnosis-report-workflow-prompt.md` 全文
- **Structured Output**：导入 `deploy/dify-prompts/diagnosis-report-schema.json`
  - 若 Dify 版本不支持 Schema 导入：在 LLM 节点选「JSON」输出，把 schema 文件内容贴进「JSON Schema」框

**上下文注入**：

```text
【诊断档案】
{{#start.diagnosis_archive#}}

【用户最后答复】
{{#start.user_reply#}}

【变化点（若有）】
{{#start.follow_up_changes#}}

【检索结果】
{{#knowledge_retrieval.result#}}
```

---

## 3. Code 校验节点（Python）

```python
import json

def main(report_text: str) -> dict:
    raw = (report_text or "").strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    obj = json.loads(raw)
    assert obj.get("version") == 1, "version must be 1"
    for key in ("risk", "plan", "actions", "notes"):
        assert key in obj, f"missing {key}"
    assert obj["plan"].get("intro"), "plan.intro required"
    assert len(obj.get("actions") or []) >= 2, "actions too few"
    assert len(obj.get("notes") or []) >= 2, "notes too few"
    cjk = sum(1 for ch in json.dumps(obj, ensure_ascii=False) if "\u4e00" <= ch <= "\u9fff")
    assert cjk >= 120, "report too short"
    return {"report_json": json.dumps(obj, ensure_ascii=False)}
```

结束节点输出变量：`report_json`（字符串）。

---

## 4. 发布并挂到诊断 Agent

1. Workflow **发布**
2. 打开 **道一财税诊断助手** Agent → **工具** → **Workflow**
3. 添加 `generate_diagnosis_report`
4. 工具描述（Agent 可见）：

```text
生成专属合规诊断报告。输入诊断档案全文，返回 version=1 的 JSON 报告。
第 1～7 步齐全后必须调用；报告更新（追问改条件）时也须重新调用。
调用成功后，向用户只输出工具返回的 JSON，不要自行写 Markdown 四章。
```

5. Agent **发布**

---

## 5. 同步 Agent 主提示词

将 `deploy/dify-prompts/diagnosis-agent-system.md` 粘贴到 Agent Instruction（含第八步「调用工具」说明）。

官网 `buildDiagnosisPlanApiQuery` 已改为提示 Agent 调用工具。

---

## 6. 自测清单

### Workflow 单独测

输入样例档案（Shopee 海外仓 + 专票 + 普货），Run 后检查：

- [ ] 输出合法 JSON，`version: 1`
- [ ] 含 `risk.processFlow`、`plan.overview` 三列、`plan.details` 连续细则
- [ ] `actions` 为数组，无 01/02/03 小标题
- [ ] 无路径 A/B/C/D、无 Markdown 表、无 URL

### Agent 端到端

1. 走完 7 步 → Agent 应调用工具
2. 官网右侧方案区正确渲染（三列概览 + 菱形细则 + 编号行动建议）
3. 聊天泡显示简短完成提示，不出现大段 JSON（可选：Agent 只回复「报告已生成，请查看右侧」）

### Fallback

- 暂时未挂工具时，旧 Markdown 四章仍可由 `renderAIPlanHtml` 渲染

---

## 7. 相关文件

```
deploy/dify-prompts/diagnosis-report-schema.json      ← JSON Schema
deploy/dify-prompts/diagnosis-report-workflow-prompt.md ← Workflow LLM 指令
deploy/dify-prompts/diagnosis-agent-system.md         ← Agent 主提示词（已更新第八步）
js/main.js                                            ← extract/render JSON
deploy/DIFY-DIAGNOSIS-AGENT.md                        ← Agent 搭建总览
```
