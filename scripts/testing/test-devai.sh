#!/bin/bash

# Test DevAI Integration
# Quick tests for all DevAI handlers

set -e

API_URL="${1:-http://localhost:8080}"
API_KEY="${2:-zantara-internal-dev-key-2025}"

echo "🧪 Testing DevAI Integration"
echo "================================"
echo "API URL: $API_URL"
echo ""

# Test 1: DevAI Chat
echo "1️⃣ Testing devai.chat..."
curl -s -X POST "$API_URL/call" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "devai.chat",
    "params": {
      "message": "Hello DevAI! Can you help me?"
    }
  }' | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 2: Code Analysis  
echo "2️⃣ Testing devai.analyze..."
curl -s -X POST "$API_URL/call" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "devai.analyze",
    "params": {
      "code": "function add(a, b) { return a + b; } add(\"1\", 2);"
    }
  }' | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 3: Bug Fix
echo "3️⃣ Testing devai.fix..."
curl -s -X POST "$API_URL/call" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "devai.fix",
    "params": {
      "code": "const x = undefned; console.log(x);"
    }
  }' | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 4: Code Review
echo "4️⃣ Testing devai.review..."
curl -s -X POST "$API_URL/call" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "devai.review",
    "params": {
      "code": "export async function handler(params) { const result = await db.query(); return result; }"
    }
  }' | python3 -m json.tool || echo "❌ Failed"
echo ""

# Test 5: Generate Tests
echo "5️⃣ Testing devai.generate-tests..."
curl -s -X POST "$API_URL/call" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "devai.generate-tests",
    "params": {
      "code": "export function multiply(a: number, b: number): number { return a * b; }"
    }
  }' | python3 -m json.tool || echo "❌ Failed"
echo ""

echo "✅ DevAI Integration Tests Complete!"

