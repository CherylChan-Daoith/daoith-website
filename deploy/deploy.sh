#!/usr/bin/env bash
# Deploy daoith-website to a Linux VPS via rsync + systemd
# Usage: ./deploy/deploy.sh user@your-server-ip

set -euo pipefail

REMOTE="${1:-}"
REMOTE_DIR="/var/www/daoith-website"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "$REMOTE" ]]; then
  echo "Usage: ./deploy/deploy.sh user@server-ip"
  echo "Example: ./deploy/deploy.sh root@123.45.67.89"
  exit 1
fi

echo "==> Syncing files to $REMOTE:$REMOTE_DIR"
rsync -avz --delete \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude '__pycache__' \
  "$ROOT/" "$REMOTE:$REMOTE_DIR/"

echo "==> Installing systemd service (if not exists)"
ssh "$REMOTE" "sudo cp $REMOTE_DIR/deploy/daoith-api.service /etc/systemd/system/daoith-api.service && sudo systemctl daemon-reload && sudo systemctl enable daoith-api && sudo systemctl restart daoith-api"

echo "==> Checking API health"
ssh "$REMOTE" "curl -sf http://127.0.0.1:8787/api/health || echo 'WARN: API not responding — check .env on server'"

echo "==> Done. Ensure Nginx is configured (see deploy/nginx.daoith.conf)"
