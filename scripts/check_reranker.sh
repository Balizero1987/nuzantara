#!/usr/bin/env bash
set -euo pipefail

# Periodic health check for RAG re-ranker enablement
# Requires: gcloud, curl; jq optional

PROJECT=${PROJECT:-involuted-box-469105-r0}
REGION=${REGION:-europe-west1}
SERVICE=${SERVICE:-zantara-rag-backend}
SERVICE_URL=${SERVICE_URL:-}
TIMEOUT=${TIMEOUT:-10}

err() { echo "[check_reranker] $*" >&2; }

if command -v gcloud >/dev/null 2>&1; then
  gcloud config set project "$PROJECT" >/dev/null 2>&1 || true
  if [ -z "${SERVICE_URL:-}" ]; then
    SERVICE_URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)
  fi
fi

if [ -z "${SERVICE_URL:-}" ]; then
  # Fallback from existing reports
  SERVICE_URL="https://zantara-rag-backend-himaadsxua-ew.a.run.app"
fi

echo "SERVICE_URL=$SERVICE_URL"

HEALTH_JSON=$(curl -fsS --max-time "$TIMEOUT" "$SERVICE_URL/health" || true)
if [ -z "$HEALTH_JSON" ]; then
  err "Health check failed (no response)"
  exit 2
fi

echo "$HEALTH_JSON"

if command -v jq >/dev/null 2>&1; then
  RERANKER=$(jq -r '.reranker // .enhancements.cross_encoder_reranking // false' <<<"$HEALTH_JSON" 2>/dev/null || echo "false")
else
  # Grep fallback
  if grep -q '"reranker"\s*:\s*true' <<<"$HEALTH_JSON" || \
     grep -q '"cross_encoder_reranking"\s*:\s*true' <<<"$HEALTH_JSON"; then
    RERANKER=true
  else
    RERANKER=false
  fi
fi

if [ "$RERANKER" != "true" ]; then
  err "Re-ranker is NOT active"
  exit 3
fi

echo "Re-ranker active ✅"

# Optional: check logs for recent readiness signal (best-effort)
if command -v gcloud >/dev/null 2>&1; then
  gcloud logging read \
    'resource.type="cloud_run_revision" AND resource.labels.service_name="'"$SERVICE"'" AND ("RerankerService ready" OR "Re-ranker disabled")' \
    --limit=20 --format='value(textPayload)' --freshness=2h || true
fi

