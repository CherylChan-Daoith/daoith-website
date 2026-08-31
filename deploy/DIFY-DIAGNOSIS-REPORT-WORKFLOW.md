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

⚠️ **只粘贴纯 Python**：打开 `deploy/dify-prompts/diagnosis-report-code.py`，**全选复制**到 Dify Code 节点。  
**禁止**把 `DIFY-DIAGNOSIS-REPORT-WORKFLOW.md` 或带 `目标：`、`##` 的 Markdown 贴进 Code 框（会报 `SyntaxError: invalid character '：'`）。

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

def _unwrap(obj):
    if not isinstance(obj, dict):
        return obj
    for _ in range(3):
        if isinstance(obj.get("structured_output"), dict):
            obj = obj["structured_output"]
            continue
        if isinstance(obj.get("report_json"), str) and obj["report_json"].strip():
            try:
                inner = json.loads(obj["report_json"])
                if isinstance(inner, dict):
                    obj = inner
                    continue
            except Exception:
                pass
        if isinstance(obj.get("report_json"), dict):
            obj = obj["report_json"]
            continue
        if isinstance(obj.get("data"), dict) and (
            obj["data"].get("risk") or obj["data"].get("plan")
        ):
            obj = obj["data"]
            continue
        break
    return obj

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
    return _unwrap(obj)

def _normalize_version(obj: dict) -> None:
    ver = obj.get("version")
    if ver is None or ver == "":
        if obj.get("risk") or obj.get("plan"):
            obj["version"] = 1
            return
        raise ValueError(f"version missing; keys={list(obj.keys())}")
    if isinstance(ver, str):
        ver = ver.strip()
    if ver in (1, "1", 1.0, "1.0", "1.00"):
        obj["version"] = 1
        return
    try:
        if int(float(ver)) == 1:
            obj["version"] = 1
            return
    except Exception:
        pass
    raise ValueError(f"version must be 1, got {repr(obj.get('version'))}; keys={list(obj.keys())}")

def main(structured_output=None, report_text: str = "") -> dict:
    obj = _parse_obj(structured_output, report_text)
    if not isinstance(obj, dict):
        raise ValueError(f"expected JSON object, got {type(obj).__name__}")
    _normalize_version(obj)
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

**若 Structured Output 常只返回 `{num,title,items}`（接线无误仍报错）**：

1. LLM 节点 → **关闭 Structured Output / JSON Schema**
2. System 末尾加一句：`只输出一个纯 JSON 对象，version=1，不要 Markdown 代码块，不要思考过程`
3. Max Tokens 调到 **8192**
4. Code 仍接 `structured_output` + `report_text`（`text` 里会有完整 JSON；新版 Code 优先解析 `text`）

> **常见报错 `version missing; keys=['num', 'title', 'items']`**：不是 Code 接线错，而是 **Dify 把 Structured Output 解析成了环节小对象**。按上表关闭 Structured Output 即可。

> **常见报错 `AssertionError: version must be 1`**：旧 Code 用了 `assert`。请替换为 `diagnosis-report-code.py` 最新版。

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

将 `deploy/dify-prompts/diagnosis-agent-system.md` 粘贴到 Agent Instruction 并 **发布**（已删减各步选项清单，选项只由官网 chips 提供；含第八步「调用工具 + 原样输出 JSON」）。

---

## 8. 报告质量：检索放在 LLM「里面」还是前面？

### 结论（可做，但别指望只换位置就变好）

Dify **普通 Workflow 的 LLM 节点不能内嵌知识库检索**——检索要么是：

| 方式 | 谁决定查什么 | 适用 |
|------|--------------|------|
| **A. Knowledge 节点在 LLM 前**（现状） | 你用固定/模板 query | 稳定、快；质量靠 **query 写好** |
| **B. Workflow 里用「Agent」节点**（带知识库工具） | 模型自己多次检索再写 | 更像「完整版 Agent」；慢、贵、可能多轮 |
| **C. 把报告 Workflow 改成 Chatflow/Agent 应用当工具** | 同 B | 与问诊 Agent 对称，调试稍重 |

「LLM 根据自己检索的内容生产报告」≈ **方案 B**：画布改为  
`开始 → Agent（挂「合规解决方案必读」知识库工具）→ Code → 结束`，  
Agent 系统提示词用 `diagnosis-report-workflow-prompt.md` + `diagnosis-agent-kb-instruction.md` 的「出报告检索流水线」，并强制：先按序调用知识库工具 ≥3 次，再输出 JSON。

**不推荐**只把「前一个 Knowledge 节点删掉、也不给 LLM 挂检索工具」——那样模型更容易空写。

### 若暂时仍用方案 A（Knowledge → LLM），优先改 query（性价比最高）

Knowledge 节点的 **查询语句不要只用用户一句话**，改为由档案拼成的强制检索串，例如：

```text
出报告硬约束与路径要点；必须知道的知识点；
平台={{平台}} 发货={{发货}} 出口={{出口}} 发票={{发票}} 产品={{产品}} 销售额={{销售额}}；
对应问题分篇与方案样本路径
```

可用 **Code/模板节点** 在 Knowledge 之前根据 `diagnosis_archive` 生成 `kb_query`，再接到 Knowledge。Top K 建议 **6～8**，并勾选必读库。

质量差时先看一次 Run 的「知识检索结果」是否命中：硬约束篇、知识点、方案样本——若没命中，换 B 也救不了。

---

## 9. 提高 `generate_diagnosis_report` 调用效率与成功率

### 故障面（按出现频率）

1. Agent **没调工具** → 自行写 Markdown / 空话  
2. 调了工具，但**最终回复没贴 JSON**（只说请看右侧）  
3. Workflow **太慢/超时**（检索+长 JSON，2～3 分钟）  
4. Workflow 成功，JSON 被 Agent **改写/截断**  
5. 官网解析失败（已加强 observation 捕获；仍依赖工具返回完整 `report_json`）

### Agent 侧（成功率）

| 项 | 建议 |
|----|------|
| 工具描述 | 用上文第 5 节文案；强调「成功后必须原样输出 JSON，禁止改写」 |
| Instruction 第八步 | 用最新 `diagnosis-agent-system.md`（已写「立刻调用 + 原样 JSON」） |
| 官网注入 | 第 8 步 query 已要求「正文第一行起必须是 JSON」——保持 |
| Agent 参数 | 温度 0.2～0.3；**关闭深度思考**；Max tokens ≥ 4096（贴 JSON 用） |
| 最大迭代 / 工具轮次 | 保证至少允许 **1 次工具调用**；出报告轮不要为了「再检索」空转 |

### Workflow 侧（效率）

| 项 | 建议 |
|----|------|
| 报告模型 | 可用比问诊稍强的模型，但 **关掉 reasoning**；温度 ≤ 0.3 |
| Max tokens | 4096～8192，避免 JSON 截断导致 Code 失败、Agent 重试 |
| 检索 | 固定/模板 query + Top K 6～8；避免无目的广撒网 |
| Structured Output | 若总解析错，关闭 SO，让 LLM 出纯 JSON，靠 Code 校验（见第 3 节） |
| Code 失败即失败 | 缺架构标题 / `processFlow` 为字段名模板 → 返回明确错误，逼 LLM 重写或让 Agent 提示重试（比静默烂报告好） |
| 结束输出 | 只输出 **一个** `report_json` 字符串，减少 Agent 挑字段失败 |

### 端到端体验

- 工具成功后 Agent **禁止再检索、禁止摘要**：只回传 JSON（+ 一句「报告已生成」）。  
- 官网已支持：observation 里有 JSON 也可上屏；空正文会自动重试一次。  
- 用户侧：生成中勿关页；预计可能 1～2 分钟属正常，可在 Workflow 压检索与 token 降到 60～90 秒更稳。

### 可选进阶（以后做）

- Agent 工具改成「HTTP 调你们自己的报告 API」：内部跑同一套检索+LLM，超时与日志更好控。  
- 或 Workflow 用 **Agent 节点自检索（方案 B）** 提质量，同时把报告模型单独调优。

---

## 10. 相关文件

```
deploy/dify-prompts/diagnosis-report-code.py           ← Dify Code 节点只粘贴此文件
deploy/dify-prompts/diagnosis-report-schema.dify.json   ← Dify 粘贴用（≤10 层）
deploy/dify-prompts/diagnosis-report-schema.json        ← 完整说明（勿直接导入 Dify）
deploy/dify-prompts/diagnosis-report-workflow-prompt.md ← Workflow LLM 指令
deploy/dify-prompts/diagnosis-agent-system.md         ← Agent 主提示词（选项已外置到官网）
deploy/dify-prompts/diagnosis-agent-kb-instruction.md ← 检索流水线说明
js/main.js                                            ← extract/render JSON
deploy/DIFY-DIAGNOSIS-AGENT.md                        ← Agent 搭建总览
```
