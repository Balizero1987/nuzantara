#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing ZANTARA Memory System..."
echo "===================================="

# 1. Test memory.save
echo -e "\n1️⃣ Testing memory.save..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.save",
    "params": {
      "userId": "test_user",
      "key": "preferences",
      "content": "User prefers dark mode and Italian language",
      "metadata": {"category": "user_settings"}
    }
  }' | jq '.'

# 2. Test memory.search
echo -e "\n2️⃣ Testing memory.search..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.search",
    "params": {
      "query": "dark mode",
      "userId": "test_user",
      "limit": 10
    }
  }' | jq '.'

# 3. Test memory.retrieve
echo -e "\n3️⃣ Testing memory.retrieve..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.retrieve",
    "params": {
      "key": "preferences"
    }
  }' | jq '.'

echo -e "\n✅ Memory tests completed!"