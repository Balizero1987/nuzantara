#!/bin/bash
# Quick health check for Railway deployments

echo "🔍 Checking Railway deployments..."
echo ""

# RAG Backend
echo "📦 RAG Backend (scintillating-kindness):"
RAG_RESPONSE=$(curl -s https://scintillating-kindness-production-47e3.up.railway.app/health)
if echo "$RAG_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ HEALTHY"
    echo "$RAG_RESPONSE" | python3 -m json.tool 2>/dev/null | head -15
else
    echo "❌ UNHEALTHY"
    echo "$RAG_RESPONSE"
fi

echo ""
echo "─────────────────────────────────"
echo ""

# TS Backend
echo "📦 TS Backend (nuzantara):"
TS_RESPONSE=$(curl -s https://ts-backend-production-568d.up.railway.app/health)
if echo "$TS_RESPONSE" | grep -q '"status":"healthy"'; then
    echo "✅ HEALTHY"
    echo "$TS_RESPONSE" | python3 -m json.tool 2>/dev/null | head -15
else
    echo "❌ UNHEALTHY"
    echo "$TS_RESPONSE"
fi

echo ""
echo "─────────────────────────────────"
echo ""

# PostgreSQL check via RAG
echo "🐘 PostgreSQL (via RAG backend):"
if echo "$RAG_RESPONSE" | grep -q '"postgresql":true'; then
    echo "✅ CONNECTED"
else
    echo "❌ NOT CONNECTED"
fi

echo ""
echo "✅ Health check complete!"
