#!/bin/bash
# ============================================
# ZANTARA - Database Restore Script
# Restores database from encrypted backup
# ============================================

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup-file> [--force]"
    echo "Example: $0 /tmp/zantara-backups/zantara-db-backup-20250106.sql.gz.enc"
    exit 1
fi

BACKUP_FILE="$1"
FORCE_RESTORE="${2:-}"

# Safety check
if [ "$FORCE_RESTORE" != "--force" ]; then
    log_error "⚠️  DATABASE RESTORE IS DESTRUCTIVE"
    log_error "This will replace all data in the database!"
    log_error "Add --force flag to confirm: $0 $1 --force"
    exit 1
fi

log_warn "⚠️  Starting database restore - THIS WILL DELETE EXISTING DATA"
read -p "Type 'RESTORE' to continue: " confirmation

if [ "$confirmation" != "RESTORE" ]; then
    log_error "Restore cancelled"
    exit 1
fi

# Check file exists
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Parse DATABASE_URL
export PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
export PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\(.*\):.*/\1/p')
export PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
export PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
export PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*\/\(.*\)/\1/p')

TEMP_DIR=$(mktemp -d)
DECOMPRESSED_FILE="$TEMP_DIR/restore.sql"

# Decrypt if encrypted
if [[ "$BACKUP_FILE" == *.enc ]]; then
    log_info "Decrypting backup..."
    if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        log_error "BACKUP_ENCRYPTION_KEY not set"
        exit 1
    fi

    echo "$BACKUP_ENCRYPTION_KEY" | openssl enc -aes-256-cbc -d -pbkdf2 \
        -in "$BACKUP_FILE" \
        -out "$TEMP_DIR/backup.sql.gz" \
        -pass stdin

    BACKUP_FILE="$TEMP_DIR/backup.sql.gz"
fi

# Decompress
log_info "Decompressing backup..."
gunzip -c "$BACKUP_FILE" > "$DECOMPRESSED_FILE"

# Restore database
log_info "Restoring database..."
psql --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --dbname="$PGDATABASE" < "$DECOMPRESSED_FILE"

# Cleanup
rm -rf "$TEMP_DIR"

log_info "✓ Database restored successfully!"
