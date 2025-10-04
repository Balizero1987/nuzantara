#!/bin/bash
# ZANTARA v5.2.0 - Rebuild and Deploy Script
# Fixes Docker architecture issue for Cloud Run

set -e

# Configuration
PROJECT_ID="involuted-box-469105-r0"
SERVICE_NAME="zantara-v520-chatgpt-patch"
REGION="europe-west1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_NAME="zantara-v520-fixed"
IMAGE_TAG="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TIMESTAMP}"
IMAGE_LATEST="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

echo "🔧 ZANTARA Rebuild & Deploy Script"
echo "=================================="
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE_TAG}"
echo ""

# Step 1: Build locally first to test
echo "📦 Step 1: Testing local build..."
docker build --platform linux/amd64 -f Dockerfile.rebuild -t ${IMAGE_NAME}:test . || {
    echo "❌ Local build failed. Please check Dockerfile.rebuild"
    exit 1
}

echo "✅ Local build successful"

# Step 2: Configure Docker for GCR
echo "🔑 Step 2: Configuring Docker for GCR..."
gcloud auth configure-docker gcr.io --quiet

# Step 3: Build and push to GCR
echo "🏗️ Step 3: Building and pushing to GCR..."
docker build \
    --platform linux/amd64 \
    -f Dockerfile.rebuild \
    -t ${IMAGE_TAG} \
    -t ${IMAGE_LATEST} \
    .

docker push ${IMAGE_TAG}
docker push ${IMAGE_LATEST}

echo "✅ Image pushed to GCR"

# Step 4: Deploy to Cloud Run
echo "🚀 Step 4: Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_TAG} \
    --region ${REGION} \
    --platform managed \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,PORT=8080" \
    --update-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest,GEMINI_API_KEY=ZANTARA_GEMINI_KEY:latest,COHERE_API_KEY=ZANTARA_COHERE_KEY:latest,ANTHROPIC_API_KEY=CLAUDE_API_KEY:latest,GOOGLE_SERVICE_ACCOUNT_KEY=ZANTARA_SA_JSON:latest,GROQ_API_KEY=groq-api-key-2025:latest,NEW_ZANTARA_PLUGIN_API_KEY=NEW_ZANTARA_PLUGIN_API_KEY:latest"

# Step 5: Verify deployment
echo "🔍 Step 5: Verifying deployment..."
sleep 10
HEALTH_CHECK=$(curl -s https://${SERVICE_NAME}-himaadsxua-ew.a.run.app/health | jq -r '.status' 2>/dev/null || echo "failed")

if [ "$HEALTH_CHECK" = "healthy" ]; then
    echo "✅ Deployment successful! Service is healthy."
    echo "📌 URL: https://${SERVICE_NAME}-himaadsxua-ew.a.run.app"
else
    echo "⚠️ Service deployed but health check failed. Please check logs:"
    echo "gcloud run logs read --service ${SERVICE_NAME} --region ${REGION}"
fi

echo ""
echo "🎉 Rebuild complete!"
echo "Image: ${IMAGE_TAG}"
echo "Service: ${SERVICE_NAME}"