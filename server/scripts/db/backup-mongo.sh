#!/usr/bin/env bash
# Nightly MongoDB backup on the VPS. Keeps the last 14 days.
#
# Install (run once on the VPS):
#   chmod +x ~/cleaniq/server/scripts/db/backup-mongo.sh
#   crontab -e
#   # add this line (runs at 03:30 every night):
#   30 3 * * * ~/cleaniq/server/scripts/db/backup-mongo.sh >> ~/mongo-backups/backup.log 2>&1
set -euo pipefail

ENV_FILE="$HOME/cleaniq/server/.env"
BACKUP_DIR="$HOME/mongo-backups"
KEEP_DAYS=14

URI=$(grep -E '^MONGODB_URI=' "$ENV_FILE" | head -n1 | cut -d= -f2- | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
if [ -z "$URI" ]; then
  echo "$(date -u +%FT%TZ) ❌ MONGODB_URI not found in $ENV_FILE"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/cleaniq-$(date -u +%Y%m%d-%H%M%S).archive.gz"

mongodump --uri="$URI" --archive="$FILE" --gzip --quiet
echo "$(date -u +%FT%TZ) ✅ Backup written: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name 'cleaniq-*.archive.gz' -mtime +"$KEEP_DAYS" -delete
