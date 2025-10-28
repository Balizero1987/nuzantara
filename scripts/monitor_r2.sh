#!/bin/bash
#
# R2 Monitoring Script
# Monitors Cloudflare R2 bucket usage, ChromaDB health, and performance
#
# Usage:
#   ./monitor_r2.sh [--json] [--verbose]
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
R2_BUCKET="nuzantaradb"
R2_PATH="chroma_db/"
R2_ENDPOINT="https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com"
R2_REGION="apac"
RAILWAY_URL="https://scintillating-kindness-production-47e3.up.railway.app"

# R2 Credentials
R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-d278bc5572014f4738192c9cb0cac1b9}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da}"

# R2 Free Tier Limits
R2_FREE_STORAGE_GB=10
R2_FREE_BANDWIDTH_GB=10

# Parse arguments
JSON_OUTPUT=false
VERBOSE=false

for arg in "$@"; do
  case $arg in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --verbose|-v)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--json] [--verbose]"
      echo ""
      echo "Options:"
      echo "  --json       Output in JSON format"
      echo "  --verbose    Show detailed information"
      exit 0
      ;;
  esac
done

# Functions
log_info() {
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${BLUE}$1${NC}"
  fi
}

log_success() {
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${GREEN}$1${NC}"
  fi
}

log_warning() {
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${YELLOW}$1${NC}"
  fi
}

log_error() {
  if [ "$JSON_OUTPUT" = false ]; then
    echo -e "${RED}$1${NC}"
  fi
}

# Check dependencies
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI not found"
  exit 1
fi

if ! command -v jq &> /dev/null; then
  log_error "jq not found (brew install jq)"
  exit 1
fi

# Banner
if [ "$JSON_OUTPUT" = false ]; then
  echo ""
  echo "=================================="
  echo "  R2 Monitoring Report"
  echo "  $(date)"
  echo "=================================="
  echo ""
fi

# 1. R2 Bucket Stats
log_info "📊 R2 Bucket Analysis"
log_info "   Bucket: s3://$R2_BUCKET/$R2_PATH"

# Count items
R2_ITEMS=$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 ls "s3://$R2_BUCKET/$R2_PATH" \
  --endpoint-url="$R2_ENDPOINT" \
  --region "$R2_REGION" 2>/dev/null | wc -l | xargs)

# Collections count
R2_COLLECTIONS=$(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 ls "s3://$R2_BUCKET/$R2_PATH" \
  --endpoint-url="$R2_ENDPOINT" \
  --region "$R2_REGION" 2>/dev/null | grep "PRE" | wc -l | xargs)

# Get total size (approximate from listing)
R2_SIZE_BYTES=0
while IFS= read -r line; do
  bytes=$(echo "$line" | awk '{print $3}')
  if [[ "$bytes" =~ ^[0-9]+$ ]]; then
    R2_SIZE_BYTES=$((R2_SIZE_BYTES + bytes))
  fi
done < <(AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
aws s3 ls "s3://$R2_BUCKET/$R2_PATH" --recursive \
  --endpoint-url="$R2_ENDPOINT" \
  --region "$R2_REGION" 2>/dev/null)

R2_SIZE_MB=$((R2_SIZE_BYTES / 1024 / 1024))
R2_SIZE_GB=$(echo "scale=2; $R2_SIZE_MB / 1024" | bc)

log_info "   Total items: $R2_ITEMS"
log_info "   Collections: $R2_COLLECTIONS"
log_info "   Total size: ${R2_SIZE_MB} MB (${R2_SIZE_GB} GB)"

# Free tier usage percentage
R2_USAGE_PERCENT=$(echo "scale=1; $R2_SIZE_GB / $R2_FREE_STORAGE_GB * 100" | bc)

if (( $(echo "$R2_SIZE_GB < 5" | bc -l) )); then
  log_success "   ✅ Storage: ${R2_USAGE_PERCENT}% of free tier (${R2_FREE_STORAGE_GB} GB)"
elif (( $(echo "$R2_SIZE_GB < 8" | bc -l) )); then
  log_warning "   ⚠️  Storage: ${R2_USAGE_PERCENT}% of free tier (approaching limit)"
else
  log_error "   🚨 Storage: ${R2_USAGE_PERCENT}% of free tier (near limit!)"
fi

# 2. Railway Health Check
echo ""
log_info "🏥 Railway Health Check"
log_info "   URL: $RAILWAY_URL/health"

HEALTH_RESPONSE=$(curl -s "$RAILWAY_URL/health" || echo "{}")
CHROMADB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.chromadb // false')
VECTOR_DB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.memory.vector_db // false')
MODE=$(echo "$HEALTH_RESPONSE" | jq -r '.mode // "unknown"')

if [ "$CHROMADB_STATUS" = "true" ]; then
  log_success "   ✅ ChromaDB: active"
else
  log_error "   ❌ ChromaDB: inactive"
fi

if [ "$VECTOR_DB_STATUS" = "true" ]; then
  log_success "   ✅ Vector DB: operational"
else
  log_error "   ❌ Vector DB: not operational"
fi

log_info "   Mode: $MODE"

# 3. Collections Check
echo ""
log_info "📂 Collections Status"

COLLECTIONS_RESPONSE=$(curl -s "$RAILWAY_URL/api/oracle/collections" || echo "{}")
COLLECTIONS_COUNT=$(echo "$COLLECTIONS_RESPONSE" | jq '.total // 0')

log_info "   Collections available: $COLLECTIONS_COUNT"

if [ "$VERBOSE" = true ]; then
  echo "$COLLECTIONS_RESPONSE" | jq -r '.collections[]' | while read col; do
    log_info "     - $col"
  done
fi

# 4. Performance Test
echo ""
log_info "⚡ Performance Test"

START_TIME=$(date +%s%N)
TEST_RESPONSE=$(curl -s -X POST "$RAILWAY_URL/api/oracle/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"test performance","limit":1,"use_ai":false}' || echo "{}")
END_TIME=$(date +%s%N)

RESPONSE_TIME_MS=$(( (END_TIME - START_TIME) / 1000000 ))
TEST_RESULTS=$(echo "$TEST_RESPONSE" | jq -r '.total_results // 0')

log_info "   Response time: ${RESPONSE_TIME_MS}ms"
log_info "   Test query results: $TEST_RESULTS"

if [ "$RESPONSE_TIME_MS" -lt 2000 ]; then
  log_success "   ✅ Performance: excellent (<2s)"
elif [ "$RESPONSE_TIME_MS" -lt 5000 ]; then
  log_warning "   ⚠️  Performance: acceptable (2-5s)"
else
  log_error "   🚨 Performance: slow (>5s)"
fi

# 5. JSON Output (if requested)
if [ "$JSON_OUTPUT" = true ]; then
  cat << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "r2": {
    "bucket": "$R2_BUCKET",
    "path": "$R2_PATH",
    "items": $R2_ITEMS,
    "collections": $R2_COLLECTIONS,
    "size_mb": $R2_SIZE_MB,
    "size_gb": $R2_SIZE_GB,
    "usage_percent": $R2_USAGE_PERCENT,
    "free_tier_limit_gb": $R2_FREE_STORAGE_GB
  },
  "railway": {
    "url": "$RAILWAY_URL",
    "chromadb": $CHROMADB_STATUS,
    "vector_db": $VECTOR_DB_STATUS,
    "mode": "$MODE",
    "collections_count": $COLLECTIONS_COUNT,
    "response_time_ms": $RESPONSE_TIME_MS
  },
  "status": {
    "r2_healthy": $([ "$R2_SIZE_GB" -lt 8 ] && echo "true" || echo "false"),
    "railway_healthy": $([ "$CHROMADB_STATUS" = "true" ] && echo "true" || echo "false"),
    "performance_ok": $([ "$RESPONSE_TIME_MS" -lt 5000 ] && echo "true" || echo "false")
  }
}
EOF
else
  # 6. Summary
  echo ""
  echo "=================================="
  echo "  Summary"
  echo "=================================="
  echo "R2 Storage:      ${R2_SIZE_GB} GB / ${R2_FREE_STORAGE_GB} GB (${R2_USAGE_PERCENT}%)"
  echo "Collections:     $R2_COLLECTIONS on R2, $COLLECTIONS_COUNT on Railway"
  echo "ChromaDB:        $CHROMADB_STATUS"
  echo "Performance:     ${RESPONSE_TIME_MS}ms"
  echo ""

  if [ "$R2_SIZE_GB" -lt 8 ] && [ "$CHROMADB_STATUS" = "true" ] && [ "$RESPONSE_TIME_MS" -lt 5000 ]; then
    log_success "🎉 All systems operational!"
  else
    log_warning "⚠️  Some issues detected. Review above."
  fi
fi

# 7. Alerts
echo ""
log_info "🔔 Alerts & Recommendations"

if (( $(echo "$R2_SIZE_GB > 8" | bc -l) )); then
  log_warning "   ⚠️  R2 storage approaching free tier limit (10 GB)"
  log_info "      Consider: cleanup old collections or upgrade plan"
fi

if [ "$CHROMADB_STATUS" != "true" ]; then
  log_error "   🚨 ChromaDB not active on Railway"
  log_info "      Run: ./scripts/sync_chromadb_to_r2.sh --force"
fi

if [ "$RESPONSE_TIME_MS" -gt 5000 ]; then
  log_warning "   ⚠️  Slow response times detected"
  log_info "      Check: Railway logs and ChromaDB warmup"
fi

echo ""
log_info "Next monitoring run: $(date -v+1d '+%Y-%m-%d %H:%M')"
echo ""
