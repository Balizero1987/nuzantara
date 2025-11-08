#!/bin/bash
# ============================================
# ZANTARA - Automated Database Backup Script
# Creates encrypted backups of PostgreSQL database
# ============================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/tmp/zantara-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
BACKUP_PREFIX="zantara-db-backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="${BACKUP_PREFIX}-${TIMESTAMP}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"
BACKUP_FILE_ENCRYPTED="${BACKUP_FILE_COMPRESSED}.enc"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required environment variables
check_prerequisites() {
    log_info "Checking prerequisites..."

    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL environment variable is not set"
        exit 1
    fi

    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump is not installed. Please install PostgreSQL client tools."
        exit 1
    fi

    # Parse DATABASE_URL
    export PGPASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')
    export PGHOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\(.*\):.*/\1/p')
    export PGPORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    export PGUSER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
    export PGDATABASE=$(echo "$DATABASE_URL" | sed -n 's/.*\/\(.*\)/\1/p')

    log_info "✓ Prerequisites checked"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
}

# Create database backup
create_backup() {
    log_info "Creating database backup..."
    log_info "Database: $PGDATABASE"
    log_info "Host: $PGHOST"

    cd "$BACKUP_DIR"

    # Create backup with pg_dump
    if pg_dump \
        --host="$PGHOST" \
        --port="$PGPORT" \
        --username="$PGUSER" \
        --dbname="$PGDATABASE" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --file="$BACKUP_FILE"; then
        log_info "✓ Database dump created: $BACKUP_FILE"
    else
        log_error "Failed to create database dump"
        exit 1
    fi
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."

    if gzip -9 "$BACKUP_FILE"; then
        log_info "✓ Backup compressed: $BACKUP_FILE_COMPRESSED"
        BACKUP_SIZE=$(du -h "$BACKUP_FILE_COMPRESSED" | cut -f1)
        log_info "Compressed size: $BACKUP_SIZE"
    else
        log_error "Failed to compress backup"
        exit 1
    fi
}

# Encrypt backup (optional but recommended)
encrypt_backup() {
    if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
        log_info "Encrypting backup..."

        if echo "$BACKUP_ENCRYPTION_KEY" | openssl enc -aes-256-cbc -salt -pbkdf2 \
            -in "$BACKUP_FILE_COMPRESSED" \
            -out "$BACKUP_FILE_ENCRYPTED" \
            -pass stdin; then
            log_info "✓ Backup encrypted: $BACKUP_FILE_ENCRYPTED"
            rm -f "$BACKUP_FILE_COMPRESSED"
            FINAL_BACKUP="$BACKUP_FILE_ENCRYPTED"
        else
            log_error "Failed to encrypt backup"
            exit 1
        fi
    else
        log_warn "BACKUP_ENCRYPTION_KEY not set, skipping encryption"
        FINAL_BACKUP="$BACKUP_FILE_COMPRESSED"
    fi
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."

    if [ -f "$FINAL_BACKUP" ]; then
        CHECKSUM=$(sha256sum "$FINAL_BACKUP" | cut -d' ' -f1)
        echo "$CHECKSUM  $FINAL_BACKUP" > "${FINAL_BACKUP}.sha256"
        log_info "✓ Backup checksum: $CHECKSUM"
        log_info "✓ Checksum saved to: ${FINAL_BACKUP}.sha256"
    else
        log_error "Backup file not found: $FINAL_BACKUP"
        exit 1
    fi
}

# Upload to cloud storage (optional)
upload_to_storage() {
    if [ -n "${AWS_S3_BUCKET:-}" ]; then
        log_info "Uploading backup to S3..."

        if command -v aws &> /dev/null; then
            aws s3 cp "$FINAL_BACKUP" "s3://${AWS_S3_BUCKET}/backups/database/"
            aws s3 cp "${FINAL_BACKUP}.sha256" "s3://${AWS_S3_BUCKET}/backups/database/"
            log_info "✓ Backup uploaded to S3"
        else
            log_warn "AWS CLI not found, skipping S3 upload"
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."

    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}-*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -delete
    find "$BACKUP_DIR" -name "${BACKUP_PREFIX}-*.sha256" -type f -mtime +${RETENTION_DAYS} -delete

    REMAINING=$(find "$BACKUP_DIR" -name "${BACKUP_PREFIX}-*" -type f | wc -l)
    log_info "✓ Cleanup complete. Remaining backups: $REMAINING"
}

# Generate backup report
generate_report() {
    log_info "====================================="
    log_info "Backup Summary"
    log_info "====================================="
    log_info "Timestamp: $(date)"
    log_info "Database: $PGDATABASE"
    log_info "Backup file: $FINAL_BACKUP"
    log_info "Backup size: $(du -h "$FINAL_BACKUP" | cut -f1)"
    log_info "Location: $BACKUP_DIR"
    log_info "====================================="
}

# Main execution
main() {
    log_info "Starting ZANTARA database backup..."

    check_prerequisites
    create_backup_dir
    create_backup
    compress_backup
    encrypt_backup
    verify_backup
    upload_to_storage
    cleanup_old_backups
    generate_report

    log_info "✓ Backup completed successfully!"
}

# Run main function
main
