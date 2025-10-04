#!/bin/bash
# Quick API Examples - ZANTARA Backends

echo "🚀 ZANTARA Backend Quick Examples"
echo "=================================="

# Backend #1 - TypeScript (port 8080)
echo -e "\n📍 BACKEND #1 - TypeScript (port 8080)"
echo "--------------------------------------"

# Health check
echo -e "\n1. Health Check:"
curl -s http://localhost:8080/health | jq

# AI Chat
echo -e "\n2. AI Chat (OpenAI):"
curl -s -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "ai.chat",
    "params": {
      "prompt": "What is 2+2?"
    }
  }' | jq '.data.response' | head -5

# Team List
echo -e "\n3. Team List:"
curl -s -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "team.list",
    "params": {}
  }' | jq '.data | length'

# Contact Info
echo -e "\n4. Contact Info:"
curl -s -X POST http://localhost:8080/call \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "contact.info",
    "params": {}
  }' | jq '.data'

# Backend #2 - Python RAG (port 8000)
echo -e "\n\n📍 BACKEND #2 - Python RAG (port 8000)"
echo "--------------------------------------"

# Root info
echo -e "\n1. Service Info:"
curl -s http://localhost:8000/ | jq

# Search endpoint info
echo -e "\n2. Search Endpoint (available):"
echo "   POST http://localhost:8000/search"
echo "   Body: {\"query\": \"...\", \"level\": 3, \"limit\": 5}"

# Ingest endpoint info
echo -e "\n3. Ingest Endpoint (available):"
echo "   POST http://localhost:8000/ingest"
echo "   For document ingestion"

# API Docs
echo -e "\n4. API Documentation (Swagger):"
echo "   Open in browser: http://localhost:8000/docs"

echo -e "\n\n✅ All backends operational!"
echo "📚 For more examples, see documentation."
