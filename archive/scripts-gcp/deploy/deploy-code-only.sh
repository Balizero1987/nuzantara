#!/bin/bash
# Deploy solo il codice usando immagine base esistente

set -e

PROJECT_ID="involuted-box-469105-r0"
SERVICE_NAME="zantara-v520-production"
REGION="europe-west1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Crea tarball del codice
echo "📦 Creating code archive..."
tar czf /tmp/nuzantara-code.tar.gz \
  --exclude=node_modules \
  --exclude=venv \
  --exclude=KB \
  --exclude=zantara-rag \
  --exclude=.git \
  dist/ server.js config.js *.html routes/ utils/

# Upload a Cloud Storage
echo "☁️ Uploading to GCS..."
gsutil cp /tmp/nuzantara-code.tar.gz gs://nuzantara-builds-2025/code-${TIMESTAMP}.tar.gz

# Deploy con mount del codice
echo "🚀 Deploying with code update..."
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/zantara-v520:20250929-082549 \
  --region ${REGION} \
  --update-env-vars "CODE_VERSION=${TIMESTAMP},CODE_URL=gs://nuzantara-builds-2025/code-${TIMESTAMP}.tar.gz" \
  --platform managed

echo "✅ Deployed with new code!"
