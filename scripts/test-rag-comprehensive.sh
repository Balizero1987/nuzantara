#!/bin/bash

# ZANTARA RAG Backend Comprehensive Test Suite
# Tests: /search, /bali-zero/chat, multi-collection routing, edge cases

RAG_URL="https://zantara-rag-backend-1064094238013.europe-west1.run.app"
PASSED=0
FAILED=0

echo "🧪 ZANTARA RAG Backend - Comprehensive Test Suite"
echo "=================================================="
echo "Target: $RAG_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
  local test_name="$1"
  local endpoint="$2"
  local data="$3"
  local expected_field="$4"

  echo -n "Testing: $test_name... "

  response=$(curl -sS -X POST "$RAG_URL$endpoint" \
    -H "Content-Type: application/json" \
    -d "$data" 2>&1)

  if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
    echo "   Response: $(echo "$response" | jq -c ".$expected_field" | head -c 100)..."
  else
    echo -e "${RED}❌ FAIL${NC}"
    FAILED=$((FAILED + 1))
    echo "   Error: $response"
  fi
  echo ""
}

# === TEST SUITE 1: /bali-zero/chat (MAIN ENDPOINT) ===
echo "📡 TEST SUITE 1: /bali-zero/chat"
echo "-----------------------------------"

# Test 1: E23 Working KITAS
test_endpoint \
  "E23 Working KITAS query" \
  "/bali-zero/chat" \
  '{"query":"What is E23 working KITAS and what are the requirements?","user_role":"member"}' \
  "response"

# Test 2: E28A Investor KITAS
test_endpoint \
  "E28A Investor KITAS query" \
  "/bali-zero/chat" \
  '{"query":"E28A investor KITAS requirements and price 2025","user_role":"member"}' \
  "response"

# Test 3: E33G Digital Nomad
test_endpoint \
  "E33G Digital Nomad visa" \
  "/bali-zero/chat" \
  '{"query":"How much does E33G digital nomad visa cost? What are requirements?","user_role":"member"}' \
  "response"

# Test 4: C312 Migration (Old Code)
test_endpoint \
  "C312 to E23 migration" \
  "/bali-zero/chat" \
  '{"query":"I have C312 visa. How do I migrate to E23?","user_role":"member"}' \
  "response"

# Test 5: KBLI Lookup
test_endpoint \
  "KBLI code lookup" \
  "/bali-zero/chat" \
  '{"query":"What KBLI code for software development company in Indonesia?","user_role":"member"}' \
  "response"

# Test 6: PT PMA Setup
test_endpoint \
  "PT PMA company setup" \
  "/bali-zero/chat" \
  '{"query":"How to set up PT PMA in Indonesia? What are the costs?","user_role":"member"}' \
  "response"

# Test 7: Tax Question (TAX_GENIUS)
test_endpoint \
  "Indonesian tax NPWP" \
  "/bali-zero/chat" \
  '{"query":"How to get NPWP for foreigners in Indonesia?","user_role":"member"}' \
  "response"

# Test 8: Philosophy Query (BOOKS collection)
test_endpoint \
  "Philosophy query (Plato)" \
  "/bali-zero/chat" \
  '{"query":"Explain Plato'\''s theory of Forms","user_role":"member"}' \
  "response"

# Test 9: Pricing Query (Bali Zero)
test_endpoint \
  "Bali Zero pricing 2025" \
  "/bali-zero/chat" \
  '{"query":"Quanto costa un KITAS Investor a Bali Zero nel 2025?","user_role":"member"}' \
  "response"

# Test 10: Complex Multi-Topic Query
test_endpoint \
  "Complex multi-topic query" \
  "/bali-zero/chat" \
  '{"query":"I want to start PT PMA with KBLI software development, get working KITAS for 5 employees, and understand tax obligations. Give me timeline and costs.","user_role":"member"}' \
  "response"

echo ""
echo "📡 TEST SUITE 2: /search (DIRECT SEARCH - MAY BE BROKEN)"
echo "-----------------------------------------------------------"

# Test 11: /search endpoint (Pydantic fix validation)
test_endpoint \
  "/search endpoint (E23 KITAS)" \
  "/search" \
  '{"query":"E23 working KITAS requirements","k":3,"use_llm":true,"user_level":3}' \
  "success"

# Test 12: /search without LLM
test_endpoint \
  "/search without LLM" \
  "/search" \
  '{"query":"investor KITAS 2025","k":5,"use_llm":false,"user_level":3}' \
  "success"

echo ""
echo "📡 TEST SUITE 3: EDGE CASES & STRESS TESTS"
echo "-------------------------------------------"

# Test 13: Empty query
test_endpoint \
  "Empty query handling" \
  "/bali-zero/chat" \
  '{"query":"","user_role":"member"}' \
  "response"

# Test 14: Very long query
test_endpoint \
  "Very long query (100+ words)" \
  "/bali-zero/chat" \
  '{"query":"I am a foreigner living in Bali and I want to start a company in Indonesia that provides software development services and consulting for international clients. I need to understand what KBLI code I should use, how to set up a PT PMA company with proper capital requirements, what visa I can get for myself and my employees, how much will all of this cost, what are the tax obligations, how long will the process take, and what documents do I need to prepare. I also want to know if I can work remotely from Bali while setting this up or if I need to be physically present for all steps. Additionally, I am interested in understanding the legal framework for employing Indonesian nationals versus foreign workers, and whether there are any restrictions on the type of services I can provide as a foreign-owned company in Indonesia.","user_role":"member"}' \
  "response"

# Test 15: Non-English query (Italian)
test_endpoint \
  "Italian language query" \
  "/bali-zero/chat" \
  '{"query":"Come posso ottenere un visto di lavoro per l'\''Indonesia?","user_role":"member"}' \
  "response"

# Test 16: Non-English query (Indonesian)
test_endpoint \
  "Indonesian language query" \
  "/bali-zero/chat" \
  '{"query":"Berapa biaya untuk membuat PT PMA di Indonesia?","user_role":"member"}' \
  "response"

# Test 17: Conversation history (multi-turn)
test_endpoint \
  "Multi-turn conversation" \
  "/bali-zero/chat" \
  '{"query":"And what about the timeline?","conversation_history":[{"role":"user","content":"What is E23 working KITAS?"},{"role":"assistant","content":"E23 is a working permit KITAS for foreign employees in Indonesia..."}],"user_role":"member"}' \
  "response"

# Test 18: Owner role (should get more detailed info)
test_endpoint \
  "Owner role query" \
  "/bali-zero/chat" \
  '{"query":"Show me Bali Zero official prices for KITAS 2025","user_role":"owner","user_email":"antonello@balizero.com"}' \
  "response"

echo ""
echo "📡 TEST SUITE 4: HEALTH & STATUS CHECKS"
echo "----------------------------------------"

# Test 19: Health endpoint
echo -n "Testing: Health check... "
response=$(curl -sS "$RAG_URL/health" 2>&1)
if echo "$response" | jq -e '.status' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
  echo "   Status: $(echo "$response" | jq -r '.status')"
else
  echo -e "${RED}❌ FAIL${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# Test 20: Root endpoint
echo -n "Testing: Root endpoint... "
response=$(curl -sS "$RAG_URL/" 2>&1)
if echo "$response" | jq -e '.version' > /dev/null 2>&1; then
  echo -e "${GREEN}✅ PASS${NC}"
  PASSED=$((PASSED + 1))
  echo "   Version: $(echo "$response" | jq -r '.version')"
else
  echo -e "${RED}❌ FAIL${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

# === SUMMARY ===
echo ""
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
  echo -e "\n${GREEN}✅ ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "\n${YELLOW}⚠️ SOME TESTS FAILED${NC}"
  exit 1
fi
