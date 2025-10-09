#!/bin/bash

# Test Gmail API with explicit impersonation
curl -X POST "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -H "x-impersonate-user: zero@balizero.com" \
  -d '{
    "key": "gmail.send",
    "params": {
      "to": "zero@balizero.com",
      "subject": "📊 INTEL REPORT - 16 Articles Generated",
      "text": "Your intel automation pipeline has completed successfully!\n\n✅ Stage 1: Scraping - 15 documents\n✅ Stage 2: RAG Processing - 27 documents\n✅ Stage 3: Article Generation - 16 professional articles\n\nCheck INTEL_ARTICLES/ folder for all generated content.\n\n--\nNUZANTARA Intel Automation"
    }
  }' | jq '.'
