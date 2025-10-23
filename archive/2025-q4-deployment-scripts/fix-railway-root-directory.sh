#!/bin/bash

# Railway Root Directory Fix Script
# Corregge la configurazione Root Directory per RAG BACKEND

echo "🔧 RAILWAY ROOT DIRECTORY FIX"
echo "============================"

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

# Check current status
echo ""
echo "📊 Current Railway Status:"
railway status

echo ""
echo "🔍 Checking RAG BACKEND configuration..."

# Check if Dockerfile exists in correct location
if [ -f "apps/backend-rag/backend/Dockerfile" ]; then
    echo "✅ RAG Backend Dockerfile exists at: apps/backend-rag/backend/Dockerfile"
else
    echo "❌ RAG Backend Dockerfile missing at: apps/backend-rag/backend/Dockerfile"
    exit 1
fi

# Check if TypeScript Dockerfile exists
if [ -f "apps/backend-ts/Dockerfile" ]; then
    echo "✅ TypeScript Backend Dockerfile exists at: apps/backend-ts/Dockerfile"
else
    echo "❌ TypeScript Backend Dockerfile missing at: apps/backend-ts/Dockerfile"
    exit 1
fi

echo ""
echo "⚠️  MANUAL CONFIGURATION REQUIRED:"
echo "=================================="
echo ""
echo "1. Go to Railway Dashboard:"
echo "   https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
echo ""
echo "2. For RAG BACKEND service:"
echo "   - Click on 'RAG BACKEND'"
echo "   - Go to 'Settings' tab"
echo "   - Find 'Root Directory' setting"
echo "   - Change from '/' to 'apps/backend-rag/backend'"
echo "   - Click 'Save'"
echo ""
echo "3. For TS-BACKEND service:"
echo "   - Click on 'TS-BACKEND'"
echo "   - Go to 'Settings' tab"
echo "   - Find 'Root Directory' setting"
echo "   - Change to 'apps/backend-ts'"
echo "   - Click 'Save'"
echo ""
echo "4. After changing Root Directory, redeploy:"
echo "   railway up --service 'RAG BACKEND'"
echo "   railway up --service TS-BACKEND"
echo ""
echo "5. Monitor deployment:"
echo "   railway logs --service 'RAG BACKEND' --tail 20"
echo "   railway logs --service TS-BACKEND --tail 20"
echo ""
echo "6. Test endpoints:"
echo "   curl https://scintillating-kindness-production-47e3.up.railway.app/health"
echo "   curl https://ts-backend-production-568d.up.railway.app/health"
echo ""
echo "🎯 Root Directory fix completed!"
echo "After manual configuration, Railway should find Dockerfile correctly."
