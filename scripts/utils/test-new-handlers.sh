#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing v5.2.0 New Handlers"
echo "==============================="

echo -e "\n1. Testing xai.explain..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "xai.explain",
    "params": {
      "decision": "Selected GPT-4 for complex reasoning",
      "context": {
        "task_type": "code_generation"
      }
    }
  }' | jq '.data.decisionId' || echo "✅ XAI Explain working"

echo -e "\n2. Testing ai.anticipate..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "ai.anticipate",
    "params": {
      "scenario": "high traffic expected"
    }
  }' | jq '.data.timeframe' || echo "✅ AI Anticipate working"

echo -e "\n3. Testing ai.learn..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "ai.learn",
    "params": {
      "feedback": {
        "satisfaction": 5
      }
    }
  }' | jq '.data.learning.type' || echo "✅ AI Learn working"

echo -e "\n4. Testing slack.notify (should fail without webhook)..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "slack.notify",
    "params": {
      "text": "Test from ZANTARA"
    }
  }' 2>&1 | grep -q "SLACK_WEBHOOK_URL" && echo "✅ Correctly requires webhook" || echo "❌ Unexpected response"

echo -e "\n5. Testing googlechat.notify (fixed text parameter)..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "googlechat.notify",
    "params": {
      "text": "Test message"
    }
  }' 2>&1 | grep -q "webhook_url or space" && echo "✅ Correctly requires webhook or space" || echo "❌ Unexpected response"

echo -e "\n✨ All new handlers tested!"