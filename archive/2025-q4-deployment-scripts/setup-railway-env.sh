#!/bin/bash

# Railway Environment Variables Setup Script
# Configura le variabili d'ambiente necessarie per i deployment Railway

echo "🚀 NUZANTARA Railway Environment Setup"
echo "====================================="

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

# TypeScript Backend Environment Variables
echo ""
echo "🔧 Configuring TypeScript Backend (TS-BACKEND)..."

# Essential variables for TypeScript backend
railway variables set JWT_SECRET=zantara-jwt-secret-2025 --service TS-BACKEND
railway variables set NODE_ENV=production --service TS-BACKEND

echo "✅ TypeScript Backend variables configured"

# RAG Backend Environment Variables
echo ""
echo "🔧 Configuring RAG Backend (RAG BACKEND)..."

# Note: These need to be configured with actual values
echo "⚠️  RAG Backend requires manual configuration of:"
echo "   - R2_ACCESS_KEY_ID (Cloudflare R2)"
echo "   - R2_SECRET_ACCESS_KEY (Cloudflare R2)"
echo "   - R2_ENDPOINT_URL (Cloudflare R2 endpoint)"
echo "   - R2_BUCKET_NAME (default: nuzantaradb)"
echo "   - ANTHROPIC_API_KEY (Claude API key)"
echo "   - TYPESCRIPT_BACKEND_URL (TS backend URL)"

# Set default values that can work
railway variables set R2_BUCKET_NAME=nuzantaradb --service "RAG BACKEND"
railway variables set ENABLE_RERANKER=false --service "RAG BACKEND"
railway variables set TYPESCRIPT_BACKEND_URL=https://ts-backend-production-568d.up.railway.app --service "RAG BACKEND"

echo "✅ RAG Backend default variables configured"

echo ""
echo "📋 MANUAL CONFIGURATION REQUIRED:"
echo "================================="
echo ""
echo "1. Go to Railway Dashboard:"
echo "   https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
echo ""
echo "2. For RAG BACKEND service, add these variables:"
echo "   - R2_ACCESS_KEY_ID = [your-cloudflare-r2-key]"
echo "   - R2_SECRET_ACCESS_KEY = [your-cloudflare-r2-secret]"
echo "   - R2_ENDPOINT_URL = https://[account-id].r2.cloudflarestorage.com"
echo "   - ANTHROPIC_API_KEY = sk-ant-api03-[your-claude-key]"
echo ""
echo "3. Verify Root Directory settings:"
echo "   - TS-BACKEND: apps/backend-ts"
echo "   - RAG BACKEND: apps/backend-rag/backend"
echo ""
echo "4. Deploy services:"
echo "   railway up --service TS-BACKEND"
echo "   railway up --service 'RAG BACKEND'"
echo ""
echo "5. Monitor logs:"
echo "   railway logs --service TS-BACKEND --tail 20"
echo "   railway logs --service 'RAG BACKEND' --tail 20"
echo ""
echo "🎯 Setup completed! Configure manual variables and deploy."
