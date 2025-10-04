#!/bin/bash
API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🗺️  ZANTARA Maps API Tests"
echo "========================="

echo ""
echo "1. Maps Places Search..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key":"maps.places","params":{"query":"restaurant Canggu"}}' | jq -r 'if .ok then "✅ Places: " + (.data.places[0].name // "No results") else "❌ " + .error end'

echo ""
echo "2. Maps Directions..."
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key":"maps.directions","params":{"origin":"Canggu","destination":"Seminyak","mode":"driving"}}' | jq -r 'if .ok then "✅ Directions: " + .data.route.distance + " in " + .data.route.duration else "❌ " + .error end'

echo ""
echo "3. Maps Place Details..."
PLACE_ID=$(curl -s -X POST $BASE_URL/call -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d '{"key":"maps.places","params":{"query":"Canggu"}}' | jq -r '.data.places[0].placeId')
curl -s -X POST $BASE_URL/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{\"key\":\"maps.placeDetails\",\"params\":{\"placeId\":\"$PLACE_ID\"}}" | jq -r 'if .ok then "✅ Details: " + .data.place.name else "❌ " + .error end'

echo ""
echo "========================="
