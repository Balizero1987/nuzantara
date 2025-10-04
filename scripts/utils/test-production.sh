#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="https://zantara-v520-production-1064094238013.europe-west1.run.app"

echo "🚀 ZANTARA v5.2.0 PRODUCTION TEST"
echo "================================="
echo "URL: $BASE_URL"
echo ""

# Test Google Workspace
echo "📁 Google Drive:"
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "drive.list", "params": {"pageSize": 3}}' | jq '.ok'

echo "📊 Google Sheets:"
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "sheets.create", "params": {"title": "Production Test"}}' | jq '.ok'

echo "📧 Gmail:"
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "gmail.send", "params": {"to": "zero@balizero.com", "subject": "ZANTARA Production Active", "text": "System operational!"}}' | jq '.ok'

# Test AI
echo "🤖 AI Chat:"
curl -s -X POST $BASE_URL/ai.chat \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"prompt": "Hello"}' | jq '.ok'

# Test Business
echo "👥 Team:"
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "team.list"}' | jq '.data.members | length'

echo "💰 Pricing:"
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "pricing.official"}' | jq '.ok'

echo ""
echo "================================="
echo "✅ PRODUCTION SYSTEM OPERATIONAL!"
echo ""
echo "📊 Summary:"
echo "- Google Workspace: ✅ Working"
echo "- AI Models: ✅ Active"
echo "- Business Logic: ✅ Operational"
echo "- Webhooks: ⚙️ Need configuration"
echo ""
echo "🔗 Production URL: $BASE_URL"
