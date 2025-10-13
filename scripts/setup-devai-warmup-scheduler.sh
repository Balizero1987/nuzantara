#!/bin/bash
#
# Setup Google Cloud Scheduler per DevAI warm-up automatico
# Esegue un ping ogni 90 secondi per mantenere i worker RunPod attivi
#

set -e

PROJECT_ID="involuted-box-469105-r0"
REGION="europe-west1"
JOB_NAME="devai-warmup-ping"
SCHEDULE="*/2 * * * *"  # Every 2 minutes
API_URL="https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call"
API_KEY="zantara-internal-dev-key-2025"

echo "🔧 Setting up DevAI warm-up Cloud Scheduler..."
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Schedule: Every 2 minutes"
echo ""

# Check if job already exists
if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "⚠️  Job $JOB_NAME already exists. Deleting..."
  gcloud scheduler jobs delete "$JOB_NAME" \
    --location="$REGION" \
    --project="$PROJECT_ID" \
    --quiet
fi

# Create Cloud Scheduler job
echo "✅ Creating Cloud Scheduler job..."
gcloud scheduler jobs create http "$JOB_NAME" \
  --location="$REGION" \
  --schedule="$SCHEDULE" \
  --uri="$API_URL" \
  --http-method=POST \
  --headers="Content-Type=application/json,X-API-Key=$API_KEY" \
  --message-body='{"key":"devai.warmup"}' \
  --project="$PROJECT_ID"

echo ""
echo "✅ Cloud Scheduler job created!"
echo ""
echo "📊 Test the job manually:"
echo "   gcloud scheduler jobs run $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""
echo "📈 View logs:"
echo "   gcloud scheduler jobs describe $JOB_NAME --location=$REGION --project=$PROJECT_ID"
echo ""
echo "🗑️  Delete job:"
echo "   gcloud scheduler jobs delete $JOB_NAME --location=$REGION --project=$PROJECT_ID"

