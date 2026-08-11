#!/usr/bin/env bash
# Deploy daoith-website to a Linux VPS via rsync + systemd
# Usage: ./deploy/deploy.sh user@your-server-ip

set -euo pipefail

REMOTE="${1:-}"
REMOTE_DIR="/var/www/daoith-website"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$REMOTE" ]]; then
  echo "Usage: ./deploy/deploy.sh <ssh-host>"
  echo "Example: ./deploy/deploy.sh daoith-pm"
  echo "Note: use SSH config host (IdentityFile), not bare root@IP — that IP rejects password/default keys."
  exit 1
fi

echo "==> Syncing files to $REMOTE:$REMOTE_DIR"
rsync -avz --delete \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude '__pycache__' \
  --exclude '.venv' \
  --exclude '.venv-pdf' \
  --exclude 'node_modules' \
  --exclude 'data/' \
  "$ROOT/" "$REMOTE:$REMOTE_DIR/"

echo "==> Restarting auth API"
ssh "$REMOTE" "sudo systemctl daemon-reload && sudo systemctl restart daoith-auth && sudo systemctl disable --now daoith-api 2>/dev/null || true"

echo "==> Checking API health"
ssh "$REMOTE" "curl -sf http://127.0.0.1:8787/api/health || echo 'WARN: API not responding — check .env on server'"

echo "==> Done. Ensure Nginx is configured (see deploy/nginx.daoith.conf)"
