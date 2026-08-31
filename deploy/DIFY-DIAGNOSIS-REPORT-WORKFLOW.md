# 诊断报告 JSON Workflow

> 目标：报告格式由 **JSON Schema + 官网渲染器** 保证稳定；问诊 Agent 只负责问卷与调工具；报告正文在 Workflow 内 **自检索知识库后写 JSON**。

## 架构（推荐：方案 B · Agent 节点自检索）

```text
用户完成 7 问
  → 诊断 Agent 调用工具 generate_diagnosis_report
    → Workflow：
         开始
           → Agent 节点（挂「合规解决方案必读」知识库工具；先检索 ≥4 次再写 JSON）
           → Code（校验 version、必填字段）
           → 结束（report_json）
  → 问诊 Agent 原样输出 JSON
  → 官网 extractDiagnosisReportJson → 右侧方案区
```

备选（方案 A）：`知识检索节点 → LLM`（更快，但模型不能自己多轮改 query；质量依赖固定 query）。详见下文「方案 A 备选」。

---

## 1. 创建 / 改造 Workflow（方案 B）

1. Dify → **工作室** → 打开已有 `generate_diagnosis_report` Workflow（或新建同名 Workflow）
2. **开始节点**输入变量保持不变：

| 变量 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `diagnosis_archive` | 文本 | 是 | `【诊断档案·必须逐字采信】` 全文 |
| `user_reply` | 文本 | 否 | 用户最后一轮答复 |
| `follow_up_changes` | 文本 | 否 | 追问变化点 JSON 字符串 |

3. **画布改线**（从旧方案 A 改造时）：
   - 删除（或断开）原来的 **知识检索 → LLM** 两段
   - 添加 **Agent** 节点（有的版本叫「Agent / 智能体」）
   - 连线：`开始 → Agent → Code → 结束`

```text
开始 → Agent（知识库工具） → Code → 结束
```

---

## 2. Agent 节点配置（方案 B · 关键）

### 2.1 模型

| 参数 | 建议 |
|------|------|
| 模型 | 与问诊 Agent 同级或略强（DeepSeek / GPT-4o 等） |
| 温度 | **0.2～0.3** |
| Max tokens | **4096～8192** |
| 深度思考 / Reasoning | **关闭** |
| 最大迭代 / 工具轮次 | **≥ 6**（至少覆盖 4 次检索 + 1 次写 JSON；太小会检索未完就截断） |

### 2.2 挂载知识库工具

1. Agent 节点 → **工具** → 添加 **知识库**（Dataset）
2. 勾选数据集：**合规解决方案必读文件**（及你们实际用于出报告的库）
3. Top K：**4～6**（单次检索）；整体靠「多次调用」覆盖硬约束/知识点/样本
4. 工具描述可粘贴（可选）：

```text
检索「合规解决方案必读」知识库。出报告时必须多次调用：硬约束与路径要点、必须知道的知识点、问题分篇注意事项、对应方案样本。返回原文片段供写 JSON 采信。
```

也可把 `deploy/dify-prompts/diagnosis-agent-kb-instruction.md` 里「出诊断报告时的检索流水线」缩进贴到工具说明。

### 2.3 系统提示词（Instruction）

1. 打开 `deploy/dify-prompts/diagnosis-report-workflow-agent-prompt.md`
2. **全选复制** → 粘贴到 Agent 节点 **系统提示词 / Instruction**（先清空旧 LLM 提示词）

该文件已包含：**强制 ≥4 次检索** + 原 Workflow 硬约束 / 路径 / JSON 结构。

### 2.4 用户消息（Query / USER）

Agent 节点的用户输入只喂档案，**不要**再接旧「知识检索.result」变量：

```text
【诊断档案】
{{#start.diagnosis_archive#}}

【用户最后答复】
{{#start.user_reply#}}

【变化点（若有）】
{{#start.follow_up_changes#}}

请按系统指令：先完成强制检索流水线，再只输出 version=1 的 JSON。
```

> 变量名以画布 `{x}` 为准。

### 2.5 输出接到 Code

- Agent 节点输出一般为 `text` / `files` 等；把 **最终文本** 接到 Code 的 `report_text`
- **不要**依赖 Structured Output（Agent 节点常不稳定）；靠提示词「只输出 JSON」+ Code 剥 ```json

Code 输入与逻辑仍用 `deploy/dify-prompts/diagnosis-report-code.py`（见下文第 3 节）。

### 2.6 自测 Agent 节点

单独 Run Workflow，输入一份完整档案，检查日志：

- [ ] 出现 **≥4 次** 知识库工具调用
- [ ] query 中能看到「硬约束」「知识点」「方案样本」等字样
- [ ] 最终输出为合法 JSON，`version: 1`
- [ ] `processFlow` 是具体业务值，不是「供应商发票 → 店铺主体 → …」字段名模板
- [ ] 路径 A 有票时 `plan.details` 含「0110出口+香港公司」等架构名

若只检索 1 次就写 JSON：提高「最大迭代」，并确认 Instruction 里「至少调用 4 次」未被旧提示词覆盖。

---

## 3. Code 节点与结束节点

与原先相同：Code 校验后输出 `report_json`；结束节点映射 `report_json`。配置细节见下方「Code 校验节点」。

---

## 方案 A 备选（Knowledge → LLM，更快）

若 Agent 节点过慢或迭代不够，可暂时回到：

```text
开始 → 知识检索（query 用档案拼接串，Top K 6–8） → LLM → Code → 结束
```

LLM 提示词用 `diagnosis-report-workflow-prompt.md`。query 示例：

```text
出报告硬约束与路径要点；必须知道的知识点；
平台/发货/出口/发票/产品/销售额（从档案摘录）；方案样本路径
```

方案 A 若开 Structured Output：用 `diagnosis-report-schema.dify.json`（勿用深度过大的完整 schema）；解析不稳时关闭 SO，靠 Code 吃 `text`。

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

## 8. 方案 B 小结（你正在用的）

画布：`开始 → Agent（必读库工具）→ Code → 结束`  
提示词：`diagnosis-report-workflow-agent-prompt.md`  
要点：最大迭代 ≥6、先检索 ≥4 次再出 JSON、问诊 Agent 仍只调工具并原样贴 JSON。

旧「检索在前还是 LLM 里」讨论已收敛为本方案；方案 A 仅作加速备选。

---

## 9. 提高问诊侧 `generate_diagnosis_report` 调用效率与成功率

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
deploy/dify-prompts/diagnosis-report-workflow-agent-prompt.md  ← 【方案B】Workflow 内 Agent 节点 Instruction（先贴这个）
deploy/dify-prompts/diagnosis-report-workflow-prompt.md        ← 【方案A】Knowledge→LLM 时的 System 提示词
deploy/dify-prompts/diagnosis-report-code.py                   ← Code 节点
deploy/dify-prompts/diagnosis-report-schema.dify.json           ← 方案A 可选 SO
deploy/dify-prompts/diagnosis-agent-system.md                  ← 问诊 Agent
deploy/dify-prompts/diagnosis-agent-kb-instruction.md          ← 知识库工具说明（可选贴到工具描述）
js/main.js
```
