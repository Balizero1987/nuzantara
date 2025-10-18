#!/bin/bash

# ZANTARA Complete Deployment Script
# Deploys: Backend (bug fixes + WebSocket + memory fixes) + RAG Backend (Pydantic fix)
# Session: m24 (2025-10-03)

set -e  # Exit on error

echo "🚀 ZANTARA Complete Deployment - Session m24"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="involuted-box-469105-r0"
REGION="europe-west1"
BACKEND_SERVICE="zantara-v520-nuzantara"
RAG_SERVICE="zantara-rag-backend"

# === STEP 1: Install WebSocket Dependency ===
echo -e "${YELLOW}📦 Step 1: Installing WebSocket dependency...${NC}"
if npm list ws &>/dev/null; then
  echo "✅ ws already installed"
else
  echo "Installing ws and @types/ws..."
  npm install ws @types/ws --legacy-peer-deps || {
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
  }
  echo -e "${GREEN}✅ WebSocket dependency installed${NC}"
fi
echo ""

# === STEP 2: Build TypeScript ===
echo -e "${YELLOW}🔨 Step 2: Building TypeScript...${NC}"
npm run build || {
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
}
echo -e "${GREEN}✅ TypeScript compiled${NC}"
echo ""

# === STEP 3: Deploy Main Backend ===
echo -e "${YELLOW}🚀 Step 3: Deploying Main Backend to Cloud Run...${NC}"
echo "Service: $BACKEND_SERVICE"
echo "Region: $REGION"
echo ""

# Optional: Set webhook URLs (comment out if not needed)
read -p "Do you want to configure Slack/Discord webhooks? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  read -p "Slack Webhook URL (or press Enter to skip): " SLACK_WEBHOOK
  read -p "Discord Webhook URL (or press Enter to skip): " DISCORD_WEBHOOK

  ENV_VARS=""
  if [ -n "$SLACK_WEBHOOK" ]; then
    ENV_VARS="SLACK_WEBHOOK_URL=$SLACK_WEBHOOK"
  fi
  if [ -n "$DISCORD_WEBHOOK" ]; then
    if [ -n "$ENV_VARS" ]; then
      ENV_VARS="$ENV_VARS,DISCORD_WEBHOOK_URL=$DISCORD_WEBHOOK"
    else
      ENV_VARS="DISCORD_WEBHOOK_URL=$DISCORD_WEBHOOK"
    fi
  fi

  if [ -n "$ENV_VARS" ]; then
    echo "Setting env vars: $ENV_VARS"
    gcloud run deploy $BACKEND_SERVICE \
      --source . \
      --region $REGION \
      --project $PROJECT_ID \
      --set-env-vars "$ENV_VARS" \
      --allow-unauthenticated || {
      echo -e "${RED}❌ Backend deployment failed${NC}"
      exit 1
    }
  else
    gcloud run deploy $BACKEND_SERVICE \
      --source . \
      --region $REGION \
      --project $PROJECT_ID \
      --allow-unauthenticated || {
      echo -e "${RED}❌ Backend deployment failed${NC}"
      exit 1
    }
  fi
else
  gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated || {
    echo -e "${RED}❌ Backend deployment failed${NC}"
    exit 1
  }
fi

echo -e "${GREEN}✅ Main Backend deployed${NC}"
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region $REGION --project $PROJECT_ID --format 'value(status.url)')
echo "URL: $BACKEND_URL"
echo ""

# === STEP 4: Deploy RAG Backend ===
echo -e "${YELLOW}🤖 Step 4: Deploying RAG Backend (Pydantic fix)...${NC}"
cd zantara-rag/backend

echo "Building Docker image..."
docker buildx build --platform linux/amd64 -f Dockerfile.cloud \
  -t gcr.io/$PROJECT_ID/$RAG_SERVICE:v2.3-pydantic-fix \
  -t gcr.io/$PROJECT_ID/$RAG_SERVICE:latest . || {
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
}

echo "Pushing to GCR..."
docker push gcr.io/$PROJECT_ID/$RAG_SERVICE:v2.3-pydantic-fix || {
  echo -e "${RED}❌ Docker push failed${NC}"
  exit 1
}
docker push gcr.io/$PROJECT_ID/$RAG_SERVICE:latest

echo "Deploying to Cloud Run..."
gcloud run deploy $RAG_SERVICE \
  --image gcr.io/$PROJECT_ID/$RAG_SERVICE:v2.3-pydantic-fix \
  --region $REGION \
  --project $PROJECT_ID \
  --port 8000 \
  --memory 2Gi \
  --timeout 300s \
  --max-instances 3 \
  --allow-unauthenticated || {
  echo -e "${RED}❌ RAG deployment failed${NC}"
  exit 1
}

echo -e "${GREEN}✅ RAG Backend deployed${NC}"
RAG_URL=$(gcloud run services describe $RAG_SERVICE --region $REGION --project $PROJECT_ID --format 'value(status.url)')
echo "URL: $RAG_URL"
echo ""

cd ../..

# === STEP 5: Post-Deployment Tests ===
echo -e "${YELLOW}🧪 Step 5: Running Post-Deployment Tests...${NC}"

# Test 1: Backend health
echo -n "Testing backend health... "
if curl -sS "$BACKEND_URL/health" | grep -q "healthy"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 2: WebSocket stats
echo -n "Testing WebSocket stats... "
WS_STATS=$(curl -sS -X POST "$BACKEND_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"websocket.stats"}' 2>&1)
if echo "$WS_STATS" | grep -q "enabled"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 3: Memory system
echo -n "Testing memory.list (new handler)... "
MEM_LIST=$(curl -sS -X POST "$BACKEND_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"memory.list","params":{"userId":"test_user"}}' 2>&1)
if echo "$MEM_LIST" | grep -q "ok"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 4: RAG /search endpoint (Pydantic fix)
echo -n "Testing RAG /search (Pydantic fix)... "
RAG_SEARCH=$(curl -sS -X POST "$RAG_URL/search" \
  -H "Content-Type: application/json" \
  -d '{"query":"E23 KITAS requirements","k":3,"use_llm":false}' 2>&1)
if echo "$RAG_SEARCH" | grep -q "success"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

# Test 5: RAG /bali-zero/chat
echo -n "Testing RAG chat... "
RAG_CHAT=$(curl -sS -X POST "$RAG_URL/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is E23 working KITAS?","user_role":"member"}' 2>&1)
if echo "$RAG_CHAT" | grep -q "response"; then
  echo -e "${GREEN}✅ PASS${NC}"
else
  echo -e "${RED}❌ FAIL${NC}"
fi

echo ""

# === SUMMARY ===
echo "=============================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo "=============================================="
echo ""
echo "🌐 Production URLs:"
echo "  Backend: $BACKEND_URL"
echo "  RAG:     $RAG_URL"
echo ""
echo "🔌 WebSocket:"
echo "  wss://${BACKEND_URL#https://}/ws"
echo ""
echo "✅ Deployed Features:"
echo "  - Bug fixes (WhatsApp/Instagram alerts, RAG Pydantic)"
echo "  - WebSocket real-time support"
echo "  - Memory system fixes (4/4 issues)"
echo "  - memory.list handler (new)"
echo "  - Auto-save integration"
echo ""
echo "🧪 Next Steps:"
echo "  - Test WebSocket: wscat -c 'wss://${BACKEND_URL#https://}/ws'"
echo "  - Run full RAG test suite: bash test-rag-comprehensive.sh"
echo "  - Configure Slack/Discord webhooks (if not done)"
echo "  - Test memory persistence (data survives restart)"
echo ""
