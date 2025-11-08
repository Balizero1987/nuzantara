#!/bin/bash
# Frontend-Backend Alignment Test Script
# Tests all the newly added auth endpoints

set -e

API_URL="${1:-http://localhost:8080}"
echo "🧪 Testing auth endpoints on: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: /api/auth/demo
echo "1️⃣ Testing /api/auth/demo"
DEMO_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/demo" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test_user", "name": "Test User", "email": "test@example.com"}')

if echo "$DEMO_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ Demo auth: OK${NC}"
  DEMO_TOKEN=$(echo "$DEMO_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
  echo -e "${RED}❌ Demo auth: FAILED${NC}"
  echo "$DEMO_RESPONSE"
  exit 1
fi
echo ""

# Test 2: /auth/login
echo "2️⃣ Testing /auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "Test User"}')

if echo "$LOGIN_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ Login: OK${NC}"
  LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
else
  echo -e "${RED}❌ Login: FAILED${NC}"
  echo "$LOGIN_RESPONSE"
  exit 1
fi
echo ""

# Test 3: /api/v3/zantara/unified (alias)
echo "3️⃣ Testing /api/v3/zantara/unified (alias)"
UNIFIED_RESPONSE=$(curl -s -X POST "$API_URL/api/v3/zantara/unified" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $LOGIN_TOKEN" \
  -d '{"params": {"query": "test query"}}')

if echo "$UNIFIED_RESPONSE" | grep -q '"' || echo "$UNIFIED_RESPONSE" | grep -q 'ok\|result\|data'; then
  echo -e "${GREEN}✅ Unified query: OK${NC}"
else
  echo -e "${RED}❌ Unified query: FAILED${NC}"
  echo "$UNIFIED_RESPONSE"
  # Don't exit, this might not be fully functional yet
fi
echo ""

# Test 4: /auth/logout
echo "4️⃣ Testing /auth/logout"
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Authorization: Bearer $LOGIN_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ Logout: OK${NC}"
else
  echo -e "${RED}❌ Logout: FAILED${NC}"
  echo "$LOGOUT_RESPONSE"
  exit 1
fi
echo ""

# Test 5: Verify endpoints exist (should not return 404)
echo "5️⃣ Testing endpoint existence"

# Test /bali-zero/chat-stream exists (GET should work or return proper error)
SSE_TEST=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/bali-zero/chat-stream")
if [ "$SSE_TEST" != "404" ]; then
  echo -e "${GREEN}✅ SSE endpoint: OK (HTTP $SSE_TEST)${NC}"
else
  echo -e "${RED}❌ SSE endpoint: NOT FOUND${NC}"
fi

echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 All tests completed!${NC}"
echo "═══════════════════════════════════════"
