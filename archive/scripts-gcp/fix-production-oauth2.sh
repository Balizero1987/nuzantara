#!/bin/bash
# 🔧 Fix Production OAuth2 Tokens - ZANTARA v5.2.0
# Aggiorna i tokens OAuth2 in Secret Manager e redeployed Cloud Run

set -e

echo "🔧 ZANTARA Production OAuth2 Fix"
echo "================================="

# Step 1: Verificare tokens locali
echo "📋 1. Checking local OAuth2 tokens..."
if [ ! -f "./oauth2-tokens.json" ]; then
    echo "❌ oauth2-tokens.json not found locally"
    echo "💡 Run: node refresh-oauth2-tokens.mjs first"
    exit 1
fi

# Controlla scadenza tokens locali
EXPIRY=$(cat oauth2-tokens.json | jq -r '.expiry // empty')
if [ -n "$EXPIRY" ]; then
    echo "✅ Local tokens expire: $EXPIRY"
else
    echo "⚠️ Local tokens expiry not found"
fi

# Step 2: Backup current secret
echo "📋 2. Backing up current Secret Manager..."
gcloud secrets versions access latest --secret="OAUTH2_TOKENS" > "oauth2-tokens-backup-$(date +%Y%m%d-%H%M%S).json"
echo "✅ Backup created"

# Step 3: Aggiornare Secret Manager
echo "📋 3. Updating Secret Manager OAUTH2_TOKENS..."
gcloud secrets versions add OAUTH2_TOKENS --data-file="./oauth2-tokens.json"
echo "✅ Secret Manager updated"

# Step 4: Ridistribuire Cloud Run (force new revision)
echo "📋 4. Redeploying Cloud Run with updated tokens..."
gcloud run services update zantara-v520-chatgpt-patch \
  --region=europe-west1 \
  --revision-suffix="oauth-fix-$(date +%Y%m%d-%H%M%S)" \
  --set-env-vars="OAUTH2_REFRESH_TIMESTAMP=$(date +%s)"

echo "⏳ Waiting for deployment..."
sleep 10

# Step 5: Test della connessione
echo "📋 5. Testing production OAuth2..."
PROD_URL="https://zantara-v520-chatgpt-patch-himaadsxua-ew.a.run.app"

# Test health check
echo "🔍 Testing health..."
curl -s "$PROD_URL/health" | jq -r '.status' | grep -q "healthy" && echo "✅ Health OK" || echo "❌ Health failed"

# Test drive.upload
echo "🔍 Testing drive.upload..."
DRIVE_RESULT=$(curl -s -X POST "$PROD_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key": "drive.upload", "params": {"name": "oauth-fix-test.txt", "mimeType": "text/plain", "media": {"body": "OAuth2 fix test"}}}')

if echo "$DRIVE_RESULT" | jq -r '.ok' | grep -q "true"; then
    echo "✅ Drive upload FIXED!"
    echo "$DRIVE_RESULT" | jq -r '.data.file.webViewLink'
else
    echo "❌ Drive upload still failing:"
    echo "$DRIVE_RESULT" | jq -r '.error // .message // .'
fi

# Step 6: Cleanup
echo "📋 6. Cleanup..."
echo "✅ Script completed"
echo ""
echo "📌 Next steps if drive still fails:"
echo "   1. Check Cloud Run logs: gcloud run services logs read zantara-v520-chatgpt-patch --region=europe-west1"
echo "   2. Verify OAuth2 scopes include Drive access"
echo "   3. Re-run OAuth2 authorization if needed"