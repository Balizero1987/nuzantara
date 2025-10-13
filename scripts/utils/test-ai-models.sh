#!/bin/bash
echo "🤖 Testing All AI Models"
echo "========================="
echo ""

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

# Test OpenAI
echo -n "OpenAI (GPT-4o-mini): "
result=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"openai.chat","params":{"prompt":"What is 5+5? Answer with just the number."}}')
if echo "$result" | jq -e '.ok' > /dev/null 2>&1; then
  echo "✅ $(echo "$result" | jq -r '.data.response' | tr -d '\n')"
else
  echo "❌ Failed"
fi

# Test Claude
echo -n "Claude (Anthropic): "
result=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"claude.chat","params":{"prompt":"What is 3+3? Answer with just the number."}}')
if echo "$result" | jq -e '.ok' > /dev/null 2>&1; then
  echo "✅ $(echo "$result" | jq -r '.data.response' | tr -d '\n' | head -c 20)"
else
  echo "❌ Failed"
fi

# Test Gemini
echo -n "Gemini (Google): "
result=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"gemini.chat","params":{"prompt":"What is 7+7? Answer with just the number."}}')
if echo "$result" | jq -e '.ok' > /dev/null 2>&1; then
  echo "✅ $(echo "$result" | jq -r '.data.response' | tr -d '\n')"
else
  echo "❌ Failed"
fi

# Test Cohere
echo -n "Cohere: "
result=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"cohere.chat","params":{"prompt":"What is 4+4? Answer with just the number."}}')
if echo "$result" | jq -e '.ok' > /dev/null 2>&1; then
  echo "✅ $(echo "$result" | jq -r '.data.response' | tr -d '\n' | head -c 20)"
else
  echo "❌ Failed"
fi

# Test AI.chat (auto-select)
echo -n "AI.chat (auto-select): "
result=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"ai.chat","params":{"prompt":"What is 6+6? Answer with just the number."}}')
if echo "$result" | jq -e '.ok' > /dev/null 2>&1; then
  model=$(echo "$result" | jq -r '.data.model // "unknown"')
  echo "✅ Model: $model"
else
  echo "❌ Failed"
fi

echo ""
echo "✅ All AI models tested!"
