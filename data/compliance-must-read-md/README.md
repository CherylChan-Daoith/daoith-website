# 合规解决方案必读文件（Dify 上传包）

上传目标知识库：`合规解决方案必读文件`（dataset id: `5038c599-48c6-4b90-ab62-b41cf7b59cb8`）

本库现有文档均为 `text_model`，**不能**混用 parent-child / `hierarchical_model`（会 400）。完整可读靠自定义切块：分隔符 + 足够大的 `max_tokens` + `chunk_overlap=0`。

## 本目录布局

| 文件 | 用途 | 上传切块建议 |
|------|------|----------------|
| `00-导读.md` | 出报告流水线总览 | 尽量整篇 |
| `00-必须知道的知识点.md` | 知识点一至十四 / 类型一至六 | **按 `\n##` 切块**，每块完整返回 |
| `15-出报告硬约束与路径要点.md` | **精简版**：输出四章/JSON、档案七字段锁定、`report_path` 禁出、决策树 Y→D→X→Z→C→B→A、指向 30–36 | 按 `\n##` 切块即可 |
| `30–36-路径*-必读.md` | **路径全文必读**（特征/风险/方案/内部路由/样本）；`report_path` 命中后**只检索当前一篇** | **整篇入库**（`<<<DOC_END>>>` 或超大 max_tokens） |
| `10–14-附件*.md` | 可选实操补充（主体、自然人店、9610、9810、增值税法等） | 可从此目录按需上传 |
| `_excel_dump/` | Excel 原文导出（维护源，一般不上传知识库） | — |

已删除旧版 `20–23-方案样本-路径*.md`（样本并入对应 `30–36` 的「方案样本」节）。

请勿再上传旧版 `01-问题1.md`～`07-问题7.md`（无关键词后缀）。**问题1–7** 问卷分篇不在本目录维护。

## 路径文件对照

| report_path | 文件 |
|-------------|------|
| Y | `30-路径Y-非中国店-必读.md` |
| D | `31-路径D-产品无法退税-必读.md` |
| X | `32-路径X-特殊平台-必读.md` |
| Z | `33-路径Z-已合规出口-必读.md` |
| C | `34-路径C-平台安排出口-必读.md` |
| B | `35-路径B-自发货小包-必读.md` |
| A | `36-路径A-备货海外仓-必读.md` |

## 上传命令示例

```bash
# 精简硬约束
python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 15-出报告硬约束与路径要点.md \
  --separator $'\n##' --max-tokens 4000 --chunk-overlap 0 --replace

# 知识点
python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 00-必须知道的知识点.md \
  --separator $'\n##' --max-tokens 4000 --chunk-overlap 0 --replace

# 路径全文（整篇；可按需改 --files 只传当前要更新的一篇）
python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 30-路径Y-非中国店-必读.md 31-路径D-产品无法退税-必读.md \
    32-路径X-特殊平台-必读.md 33-路径Z-已合规出口-必读.md \
    34-路径C-平台安排出口-必读.md 35-路径B-自发货小包-必读.md \
    36-路径A-备货海外仓-必读.md \
  --separator "<<<DOC_END>>>" --max-tokens 8000 --chunk-overlap 0 --replace
```

检索：知识库 `top_k` 建议足够大，且对路径篇优先整篇召回；出报告时先读 `15`，再只采信当前 `report_path` 对应的 30–36 一篇。
