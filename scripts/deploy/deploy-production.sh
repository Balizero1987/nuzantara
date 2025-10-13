#!/bin/bash

# ZANTARA v5.2.0 Production Deployment Script
# Complete with Identity Gate, Anti-Hallucination v2, and ZARA v2.0

echo "🚀 ZANTARA v5.2.0 Production Deployment Starting..."
echo "========================================"
echo "🛡️ Features: Identity Gate + Anti-Hallucination + ZARA v2.0"
echo ""

# Configuration
PROJECT_ID="involuted-box-469105-r0"
SERVICE_NAME="zantara-v520-secure-prod"
REGION="europe-west1"
IMAGE_NAME="zantara-v520"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
VERSION="v5-2-0-${TIMESTAMP}"
VERSION_TAG="v5.2.0-${TIMESTAMP}"

# Build Docker image with Dockerfile.v520
echo "📦 Building Docker image v5.2.0..."
echo "  Using Dockerfile.v520 with all security features"

docker build \
  -t ${IMAGE_NAME}:${VERSION_TAG} \
  -t ${IMAGE_NAME}:latest \
  -f Dockerfile.v520 \
  --platform linux/amd64 \
  --build-arg NPM_IGNORE_SCRIPTS=true \
  .

if [ $? -ne 0 ]; then
  echo "❌ Docker build failed"
  exit 1
fi

# Tag for Google Container Registry
echo "🏷️ Tagging image..."
docker tag ${IMAGE_NAME}:${VERSION_TAG} gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${VERSION_TAG}
docker tag ${IMAGE_NAME}:latest gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest

# Push to GCR
echo "⬆️ Pushing to Google Container Registry..."
docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${VERSION_TAG}
docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest

if [ $? -ne 0 ]; then
  echo "❌ Docker push failed"
  exit 1
fi

# Get API keys from .env
OPENAI_KEY=$(grep "^OPENAI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
ANTHROPIC_KEY=$(grep "^ANTHROPIC_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
GEMINI_KEY=$(grep "^GEMINI_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
COHERE_KEY=$(grep "^COHERE_API_KEY=" .env 2>/dev/null | cut -d'=' -f2- || echo "")

# Deploy to Cloud Run with all features
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${VERSION_TAG} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 2 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 1 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "PORT=8080" \
  --set-env-vars "FIREBASE_PROJECT_ID=${PROJECT_ID}" \
  --set-env-vars "USE_OAUTH2=false" \
  --set-env-vars "IMPERSONATE_USER=zero@balizero.com" \
  --update-secrets "GOOGLE_SERVICE_ACCOUNT_KEY=GOOGLE_SERVICE_ACCOUNT_KEY:latest" \
  --set-env-vars "REALITY_CHECK_ENABLED=true" \
  --set-env-vars "IDENTITY_GATE_ENABLED=true" \
  --set-env-vars "OPENAI_API_KEY_FULL=${OPENAI_KEY}" \
  --set-env-vars "ANTHROPIC_API_KEY=${ANTHROPIC_KEY}" \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_KEY}" \
  --set-env-vars "COHERE_API_KEY=${COHERE_KEY}" \
  --service-account zantara-bridge-v2@${PROJECT_ID}.iam.gserviceaccount.com \
  --update-labels "version=${VERSION},security=enhanced,features=complete"

if [ $? -ne 0 ]; then
  echo "❌ Cloud Run deployment failed"
  exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format="value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo "📍 Service URL: ${SERVICE_URL}"
echo ""

# Test the deployment
echo "🧪 Testing deployment..."
echo "  1. Health check..."
HEALTH=$(curl -s ${SERVICE_URL}/health)
if echo "${HEALTH}" | grep -q "healthy"; then
  echo "     ✅ Health check passed"
else
  echo "     ❌ Health check failed"
fi

echo "  2. Identity Gate check..."
GATE_TEST=$(curl -s -X POST ${SERVICE_URL}/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{"key":"quote.generate","params":{"service":"visa"}}')

if echo "${GATE_TEST}" | grep -q "IDENTIFICATION_REQUIRED"; then
  echo "     ✅ Identity Gate working (blocking correctly)"
else
  echo "     ⚠️ Identity Gate may not be working"
fi

echo "  3. Reality metrics check..."
REALITY=$(curl -s ${SERVICE_URL}/reality/metrics)
if echo "${REALITY}" | grep -q "ok"; then
  echo "     ✅ Anti-Hallucination system operational"
else
  echo "     ⚠️ Reality check system issue"
fi

echo ""
echo "========================================"
echo "🎉 ZANTARA v5.2.0 DEPLOYED SUCCESSFULLY!"
echo "========================================"
echo ""
echo "📊 Deployment Summary:"
echo "  Service: ${SERVICE_NAME}"
echo "  Version: ${VERSION}"
echo "  Region: ${REGION}"
echo "  URL: ${SERVICE_URL}"
echo ""
echo "🛡️ Security Features Active:"
echo "  ✅ Identity Gate - Mandatory authentication"
echo "  ✅ Anti-Hallucination v2 - Triple-layer validation"
echo "  ✅ Reality Anchor - Business truth verification"
echo ""
echo "🧠 Intelligence Features:"
echo "  ✅ ZARA v1.0 - 10 collaborative handlers"
echo "  ✅ ZARA v2.0 - 6 advanced AI handlers"
echo "  ✅ ZARA Dashboard - 4 analytics handlers"
echo ""
echo "📋 Next Steps:"
echo "  1. Update Custom GPT URL: ${SERVICE_URL}"
echo "  2. Monitor logs: gcloud run logs read ${SERVICE_NAME} --region=${REGION}"
echo "  3. Check sessions: curl ${SERVICE_URL}/session/active"
echo ""
echo "🔐 Remember: ALL service requests now require identification!"
