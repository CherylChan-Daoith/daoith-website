#!/usr/bin/env bash
# Upload CMCODE export-rebate Markdown packs into Dify dataset「海关编码和出口退税率」.
# Run on a machine that can reach api.daoith.com and has Dataset API key in .env.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

: "${DIFY_DATASET_API_KEY:?Set DIFY_DATASET_API_KEY in .env}"
API_BASE="${DIFY_API_BASE:-https://api.daoith.com/v1}"
DATASET_ID="${DIFY_HS_REFUND_DATASET_ID:-ed8d40b7-9133-4691-a4ba-51f99825e62d}"
DIR="${1:-data/dify-hs-rebate}"
PY="${ROOT}/.venv-dbf/bin/python"
if [[ ! -x "$PY" ]]; then
  PY="$(command -v python3)"
fi

echo "Uploading $DIR -> $DATASET_ID via $API_BASE"
exec "$PY" scripts/dify_upload_md.py \
  --base "$API_BASE" \
  --dataset-id "$DATASET_ID" \
  --api-key "$DIFY_DATASET_API_KEY" \
  --dir "$DIR" \
  --recursive \
  --purge-all \
  --separator=--- \
  --max-tokens 1200 \
  --chunk-overlap 1 \
  --sleep 0.5
