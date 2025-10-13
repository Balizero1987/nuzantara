#!/bin/bash

echo "🧪 Testing Google Workspace Handlers with OAuth2"
echo "================================================"

API_KEY="zantara-internal-dev-key-2025"
URL="http://localhost:8080/call"

echo -e "\n1️⃣ Testing Google Docs Creation..."
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "docs.create",
    "params": {
      "title": "ZANTARA OAuth2 Test Document",
      "content": "This document was created via ZANTARA API with working OAuth2 authentication!"
    }
  }' | python3 -m json.tool

echo -e "\n2️⃣ Testing Google Sheets Creation..."
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "sheets.create",
    "params": {
      "title": "ZANTARA OAuth2 Test Spreadsheet",
      "data": [
        ["Name", "Service", "Status"],
        ["Zero", "Visa", "Active"],
        ["Amanda", "Company Setup", "Pending"]
      ]
    }
  }' | python3 -m json.tool

echo -e "\n3️⃣ Testing Google Slides Creation..."
curl -s -X POST $URL \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "slides.create",
    "params": {
      "title": "ZANTARA OAuth2 Test Presentation"
    }
  }' | python3 -m json.tool

echo -e "\n✅ Testing Complete!"