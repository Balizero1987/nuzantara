#!/bin/bash

# Railway Deployment Test Script
# Testa i deployment Railway e verifica la funzionalità

echo "🧪 NUZANTARA Railway Deployment Test"
echo "=================================="

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
fi

echo ""
echo "🔍 Testing JWT Authentication..."
echo "Testing /auth/login endpoint..."

# Test login endpoint (should return 400 for missing credentials, not 404)
TS_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TS_BACKEND_URL/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null)

if [ "$TS_LOGIN" = "400" ] || [ "$TS_LOGIN" = "422" ]; then
    echo "✅ JWT Login endpoint: AVAILABLE (HTTP $TS_LOGIN - expected for missing credentials)"
else
    echo "❌ JWT Login endpoint: FAILED (HTTP $TS_LOGIN)"
fi

echo ""
echo "🔍 Testing AI Chat Endpoints..."

# Test AI chat endpoint
TS_CHAT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TS_BACKEND_URL/ai.chat" -H "Content-Type: application/json" -d '{"message":"test"}' 2>/dev/null)

if [ "$TS_CHAT" = "401" ] || [ "$TS_CHAT" = "400" ]; then
    echo "✅ AI Chat endpoint: AVAILABLE (HTTP $TS_CHAT - expected for missing auth/params)"
else
    echo "❌ AI Chat endpoint: FAILED (HTTP $TS_CHAT)"
fi

# Test RAG chat endpoint
RAG_CHAT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$RAG_BACKEND_URL/bali-zero/chat" -H "Content-Type: application/json" -d '{"query":"test"}' 2>/dev/null)

if [ "$RAG_CHAT" = "200" ] || [ "$RAG_CHAT" = "400" ] || [ "$RAG_CHAT" = "422" ]; then
    echo "✅ RAG Chat endpoint: AVAILABLE (HTTP $RAG_CHAT)"
else
    echo "❌ RAG Chat endpoint: FAILED (HTTP $RAG_CHAT)"
fi

echo ""
echo "📊 DEPLOYMENT SUMMARY:"
echo "======================"

if [ "$TS_HEALTH" = "200" ]; then
    echo "✅ TypeScript Backend: DEPLOYED"
else
    echo "❌ TypeScript Backend: FAILED"
fi

if [ "$RAG_HEALTH" = "200" ]; then
    echo "✅ RAG Backend: DEPLOYED"
else
    echo "❌ RAG Backend: FAILED"
fi

echo ""
echo "🔧 DEBUG COMMANDS:"
echo "=================="
echo "Check logs:"
echo "  railway logs --service TS-BACKEND --tail 20"
echo "  railway logs --service 'RAG BACKEND' --tail 20"
echo ""
echo "Check variables:"
echo "  railway variables --service TS-BACKEND"
echo "  railway variables --service 'RAG BACKEND'"
echo ""
echo "Redeploy:"
echo "  railway up --service TS-BACKEND"
echo "  railway up --service 'RAG BACKEND'"
echo ""
echo "🎯 Test completed!"
