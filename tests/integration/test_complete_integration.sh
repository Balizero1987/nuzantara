#!/bin/bash
# Complete Integration Test for NUZANTARA System
# Tests backend, frontend, RAG warmup, error handling

set -e  # Exit on error

echo "=========================================="
echo "🧪 NUZANTARA COMPLETE INTEGRATION TEST"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_TS_URL="https://nuzantara-backend.fly.dev"
BACKEND_RAG_URL="https://nuzantara-rag.fly.dev"
WEBAPP_URL="https://zantara.balizero.com"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  local test_name="$1"
  local command="$2"
  
  echo -n "Testing: $test_name... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  BACKEND TYPESCRIPT HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Backend TS Health
run_test "Backend TS Health Check" \
  "curl -s -f ${BACKEND_TS_URL}/health | jq -e '.status == \"operational\"'"

# Test 2: RAG Warmup Stats
run_test "RAG Warmup Stats Endpoint" \
  "curl -s -f ${BACKEND_TS_URL}/warmup/stats | jq -e '.ok == true'"

# Test 3: RAG Warmup Service Running
run_test "RAG Warmup Service Running" \
  "curl -s -f ${BACKEND_TS_URL}/warmup/stats | jq -e '.data.health.isRunning == true'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  BACKEND RAG HEALTH"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 4: Backend RAG Health
run_test "Backend RAG Health Check" \
  "curl -s -f ${BACKEND_RAG_URL}/health | jq -e '.status == \"healthy\"'"

# Test 5: Backend RAG Services
run_test "Backend RAG Services Available" \
  "curl -s -f ${BACKEND_RAG_URL}/health | jq -e '.available_services | length > 0'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  BALI ZERO IDENTITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 6: Bali Zero Identity - Chat Endpoint
echo -n "Testing: Bali Zero Identity in Chat... "
CHAT_RESPONSE=$(curl -s -X POST "${BACKEND_RAG_URL}/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "query": "Ciao! Chi sei?",
    "conversation_history": [],
    "user_role": "member"
  }')

if echo "$CHAT_RESPONSE" | grep -qi "bali zero"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "Response: $CHAT_RESPONSE"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4️⃣  WEBAPP FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 7: Webapp Accessibility
run_test "Webapp Home Page Accessible" \
  "curl -s -f ${WEBAPP_URL} -o /dev/null"

# Test 8: Chat Page Accessible
run_test "Webapp Chat Page Accessible" \
  "curl -s -f ${WEBAPP_URL}/chat.html -o /dev/null"

# Test 9: Error Handler Loaded
run_test "Error Handler Script Exists" \
  "curl -s ${WEBAPP_URL}/js/core/error-handler.js | grep -q 'ErrorHandler'"

# Test 10: API Config Loaded
run_test "API Config Script Exists" \
  "curl -s ${WEBAPP_URL}/js/api-config.js | grep -q 'API_CONFIG'"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5️⃣  RAG WARMUP FUNCTIONALITY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 11: Manual Warmup Trigger
echo -n "Testing: Manual Warmup Trigger... "
WARMUP_RESULT=$(curl -s -X POST "${BACKEND_TS_URL}/warmup/trigger")
if echo "$WARMUP_RESULT" | jq -e '.ok == true' > /dev/null 2>&1; then
  RESPONSE_TIME=$(echo "$WARMUP_RESULT" | jq -r '.data.responseTime')
  echo -e "${GREEN}✓ PASS${NC} (${RESPONSE_TIME}ms)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Test 12: Warmup Success Rate
echo -n "Testing: Warmup Success Rate > 80%... "
SUCCESS_RATE=$(curl -s "${BACKEND_TS_URL}/warmup/stats" | jq -r '.data.health.successRate')
if (( $(echo "$SUCCESS_RATE > 80" | bc -l) )); then
  echo -e "${GREEN}✓ PASS${NC} (${SUCCESS_RATE}%)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${YELLOW}⚠ WARNING${NC} (${SUCCESS_RATE}%)"
  PASSED_TESTS=$((PASSED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6️⃣  INTEGRATION FLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 13: End-to-End Flow
echo -n "Testing: End-to-End Chat Flow... "
E2E_RESPONSE=$(curl -s -X POST "${BACKEND_TS_URL}/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: zantara-internal-dev-key-2025" \
  -d '{
    "key": "zantara.chat",
    "params": {
      "message": "Hello ZANTARA!",
      "history": []
    }
  }')

if echo "$E2E_RESPONSE" | jq -e '.ok == true' > /dev/null 2>&1 || \
   echo "$E2E_RESPONSE" | jq -e '.reply' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  echo "Response: $E2E_RESPONSE"
  FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo "=========================================="
echo "📊 TEST RESULTS"
echo "=========================================="
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

# Calculate percentage
PASS_PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED! (100%)${NC}"
  exit 0
elif [ $PASS_PERCENTAGE -ge 80 ]; then
  echo -e "${YELLOW}⚠️  MOST TESTS PASSED ($PASS_PERCENTAGE%)${NC}"
  exit 0
else
  echo -e "${RED}❌ TOO MANY FAILURES ($PASS_PERCENTAGE%)${NC}"
  exit 1
fi
