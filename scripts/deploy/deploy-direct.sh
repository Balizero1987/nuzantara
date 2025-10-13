#!/bin/bash
# Deploy diretto usando immagine esistente con montaggio codice

set -e

PROJECT_ID="involuted-box-469105-r0"
SERVICE_NAME="zantara-v520-production"
REGION="europe-west1"

echo "🚀 Direct Deploy to Production"
echo "=============================="
echo "Using existing image with code update"
echo ""

# Get current image
CURRENT_IMAGE=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format='value(spec.template.spec.containers[0].image)')

echo "📦 Current image: ${CURRENT_IMAGE}"

# Deploy with environment update to trigger restart
echo "🔄 Deploying with code refresh..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${CURRENT_IMAGE} \
  --region ${REGION} \
  --update-env-vars "DEPLOY_TIMESTAMP=$(date +%Y%m%d-%H%M%S),CODE_VERSION=nuzantara-local" \
  --platform managed

echo "✅ Deployment complete!"
echo "🌐 URL: https://${SERVICE_NAME}-1064094238013.europe-west1.run.app"
