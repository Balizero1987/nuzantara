#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing Firestore Memory System..."
echo "======================================"

# Test memory.save
echo -n "1. memory.save (Firestore)... "
RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.save",
    "params": {
      "userId": "test_firebase_user",
      "content": "Firebase Firestore is now enabled and working!",
      "type": "system",
      "metadata": {"category": "system_test"}
    }
  }')

if echo "$RESPONSE" | grep -q "saved"; then
  echo "✅"
  echo "   Response: $(echo "$RESPONSE" | jq -c '.data')"
else
  echo "❌"
  echo "   Error: $RESPONSE"
fi

# Test memory.retrieve
echo -n "2. memory.retrieve (Firestore)... "
RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.retrieve",
    "params": {
      "userId": "test_firebase_user"
    }
  }')

if echo "$RESPONSE" | grep -q "content"; then
  echo "✅"
  echo "   Content: $(echo "$RESPONSE" | jq -r '.data.content')"
else
  echo "❌"
  echo "   Error: $RESPONSE"
fi

# Test memory.search
echo -n "3. memory.search (Firestore)... "
RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.search",
    "params": {
      "query": "Firebase",
      "userId": "test_firebase_user"
    }
  }')

if echo "$RESPONSE" | grep -q "memories"; then
  echo "✅"
  echo "   Found: $(echo "$RESPONSE" | jq -r '.data.count') memories"
else
  echo "❌"
  echo "   Error: $RESPONSE"
fi

echo "======================================"
echo "✅ Firestore testing complete!"