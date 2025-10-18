#!/bin/bash

# Test script for DevAI new system prompt v2.0
# Tests different scenarios to verify the improved prompt

echo "🧪 Testing DevAI System Prompt v2.0"
echo "===================================="
echo ""

# Test 1: Chat mode - Italian
echo "Test 1: Chat mode (Italian)"
echo "---------------------------"
curl -X POST http://localhost:8080/api/handler \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "handler": "devai.chat",
    "params": {
      "message": "Ciao DevAI! Quanti handler ci sono nel sistema? E quali porte usa il backend?",
      "task": "chat"
    }
  }' | jq '.data.answer' -r

echo ""
echo "Test 2: Analyze mode"
echo "--------------------"
curl -X POST http://localhost:8080/api/handler \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "handler": "devai.analyze",
    "params": {
      "code": "function getData() {\n  const result = fetch(url);\n  return result.json();\n}",
      "message": "Find bugs in this code"
    }
  }' | jq '.data.answer' -r

echo ""
echo "Test 3: Fix mode"
echo "----------------"
curl -X POST http://localhost:8080/api/handler \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "handler": "devai.fix",
    "params": {
      "code": "const data = null;\nconsole.log(data.length);",
      "message": "Fix the null pointer error"
    }
  }' | jq '.data.answer' -r

echo ""
echo "Test 4: Architecture verification"
echo "---------------------------------"
curl -X POST http://localhost:8080/api/handler \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{
    "handler": "devai.chat",
    "params": {
      "message": "Tell me about the NUZANTARA architecture. What files exist in src/?"
    }
  }' | jq '.data.answer' -r

echo ""
echo "✅ Tests completed!"
