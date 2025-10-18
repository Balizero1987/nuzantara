#!/bin/bash
# Allinea NUZANTARA locale con zantara-v520-production

set -e

PROJECT_ID="involuted-box-469105-r0"
SERVICE_NAME="zantara-v520-production"
REGION="europe-west1"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="gcr.io/${PROJECT_ID}/zantara-v520:nuzantara-${TIMESTAMP}"

echo "🔄 NUZANTARA → Production Alignment"
echo "===================================="
echo "Local: ~/Desktop/NUZANTARA"
echo "Target: ${SERVICE_NAME}"
echo "Image: ${IMAGE_TAG}"
echo ""

# Step 1: Clean build directory
echo "🧹 Step 1: Preparing clean build..."
rm -rf /tmp/nuzantara-build
mkdir -p /tmp/nuzantara-build

# Step 2: Copy only essential files
echo "📦 Step 2: Copying essential files..."
cp -r ~/Desktop/NUZANTARA/src /tmp/nuzantara-build/
cp -r ~/Desktop/NUZANTARA/routes /tmp/nuzantara-build/
cp -r ~/Desktop/NUZANTARA/utils /tmp/nuzantara-build/
cp ~/Desktop/NUZANTARA/*.js /tmp/nuzantara-build/ 2>/dev/null || true
cp ~/Desktop/NUZANTARA/*.ts /tmp/nuzantara-build/ 2>/dev/null || true
cp ~/Desktop/NUZANTARA/package*.json /tmp/nuzantara-build/
cp ~/Desktop/NUZANTARA/tsconfig.json /tmp/nuzantara-build/
cp ~/Desktop/NUZANTARA/*.yaml /tmp/nuzantara-build/
cp ~/Desktop/NUZANTARA/*.html /tmp/nuzantara-build/
cp ~/Desktop/NUZANTARA/Dockerfile.prod /tmp/nuzantara-build/Dockerfile

# Step 3: Create minimal cloudbuild
cat > /tmp/nuzantara-build/cloudbuild.yaml <<EOF
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', '${IMAGE_TAG}', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${IMAGE_TAG}']
timeout: 900s
options:
  machineType: 'E2_HIGHCPU_8'
images: ['${IMAGE_TAG}']
EOF

# Step 4: Submit to Cloud Build
echo "☁️ Step 3: Building on Cloud Build..."
cd /tmp/nuzantara-build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=${PROJECT_ID}

# Step 5: Deploy to production
echo "🚀 Step 4: Deploying to production..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_TAG} \
  --region ${REGION} \
  --platform managed

# Step 6: Verify
echo "✅ Step 5: Verifying deployment..."
sleep 5
curl -s https://${SERVICE_NAME}-1064094238013.europe-west1.run.app/health | jq

echo "🎉 Alignment complete!"
echo "Production is now running NUZANTARA code"