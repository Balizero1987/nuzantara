#!/bin/bash
#
# ChromaDB → R2 Sync Script
# Syncs local ChromaDB backup to Cloudflare R2 bucket
#
# Usage:
#   ./sync_chromadb_to_r2.sh [--dry-run] [--force]
#
# Options:
#   --dry-run    Show what would be synced without actually doing it
#   --force      Force redeploy Railway after sync
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHROMADB_PATH="/Users/antonellosiano/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db"
R2_BUCKET="nuzantaradb"
R2_PATH="chroma_db/"
R2_ENDPOINT="https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"
R2_REGION="apac"

# R2 Credentials (from env or hardcoded)
R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-d278bc5572014f4738192c9cb0cac1b9}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da}"

# Parse arguments
DRY_RUN=false
FORCE_DEPLOY=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE_DEPLOY=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [--force]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Show what would be synced without actually doing it"
      echo "  --force      Force redeploy Railway after sync"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Functions
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Banner
echo ""
echo "=================================="
echo "  ChromaDB → R2 Sync Script"
echo "=================================="
echo ""

# 1. Check if ChromaDB exists
if [ ! -d "$CHROMADB_PATH" ]; then
  log_error "ChromaDB not found at: $CHROMADB_PATH"
  exit 1
fi

log_info "ChromaDB path: $CHROMADB_PATH"

# 2. Check size
CHROMADB_SIZE=$(du -sh "$CHROMADB_PATH" | cut -f1 | xargs)
log_info "ChromaDB size: $CHROMADB_SIZE"

# 3. Count collections
COLLECTION_COUNT=$(ls -1 "$CHROMADB_PATH" | grep -E "^[a-f0-9]{8}-" | wc -l | xargs)
log_info "Collections: $COLLECTION_COUNT"

# 4. Check AWS CLI
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI not found. Install with: brew install awscli"
  exit 1
fi

log_success "AWS CLI found"

# 5. Dry run check
if [ "$DRY_RUN" = true ]; then
  log_warning "DRY RUN MODE - No changes will be made"
  echo ""

  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 sync "$CHROMADB_PATH/" "s3://$R2_BUCKET/$R2_PATH" \
    --endpoint-url="$R2_ENDPOINT" \
    --region "$R2_REGION" \
    --delete \
    --dryrun

  log_info "Dry run complete. Use without --dry-run to actually sync."
  exit 0
fi

# 6. Sync to R2
echo ""
log_info "Syncing to R2..."
echo ""

AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 sync "$CHROMADB_PATH/" "s3://$R2_BUCKET/$R2_PATH" \
  --endpoint-url="$R2_ENDPOINT" \
  --region "$R2_REGION" \
  --delete

echo ""
log_success "Sync complete!"

# 7. Verify R2 contents
log_info "Verifying R2 bucket..."
R2_COUNT=$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 ls "s3://$R2_BUCKET/$R2_PATH" \
  --endpoint-url="$R2_ENDPOINT" \
  --region "$R2_REGION" | grep -E "PRE|chroma.sqlite3" | wc -l | xargs)

log_success "R2 contains $R2_COUNT items"

# 8. Force Railway redeploy (optional)
if [ "$FORCE_DEPLOY" = true ]; then
  echo ""
  log_info "Triggering Railway redeploy..."

  cd "$(dirname "$0")/.."

  # Check if git repo
  if git rev-parse --git-dir > /dev/null 2>&1; then
    # Create trigger commit
    echo "# ChromaDB synced - $(date)" >> .railway-deploy-trigger
    git add .railway-deploy-trigger
    git commit -m "chore: ChromaDB sync to R2 ($(date '+%Y-%m-%d %H:%M'))

🔄 Automated sync from script
📦 Size: $CHROMADB_SIZE
📂 Collections: $COLLECTION_COUNT

🤖 Generated with Claude Code" || true

    git push

    log_success "Railway redeploy triggered!"
  else
    log_warning "Not in git repo. Skipping Railway trigger."
  fi
fi

# 9. Summary
echo ""
echo "=================================="
echo "  Sync Summary"
echo "=================================="
echo "Source:       $CHROMADB_PATH"
echo "Destination:  s3://$R2_BUCKET/$R2_PATH"
echo "Size:         $CHROMADB_SIZE"
echo "Collections:  $COLLECTION_COUNT"
echo "R2 Items:     $R2_COUNT"
echo ""
log_success "All done!"
echo ""

# 10. Next steps
echo "Next steps:"
echo "  1. Verify Railway deployment:"
echo "     curl https://scintillating-kindness-production-47e3.up.railway.app/health | jq .chromadb"
echo ""
echo "  2. Test collection query:"
echo "     curl -X POST https://scintillating-kindness-production-47e3.up.railway.app/api/oracle/query \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"query\":\"test\",\"limit\":1}'"
echo ""

# Cron example
echo "To run automatically via cron, add to crontab:"
echo "  # Daily at 3 AM"
echo "  0 3 * * * $0 >> /tmp/chromadb_sync.log 2>&1"
echo ""
