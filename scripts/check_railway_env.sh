#!/bin/bash
# Quick check of Railway deployment status

echo "🔍 Checking Railway Backend RAG Health..."
echo "🌐 Public Domain: scintillating-kindness-production-47e3.up.railway.app"
echo "🔒 Private Domain: scintillating-kindness.railway.internal"
echo ""

RESPONSE=$(curl -s "https://scintillating-kindness-production-47e3.up.railway.app/health" 2>&1)

# Check if we got valid JSON
if echo "$RESPONSE" | python3 -m json.tool >/dev/null 2>&1; then
    echo "✅ GOT VALID RESPONSE!"
    echo ""
    echo "$RESPONSE" | python3 -m json.tool
    echo ""

    # Parse key fields
    STATUS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', 'unknown'))" 2>/dev/null)
    MODE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('mode', 'unknown'))" 2>/dev/null)

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 STATUS: $STATUS"
    echo "🔧 MODE: $MODE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ "$STATUS" = "healthy" ]; then
        echo "✅ Backend is HEALTHY!"
    elif [ "$STATUS" = "degraded" ]; then
        echo "⚠️  Backend is in DEGRADED mode - some services missing"
        echo "   Check warnings in response above"
    elif [ "$STATUS" = "starting" ]; then
        echo "⏳ Backend is STARTING UP - retry in 30 seconds"
    else
        echo "❌ Backend has issues"
    fi
else
    echo "❌ NO VALID RESPONSE"
    echo "Response: ${RESPONSE:0:200}"
    echo ""

    if echo "$RESPONSE" | grep -q "502"; then
        echo "➡️  502 Error - App failed to start or is still deploying"
        echo "   Possible causes:"
        echo "   1. Missing required env variables"
        echo "   2. App crashed during startup"
        echo "   3. Deployment still in progress"
        echo ""
        echo "   📋 Check Railway Dashboard Logs for details"
    elif echo "$RESPONSE" | grep -q "503"; then
        echo "➡️  503 Error - Service unavailable (likely deploying)"
    fi
fi

echo ""
echo "🔗 Railway Dashboard: https://railway.app/project/1c81bf3b-3834-49e1-9753-2e2a63b74bb9"
