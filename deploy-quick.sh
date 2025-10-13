#!/bin/bash

# Quick Deploy - Skip local build, use Cloud Build
# Memory fixes + WebSocket + Bug fixes

set -e

PROJECT_ID="involuted-box-469105-r0"
REGION="europe-west1"
SERVICE="zantara-v520-nuzantara"

echo "🚀 Quick Deploy to Cloud Run (Cloud Build)"
echo "=========================================="
echo ""

# Deploy using Cloud Build (builds in cloud, faster)
echo "📦 Deploying to Cloud Run (Cloud Build will compile TypeScript)..."
gcloud run deploy $SERVICE \
  --source . \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --memory 2Gi \
  --timeout 300s \
  --max-instances 10

echo ""
echo "✅ Deployment complete!"

# Get URL
SERVICE_URL=$(gcloud run services describe $SERVICE \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo ""
echo "🌐 Production URL: $SERVICE_URL"
echo ""

# Quick tests
echo "🧪 Running Quick Tests..."
echo ""

# Test 1: Health
echo -n "1. Health check... "
if curl -sS "$SERVICE_URL/health" | grep -q "healthy"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

# Test 2: memory.list (new handler)
echo -n "2. memory.list handler... "
RESULT=$(curl -sS -X POST "$SERVICE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"memory.list","params":{"userId":"test"}}' 2>&1)

if echo "$RESULT" | grep -q "ok"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

# Test 3: WebSocket stats
echo -n "3. WebSocket stats... "
RESULT=$(curl -sS -X POST "$SERVICE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"websocket.stats"}' 2>&1)

if echo "$RESULT" | grep -q "enabled"; then
  echo "✅ PASS"
else
  echo "❌ FAIL (may need 'npm install ws' in Dockerfile)"
fi

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📝 What was deployed:"
echo "  - Memory fixes (4/4 issues)"
echo "  - Bug fixes (WhatsApp/Instagram alerts, RAG Pydantic)"
echo "  - WebSocket support (if ws installed)"
echo ""
echo "🔗 WebSocket endpoint: wss://${SERVICE_URL#https://}/ws"
echo ""
