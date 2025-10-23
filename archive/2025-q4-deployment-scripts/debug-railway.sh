#!/bin/bash

# NUZANTARA Railway Debug Script
# Test deployment configuration locally

echo "🚀 NUZANTARA Railway Debug Script"
echo "=================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI found"

# Check login status
echo "🔐 Checking Railway login status..."
if railway whoami &> /dev/null; then
    echo "✅ Logged in to Railway"
else
    echo "❌ Not logged in. Run: railway login"
    exit 1
fi

# Check project status
echo "📊 Checking project status..."
railway status

echo ""
echo "🔍 Checking TypeScript Backend..."
echo "Service: TS-BACKEND"
railway logs --service TS-BACKEND --tail 10

echo ""
echo "🔍 Checking RAG Backend..."
echo "Service: RAG BACKEND"
railway logs --service "RAG BACKEND" --tail 10

echo ""
echo "🔧 Environment Variables Check..."
echo "TS-BACKEND variables:"
railway variables --service TS-BACKEND

echo ""
echo "RAG BACKEND variables:"
railway variables --service "RAG BACKEND"

echo ""
echo "🚀 Deployment Commands:"
echo "To deploy TS-BACKEND: railway up --service TS-BACKEND"
echo "To deploy RAG BACKEND: railway up --service 'RAG BACKEND'"
echo ""
echo "📝 Debug completed!"
