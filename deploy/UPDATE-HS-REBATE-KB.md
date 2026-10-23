# 更新出口退税率知识库（CMCODE）

官网与小程序查询走 `POST /api/hs-refund-rate` → Dify 知识库 `海关编码和出口退税率`
（默认 Dataset ID：`ed8d40b7-9133-4691-a4ba-51f99825e62d`）。

## 1. 下载文库

优先用各省税务局「软件下载」页（广东示例）：

https://guangdong.chinatax.gov.cn/gdsw/rjxz/2026-10/08/content_0ca9c80dcb0a4a37bd3f8d1b4ff04d8a.shtml

解压得到 `cmcode.dbf` + `stdcm.DBF`（+ memo），放到 `data/cmcode-2026c/`。

## 2. 生成 Markdown

```bash
.venv-dbf/bin/python scripts/dbf_to_dify_full_rebate_kb.py data/cmcode-2026c
# 可选：本地章文件兜底
.venv-dbf/bin/python scripts/dbf_to_dify_md.py data/cmcode-2026c
```

## 3. 上传到 Dify（全量替换）

在服务器或本机（需 `.env` 中 `DIFY_DATASET_API_KEY`）：

```bash
DIFY_API_BASE=https://api.daoith.com/v1 \
DIFY_DATASET_ID=ed8d40b7-9133-4691-a4ba-51f99825e62d \
.venv-dbf/bin/python scripts/dify_upload_md.py \
  --dir data/dify-hs-rebate \
  --recursive \
  --purge-all \
  --separator '---' \
  --max-tokens 1200 \
  --sleep 0.5
```

`--purge-all` 会先清空该知识库全部文档再上传，避免旧批次文件名残留。

## 4. 同步本地章文件到官网服务器（可选兜底）

```bash
rsync -avz data/dify-hs-codes/ daoith-pm:/var/www/daoith-website/data/dify-hs-codes/
```

## 5. 抽查

```bash
curl -s https://www.daoith.com/api/hs-refund-rate \
  -H 'Content-Type: application/json' \
  -d '{"hs_code":"7113119090"}'
```
