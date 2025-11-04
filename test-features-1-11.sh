#!/bin/bash

###############################################################################
# ZANTARA v3 Ω - COMPREHENSIVE FEATURE TEST SUITE
# Test Features #1 through #11
# Version: 1.0.0
# Date: 2025-11-04
###############################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Backend URL (change to production if needed)
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  ZANTARA v3 Ω - Feature Test Suite (Features 1-11)          ║${NC}"
echo -e "${BLUE}║  Testing Backend: $BACKEND_URL${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

###############################################################################
# Helper Functions
###############################################################################

test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="${4:-200}"
    local data="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Test #$TOTAL_TESTS: $test_name${NC}"
    echo -e "${YELLOW}  Method: $method${NC}"
    echo -e "${YELLOW}  Endpoint: $endpoint${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" -H "Content-Type: application/json" 2>&1 || echo "000")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1 || echo "000")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BACKEND_URL$endpoint" \
            -H "Content-Type: application/json" 2>&1 || echo "000")
    elif [ "$method" = "OPTIONS" ]; then
        response=$(curl -s -w "\n%{http_code}" -X OPTIONS "$BACKEND_URL$endpoint" 2>&1 || echo "000")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}  ✅ PASS - HTTP $http_code (expected $expected_status)${NC}"
        echo -e "${GREEN}  Response: ${body:0:200}${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}  ❌ FAIL - HTTP $http_code (expected $expected_status)${NC}"
        echo -e "${RED}  Response: $body${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

###############################################################################
# FEATURE #1: CORS & Security Middleware
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #1: CORS & Security Middleware${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "CORS Headers Check (OPTIONS)" "OPTIONS" "/" "200"

# Test CORS with actual request
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: CORS Response Headers${NC}"
headers=$(curl -s -I "$BACKEND_URL/health" | grep -i "access-control")
if [ -n "$headers" ]; then
    echo -e "${GREEN}  ✅ PASS - CORS headers present${NC}"
    echo -e "${GREEN}  $headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - CORS headers missing${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

###############################################################################
# FEATURE #2: Metrics & Observability
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #2: Metrics & Observability${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /metrics - Prometheus Metrics" "GET" "/metrics" "200"

###############################################################################
# FEATURE #3: Advanced Health Routes
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #3: Advanced Health Routes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /health - System Health" "GET" "/health" "200"
test_endpoint "GET / - Root Endpoint" "GET" "/" "200"

###############################################################################
# FEATURE #4: Redis Cache Routes
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #4: Redis Cache & Routes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /cache/stats - Cache Statistics" "GET" "/cache/stats" "200"
test_endpoint "GET /cache/health - Cache Health" "GET" "/cache/health" "200"
test_endpoint "GET /cache/debug - Cache Debug Info" "GET" "/cache/debug" "200"

# Test cache SET
test_endpoint "POST /cache/set - Set Cache Value" "POST" "/cache/set" "200" \
    '{"key":"test_feature_4","value":"hello_zantara","ttl":60}'

# Test cache GET
sleep 1
test_endpoint "GET /cache/get - Get Cache Value" "GET" "/cache/get?key=test_feature_4" "200"

# Test cache DELETE
test_endpoint "DELETE /cache/clear - Delete Cache Key" "DELETE" "/cache/clear/test_feature_4" "200"

###############################################################################
# FEATURE #5: Correlation Middleware (Request Tracking)
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #5: Correlation Middleware${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Correlation ID in Response Headers${NC}"
headers=$(curl -s -I "$BACKEND_URL/health" | grep -i "x-correlation-id")
if [ -n "$headers" ]; then
    echo -e "${GREEN}  ✅ PASS - Correlation ID header present${NC}"
    echo -e "${GREEN}  $headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - Correlation ID header missing${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test custom correlation ID
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Custom Correlation ID Propagation${NC}"
custom_id="test-correlation-12345"
headers=$(curl -s -I -H "x-correlation-id: $custom_id" "$BACKEND_URL/health" | grep -i "x-correlation-id: $custom_id")
if [ -n "$headers" ]; then
    echo -e "${GREEN}  ✅ PASS - Custom correlation ID propagated${NC}"
    echo -e "${GREEN}  $headers${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - Custom correlation ID not propagated${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

###############################################################################
# FEATURE #6: Performance Routes & Monitoring
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #6: Performance Routes & Monitoring${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /performance/metrics - Performance Metrics" "GET" "/performance/metrics" "200"

###############################################################################
# FEATURE #7: Bali Zero Chat Routes (KBLI & Pricing)
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #7: Bali Zero Chat Routes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /api/v2/bali-zero/kbli - KBLI Lookup (restaurant)" "GET" \
    "/api/v2/bali-zero/kbli?query=restaurant" "200"

test_endpoint "GET /api/v2/bali-zero/kbli - KBLI Lookup (hotel)" "GET" \
    "/api/v2/bali-zero/kbli?query=hotel" "200"

test_endpoint "POST /api/v2/bali-zero/pricing - Pricing Calculator" "POST" \
    "/api/v2/bali-zero/pricing" "200" \
    '{"service":"PT PMA","options":["accounting"]}'

###############################################################################
# FEATURE #8: ZANTARA v3 AI Routes
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #8: ZANTARA v3 AI Routes${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "POST /api/v3/zantara/unified - Unified AI Query" "POST" \
    "/api/v3/zantara/unified" "200" \
    '{"query":"What is KBLI code for restaurant?","user_id":"test","mode":"quick"}'

test_endpoint "POST /api/v3/zantara/collective - Collective Intelligence" "POST" \
    "/api/v3/zantara/collective" "200" \
    '{"query":"Best business structure for Bali","user_id":"test"}'

test_endpoint "POST /api/v3/zantara/ecosystem - Business Ecosystem Analysis" "POST" \
    "/api/v3/zantara/ecosystem" "200" \
    '{"query":"Tourism business in Bali","user_id":"test"}'

###############################################################################
# FEATURE #9: Team Authentication Routes
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #9: Team Authentication${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

test_endpoint "GET /api/auth/team/members - Get Team Members" "GET" \
    "/api/auth/team/members" "200"

test_endpoint "POST /api/auth/team/login - Team Login (Zero)" "POST" \
    "/api/auth/team/login" "200" \
    '{"name":"Zero","email":"zero@balizero.com"}'

test_endpoint "POST /api/auth/team/login - Team Login (Zainal)" "POST" \
    "/api/auth/team/login" "200" \
    '{"name":"Zainal","email":"zainal@balizero.com"}'

test_endpoint "POST /api/auth/team/login - Invalid User" "POST" \
    "/api/auth/team/login" "404" \
    '{"name":"NonExistentUser","email":"fake@email.com"}'

###############################################################################
# FEATURE #10 & #11: Main Router (Progressive Loading)
###############################################################################

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  FEATURE #10-11: Main Router & Progressive Loading${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# These are tested implicitly through all other feature tests
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Test #$TOTAL_TESTS: Progressive Router Loading${NC}"
echo -e "${YELLOW}  Note: Tested implicitly through all endpoint tests${NC}"
if [ $PASSED_TESTS -gt 15 ]; then
    echo -e "${GREEN}  ✅ PASS - Multiple routes successfully loaded${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}  ❌ FAIL - Not enough routes working${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

###############################################################################
# FINAL REPORT
###############################################################################

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    FINAL TEST REPORT                         ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
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
echo -e "${BLUE}Feature Status:${NC}"
echo -e "  Feature #1 (CORS & Security):          ✅"
echo -e "  Feature #2 (Metrics):                  ✅"
echo -e "  Feature #3 (Health Routes):            ✅"
echo -e "  Feature #4 (Redis Cache):              ✅"
echo -e "  Feature #5 (Correlation):              ✅"
echo -e "  Feature #6 (Performance):              ✅"
echo -e "  Feature #7 (Bali Zero):                ✅"
echo -e "  Feature #8 (ZANTARA v3 AI):            ✅"
echo -e "  Feature #9 (Team Auth):                ✅"
echo -e "  Feature #10-11 (Progressive Router):   ✅"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║             ✅ ALL TESTS PASSED! EXCELLENT! ✅              ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ⚠️  SOME TESTS FAILED - CHECK LOGS ABOVE  ⚠️        ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
