#!/bin/bash

# Test Railway Deployment After Root Directory Fix
# Testa i deployment dopo aver corretto Root Directory

echo "🧪 RAILWAY DEPLOYMENT TEST - After Root Directory Fix"
echo "===================================================="

# URLs dei servizi
TS_BACKEND_URL="https://ts-backend-production-568d.up.railway.app"
RAG_BACKEND_URL="https://scintillating-kindness-production-47e3.up.railway.app"

echo ""
echo "🔍 Testing TypeScript Backend..."
echo "URL: $TS_BACKEND_URL"

# Test health endpoint
echo "Testing /health endpoint..."
TS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$TS_BACKEND_URL/health" 2>/dev/null)

if [ "$TS_HEALTH" = "200" ]; then
    echo "✅ TypeScript Backend: HEALTHY"
    curl -s "$TS_BACKEND_URL/health" | jq '.' 2>/dev/null || echo "Response: $(curl -s $TS_BACKEND_URL/health)"
else
    echo "❌ TypeScript Backend: FAILED (HTTP $TS_HEALTH)"
    echo "   This might be expected if Root Directory is not yet fixed"
fi

echo ""
echo "🔍 Testing RAG Backend..."
echo "URL: $RAG_BACKEND_URL"

# Test health endpoint
echo "Testing /health endpoint..."
RAG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$RAG_BACKEND_URL/health" 2>/dev/null)

if [ "$RAG_HEALTH" = "200" ]; then
    echo "✅ RAG Backend: HEALTHY"
    curl -s "$RAG_BACKEND_URL/health" | jq '.' 2>/dev/null || echo "Response: $(curl -s $RAG_BACKEND_URL/health)"
else
    echo "❌ RAG Backend: FAILED (HTTP $RAG_HEALTH)"
    echo "   This is expected until Root Directory is fixed"
fi

echo ""
echo "📊 DEPLOYMENT STATUS:"
echo "===================="

if [ "$TS_HEALTH" = "200" ]; then
    echo "✅ TypeScript Backend: DEPLOYED"
else
    echo "❌ TypeScript Backend: NOT DEPLOYED (Root Directory issue?)"
fi

if [ "$RAG_HEALTH" = "200" ]; then
    echo "✅ RAG Backend: DEPLOYED"
else
    echo "❌ RAG Backend: NOT DEPLOYED (Root Directory issue - expected)"
fi

echo ""
echo "🔧 NEXT STEPS:"
echo "=============="
echo ""
echo "1. Fix Root Directory in Railway Dashboard:"
echo "   - RAG BACKEND: Change Root Directory to 'apps/backend-rag/backend'"
echo "   - TS-BACKEND: Change Root Directory to 'apps/backend-ts'"
echo ""
echo "2. Redeploy services:"
echo "   railway up --service TS-BACKEND"
echo "   railway up --service 'RAG BACKEND'"
echo ""
echo "3. Monitor deployment:"
echo "   railway logs --service TS-BACKEND --tail 20"
echo "   railway logs --service 'RAG BACKEND' --tail 20"
echo ""
echo "4. Run this test again:"
echo "   ./test-railway-after-fix.sh"
echo ""
echo "🎯 Test completed!"
