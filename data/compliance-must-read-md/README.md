# 合规解决方案必读文件（Dify 上传包）

上传目标知识库：`合规解决方案必读文件`（dataset id: `5038c599-48c6-4b90-ab62-b41cf7b59cb8`）

本库现有文档均为 `text_model`，**不能**混用 parent-child / `hierarchical_model`（会 400）。完整可读靠自定义切块：分隔符 + 足够大的 `max_tokens` + `chunk_overlap=0`。

## 本目录维护什么

| 文件 | 用途 | 上传切块 |
|------|------|----------|
| `00-导读.md` | 出报告流水线 | 尽量整篇 |
| `00-必须知道的知识点.md` | 知识点一至十四 / 类型一至六 | **按 `\n##` 切块**，每块完整返回 |
| `15-出报告硬约束与路径要点.md` | 版式、路由、路径 A/B/C/D 要点 | **按 `\n##` 切块**（全文超过向量上限，无法单块嵌入）；出报告须多次检索覆盖流水线+版式+命中路径 |
| `10–14-附件*.md` | 跨境电商实操附件 | 可从此目录上传 |
| `20–23-方案样本-路径*.md` | 诊断报告样本（含路径D） | 路径D 尽量整篇 |
| **问题1–7** | 问卷分篇 | **不在本目录维护** |

请勿再上传旧版 `01-问题1.md`～`07-问题7.md`（无关键词后缀）。

## 上传命令（0819 三份）

```bash
python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 15-出报告硬约束与路径要点.md \
  --separator $'\n##' --max-tokens 4000 --chunk-overlap 0 --replace

python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 00-必须知道的知识点.md \
  --separator $'\n##' --max-tokens 4000 --chunk-overlap 0 --replace

python scripts/dify_upload_md.py --dir data/compliance-must-read-md \
  --dataset-id 5038c599-48c6-4b90-ab62-b41cf7b59cb8 \
  --files 23-方案样本-路径D-产品无法退免税.md \
  --separator "<<<DOC_END>>>" --max-tokens 4000 --chunk-overlap 0 --replace
```

检索：知识库 `top_k` 已调到 8，且关闭分数阈值，便于一次召回多块完整内容。
