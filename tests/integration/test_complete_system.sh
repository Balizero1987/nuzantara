#!/bin/bash

# ZANTARA Complete System Test
# Tests backend-frontend integration and Bali Zero identity

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 ZANTARA COMPLETE SYSTEM TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper function
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>&1)
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected: $expected"
        first_100=$(echo "$response" | head -c 100)
        echo "  Got: $first_100"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

test_json_endpoint() {
    local name="$1"
    local url="$2"
    local expected_field="$3"
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url" 2>&1)
    
    if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "  Expected field: $expected_field"
        echo "  Got: ${response:0:100}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}1. Frontend Tests${NC}"
echo "───────────────────────────────────────────────────────────"

test_endpoint "Webapp Homepage" "https://zantara.balizero.com" "ZANTARA"
test_endpoint "Webapp Login Page" "https://zantara.balizero.com/login.html" "BALI ZERO"
test_endpoint "Webapp Chat Page" "https://zantara.balizero.com/chat.html" "ZANTARA"
test_endpoint "PWA Manifest" "https://zantara.balizero.com/manifest.json" "ZANTARA"

echo ""

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}2. Backend TypeScript Tests${NC}"
echo "───────────────────────────────────────────────────────────"

test_json_endpoint "Backend Health" "https://ts-backend-production-568d.up.railway.app/health" "status"
test_json_endpoint "RAG Warmup Stats" "https://ts-backend-production-568d.up.railway.app/warmup/stats" "ok"

echo ""

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}3. Backend RAG Tests${NC}"
echo "───────────────────────────────────────────────────────────"

test_json_endpoint "RAG Health" "https://scintillating-kindness-production-47e3.up.railway.app/health" "status"
test_json_endpoint "RAG AI Services" "https://scintillating-kindness-production-47e3.up.railway.app/health" "ai"

echo ""

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}4. Bali Zero Identity Test${NC}"
echo "───────────────────────────────────────────────────────────"

echo -n "Testing Bali Zero Identity... "

# Test che ZANTARA menzioni Bali Zero nella risposta
response=$(curl -s -X POST "https://ts-backend-production-568d.up.railway.app/call" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "chat.send",
    "params": {
      "message": "Ciao! Chi sei?",
      "user_id": "test_user_123"
    }
  }' 2>&1)

if echo "$response" | grep -qi "bali zero"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "  Response contains 'Bali Zero' ✓"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response does NOT mention 'Bali Zero'"
    echo "  Got: ${response:0:200}"
    FAILED=$((FAILED + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}5. Core Features Test${NC}"
echo "───────────────────────────────────────────────────────────"

echo -n "Testing Cache Manager... "
if curl -s "https://zantara.balizero.com/js/core/cache-manager.js" | grep -q "CacheManager"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing WebSocket Manager... "
if curl -s "https://zantara.balizero.com/js/core/websocket-manager.js" | grep -q "WebSocketManager"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing Error Handler... "
if curl -s "https://zantara.balizero.com/js/core/error-handler.js" | grep -q "ZANTARA_ERROR_HANDLER"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing PWA Installer... "
if curl -s "https://zantara.balizero.com/js/core/pwa-installer.js" | grep -q "PWAInstaller"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo -n "Testing Service Worker... "
if curl -s "https://zantara.balizero.com/service-worker.js" | grep -q "CACHE_VERSION"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ FAILED${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
echo -e "${BLUE}6. Performance Monitoring${NC}"
echo "───────────────────────────────────────────────────────────"

# RAG Backend response time
echo -n "RAG Backend Response Time... "
if curl -s --max-time 5 "https://scintillating-kindness-production-47e3.up.railway.app/health" > /dev/null; then
    echo -e "${GREEN}✓ Fast${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Slow or timeout${NC}"
    FAILED=$((FAILED + 1))
fi

# TS Backend response time
echo -n "TS Backend Response Time... "
if curl -s --max-time 5 "https://ts-backend-production-568d.up.railway.app/health" > /dev/null; then
    echo -e "${GREEN}✓ Fast${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ Slow or timeout${NC}"
    FAILED=$((FAILED + 1))
fi

echo ""

# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 TEST RESULTS${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo ""
    echo "System Status: HEALTHY ✓"
    echo "Bali Zero Identity: VERIFIED ✓"
    echo "Core Features: WORKING ✓"
    echo "Performance: OPTIMAL ✓"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please check the failed tests above and fix the issues."
    exit 1
fi
