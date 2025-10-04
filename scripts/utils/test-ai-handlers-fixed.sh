#!/bin/bash

# Test AI handlers with correct parameters
echo "🤖 Testing AI handlers with correct parameters..."
echo "================================================"

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080/call"

# Function to test handler
test_ai_handler() {
    local KEY=$1
    local DESC=$2

    echo -e "\n📋 Testing: $DESC"
    echo "Handler: $KEY"

    # Use 'prompt' parameter for AI handlers
    RESPONSE=$(curl -s -X POST $BASE_URL \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "{\"key\": \"$KEY\", \"params\": {\"prompt\": \"Hello, what is 2+2?\"}}")

    if echo "$RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1; then
        echo "✅ SUCCESS"
        # Extract AI response
        AI_RESPONSE=$(echo "$RESPONSE" | jq -r '.data.response // .data.message // .data' 2>/dev/null | head -50)
        echo "Response: ${AI_RESPONSE:0:200}..."
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
        MESSAGE=$(echo "$RESPONSE" | jq -r '.message // "No message"')
        echo "❌ FAILED: $ERROR - $MESSAGE"
    fi
}

# Test all AI handlers
test_ai_handler "ai.chat" "Unified AI Chat (auto-selects provider)"
test_ai_handler "gemini.chat" "Gemini AI"
test_ai_handler "claude.chat" "Claude AI"
test_ai_handler "openai.chat" "OpenAI GPT"
test_ai_handler "cohere.chat" "Cohere AI"

echo -e "\n================================================"
echo "✅ AI handler testing complete!"