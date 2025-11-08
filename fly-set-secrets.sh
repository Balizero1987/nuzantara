#!/bin/bash
# 🔐 NUZANTARA - Fly.io Secrets Deployment Script
# Usage: ./fly-set-secrets.sh [--minimal|--recommended|--full]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_TS_APP="nuzantara-backend"
BACKEND_RAG_APP="nuzantara-rag"
MEMORY_APP="nuzantara-memory"

# Parse arguments
MODE="${1:-minimal}"

print_header() {
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}======================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check fly CLI
if ! command -v fly &> /dev/null; then
  print_error "fly CLI not found. Install with: curl -L https://fly.io/install.sh | sh"
  exit 1
fi

print_header "🔐 NUZANTARA Secrets Deployment"
echo ""
print_info "Mode: $MODE"
print_info "Backend-TS: $BACKEND_TS_APP"
print_info "Backend-RAG: $BACKEND_RAG_APP"
print_info "Memory Service: $MEMORY_APP"
echo ""

# Confirm
read -p "Continue with secret deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_warning "Deployment cancelled"
  exit 0
fi

echo ""

# ===================================
# BACKEND-TS (nuzantara-backend)
# ===================================

print_header "Backend-TS: REQUIRED Secrets"

# Check if app exists
if ! fly apps list | grep -q "$BACKEND_TS_APP"; then
  print_error "App $BACKEND_TS_APP not found. Create it first with: fly apps create $BACKEND_TS_APP"
  exit 1
fi

# Prompt for required secrets
print_info "Setting REQUIRED secrets for $BACKEND_TS_APP..."
echo ""

read -p "DATABASE_URL (PostgreSQL): " DATABASE_URL
read -p "REDIS_URL: " REDIS_URL
read -sp "JWT_SECRET (min 32 chars): " JWT_SECRET
echo ""
read -p "API_KEYS_INTERNAL (comma-separated): " API_KEYS_INTERNAL

fly secrets set \
  PORT=8080 \
  NODE_ENV=production \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  JWT_SECRET="$JWT_SECRET" \
  API_KEYS_INTERNAL="$API_KEYS_INTERNAL" \
  RAG_BACKEND_URL="https://nuzantara-rag.fly.dev" \
  --app $BACKEND_TS_APP

print_success "Backend-TS REQUIRED secrets set"

if [[ "$MODE" == "recommended" || "$MODE" == "full" ]]; then
  echo ""
  print_header "Backend-TS: RECOMMENDED Secrets"

  read -p "FIREBASE_PROJECT_ID: " FIREBASE_PROJECT_ID
  read -p "GOOGLE_OAUTH_CLIENT_ID: " GOOGLE_OAUTH_CLIENT_ID
  read -sp "GOOGLE_OAUTH_CLIENT_SECRET: " GOOGLE_OAUTH_CLIENT_SECRET
  echo ""
  read -p "SENDGRID_API_KEY: " SENDGRID_API_KEY
  read -p "TWILIO_ACCOUNT_SID: " TWILIO_ACCOUNT_SID
  read -sp "TWILIO_AUTH_TOKEN: " TWILIO_AUTH_TOKEN
  echo ""
  read -p "OPENROUTER_API_KEY: " OPENROUTER_API_KEY

  fly secrets set \
    FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
    GOOGLE_OAUTH_CLIENT_ID="$GOOGLE_OAUTH_CLIENT_ID" \
    GOOGLE_OAUTH_CLIENT_SECRET="$GOOGLE_OAUTH_CLIENT_SECRET" \
    SENDGRID_API_KEY="$SENDGRID_API_KEY" \
    TWILIO_ACCOUNT_SID="$TWILIO_ACCOUNT_SID" \
    TWILIO_AUTH_TOKEN="$TWILIO_AUTH_TOKEN" \
    ENABLE_CRON="true" \
    CRON_TIMEZONE="Asia/Singapore" \
    OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --app $BACKEND_TS_APP

  print_success "Backend-TS RECOMMENDED secrets set"
fi

echo ""

# ===================================
# BACKEND-RAG (nuzantara-rag)
# ===================================

print_header "Backend-RAG: REQUIRED Secrets"

# Check if app exists
if ! fly apps list | grep -q "$BACKEND_RAG_APP"; then
  print_error "App $BACKEND_RAG_APP not found. Create it first with: fly apps create $BACKEND_RAG_APP"
  exit 1
fi

print_info "Setting REQUIRED secrets for $BACKEND_RAG_APP..."
echo ""

read -sp "OPENAI_API_KEY: " OPENAI_API_KEY
echo ""
read -sp "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY
echo ""

fly secrets set \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  DATABASE_URL="$DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  CHROMA_DB_PATH="/data/chroma_db" \
  CHROMA_PERSIST_DIR="/data/chroma_db" \
  TS_BACKEND_URL="https://nuzantara-backend.fly.dev" \
  TYPESCRIPT_BACKEND_URL="https://nuzantara-backend.fly.dev" \
  API_KEYS_INTERNAL="$API_KEYS_INTERNAL" \
  INTERNAL_API_KEY="$API_KEYS_INTERNAL" \
  --app $BACKEND_RAG_APP

print_success "Backend-RAG REQUIRED secrets set"

if [[ "$MODE" == "recommended" || "$MODE" == "full" ]]; then
  echo ""
  print_header "Backend-RAG: RECOMMENDED Secrets"

  read -p "QDRANT_URL (optional, press Enter to skip): " QDRANT_URL
  read -p "QDRANT_API_KEY (optional, press Enter to skip): " QDRANT_API_KEY

  if [[ -n "$QDRANT_URL" && -n "$QDRANT_API_KEY" ]]; then
    fly secrets set \
      ENABLE_RERANKER="true" \
      QDRANT_URL="$QDRANT_URL" \
      QDRANT_API_KEY="$QDRANT_API_KEY" \
      SENDGRID_API_KEY="$SENDGRID_API_KEY" \
      --app $BACKEND_RAG_APP

    print_success "Backend-RAG RECOMMENDED secrets set"
  else
    fly secrets set \
      ENABLE_RERANKER="true" \
      SENDGRID_API_KEY="$SENDGRID_API_KEY" \
      --app $BACKEND_RAG_APP

    print_success "Backend-RAG RECOMMENDED secrets set (without Qdrant)"
  fi
fi

echo ""

# ===================================
# MEMORY SERVICE (nuzantara-memory)
# ===================================

print_header "Memory Service: REQUIRED Secrets"

# Check if app exists
if ! fly apps list | grep -q "$MEMORY_APP"; then
  print_error "App $MEMORY_APP not found. Create it first with: fly apps create $MEMORY_APP"
  exit 1
fi

print_info "Setting REQUIRED secrets for $MEMORY_APP..."
echo ""

read -p "DATABASE_URL for Memory Service (can be different or same): " MEMORY_DATABASE_URL

fly secrets set \
  PORT=8080 \
  NODE_ENV=production \
  DATABASE_URL="$MEMORY_DATABASE_URL" \
  REDIS_URL="$REDIS_URL" \
  --app $MEMORY_APP

print_success "Memory Service REQUIRED secrets set"

echo ""
print_header "✅ Deployment Complete"
echo ""
print_success "All secrets configured!"
echo ""
echo "Next steps:"
echo "  1. Verify secrets with: fly secrets list --app <app-name>"
echo "  2. Deploy each backend:"
echo "     cd apps/backend-ts && fly deploy --app $BACKEND_TS_APP"
echo "     cd apps/backend-rag && fly deploy --app $BACKEND_RAG_APP"
echo "     cd apps/memory-service && fly deploy --app $MEMORY_APP"
echo "  3. Check logs: fly logs --app <app-name>"
echo ""

# Summary
print_info "Secrets Summary:"
echo "  Backend-TS: $(fly secrets list --app $BACKEND_TS_APP 2>/dev/null | wc -l) secrets"
echo "  Backend-RAG: $(fly secrets list --app $BACKEND_RAG_APP 2>/dev/null | wc -l) secrets"
echo "  Memory Service: $(fly secrets list --app $MEMORY_APP 2>/dev/null | wc -l) secrets"
echo ""
