#!/bin/bash

curl -X POST "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "gmail.send",
    "params": {
      "to": "zero@balizero.com",
      "subject": "📊 Intel Report - 16 Articles Ready",
      "text": "16 new intel articles have been generated and are ready for review in INTEL_ARTICLES/"
    }
  }' | jq '.'
