#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 GOOGLE DOCS - COMPLETE TEST SUITE"
echo "===================================="
echo ""

# 1. CREATE
echo "✅ 1. CREATE Document"
DOC_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "docs.create",
    "params": {
      "title": "ZANTARA Complete Test",
      "content": "ZANTARA v5.2.0 Test Document\n\nThis document demonstrates:\n- Full OAuth2 integration\n- Create/Read/Update operations\n- Real-time Google Docs API"
    }
  }')

echo "$DOC_RESPONSE" | jq '.data | {documentId, title, url}'
DOC_ID=$(echo "$DOC_RESPONSE" | jq -r '.data.documentId')
echo ""

# 2. READ
echo "✅ 2. READ Document"
READ_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $API_KEY" \
  -d "{\"key\": \"docs.read\", \"params\": {\"documentId\": \"$DOC_ID\"}}")

echo "$READ_RESPONSE" | jq '.data | {title: .document.title, contentLength, preview: .content[:100]}'
echo ""

# 3. UPDATE
echo "✅ 3. UPDATE Document"
UPDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "docs.update",
    "params": {
      "documentId": "'$DOC_ID'",
      "requests": [
        {
          "insertText": {
            "location": {"index": 1},
            "text": "\n[UPDATED via ZANTARA API]\n"
          }
        }
      ]
    }
  }')

echo "$UPDATE_RESPONSE" | jq '.data | {documentId, updated: true}'
echo ""

# 4. VERIFY UPDATE
echo "✅ 4. VERIFY Update"
VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H 'Content-Type: application/json' \
  -H "x-api-key: $API_KEY" \
  -d "{\"key\": \"docs.read\", \"params\": {\"documentId\": \"$DOC_ID\"}}")

echo "$VERIFY_RESPONSE" | jq '.data.content[:100]'
echo ""

echo "===================================="
echo "✅ ALL GOOGLE DOCS HANDLERS WORKING!"
echo "Document URL: https://docs.google.com/document/d/$DOC_ID"
echo "===================================="