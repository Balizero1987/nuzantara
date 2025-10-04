#!/usr/bin/env bash
set -euo pipefail

# ZANTARA RAG Backend — One‑shot Cloud Run deploy
# Usage:
#   export ANTHROPIC_API_KEY=sk-ant-...
#   ./deploy_cloud_run.sh

PROJECT_DEFAULT="involuted-box-469105-r0"
REGION_DEFAULT="europe-west1"
SERVICE_DEFAULT="zantara-rag-backend"
IMAGE_TAG_DEFAULT="v10-ci"
SERVICE_ACCOUNT_DEFAULT="cloud-run-deployer@involuted-box-469105-r0.iam.gserviceaccount.com"

PROJECT="${PROJECT:-$PROJECT_DEFAULT}"
REGION="${REGION:-$REGION_DEFAULT}"
SERVICE="${SERVICE:-$SERVICE_DEFAULT}"
IMAGE_TAG="${IMAGE_TAG:-$IMAGE_TAG_DEFAULT}"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT:-$SERVICE_ACCOUNT_DEFAULT}"

IMAGE="gcr.io/${PROJECT}/${SERVICE}:${IMAGE_TAG}"

echo "🚀 ZANTARA RAG Backend — Cloud Run Deploy"
echo "Project:   ${PROJECT}"
echo "Service:   ${SERVICE}"
echo "Region:    ${REGION}"
echo "Image:     ${IMAGE}"
echo "SA:        ${SERVICE_ACCOUNT}"
echo

command -v gcloud >/dev/null 2>&1 || { echo "gcloud not found"; exit 1; }

if [[ -z "${ANTHROPIC_API_KEY:-}" ]]; then
  echo "❌ ANTHROPIC_API_KEY is not set in the environment"
  echo "   export ANTHROPIC_API_KEY=sk-ant-..."
  exit 1
fi

echo "🧭 Setting project..."
gcloud config set project "${PROJECT}" >/dev/null

if [[ -n "${IMPERSONATE_SA:-}" ]]; then
  echo "🪪 Impersonating: ${SERVICE_ACCOUNT}"
  gcloud config set auth/impersonate_service_account "${SERVICE_ACCOUNT}" >/dev/null
fi

echo "🧰 Enabling APIs (idempotent)..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com containerregistry.googleapis.com --quiet

echo "📦 Building image via Cloud Build..."
gcloud builds submit --tag "${IMAGE}" --quiet

echo "🚢 Deploying to Cloud Run..."
gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8000 \
  --service-account "${SERVICE_ACCOUNT}" \
  --set-env-vars "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}" \
  --quiet

echo "⏳ Waiting for health (up to 90s)..."
URL=$(gcloud run services describe "${SERVICE}" --region "${REGION}" --format='value(status.url)')
for i in {1..18}; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "${URL}/health" || true)
  if [[ "${code}" == "200" ]]; then
    echo "✅ Healthy: ${URL}/health"
    break
  fi
  sleep 5
done

echo "🎉 Done. Chat endpoint: ${URL}/bali-zero/chat"

