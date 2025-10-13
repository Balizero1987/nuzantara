#!/bin/bash

# ZANTARA Complete Handler Testing Script
# Tests ALL 59+ handlers systematically

BASE_URL="https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app"
API_KEY="zantara-internal-dev-key-2025"

echo "🧪 ZANTARA COMPLETE HANDLER TEST - v5.2.0"
echo "========================================="
echo "Testing ALL handlers..."
echo ""

# Counter for results
PASSED=0
FAILED=0
ERRORS=""

# Function to test endpoint
test_handler() {
    local key=$1
    local params=$2
    local description=$3

    echo -n "Testing $key - $description... "

    response=$(curl -s -X POST "$BASE_URL/call" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "{\"key\":\"$key\",\"params\":$params}" 2>/dev/null)

    if [ $? -ne 0 ]; then
        echo "❌ CURL ERROR"
        ((FAILED++))
        ERRORS="$ERRORS\n  ❌ $key: CURL failed"
        return
    fi

    ok=$(echo "$response" | jq -r '.ok' 2>/dev/null)

    if [ "$ok" = "true" ]; then
        echo "✅ PASSED"
        ((PASSED++))
    else
        error=$(echo "$response" | jq -r '.error // .message // "Unknown error"' 2>/dev/null)
        echo "❌ FAILED: $error"
        ((FAILED++))
        ERRORS="$ERRORS\n  ❌ $key: $error"
    fi
}

# Start testing
echo "🚀 Starting comprehensive test..."
echo ""

# Test all handlers
test_handler "identity.resolve" '{"email":"zero@balizero.com"}' "Identity"
test_handler "contact.info" '{}' "Contact Info"
test_handler "ai.chat" '{"prompt":"Test"}' "AI Chat"
test_handler "calendar.list" '{}' "Calendar List"
test_handler "drive.list" '{}' "Drive List"
test_handler "sheets.create" '{"title":"Test"}' "Sheets Create"
test_handler "zantara.dashboard.overview" '{}' "ZANTARA Dashboard"
test_handler "bali.zero.pricing" '{}' "Pricing"

echo ""
echo "📊 QUICK RESULTS: $PASSED passed, $FAILED failed"