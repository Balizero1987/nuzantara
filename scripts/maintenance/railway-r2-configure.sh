#!/bin/bash
# Railway R2 Configuration Script
# Configures Cloudflare R2 credentials for ChromaDB on Railway RAG Backend

set -e  # Exit on error

echo "🚀 Railway R2 Configuration Script"
echo "=================================="
echo ""

# Check if Railway CLI is authenticated
echo "🔐 Checking Railway authentication..."
if ! railway whoami &>/dev/null; then
    echo "❌ Railway CLI not authenticated"
    echo ""
    echo "Please run: railway login"
    echo "Then re-run this script."
    exit 1
fi

echo "✅ Railway CLI authenticated"
echo ""

# Service name
SERVICE="RAG BACKEND"

echo "📝 Configuring R2 credentials for service: $SERVICE"
echo ""

# Set environment variables
echo "Setting R2_ACCESS_KEY_ID..."
railway variables --set "R2_ACCESS_KEY_ID=d278bc5572014f4738192c9cb0cac1b9" --service "$SERVICE"

echo "Setting R2_SECRET_ACCESS_KEY..."
railway variables --set "R2_SECRET_ACCESS_KEY=82990a4591b1607ba7e45bf8fb65a8f12003849b873797d2555d19e1f46ee0da" --service "$SERVICE"

echo "Setting R2_ENDPOINT_URL..."
railway variables --set "R2_ENDPOINT_URL=https://a079a34fb9f45d0c6c7b6c182f3dc2cc.r2.cloudflarestorage.com" --service "$SERVICE"

echo "Setting R2_BUCKET_NAME..."
railway variables --set "R2_BUCKET_NAME=nuzantaradb" --service "$SERVICE"

echo "Setting RAILWAY_VOLUME_MOUNT_PATH..."
railway variables --set "RAILWAY_VOLUME_MOUNT_PATH=/data/chroma_db" --service "$SERVICE"

echo ""
echo "✅ All environment variables configured!"
echo ""

# Display configured variables
echo "📋 Configured variables:"
railway variables --service "$SERVICE" --kv | grep R2
railway variables --service "$SERVICE" --kv | grep RAILWAY_VOLUME

echo ""
echo "⚠️  IMPORTANT: Persistent Volume Setup"
echo "======================================"
echo ""
echo "Railway CLI cannot configure volumes automatically."
echo "You must configure the persistent volume manually:"
echo ""
echo "1. Go to: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
echo "2. Click on 'RAG BACKEND' service"
echo "3. Go to 'Settings' tab"
echo "4. Scroll to 'Volumes' section"
echo "5. Click '+ Add Volume'"
echo "6. Set Mount Path: /data/chroma_db"
echo "7. Set Size: 5 GB"
echo "8. Click 'Add'"
echo ""

# Trigger redeploy
echo "🔄 Triggering redeploy..."
railway up --service "$SERVICE" --detach

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📊 Monitor deployment:"
echo "   railway logs --service \"$SERVICE\" --tail 50"
echo ""
echo "🔍 Verify after deployment:"
echo "   curl https://scintillating-kindness-production-47e3.up.railway.app/health"
echo ""
echo "Expected result: \"chromadb\": true"
echo ""
