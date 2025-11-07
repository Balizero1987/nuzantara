#!/bin/bash

###############################################################################
# 🗄️ ZANTARA Database Backup Script
# 
# Automated backup system for PostgreSQL and ChromaDB vector stores
# Features:
# - PostgreSQL full database backup (pg_dump)
# - ChromaDB vector store backup (all collections)
# - Upload to Cloudflare R2 secure storage
# - Automatic cleanup of old backups
# - Comprehensive error handling and logging
#
# Usage:
#   ./backup-databases.sh                    # Full backup
#   ./backup-databases.sh --postgres-only    # Only PostgreSQL
#   ./backup-databases.sh --chroma-only      # Only ChromaDB
#   ./backup-databases.sh --local-only       # Skip R2 upload
#
# Environment Variables Required:
#   DATABASE_URL              - PostgreSQL connection string
#   R2_ACCESS_KEY_ID          - Cloudflare R2 access key
#   R2_SECRET_ACCESS_KEY      - Cloudflare R2 secret key
#   R2_ENDPOINT_URL           - Cloudflare R2 endpoint
#   FLY_VOLUME_MOUNT_PATH     - ChromaDB path (optional, defaults to /data/chroma_db)
#
# Author: ZANTARA Infrastructure Team
# Version: 1.0.0
###############################################################################

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30  # Keep backups for 30 days
R2_BACKUP_BUCKET="nuzantaradb"
R2_BACKUP_PREFIX="backups/"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Flags
BACKUP_POSTGRES=true
BACKUP_CHROMA=true
UPLOAD_TO_R2=true
VERBOSE=false

# ============================================================================
# Parse Arguments
# ============================================================================

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --postgres-only)
                BACKUP_POSTGRES=true
                BACKUP_CHROMA=false
                shift
                ;;
            --chroma-only)
                BACKUP_POSTGRES=false
                BACKUP_CHROMA=true
                shift
                ;;
            --local-only)
                UPLOAD_TO_R2=false
                shift
                ;;
            --verbose|-v)
                VERBOSE=true
                set -x  # Enable debug mode
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --postgres-only      Backup only PostgreSQL database
    --chroma-only        Backup only ChromaDB vector stores
    --local-only         Skip R2 upload (local backup only)
    --verbose, -v        Enable verbose output
    --help, -h           Show this help message

Examples:
    $0                          # Full backup with R2 upload
    $0 --postgres-only          # Only PostgreSQL
    $0 --local-only             # Local backups only
    $0 --verbose                # Verbose output

EOF
}

# ============================================================================
# Logging Functions
# ============================================================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ============================================================================
# Setup Functions
# ============================================================================

setup_directories() {
    log_info "Setting up backup directories..."
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}/${TIMESTAMP}"
    log_success "Backup directories created: ${BACKUP_DIR}/${TIMESTAMP}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    # Check PostgreSQL client tools
    if ! command -v pg_dump &> /dev/null; then
        missing_deps+=("postgresql-client (pg_dump)")
    fi
    
    # Check AWS CLI (used for R2)
    if [ "$UPLOAD_TO_R2" = true ] && ! command -v aws &> /dev/null; then
        missing_deps+=("aws-cli")
    fi
    
    # Check Python boto3 (alternative for R2)
    if [ "$UPLOAD_TO_R2" = true ] && ! python3 -c "import boto3" 2>/dev/null; then
        if [ ${#missing_deps[@]} -eq 0 ] || [[ ! " ${missing_deps[@]} " =~ " aws-cli " ]]; then
            missing_deps+=("boto3 (python3 -m pip install boto3)")
        fi
    fi
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
    
    log_success "All dependencies available"
}

check_environment() {
    log_info "Checking environment variables..."
    
    local missing_vars=()
    
    if [ "$BACKUP_POSTGRES" = true ] && [ -z "${DATABASE_URL:-}" ]; then
        missing_vars+=("DATABASE_URL")
    fi
    
    if [ "$UPLOAD_TO_R2" = true ]; then
        [ -z "${R2_ACCESS_KEY_ID:-}" ] && missing_vars+=("R2_ACCESS_KEY_ID")
        [ -z "${R2_SECRET_ACCESS_KEY:-}" ] && missing_vars+=("R2_SECRET_ACCESS_KEY")
        [ -z "${R2_ENDPOINT_URL:-}" ] && missing_vars+=("R2_ENDPOINT_URL")
    fi
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_success "Environment variables validated"
}

# ============================================================================
# PostgreSQL Backup
# ============================================================================

backup_postgresql() {
    if [ "$BACKUP_POSTGRES" = false ]; then
        return 0
    fi
    
    log_info "Starting PostgreSQL backup..."
    
    local backup_file="${BACKUP_DIR}/${TIMESTAMP}/postgres_backup_${TIMESTAMP}.sql"
    local backup_file_gz="${backup_file}.gz"
    
    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    if [[ "${DATABASE_URL}" =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+)$ ]]; then
        local pg_user="${BASH_REMATCH[1]}"
        local pg_password="${BASH_REMATCH[2]}"
        local pg_host="${BASH_REMATCH[3]}"
        local pg_port="${BASH_REMATCH[4]}"
        local pg_database="${BASH_REMATCH[5]}"
        
        export PGPASSWORD="${pg_password}"
        
        log_info "Connecting to PostgreSQL: ${pg_host}:${pg_port}/${pg_database}"
        
        # Create backup with custom format for better compression
        if pg_dump \
            -h "${pg_host}" \
            -p "${pg_port}" \
            -U "${pg_user}" \
            -d "${pg_database}" \
            --no-owner \
            --no-acl \
            --verbose \
            > "${backup_file}" 2>&1; then
            
            # Compress backup
            log_info "Compressing PostgreSQL backup..."
            gzip -f "${backup_file}"
            
            local file_size=$(du -h "${backup_file_gz}" | cut -f1)
            log_success "PostgreSQL backup completed: ${backup_file_gz} (${file_size})"
            
            # Verify backup integrity
            if gzip -t "${backup_file_gz}" 2>/dev/null; then
                log_success "Backup integrity verified"
            else
                log_error "Backup integrity check failed!"
                return 1
            fi
        else
            log_error "PostgreSQL backup failed"
            rm -f "${backup_file}" "${backup_file_gz}"
            return 1
        fi
        
        unset PGPASSWORD
    else
        log_error "Invalid DATABASE_URL format. Expected: postgresql://user:pass@host:port/db"
        return 1
    fi
}

# ============================================================================
# ChromaDB Backup
# ============================================================================

backup_chromadb() {
    if [ "$BACKUP_CHROMA" = false ]; then
        return 0
    fi
    
    log_info "Starting ChromaDB backup..."
    
    local chroma_backup_dir="${BACKUP_DIR}/${TIMESTAMP}/chroma_db"
    mkdir -p "${chroma_backup_dir}"
    
    # Determine ChromaDB paths
    local chroma_paths=(
        "${FLY_VOLUME_MOUNT_PATH:-/data/chroma_db}"
        "${SCRIPT_DIR}/data/chroma_db"
        "${SCRIPT_DIR}/data/chroma"
        "${SCRIPT_DIR}/data/chroma_intel"
        "${SCRIPT_DIR}/data/oracle_kb"
    )
    
    local backed_up_count=0
    
    for chroma_path in "${chroma_paths[@]}"; do
        if [ -d "${chroma_path}" ] && [ -f "${chroma_path}/chroma.sqlite3" ]; then
            local db_name=$(basename "${chroma_path}")
            log_info "Backing up ChromaDB: ${chroma_path}"
            
            # Copy entire directory structure
            local dest_dir="${chroma_backup_dir}/${db_name}"
            if cp -r "${chroma_path}" "${dest_dir}" 2>/dev/null; then
                local file_size=$(du -sh "${dest_dir}" | cut -f1)
                log_success "ChromaDB backed up: ${db_name} (${file_size})"
                backed_up_count=$((backed_up_count + 1))
            else
                log_warn "Failed to backup ChromaDB: ${chroma_path}"
            fi
        fi
    done
    
    if [ $backed_up_count -eq 0 ]; then
        log_warn "No ChromaDB databases found to backup"
    else
        log_success "ChromaDB backup completed: ${backed_up_count} database(s)"
    fi
    
    # Create archive
    log_info "Creating ChromaDB archive..."
    local archive_file="${BACKUP_DIR}/${TIMESTAMP}/chroma_db_${TIMESTAMP}.tar.gz"
    cd "${BACKUP_DIR}/${TIMESTAMP}"
    if tar -czf "${archive_file}" chroma_db/; then
        local file_size=$(du -h "${archive_file}" | cut -f1)
        log_success "ChromaDB archive created: ${archive_file} (${file_size})"
        rm -rf chroma_db/  # Remove uncompressed directory
    else
        log_error "Failed to create ChromaDB archive"
        return 1
    fi
    cd - > /dev/null
}

# ============================================================================
# R2 Upload Functions
# ============================================================================

upload_to_r2_with_aws_cli() {
    local file_path="$1"
    local s3_key="$2"
    
    log_info "Uploading to R2: ${s3_key}"
    
    if aws s3 cp "${file_path}" "s3://${R2_BACKUP_BUCKET}/${s3_key}" \
        --endpoint-url "${R2_ENDPOINT_URL}" \
        --quiet; then
        log_success "Upload completed: ${s3_key}"
        return 0
    else
        log_error "Upload failed: ${s3_key}"
        return 1
    fi
}

upload_to_r2_with_python() {
    local file_path="$1"
    local s3_key="$2"
    
    log_info "Uploading to R2 (Python): ${s3_key}"
    
    python3 << EOF
import boto3
import os
from botocore.exceptions import ClientError

try:
    s3_client = boto3.client(
        's3',
        endpoint_url=os.environ['R2_ENDPOINT_URL'],
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        region_name='auto'
    )
    
    bucket_name = '${R2_BACKUP_BUCKET}'
    key = '${s3_key}'
    file_path = '${file_path}'
    
    s3_client.upload_file(file_path, bucket_name, key)
    print(f"✅ Upload successful: {key}")
except ClientError as e:
    print(f"❌ Upload failed: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
EOF
}

upload_backups_to_r2() {
    if [ "$UPLOAD_TO_R2" = false ]; then
        log_info "Skipping R2 upload (--local-only flag)"
        return 0
    fi
    
    log_info "Uploading backups to Cloudflare R2..."
    
    local upload_count=0
    local upload_failed=0
    
    # Find all backup files
    for file in "${BACKUP_DIR}/${TIMESTAMP}"/*.{gz,tar.gz}; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local s3_key="${R2_BACKUP_PREFIX}${TIMESTAMP}/${filename}"
            
            # Try AWS CLI first, fallback to Python
            if command -v aws &> /dev/null; then
                if upload_to_r2_with_aws_cli "$file" "$s3_key"; then
                    upload_count=$((upload_count + 1))
                else
                    upload_failed=$((upload_failed + 1))
                fi
            elif python3 -c "import boto3" 2>/dev/null; then
                if upload_to_r2_with_python "$file" "$s3_key"; then
                    upload_count=$((upload_count + 1))
                else
                    upload_failed=$((upload_failed + 1))
                fi
            else
                log_error "No upload method available (aws-cli or boto3 required)"
                return 1
            fi
        fi
    done
    
    if [ $upload_count -gt 0 ]; then
        log_success "Upload completed: ${upload_count} file(s) uploaded to R2"
    fi
    
    if [ $upload_failed -gt 0 ]; then
        log_warn "${upload_failed} file(s) failed to upload"
        return 1
    fi
}

# ============================================================================
# Cleanup Functions
# ============================================================================

cleanup_old_backups_local() {
    log_info "Cleaning up old local backups (older than ${RETENTION_DAYS} days)..."
    
    local deleted_count=0
    
    if [ -d "${BACKUP_DIR}" ]; then
        while IFS= read -r -d '' backup_folder; do
            local folder_timestamp=$(basename "$backup_folder")
            # Extract date from timestamp (YYYYMMDD_HHMMSS)
            local backup_date="${folder_timestamp%_*}"
            
            # Convert to seconds since epoch
            local backup_epoch=$(date -j -f "%Y%m%d" "${backup_date}" "+%s" 2>/dev/null || echo "0")
            local current_epoch=$(date "+%s")
            local age_days=$(( (current_epoch - backup_epoch) / 86400 ))
            
            if [ $age_days -gt $RETENTION_DAYS ]; then
                log_info "Deleting old backup: ${folder_timestamp} (${age_days} days old)"
                rm -rf "$backup_folder"
                deleted_count=$((deleted_count + 1))
            fi
        done < <(find "${BACKUP_DIR}" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null || true)
    fi
    
    if [ $deleted_count -gt 0 ]; then
        log_success "Cleaned up ${deleted_count} old backup(s)"
    else
        log_info "No old backups to clean up"
    fi
}

cleanup_old_backups_r2() {
    if [ "$UPLOAD_TO_R2" = false ]; then
        return 0
    fi
    
    log_info "Cleaning up old R2 backups (older than ${RETENTION_DAYS} days)..."
    
    python3 << EOF
import boto3
import os
from datetime import datetime, timedelta
from botocore.exceptions import ClientError

try:
    s3_client = boto3.client(
        's3',
        endpoint_url=os.environ['R2_ENDPOINT_URL'],
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        region_name='auto'
    )
    
    bucket_name = '${R2_BACKUP_BUCKET}'
    prefix = '${R2_BACKUP_PREFIX}'
    retention_days = ${RETENTION_DAYS}
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    
    deleted_count = 0
    
    # List all backup folders
    paginator = s3_client.get_paginator('list_objects_v2')
    for page in paginator.paginate(Bucket=bucket_name, Prefix=prefix, Delimiter='/'):
        if 'CommonPrefixes' not in page:
            continue
            
        for prefix_info in page['CommonPrefixes']:
            folder_path = prefix_info['Prefix']
            folder_name = folder_path.rstrip('/').split('/')[-1]
            
            # Extract date from timestamp (YYYYMMDD_HHMMSS)
            try:
                folder_date_str = folder_name.split('_')[0]
                folder_date = datetime.strptime(folder_date_str, '%Y%m%d')
                
                if folder_date < cutoff_date:
                    # Delete all objects in this folder
                    for obj_page in paginator.paginate(Bucket=bucket_name, Prefix=folder_path):
                        if 'Contents' in obj_page:
                            for obj in obj_page['Contents']:
                                s3_client.delete_object(Bucket=bucket_name, Key=obj['Key'])
                                deleted_count += 1
                    print(f"✅ Deleted old backup folder: {folder_name}")
            except (ValueError, IndexError):
                continue
    
    if deleted_count > 0:
        print(f"✅ Cleaned up {deleted_count} old backup object(s) from R2")
    else:
        print("ℹ️  No old backups to clean up from R2")
        
except ClientError as e:
    print(f"❌ R2 cleanup failed: {e}")
    exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
EOF
}

# ============================================================================
# Summary Report
# ============================================================================

generate_summary() {
    log_info "Generating backup summary..."
    
    local summary_file="${BACKUP_DIR}/${TIMESTAMP}/backup_summary.txt"
    
    {
        echo "=========================================="
        echo "ZANTARA Database Backup Summary"
        echo "=========================================="
        echo "Timestamp: ${TIMESTAMP}"
        echo "Date: $(date)"
        echo ""
        echo "Backup Location: ${BACKUP_DIR}/${TIMESTAMP}"
        echo ""
        
        if [ "$BACKUP_POSTGRES" = true ]; then
            local pg_backup=$(find "${BACKUP_DIR}/${TIMESTAMP}" -name "postgres_backup_*.sql.gz" -type f)
            if [ -n "$pg_backup" ]; then
                echo "PostgreSQL Backup:"
                echo "  File: $(basename "$pg_backup")"
                echo "  Size: $(du -h "$pg_backup" | cut -f1)"
                echo ""
            fi
        fi
        
        if [ "$BACKUP_CHROMA" = true ]; then
            local chroma_backup=$(find "${BACKUP_DIR}/${TIMESTAMP}" -name "chroma_db_*.tar.gz" -type f)
            if [ -n "$chroma_backup" ]; then
                echo "ChromaDB Backup:"
                echo "  File: $(basename "$chroma_backup")"
                echo "  Size: $(du -h "$chroma_backup" | cut -f1)"
                echo ""
            fi
        fi
        
        if [ "$UPLOAD_TO_R2" = true ]; then
            echo "R2 Storage:"
            echo "  Bucket: ${R2_BACKUP_BUCKET}"
            echo "  Path: ${R2_BACKUP_PREFIX}${TIMESTAMP}/"
            echo ""
        fi
        
        echo "Retention Policy: ${RETENTION_DAYS} days"
        echo "=========================================="
        
    } > "${summary_file}"
    
    log_success "Summary saved: ${summary_file}"
    cat "${summary_file}"
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║     🗄️  ZANTARA Database Backup System v1.0.0        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    parse_args "$@"
    
    setup_directories
    check_dependencies
    check_environment
    
    local start_time=$(date +%s)
    local errors=0
    
    # PostgreSQL Backup
    if [ "$BACKUP_POSTGRES" = true ]; then
        if ! backup_postgresql; then
            errors=$((errors + 1))
        fi
    fi
    
    # ChromaDB Backup
    if [ "$BACKUP_CHROMA" = true ]; then
        if ! backup_chromadb; then
            errors=$((errors + 1))
        fi
    fi
    
    # Upload to R2
    if ! upload_backups_to_r2; then
        errors=$((errors + 1))
    fi
    
    # Cleanup
    cleanup_old_backups_local
    if [ "$UPLOAD_TO_R2" = true ]; then
        cleanup_old_backups_r2
    fi
    
    # Generate summary
    generate_summary
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    if [ $errors -eq 0 ]; then
        log_success "Backup completed successfully in ${duration}s"
        echo -e "${GREEN}✅ All backups completed successfully!${NC}"
        exit 0
    else
        log_error "Backup completed with ${errors} error(s) in ${duration}s"
        echo -e "${RED}⚠️  Backup completed with errors. Please review logs.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"

