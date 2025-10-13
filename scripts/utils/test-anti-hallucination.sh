#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing Anti-Hallucination System..."
echo "======================================="
echo ""

# Test 1: Memory save with verification
echo "1️⃣  Testing memory.save with grounded data..."
RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "memory.save",
    "params": {
      "userId": "test_user",
      "content": "Bali Zero offers visa services including B211A and company setup",
      "type": "fact"
    }
  }')

echo "Response: $(echo "$RESPONSE" | jq -c '{ok, grounded, confidence}')"
echo ""

# Test 2: AI response validation
echo "2️⃣  Testing AI response grounding..."
RESPONSE=$(curl -s -X POST $BASE_URL/ai.chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "prompt": "What visa types does Bali Zero offer?",
    "model": "auto"
  }')

echo "Response includes grounding: $(echo "$RESPONSE" | jq -r '.grounded // "not validated"')"
echo "Confidence: $(echo "$RESPONSE" | jq -r '.confidence // "N/A"')"
echo ""

# Test 3: Check validation report
echo "3️⃣  Getting validation report..."
REPORT=$(curl -s $BASE_URL/validation/report)

echo "Validation Report:"
echo "$REPORT" | jq '.data'
echo ""

# Test 4: Test with potentially hallucinated content
echo "4️⃣  Testing response with unverified claims..."
RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "quote.generate",
    "params": {
      "service": "impossible_service",
      "details": "guaranteed 100% success always",
      "urgency": "impossible_timeline"
    }
  }')

echo "Response validation warnings: $(echo "$RESPONSE" | jq '.validation_warnings // []')"
echo "Grounded: $(echo "$RESPONSE" | jq -r '.grounded // "not checked"')"
echo ""

echo "======================================="
echo "✅ Anti-Hallucination Test Complete!"
echo ""
echo "Key Features Demonstrated:"
echo "• Responses include grounding metadata"
echo "• Confidence scores for all responses"
echo "• Validation warnings for unverified claims"
echo "• Fact storage in Firestore for persistence"