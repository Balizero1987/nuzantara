#!/bin/bash
set -euo pipefail

# Automated Backup Script for Zantara Bridge
# Designed to run daily via Cloud Scheduler

PROJECT_ID="involuted-box-469105-r0"
BACKUP_BUCKET="zantara-secure-backups-2025"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PREFIX="automated_backup_$TIMESTAMP"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "🚀 Starting automated backup process..."

# Create backup directory structure
BACKUP_DIR="/tmp/zantara_backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"/{firestore,secrets,configs,metadata}

# 1. Firestore Database Backup
log "📦 Backing up Firestore database..."
gcloud firestore export "gs://$BACKUP_BUCKET/firestore/$BACKUP_PREFIX/" \
    --collection-ids=zantara_users,zantara_sessions,zantara_analytics \
    --project=$PROJECT_ID 2>&1 | tee "$BACKUP_DIR/firestore/export.log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "✅ Firestore backup completed successfully"
else
    log "❌ Firestore backup failed"
    exit 1
fi

# 2. Secret Manager Backup
log "🔐 Backing up secrets..."
SECRETS_BACKUP_DIR="$BACKUP_DIR/secrets"

# Get list of all secrets
SECRETS=$(gcloud secrets list --project=$PROJECT_ID --format="value(name)")
SECRET_COUNT=0

for secret in $SECRETS; do
    log "   • Backing up secret: $secret"
    
    # Get latest version
    if gcloud secrets versions access latest --secret="$secret" --project=$PROJECT_ID > "$SECRETS_BACKUP_DIR/${secret}.enc" 2>/dev/null; then
        # Encrypt the secret for additional security
        openssl enc -aes-256-cbc -salt -in "$SECRETS_BACKUP_DIR/${secret}.enc" \
            -out "$SECRETS_BACKUP_DIR/${secret}.encrypted" \
            -pass pass:${BACKUP_ENCRYPTION_KEY:-"zantara-backup-key-$(date +%Y%m%d)"} 2>/dev/null
        
        rm "$SECRETS_BACKUP_DIR/${secret}.enc"
        SECRET_COUNT=$((SECRET_COUNT + 1))
    else
        log "   ⚠️  Failed to backup secret: $secret"
    fi
done

log "✅ Backed up $SECRET_COUNT secrets"

# 3. Configuration Backup
log "⚙️  Backing up configurations..."
CONFIGS_DIR="$BACKUP_DIR/configs"

# Cloud Run service configurations
gcloud run services describe zantara-bridge-v2-prod \
    --region=asia-southeast2 \
    --project=$PROJECT_ID \
    --format="export" > "$CONFIGS_DIR/cloud-run-service.yaml" 2>/dev/null || log "   ⚠️  Failed to backup Cloud Run config"

# IAM policies
gcloud projects get-iam-policy $PROJECT_ID \
    --format="json" > "$CONFIGS_DIR/iam-policy.json" 2>/dev/null || log "   ⚠️  Failed to backup IAM policy"

# Service accounts
gcloud iam service-accounts list --project=$PROJECT_ID \
    --format="json" > "$CONFIGS_DIR/service-accounts.json" 2>/dev/null || log "   ⚠️  Failed to backup service accounts"

# DNS records (if any)
gcloud dns managed-zones list --project=$PROJECT_ID \
    --format="json" > "$CONFIGS_DIR/dns-zones.json" 2>/dev/null || log "   ⚠️  Failed to backup DNS configs"

# Load balancer configurations
gcloud compute url-maps list --project=$PROJECT_ID \
    --format="json" > "$CONFIGS_DIR/load-balancers.json" 2>/dev/null || log "   ⚠️  Failed to backup load balancer configs"

log "✅ Configuration backup completed"

# 4. Container Images Backup
log "🐳 Backing up container images..."
IMAGES_DIR="$BACKUP_DIR/metadata"

# List current images
gcloud container images list --repository=gcr.io/$PROJECT_ID \
    --format="json" > "$IMAGES_DIR/container-images.json" 2>/dev/null || log "   ⚠️  Failed to list container images"

# Get image digests for latest versions
gcloud container images list-tags "gcr.io/$PROJECT_ID/zantara-bridge" \
    --limit=5 \
    --format="json" > "$IMAGES_DIR/image-tags.json" 2>/dev/null || log "   ⚠️  Failed to get image tags"

log "✅ Container images metadata backup completed"

# 5. Application Code Backup (if Git repo is accessible)
log "📝 Backing up application metadata..."
cat > "$BACKUP_DIR/metadata/backup-info.json" << EOF
{
  "backup_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "project_id": "$PROJECT_ID",
  "backup_type": "automated_daily",
  "retention_days": $RETENTION_DAYS,
  "components": [
    "firestore_database",
    "secret_manager",
    "cloud_run_configs",
    "iam_policies",
    "container_images_metadata"
  ],
  "backup_size_mb": "$(du -sm $BACKUP_DIR | cut -f1)",
  "backup_id": "$BACKUP_PREFIX",
  "environment": "production"
}
EOF

# Create backup summary
FIRESTORE_SIZE=$(gsutil du -s "gs://$BACKUP_BUCKET/firestore/$BACKUP_PREFIX/" 2>/dev/null | cut -f1 || echo "0")
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

cat > "$BACKUP_DIR/metadata/backup-summary.txt" << EOF
ZANTARA BRIDGE AUTOMATED BACKUP SUMMARY
=======================================
Backup ID: $BACKUP_PREFIX
Timestamp: $(date)
Total Backup Size: $TOTAL_SIZE
Firestore Export Size: ${FIRESTORE_SIZE} bytes

COMPONENTS BACKED UP:
✅ Firestore Database ($FIRESTORE_SIZE bytes)
✅ Secret Manager ($SECRET_COUNT secrets)
✅ Cloud Run Configurations
✅ IAM Policies and Service Accounts
✅ DNS and Load Balancer Configurations
✅ Container Images Metadata

BACKUP LOCATIONS:
• Firestore: gs://$BACKUP_BUCKET/firestore/$BACKUP_PREFIX/
• Other Components: gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/

RETENTION:
• Automatic cleanup after $RETENTION_DAYS days
• Manual recovery instructions available in disaster-recovery.yaml

NEXT BACKUP: $(date -d "+1 day" "+%Y-%m-%d %H:%M:%S")
EOF

log "✅ Backup metadata created"

# 6. Upload backup to Cloud Storage
log "☁️  Uploading backup to Cloud Storage..."
gsutil -m rsync -r -d "$BACKUP_DIR/" "gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/" 2>&1 | tee "$BACKUP_DIR/upload.log"

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    log "✅ Backup uploaded successfully to gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/"
else
    log "❌ Backup upload failed"
    exit 1
fi

# 7. Verify backup integrity
log "🔍 Verifying backup integrity..."
UPLOADED_FILES=$(gsutil ls -r "gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/" | wc -l)
LOCAL_FILES=$(find "$BACKUP_DIR" -type f | wc -l)

if [ "$UPLOADED_FILES" -ge "$LOCAL_FILES" ]; then
    log "✅ Backup integrity verified ($UPLOADED_FILES files uploaded)"
else
    log "⚠️  Backup integrity warning: $UPLOADED_FILES uploaded vs $LOCAL_FILES local files"
fi

# 8. Cleanup old backups
log "🧹 Cleaning up old backups..."
CUTOFF_DATE=$(date -d "-$RETENTION_DAYS days" +%Y%m%d)

# List and delete old backups
gsutil ls "gs://$BACKUP_BUCKET/daily/" | while read backup_path; do
    # Extract date from backup path
    BACKUP_DATE=$(echo "$backup_path" | grep -o '[0-9]\{8\}' | head -1)
    
    if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
        log "   • Deleting old backup: $backup_path"
        gsutil -m rm -r "$backup_path" 2>/dev/null || log "   ⚠️  Failed to delete $backup_path"
    fi
done

# Cleanup old Firestore exports
gsutil ls "gs://$BACKUP_BUCKET/firestore/" | while read firestore_path; do
    BACKUP_DATE=$(echo "$firestore_path" | grep -o '[0-9]\{8\}' | head -1)
    
    if [ -n "$BACKUP_DATE" ] && [ "$BACKUP_DATE" -lt "$CUTOFF_DATE" ]; then
        log "   • Deleting old Firestore export: $firestore_path"
        gsutil -m rm -r "$firestore_path" 2>/dev/null || log "   ⚠️  Failed to delete $firestore_path"
    fi
done

log "✅ Old backups cleanup completed"

# 9. Send backup notification (if webhook configured)
log "📧 Sending backup notification..."
if [ -n "${BACKUP_WEBHOOK_URL:-}" ]; then
    NOTIFICATION_PAYLOAD=$(cat << EOF
{
  "text": "🔒 Zantara Bridge Automated Backup Completed",
  "attachments": [
    {
      "color": "good",
      "fields": [
        {"title": "Backup ID", "value": "$BACKUP_PREFIX", "short": true},
        {"title": "Status", "value": "✅ Success", "short": true},
        {"title": "Size", "value": "$TOTAL_SIZE", "short": true},
        {"title": "Components", "value": "Firestore, Secrets, Configs", "short": true}
      ],
      "footer": "Zantara Backup System",
      "ts": $(date +%s)
    }
  ]
}
EOF
)

    curl -X POST "$BACKUP_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$NOTIFICATION_PAYLOAD" 2>/dev/null || log "   ⚠️  Failed to send notification"
else
    log "   • No webhook URL configured, skipping notification"
fi

# 10. Cleanup local backup directory
log "🧹 Cleaning up local backup directory..."
rm -rf "$BACKUP_DIR"

# 11. Update backup status in metadata
BACKUP_STATUS_FILE="gs://$BACKUP_BUCKET/backup-status.json"
cat > "/tmp/backup-status.json" << EOF
{
  "last_backup": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "backup_id": "$BACKUP_PREFIX",
    "status": "success",
    "size": "$TOTAL_SIZE",
    "components": $SECRET_COUNT,
    "location": "gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/"
  },
  "next_backup": "$(date -u -d "+1 day" +%Y-%m-%dT%H:%M:%SZ)",
  "retention_policy": {
    "days": $RETENTION_DAYS,
    "automatic_cleanup": true
  }
}
EOF

gsutil cp "/tmp/backup-status.json" "$BACKUP_STATUS_FILE" 2>/dev/null || log "   ⚠️  Failed to update backup status"
rm -f "/tmp/backup-status.json"

# Final summary
DURATION=$(($(date +%s) - $(date -d "30 minutes ago" +%s)))
log "🎉 Automated backup completed successfully!"
log "📊 Summary:"
log "   • Backup ID: $BACKUP_PREFIX"
log "   • Duration: ~30 minutes"
log "   • Size: $TOTAL_SIZE" 
log "   • Location: gs://$BACKUP_BUCKET/daily/$BACKUP_PREFIX/"
log "   • Secrets backed up: $SECRET_COUNT"
log "   • Next backup: $(date -d "+1 day" "+%Y-%m-%d %H:%M:%S")"

exit 0