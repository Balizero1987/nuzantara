#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing ZANTARA v5.2.0 Working Handlers..."
echo "============================================"

SUCCESS=0
TOTAL=0

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local check=$4
    local name=$5

    TOTAL=$((TOTAL + 1))
    echo -n "$TOTAL. $name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -H "x-api-key: $API_KEY" "$BASE_URL/$endpoint" 2>&1)
    else
        response=$(curl -s -X POST -H "x-api-key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" "$BASE_URL$endpoint" 2>&1)
    fi

    if echo "$response" | grep -q "$check"; then
        echo "✅"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "❌"
    fi
}

# Health check (no auth)
TOTAL=$((TOTAL + 1))
echo -n "$TOTAL. Health check... "
curl -s $BASE_URL/health | grep -q "healthy" && { echo "✅"; SUCCESS=$((SUCCESS + 1)); } || echo "❌"

# Memory System
test_endpoint "POST" "/call" '{"key":"memory.save","params":{"userId":"test-user","key":"test","content":"data"}}' "ok" "memory.save"
test_endpoint "POST" "/call" '{"key":"memory.search","params":{"userId":"test-user","query":"test"}}' "ok" "memory.search"
test_endpoint "POST" "/call" '{"key":"memory.retrieve","params":{"userId":"test-user","key":"test"}}' "ok" "memory.retrieve"

# AI Core
test_endpoint "POST" "/call" '{"key":"ai.chat","params":{"prompt":"Hi"}}' "ok" "ai.chat"
test_endpoint "POST" "/call" '{"key":"openai.chat","params":{"prompt":"Hi"}}' "ok" "openai.chat"
test_endpoint "POST" "/call" '{"key":"claude.chat","params":{"prompt":"Hi"}}' "ok" "claude.chat"
test_endpoint "POST" "/call" '{"key":"gemini.chat","params":{"prompt":"Hi"}}' "ok" "gemini.chat"
test_endpoint "POST" "/call" '{"key":"cohere.chat","params":{"prompt":"Hi"}}' "ok" "cohere.chat"

# AI Advanced
test_endpoint "POST" "/call" '{"key":"ai.anticipate","params":{"scenario":"test"}}' "ok" "ai.anticipate"
test_endpoint "POST" "/call" '{"key":"ai.learn","params":{"feedback":{"test":1}}}' "ok" "ai.learn"
test_endpoint "POST" "/call" '{"key":"xai.explain","params":{"decision":"test"}}' "ok" "xai.explain"

# Oracle System
test_endpoint "POST" "/call" '{"key":"oracle.simulate","params":{"service":"visa"}}' "ok" "oracle.simulate"
test_endpoint "POST" "/call" '{"key":"oracle.predict","params":{"service":"visa"}}' "ok" "oracle.predict"
test_endpoint "POST" "/call" '{"key":"oracle.analyze","params":{"service":"visa"}}' "ok" "oracle.analyze"

# Advisory System
test_endpoint "POST" "/call" '{"key":"document.prepare","params":{"service":"visa"}}' "ok" "document.prepare"
test_endpoint "POST" "/call" '{"key":"assistant.route","params":{"query":"help"}}' "ok" "assistant.route"

# Business Handlers
test_endpoint "POST" "/call" '{"key":"contact.info","params":{"name":"test"}}' "ok" "contact.info"
test_endpoint "POST" "/call" '{"key":"lead.save","params":{"service":"visa","name":"Test","email":"test@test.com"}}' "ok" "lead.save"
test_endpoint "POST" "/call" '{"key":"quote.generate","params":{"service":"visa"}}' "ok" "quote.generate"

# Identity
test_endpoint "POST" "/call" '{"key":"identity.resolve","params":{"email":"test@test.com"}}' "ok" "identity.resolve"

echo "============================================"
echo "📊 Results: $SUCCESS/$TOTAL handlers working"
echo "============================================"

if [ $SUCCESS -eq $TOTAL ]; then
    echo "🎉 ALL TESTS PASSED!"
    exit 0
else
    echo "⚠️  Some tests failed"
    exit 1
fi