#!/bin/sh
# Backup SQLite database
# Usage: ./scripts/backup.sh [backup_dir]
# Cron example: 0 3 * * * /path/to/barboursier/scripts/backup.sh

BACKUP_DIR="${1:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/barboursier_$DATE.db"

mkdir -p "$BACKUP_DIR"

# Copy database from container
docker exec barboursier cat /app/data/barboursier.db > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ] && [ -s "$BACKUP_FILE" ]; then
    echo "Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
    # Keep only last 7 backups
    ls -t "$BACKUP_DIR"/barboursier_*.db 2>/dev/null | tail -n +8 | xargs -r rm
else
    echo "Backup failed" >&2
    rm -f "$BACKUP_FILE"
    exit 1
fi
