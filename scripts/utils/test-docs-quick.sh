#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 Testing Google Docs handlers..."
echo ""

# Test docs.create
echo "1️⃣ Testing docs.create..."
DOC_RESPONSE=$(curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "docs.create", "params": {"title": "ZANTARA Test Document", "content": "This is a test document created by ZANTARA v5.2.0\n\nFeatures:\n- OAuth2 authentication\n- Google Docs API integration\n- Real-time document creation"}}')

echo "$DOC_RESPONSE" | jq '.'

# Extract document ID
DOC_ID=$(echo "$DOC_RESPONSE" | jq -r '.data.documentId // empty')

if [ -n "$DOC_ID" ]; then
  echo "✅ Document created: $DOC_ID"
  echo ""

  # Test docs.read
  echo "2️⃣ Testing docs.read with ID: $DOC_ID..."
  curl -s -X POST $BASE_URL/call \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"key\": \"docs.read\", \"params\": {\"documentId\": \"$DOC_ID\"}}" | jq '.'
  echo ""

  # Test docs.update
  echo "3️⃣ Testing docs.update..."
  curl -s -X POST $BASE_URL/call \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "{\"key\": \"docs.update\", \"params\": {\"documentId\": \"$DOC_ID\", \"updates\": [{\"insertText\": {\"location\": {\"index\": 1}, \"text\": \"[UPDATED] \"}}]}}" | jq '.'
else
  echo "❌ Failed to create document"
fi

echo ""
echo "✅ Google Docs test complete!"