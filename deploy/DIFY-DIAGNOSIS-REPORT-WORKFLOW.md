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

## 2. LLM 节点配置（逐步）

### 2.1 添加并连线

1. 画布点 **+** → 选 **LLM**
2. 连线：**知识检索** → **LLM** → **Code** → **结束**

---

### 2.2 模型参数（Settings / 设置）

| 参数 | 建议值 | 说明 |
|------|--------|------|
| **模型** | 与「道一财税诊断助手」Agent **相同**；若无偏好，选你们已在用的 **DeepSeek / GPT-4o / Claude** 等中等偏强模型 | 报告要综合推理，不要用过小模型 |
| **温度 (Temperature)** | **0.25**（范围 0.2～0.35） | 低温度，少编造税率/路径 |
| **Top P** | 默认或 **0.9** | 一般不用改 |
| **最大 Token (Max Tokens)** | **4096**（报告常被截断时调到 **8192**） | JSON 四章内容较长 |
| **频率惩罚 / 存在惩罚** | 默认 **0** | 不用改 |

**不要开**：联网搜索、Vision、深度思考/Reasoning（若可选）—— 知识已在检索节点提供。

---

### 2.3 系统提示词（SYSTEM / 指令）

1. 打开 Cursor 里的 `deploy/dify-prompts/diagnosis-report-workflow-prompt.md`
2. **源码视图**全选复制（`⌘A` → `⌘C`）
3. 粘贴到 LLM 节点的 **系统提示词 / System** 框（先清空旧内容）

---

### 2.4 用户消息（USER / 上下文）

在 **USER** 或 **上下文 / Prompt** 区域粘贴下面模板，变量用 `{x}` 按钮从上游节点选取（不要手打错名）：

```text
【诊断档案】
{{#start.diagnosis_archive#}}

【用户最后答复】
{{#start.user_reply#}}

【变化点（若有）】
{{#start.follow_up_changes#}}

【知识库检索结果】
{{#知识检索.result#}}
```

> Dify 里变量名可能是 `用户输入 / diagnosis_archive`、`知识检索 / result` 等，**以画布上 `{x}` 列表为准**。

若 USER 框只能写一条，把上面整段放在 USER；系统提示词仍单独在 SYSTEM。

---

### 2.5 结构化输出（JSON Schema）—— 关键

1. 找到 **输出 / Output** 或 **Structured Output / 结构化输出**
2. 开启 **JSON** 或 **Structured Output**
3. **请用 Dify 专用简化 Schema**（避免「Schema exceeds maximum depth of 10」）  
   打开 `deploy/dify-prompts/diagnosis-report-schema.dify.json`，**整文件复制**粘贴到 Schema 框  
   ⚠️ **不要**导入 `diagnosis-report-schema.json`（完整版供文档/Code 校验，嵌套过深）

**内层字段形状**（Schema 不强制，靠提示词 + Code 节点；LLM 须按此填写）：

- `risk.stages[]`：`{ "num": "01", "title": "供应商发票和产品环节", "items": [{ "title": "…", "body": "…" }] }`
- `plan.overview[]`：`{ "num": "01", "title": "…", "items": ["短事项1", "短事项2"] }`
- `plan.details[]`：`{ "title": "专票梳理", "body": "…" }`

**若仍报 depth 超限**：关掉 Structured Output，仅在 SYSTEM 末尾加「只输出纯 JSON，version=1」；由 **Code 节点**做校验（见第 3 节）。

**若模型包 ```json 代码块**：Code 节点会剥除，可正常处理。

---

### 2.6 LLM 节点输出变量

开启 **Structured Output** 后：

| 变量 | 含义 |
|------|------|
| `structured_output` | **主输出**（Object，即整份报告 JSON） |
| `text` | 可能为空或重复 JSON，**Code 节点优先用 structured_output** |
| `usage` | Token 用量，可忽略 |

**关于输出区的橙色「必填」**：这是 Schema 里标记为 `required` 的字段（如 `version`、`risk.processFlow`、`plan.intro`），**属于正常提示，不是配置错误**，可以忽略。

若「结构化输出」标题旁有 ⚠️ 三角：点 **配置** → 确认已 **保存** Schema → 展开 `structured_output` 向下滚动，应还能看到 `actions`、`notes`、`closing`。

Code 节点输入见下节（兼容 `structured_output` 与 `text`）。

---

## 3. Code 校验节点（Python）

```python
import json
import re

def _strip_think(raw: str) -> str:
    s = str(raw or "")
    s = re.sub(
        r"<\s*redacted_thinking\b[^>]*>[\s\S]*?<\s*/\s*redacted_thinking\s*>",
        "",
        s,
        flags=re.I,
    )
    s = re.sub(r"<\s*think\b[^>]*>[\s\S]*?<\s*/\s*think\s*>", "", s, flags=re.I)
    s = re.sub(r"```(?:thinking|thought|reasoning)[\s\S]*?```", "", s, flags=re.I)
    return s.strip()

def _parse_obj(structured_output=None, report_text: str = ""):
    obj = None
    if structured_output is not None:
        if isinstance(structured_output, dict) and structured_output:
            obj = structured_output
        elif isinstance(structured_output, str) and structured_output.strip():
            obj = json.loads(_strip_think(structured_output))
    if obj is None:
        raw = _strip_think(report_text)
        if raw.startswith("```"):
            for part in raw.split("```"):
                p = part.strip()
                if p.startswith("json"):
                    p = p[4:].strip()
                if p.startswith("{"):
                    raw = p
                    break
        brace = re.search(r"\{[\s\S]*\}", raw)
        if not brace:
            raise ValueError("no JSON object in LLM text (got think/plain text only)")
        obj = json.loads(brace.group(0))
    if isinstance(obj, dict) and "structured_output" in obj and isinstance(obj["structured_output"], dict):
        obj = obj["structured_output"]
    return obj

def main(structured_output=None, report_text: str = "") -> dict:
    obj = _parse_obj(structured_output, report_text)
    ver = obj.get("version")
    if ver in (1, "1", 1.0, "1.0"):
        obj["version"] = 1
    else:
        raise ValueError(
            f"version must be 1, got {repr(ver)}; keys={list(obj.keys())}"
        )
    for key in ("risk", "plan", "actions", "notes"):
        if key not in obj:
            raise ValueError(f"missing {key}; keys={list(obj.keys())}")
    if not obj.get("plan", {}).get("intro"):
        raise ValueError("plan.intro required")
    if len(obj.get("actions") or []) < 2:
        raise ValueError("actions too few")
    if len(obj.get("notes") or []) < 2:
        raise ValueError("notes too few")
    cjk = sum(1 for ch in json.dumps(obj, ensure_ascii=False) if "\u4e00" <= ch <= "\u9fff")
    if cjk < 120:
        raise ValueError(f"report too short (cjk={cjk})")
    return {"report_json": json.dumps(obj, ensure_ascii=False)}
```

### 3.1 Code 节点设置

1. 添加 **Code** 节点，语言选 **Python3**
2. **输入变量**（两个都接，代码会自动选用）：

| 变量名 | 来源 |
|--------|------|
| `structured_output` | `LLM / structured_output` |
| `report_text` | `LLM / text` |

3. **代码**：粘贴上方 Python
4. **输出变量**：`report_json`（String）

---

## 4. 结束节点

1. 添加 **结束** 节点，接在 Code 之后
2. **输出** 映射：

| 输出字段 | 值 |
|----------|-----|
| `report_json` | `Code / report_json` |

Agent 调用 Workflow 工具时，会拿到 `report_json` 字符串。

---

## 5. 发布并挂到诊断 Agent

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

## 7. 同步 Agent 主提示词

将 `deploy/dify-prompts/diagnosis-agent-system.md` 粘贴到 Agent Instruction（含第八步「调用工具」说明）。

---

## 8. 相关文件

```
deploy/dify-prompts/diagnosis-report-schema.dify.json   ← Dify 粘贴用（≤10 层）
deploy/dify-prompts/diagnosis-report-schema.json        ← 完整说明（勿直接导入 Dify）
deploy/dify-prompts/diagnosis-report-workflow-prompt.md ← Workflow LLM 指令
deploy/dify-prompts/diagnosis-agent-system.md         ← Agent 主提示词（已更新第八步）
js/main.js                                            ← extract/render JSON
deploy/DIFY-DIAGNOSIS-AGENT.md                        ← Agent 搭建总览
```
