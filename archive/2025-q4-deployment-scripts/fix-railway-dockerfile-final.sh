#!/bin/bash

# Railway Dockerfile Not Found - Final Fix Script
# Verifica e corregge la configurazione Root Directory

echo "🔧 RAILWAY DOCKERFILE NOT FOUND - FINAL FIX"
echo "==========================================="

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

# Verify Dockerfile files exist
echo ""
echo "🔍 Verifying Dockerfile files..."

if [ -f "apps/backend-rag/backend/Dockerfile" ]; then
    echo "✅ RAG Backend Dockerfile exists: apps/backend-rag/backend/Dockerfile"
    echo "   Size: $(ls -lh apps/backend-rag/backend/Dockerfile | awk '{print $5}')"
    echo "   Modified: $(ls -l apps/backend-rag/backend/Dockerfile | awk '{print $6, $7, $8}')"
else
    echo "❌ RAG Backend Dockerfile missing: apps/backend-rag/backend/Dockerfile"
    exit 1
fi

if [ -f "apps/backend-ts/Dockerfile" ]; then
    echo "✅ TypeScript Backend Dockerfile exists: apps/backend-ts/Dockerfile"
    echo "   Size: $(ls -lh apps/backend-ts/Dockerfile | awk '{print $5}')"
    echo "   Modified: $(ls -l apps/backend-ts/Dockerfile | awk '{print $6, $7, $8}')"
else
    echo "❌ TypeScript Backend Dockerfile missing: apps/backend-ts/Dockerfile"
    exit 1
fi

# Check current Railway status
echo ""
echo "📊 Current Railway Status:"
railway status

echo ""
echo "🚨 CRITICAL: Railway Dashboard Configuration Required!"
echo "====================================================="
echo ""
echo "Railway is looking for Dockerfile in the wrong directory."
echo "You MUST fix the Root Directory in Railway Dashboard:"
echo ""
echo "1. Go to: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
echo ""
echo "2. For RAG BACKEND service:"
echo "   - Click on 'RAG BACKEND'"
echo "   - Go to 'Settings' tab"
echo "   - Find 'Root Directory' field"
echo "   - Change to: apps/backend-rag/backend"
echo "   - Click 'Save'"
echo ""
echo "3. For TS-BACKEND service:"
echo "   - Click on 'TS-BACKEND'"
echo "   - Go to 'Settings' tab"
echo "   - Find 'Root Directory' field"
echo "   - Change to: apps/backend-ts"
echo "   - Click 'Save'"
echo ""
echo "4. After fixing Root Directory, run:"
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

# Show current directory structure
echo "📁 Current Directory Structure:"
echo "=============================="
echo ""
echo "RAG Backend Dockerfile location:"
ls -la apps/backend-rag/backend/Dockerfile 2>/dev/null || echo "❌ Not found"
echo ""
echo "TypeScript Backend Dockerfile location:"
ls -la apps/backend-ts/Dockerfile 2>/dev/null || echo "❌ Not found"
echo ""

# Show what Railway is looking for
echo "🔍 What Railway is currently looking for:"
echo "========================================="
echo ""
echo "Railway is looking for Dockerfile in:"
echo "- Root of repository: /Dockerfile (❌ WRONG)"
echo ""
echo "Railway should look for Dockerfile in:"
echo "- RAG Backend: apps/backend-rag/backend/Dockerfile (✅ CORRECT)"
echo "- TS Backend: apps/backend-ts/Dockerfile (✅ CORRECT)"
echo ""

echo "🎯 SOLUTION:"
echo "============"
echo "Fix Root Directory in Railway Dashboard and redeploy!"
echo ""
echo "This script cannot fix the Dashboard configuration automatically."
echo "You must manually change the Root Directory settings."
echo ""
echo "🎯 Final fix completed - manual Dashboard configuration required!"
