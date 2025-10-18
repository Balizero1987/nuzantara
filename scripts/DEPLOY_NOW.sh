#!/bin/bash
# DEPLOY M13 - SIMPLIFIED (One command deploy)
# Run this when you're ready to deploy team recognition update

set -e

echo "🚀 M13 Team Recognition - Quick Deploy"
echo ""

# Check Docker
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker not running. Start Docker Desktop or Colima first:"
    echo "   colima start"
    exit 1
fi

# Configuration
IMAGE="gcr.io/involuted-box-469105-r0/zantara-v520:m13"
SERVICE="zantara-v520-nuzantara"

cd /Users/antonellosiano/Desktop/NUZANTARA

echo "1️⃣  Building image..."
docker build -f Dockerfile.dist -t "$IMAGE" . || exit 1

echo ""
echo "2️⃣  Pushing to GCR..."
docker push "$IMAGE" || exit 1

echo ""
echo "3️⃣  Deploying to Cloud Run..."
gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region europe-west1 \
  --project involuted-box-469105-r0 || exit 1

echo ""
echo "✅ DEPLOYED!"
echo ""
echo "Test team recognition:"
echo 'curl -X POST https://zantara-v520-nuzantara-1064094238013.europe-west1.run.app/call \'
echo '  -H "x-api-key: zantara-internal-dev-key-2025" \'
echo '  -d '"'"'{"key":"ai.chat.enhanced","params":{"prompt":"sono zero"}}'"'"
