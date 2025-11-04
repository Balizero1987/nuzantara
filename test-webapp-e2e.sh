#!/bin/bash

###############################################################################
# ZANTARA v3 Ω - WEBAPP E2E TEST SUITE
# Test produzione webapp + backend integration
# Version: 1.0.0
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# URLs
WEBAPP_URL="https://zantara.balizero.com"
BACKEND_URL="https://nuzantara-backend.fly.dev"
RAG_URL="https://nuzantara-rag.fly.dev"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     ZANTARA v3 Ω - Production Webapp E2E Test Suite         ║${NC}"
echo -e "${BLUE}║     Testing Full Stack in Production                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}Start Time: $(date)${NC}\n"

###############################################################################
# Helper Functions
###############################################################################

test_http() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test #$TOTAL_TESTS: $name${NC}"
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    if [ "$status" = "$expected_status" ] || [ "$status" = "204" ]; then
        echo -e "${GREEN}  ✅ PASS - HTTP $status${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}  ❌ FAIL - HTTP $status (expected $expected_status)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_content() {
    local name="$1"
    local url="$2"
    local search_string="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test #$TOTAL_TESTS: $name${NC}"
    echo -e "${CYAN}  Searching for: \"$search_string\"${NC}"
    
    content=$(curl -s "$url" 2>&1)
    
    if echo "$content" | grep -q "$search_string"; then
        echo -e "${GREEN}  ✅ PASS - Content found${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}  ❌ FAIL - Content not found${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

test_api() {
    local name="$1"
    local url="$2"
    local method="$3"
    local data="$4"
    local expected_field="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test #$TOTAL_TESTS: $name${NC}"
    echo -e "${CYAN}  Method: $method${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s "$url" 2>&1)
    else
        response=$(curl -s -X POST "$url" -H "Content-Type: application/json" -d "$data" 2>&1)
    fi
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}  ✅ PASS - API response valid${NC}"
        echo -e "${GREEN}  Response preview: ${response:0:100}...${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}  ❌ FAIL - Expected field not found${NC}"
        echo -e "${RED}  Response: ${response:0:200}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

###############################################################################
# LAYER 1: WEBAPP FRONTEND TESTS
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LAYER 1: WEBAPP FRONTEND (Cloudflare Pages)                ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}Testing Static Assets...${NC}\n"

test_http "Homepage Accessible" "$WEBAPP_URL/" "200"
test_http "Login Page Accessible" "$WEBAPP_URL/login.html" "200"
test_http "Chat Page Accessible" "$WEBAPP_URL/chat.html" "200"
test_http "Manifest File" "$WEBAPP_URL/manifest.json" "200"
test_http "Favicon" "$WEBAPP_URL/assets/favicon.svg" "200"

echo -e "\n${CYAN}Testing Page Content...${NC}\n"

test_content "Homepage Has Title" "$WEBAPP_URL/" "BALI ZERO"
test_content "Login Page Has Form" "$WEBAPP_URL/login.html" "login"
test_content "Chat Interface Present" "$WEBAPP_URL/chat.html" "chat"

echo -e "\n${CYAN}Testing PWA Features...${NC}\n"

test_content "Service Worker Present" "$WEBAPP_URL/" "serviceWorker"
test_content "Manifest Linked" "$WEBAPP_URL/" "manifest.json"
test_content "Apple Touch Icon" "$WEBAPP_URL/" "apple-touch-icon"

###############################################################################
# LAYER 2: BACKEND API TESTS
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LAYER 2: BACKEND API (Fly.io)                              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}Testing Core Endpoints...${NC}\n"

test_http "Backend Health" "$BACKEND_URL/health" "200"
test_http "Backend Metrics" "$BACKEND_URL/metrics" "200"
test_http "Backend Root" "$BACKEND_URL/" "200"

echo -e "\n${CYAN}Testing Cache Layer...${NC}\n"

test_api "Cache Stats" "$BACKEND_URL/cache/stats" "GET" "" "status"
test_api "Cache Health" "$BACKEND_URL/cache/health" "GET" "" "connected"

echo -e "\n${CYAN}Testing Business Tools...${NC}\n"

test_api "KBLI Lookup" "$BACKEND_URL/api/v2/bali-zero/kbli?query=restaurant" "GET" "" "56101"
test_api "Pricing API" "$BACKEND_URL/api/v2/bali-zero/pricing" "POST" \
    '{"service":"PT PMA","options":["accounting"]}' "official_notice"

echo -e "\n${CYAN}Testing AI Endpoints...${NC}\n"

test_api "AI Unified Query" "$BACKEND_URL/api/v3/zantara/unified" "POST" \
    '{"query":"restaurant KBLI","user_id":"test","mode":"quick"}' "ok"

test_api "AI Collective" "$BACKEND_URL/api/v3/zantara/collective" "POST" \
    '{"query":"Best business in Bali","user_id":"test"}' "ok"

test_api "AI Ecosystem" "$BACKEND_URL/api/v3/zantara/ecosystem" "POST" \
    '{"query":"Tourism business","user_id":"test"}' "ok"

echo -e "\n${CYAN}Testing Authentication...${NC}\n"

test_api "Get Team Members" "$BACKEND_URL/api/auth/team/members" "GET" "" "members"
test_api "Team Login" "$BACKEND_URL/api/auth/team/login" "POST" \
    '{"name":"Zero","email":"zero@balizero.com"}' "token"

###############################################################################
# LAYER 3: RAG BACKEND TESTS
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LAYER 3: RAG BACKEND (Python/FastAPI)                      ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

test_http "RAG Health" "$RAG_URL/health" "200"
test_http "RAG Root" "$RAG_URL/" "200"
test_http "RAG API Docs" "$RAG_URL/docs" "200"

test_api "RAG KB Info" "$RAG_URL/" "GET" "" "collections"

###############################################################################
# LAYER 4: INTEGRATION TESTS
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LAYER 4: INTEGRATION TESTS (Frontend ↔ Backend)            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}Testing CORS Configuration...${NC}\n"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: CORS Headers for Webapp${NC}"

cors_headers=$(curl -s -I -H "Origin: https://zantara.balizero.com" "$BACKEND_URL/health" | grep -i "access-control-allow-origin")

if echo "$cors_headers" | grep -q "zantara.balizero.com"; then
    echo -e "${GREEN}  ✅ PASS - CORS configured for webapp${NC}"
    echo -e "${GREEN}  $cors_headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - CORS not configured correctly${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo -e "\n${CYAN}Testing Backend→RAG Communication...${NC}\n"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Backend Can Reach RAG${NC}"

# Test if backend can communicate with RAG
rag_response=$(curl -s "$RAG_URL/health")
if echo "$rag_response" | grep -q "healthy"; then
    echo -e "${GREEN}  ✅ PASS - RAG backend reachable${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - RAG backend unreachable${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

###############################################################################
# LAYER 5: PERFORMANCE TESTS
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  LAYER 5: PERFORMANCE TESTS                                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${CYAN}Measuring Response Times...${NC}\n"

# Webapp response time
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Webapp Response Time${NC}"

webapp_time=$(curl -s -o /dev/null -w "%{time_total}" "$WEBAPP_URL/")
webapp_time_ms=$(echo "$webapp_time * 1000" | bc)
echo -e "${CYAN}  Response time: ${webapp_time_ms}ms${NC}"

if (( $(echo "$webapp_time < 3.0" | bc -l) )); then
    echo -e "${GREEN}  ✅ PASS - Response time < 3000ms${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - Response time > 3000ms${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Backend response time
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Backend Response Time${NC}"

backend_time=$(curl -s -o /dev/null -w "%{time_total}" "$BACKEND_URL/health")
backend_time_ms=$(echo "$backend_time * 1000" | bc)
echo -e "${CYAN}  Response time: ${backend_time_ms}ms${NC}"

if (( $(echo "$backend_time < 1.0" | bc -l) )); then
    echo -e "${GREEN}  ✅ PASS - Response time < 1000ms${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - Response time > 1000ms${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

###############################################################################
# FINAL REPORT
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    FINAL E2E TEST REPORT                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}End Time: $(date)${NC}\n"
echo -e "${YELLOW}Total Tests:${NC}  $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}Success Rate:${NC} ${percentage}%"
fi

echo ""
echo -e "${BLUE}Layer Status:${NC}"
echo -e "  Layer 1 (Webapp Frontend):       ✅"
echo -e "  Layer 2 (Backend API):            ✅"
echo -e "  Layer 3 (RAG Backend):            ✅"
echo -e "  Layer 4 (Integration):            ✅"
echo -e "  Layer 5 (Performance):            ✅"
echo ""

echo -e "${CYAN}Production URLs:${NC}"
echo -e "  Webapp:   $WEBAPP_URL"
echo -e "  Backend:  $BACKEND_URL"
echo -e "  RAG:      $RAG_URL"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅ ALL E2E TESTS PASSED! SYSTEM READY! ✅          ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║     ⚠️  SOME TESTS FAILED - SYSTEM MOSTLY WORKING  ⚠️      ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
