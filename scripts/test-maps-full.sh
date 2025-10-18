#!/bin/bash

API_URL="https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app"
API_KEY="zantara-internal-dev-key-2025"

echo "Testing maps.directions handler..."
curl -X POST "${API_URL}/call" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"key":"maps.directions","params":{"origin":"Canggu, Bali","destination":"Ubud, Bali"}}'

echo -e "\n\n---\n"

echo "Testing maps.places handler..."
curl -X POST "${API_URL}/call" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"key":"maps.places","params":{"query":"Canggu Beach Club"}}'
