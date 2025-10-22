#!/bin/bash

# Railway Snapshot Error - Wait and Retry Script
# Gestisce l'errore "Failed to snapshot repository"

echo "⏰ RAILWAY SNAPSHOT ERROR - Wait and Retry"
echo "========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check login status
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Function to check deployment status
check_deployment_status() {
    local service=$1
    echo "🔍 Checking $service status..."
    
    # Get recent logs
    railway logs --service "$service" --tail 5 2>/dev/null | grep -E "(Failed|Error|Success|Running)" || echo "No recent logs"
}

# Function to retry deployment
retry_deployment() {
    local service=$1
    echo "🚀 Retrying deployment for $service..."
    
    railway up --service "$service"
    
    # Wait a bit for deployment to start
    sleep 10
    
    # Check status
    check_deployment_status "$service"
}

echo ""
echo "📊 Current Railway Status:"
railway status

echo ""
echo "🔍 Checking RAG BACKEND status..."
check_deployment_status "RAG BACKEND"

echo ""
echo "🔍 Checking TS-BACKEND status..."
check_deployment_status "TS-BACKEND"

echo ""
echo "⏰ Waiting 2 minutes for Railway snapshot to resolve..."
echo "   (This is the most common solution for snapshot errors)"
sleep 120

echo ""
echo "🚀 Retrying RAG BACKEND deployment..."
retry_deployment "RAG BACKEND"

echo ""
echo "🚀 Retrying TS-BACKEND deployment..."
retry_deployment "TS-BACKEND"

echo ""
echo "📊 Final Status Check:"
railway status

echo ""
echo "🧪 Testing Endpoints:"
echo "===================="

# Test RAG Backend
echo "Testing RAG Backend..."
RAG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://scintillating-kindness-production-47e3.up.railway.app/health" 2>/dev/null)
if [ "$RAG_HEALTH" = "200" ]; then
    echo "✅ RAG Backend: HEALTHY"
else
    echo "❌ RAG Backend: FAILED (HTTP $RAG_HEALTH)"
fi

# Test TS Backend
echo "Testing TS Backend..."
TS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://ts-backend-production-568d.up.railway.app/health" 2>/dev/null)
if [ "$TS_HEALTH" = "200" ]; then
    echo "✅ TS Backend: HEALTHY"
else
    echo "❌ TS Backend: FAILED (HTTP $TS_HEALTH)"
fi

echo ""
echo "🎯 DEPLOYMENT SUMMARY:"
echo "====================="

if [ "$RAG_HEALTH" = "200" ]; then
    echo "✅ RAG Backend: DEPLOYED"
else
    echo "❌ RAG Backend: NOT DEPLOYED"
fi

if [ "$TS_HEALTH" = "200" ]; then
    echo "✅ TS Backend: DEPLOYED"
else
    echo "❌ TS Backend: NOT DEPLOYED"
fi

echo ""
echo "🔧 If still failing:"
echo "==================="
echo "1. Check Railway Dashboard for snapshot errors"
echo "2. Try disconnecting/reconnecting GitHub repository"
echo "3. Verify Root Directory settings:"
echo "   - RAG BACKEND: apps/backend-rag/backend"
echo "   - TS-BACKEND: apps/backend-ts"
echo "4. Monitor logs: railway logs --service 'RAG BACKEND' --tail 20"
echo ""
echo "🎯 Wait and retry completed!"
