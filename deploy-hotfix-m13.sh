#!/bin/bash
set -e

echo "🚀 M13 Hotfix Deploy (WhatsApp + Instagram)"

# 1. Create minimal build context
echo "📦 Creating patch tarball..."
tar -czf m13-patch.tar.gz \
  dist/handlers/communication/whatsapp.js \
  dist/handlers/communication/instagram.js \
  dist/router.js \
  Dockerfile.patch-m13

# 2. Upload to GCS
echo "☁️ Uploading to Cloud Storage..."
gsutil cp m13-patch.tar.gz gs://involuted-box-469105-r0_cloudbuild/m13-patch.tar.gz

# 3. Trigger Cloud Build with remote context
echo "🏗️ Starting Cloud Build..."
gcloud builds submit gs://involuted-box-469105-r0_cloudbuild/m13-patch.tar.gz \
  --project involuted-box-469105-r0 \
  --config - <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'Dockerfile.patch-m13', '-t', 'gcr.io/involuted-box-469105-r0/zantara-backend-updated:m13-patch', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/involuted-box-469105-r0/zantara-backend-updated:m13-patch']
images:
  - 'gcr.io/involuted-box-469105-r0/zantara-backend-updated:m13-patch'
EOF

# 4. Deploy
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy zantara-v520-nuzantara \
  --image gcr.io/involuted-box-469105-r0/zantara-backend-updated:m13-patch \
  --region europe-west1 \
  --project involuted-box-469105-r0

echo "✅ M13 Deployed!"
