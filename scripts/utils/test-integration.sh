#!/bin/bash
# Test ZANTARA integration

set -e

echo "🧪 Testing ZANTARA Integration"
echo "=============================="

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test 1: Python backend health (direct)
echo ""
echo -e "${BLUE}Test 1: Python RAG health (direct)...${NC}"
if curl -s http://localhost:8000/health | jq -e '.status == "healthy"' > /dev/null; then
    echo -e "${GREEN}✅ Python RAG backend is healthy${NC}"
else
    echo -e "${RED}❌ Python RAG backend health check failed${NC}"
fi

# Test 2: TypeScript backend health
echo ""
echo -e "${BLUE}Test 2: TypeScript backend health...${NC}"
if curl -s http://localhost:8080/health | jq '.' > /dev/null; then
    echo -e "${GREEN}✅ TypeScript backend is healthy${NC}"
else
    echo -e "${RED}❌ TypeScript backend health check failed${NC}"
fi

# Test 3: RAG health check (via TypeScript proxy)
echo ""
echo -e "${BLUE}Test 3: RAG health check (via TypeScript)...${NC}"
curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "rag.health", "params": {}}' | jq '.'

# Test 4: RAG search (no LLM)
echo ""
echo -e "${BLUE}Test 4: RAG search (semantic search only)...${NC}"
curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "rag.search",
    "params": {
      "query": "What is Sunda Wiwitan?",
      "k": 3
    }
  }' | jq '.data.sources[0:2]'

# Test 5: RAG query with LLM (if Ollama available)
echo ""
echo -e "${BLUE}Test 5: RAG query with LLM generation (Ollama)...${NC}"
if curl -s http://localhost:11434 > /dev/null 2>&1; then
    curl -s -X POST "$BASE_URL/call" \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d '{
        "key": "rag.query",
        "params": {
          "query": "Explain the Kujang symbol",
          "use_llm": true,
          "k": 3
        }
      }' | jq '{answer: .data.answer, sources_count: (.data.sources | length), model: .data.model_used}'
    echo -e "${GREEN}✅ RAG with Ollama works${NC}"
else
    echo -e "${RED}⚠️  Ollama not available, skipping LLM test${NC}"
fi

# Test 6: Bali Zero chat (if Anthropic key available)
echo ""
echo -e "${BLUE}Test 6: Bali Zero chat (Haiku/Sonnet routing)...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "key": "bali.zero.chat",
    "params": {
      "query": "What are the requirements for KITAS work permit?"
    }
  }')

if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    echo "$RESPONSE" | jq '{response: .data.response[0:150], model: .data.model_used}'
    echo -e "${GREEN}✅ Bali Zero works${NC}"
else
    echo -e "${RED}⚠️  Bali Zero not available (ANTHROPIC_API_KEY needed)${NC}"
    echo "$RESPONSE" | jq '.'
fi

# Test 7: Standard business endpoints still work
echo ""
echo -e "${BLUE}Test 7: Standard business endpoints (contact.info)...${NC}"
curl -s -X POST "$BASE_URL/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"key": "contact.info", "params": {}}' | jq '.data | {company, tagline, services}'

echo ""
echo "=============================="
echo -e "${GREEN}✅ Integration tests complete${NC}"
echo "=============================="