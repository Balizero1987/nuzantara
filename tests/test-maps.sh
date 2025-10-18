#!/bin/bash

echo "🧪 Testing Maps handlers..."

# Test maps.directions
echo "1️⃣ Testing maps.directions..."
curl -s -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{"key":"maps.directions","params":{"origin":"Canggu, Bali","destination":"Ubud, Bali"}}' | jq -r 'if .status == "success" then "✅ maps.directions: SUCCESS - \(.data.routes[0].legs[0].distance.text), \(.data.routes[0].legs[0].duration.text)" else "❌ maps.directions: FAILED - \(.error // .message)" end'

echo ""

# Test maps.places
echo "2️⃣ Testing maps.places..."
curl -s -X POST https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call \
  -H "Content-Type: application/json" \
  -H "X-API-Key: zantara-internal-dev-key-2025" \
  -d '{"key":"maps.places","params":{"query":"Canggu Beach Club","location":"Canggu, Bali"}}' | jq -r 'if .status == "success" then "✅ maps.places: SUCCESS - \(.data.candidates[0].name)" else "❌ maps.places: FAILED - \(.error // .message)" end'

echo ""
echo "✅ Maps testing complete"
