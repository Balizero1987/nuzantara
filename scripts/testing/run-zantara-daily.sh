#!/bin/bash
# ZANTARA Nightly Worker - Daily Run
# Usage: ./run-zantara-daily.sh

echo "🌙 ZANTARA NIGHTLY WORKER - Daily Run"
echo "===================================="
echo ""

cd ~/Desktop/NUZANTARA-RAILWAY

# Set environment variables
# NOTE: Set these in your shell or .env file before running:
# export DATABASE_URL="your-postgresql-url"
# export RUNPOD_LLAMA_ENDPOINT="your-runpod-endpoint"
# export RUNPOD_API_KEY="your-runpod-key"
# export HF_API_KEY="your-huggingface-key"

if [ -z "$DATABASE_URL" ] || [ -z "$RUNPOD_API_KEY" ]; then
    echo "❌ Error: Required environment variables not set!"
    echo ""
    echo "Please set these variables before running:"
    echo "  export DATABASE_URL=\"your-postgresql-url\""
    echo "  export RUNPOD_LLAMA_ENDPOINT=\"your-runpod-endpoint\""
    echo "  export RUNPOD_API_KEY=\"your-runpod-key\""
    echo "  export HF_API_KEY=\"your-huggingface-key\" (optional)"
    echo ""
    exit 1
fi

echo "🔥 Step 1: Warming up RunPod worker (this may take 2-3 minutes)..."
curl -s -X POST "$RUNPOD_LLAMA_ENDPOINT" \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"prompt": "test warm-up", "max_tokens": 10}}' > /dev/null

echo "⏳ Waiting 3 minutes for worker to be ready..."
sleep 180

echo ""
echo "🚀 Step 2: Running ZANTARA worker..."
echo ""

python3 apps/backend-rag/scripts/llama_nightly_worker.py \
  --days 7 \
  --max-golden 50 \
  --regenerate-cultural

echo ""
echo "✅ ZANTARA Daily Run Complete!"

