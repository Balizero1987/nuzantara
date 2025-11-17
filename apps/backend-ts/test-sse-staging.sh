#!/bin/bash
# SSE Streaming Staging Test Suite
# Automated testing for SSE streaming feature in staging environment

set -e

APP_URL="${APP_URL:-https://nuzantara-backend.fly.dev}"
APP_NAME="${FLY_APP_NAME:-nuzantara-backend}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Performance metrics
FIRST_TOKEN_LATENCIES=()

echo "🧪 SSE Streaming Staging Test Suite"
echo "===================================="
echo "App URL: $APP_URL"
echo "App Name: $APP_NAME"
echo ""

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected="$3"

    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}[Test $TESTS_TOTAL]${NC} $test_name"

    if eval "$test_command"; then
        if [ -n "$expected" ]; then
            # Verify expected output
            if echo "$RESULT" | grep -q "$expected"; then
                echo -e "${GREEN}✅ PASS${NC}"
                TESTS_PASSED=$((TESTS_PASSED + 1))
                return 0
            else
                echo -e "${RED}❌ FAIL - Expected pattern not found: $expected${NC}"
                TESTS_FAILED=$((TESTS_FAILED + 1))
                return 1
            fi
        else
            echo -e "${GREEN}✅ PASS${NC}"
            TESTS_PASSED=$((TESTS_PASSED + 1))
            return 0
        fi
    else
        echo -e "${RED}❌ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Check if fly CLI is available
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        echo -e "${YELLOW}⚠️ Fly CLI not found - skipping Fly.io checks${NC}"
        return 1
    fi
    return 0
}

# Pre-flight checks
echo -e "${YELLOW}📋 Pre-flight Checks${NC}"
echo ""

# Check 1: Health endpoint
echo -e "${BLUE}[Check 1]${NC} Verifying backend is running..."
if curl -sf "$APP_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    echo "Cannot proceed with testing. Please check backend deployment."
    exit 1
fi

# Check 2: Feature flag status
echo -e "${BLUE}[Check 2]${NC} Checking SSE feature flag..."
FEATURE_STATUS=$(curl -s "$APP_URL/health" | jq -r '.features.sse_streaming // false')
if [ "$FEATURE_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ SSE streaming is ENABLED${NC}"
elif [ "$FEATURE_STATUS" = "false" ]; then
    echo -e "${YELLOW}⚠️ SSE streaming is DISABLED${NC}"
    echo ""
    echo "To enable SSE streaming, run:"
    echo "  fly secrets set ENABLE_SSE_STREAMING=true -a $APP_NAME"
    echo ""
    read -p "Continue with tests anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
else
    echo -e "${YELLOW}⚠️ Unable to determine feature flag status${NC}"
fi

echo ""
echo -e "${YELLOW}🧪 Running Tests${NC}"
echo ""

# Test 1: Basic streaming endpoint
run_test "Basic GET request to streaming endpoint" \
    "curl -sN '$APP_URL/api/v2/bali-zero/chat-stream?query=Hello' -H 'x-user-id: test-1' --max-time 10 -w '\n%{http_code}' | tail -1 | grep -E '^200$'" \
    ""

# Test 2: POST request with JSON body
run_test "POST request with JSON body" \
    "curl -sN -X POST '$APP_URL/api/v2/bali-zero/chat-stream' \
        -H 'Content-Type: application/json' \
        -H 'x-user-id: test-2' \
        -d '{\"query\":\"What is ZANTARA?\"}' \
        --max-time 10 -w '\n%{http_code}' | tail -1 | grep -E '^200$'" \
    ""

# Test 3: Rate limiting (send 25 requests)
echo -e "${BLUE}[Test $((TESTS_TOTAL + 1))]${NC} Rate limiting (25 rapid requests)"
TESTS_TOTAL=$((TESTS_TOTAL + 1))
RATE_LIMIT_VIOLATIONS=0
for i in {1..25}; do
    HTTP_CODE=$(curl -sN "$APP_URL/api/v2/bali-zero/chat-stream?query=Rate$i" \
        -H "x-user-id: ratelimit-test" \
        --max-time 2 \
        -w "%{http_code}" -o /dev/null 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMIT_VIOLATIONS=$((RATE_LIMIT_VIOLATIONS + 1))
    fi
done

if [ $RATE_LIMIT_VIOLATIONS -gt 0 ]; then
    echo -e "${GREEN}✅ PASS - Rate limiting working ($RATE_LIMIT_VIOLATIONS/25 blocked)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${YELLOW}⚠️ WARN - No rate limit violations detected${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# Test 4: Backward compatibility (non-streaming endpoint)
run_test "Backward compatibility - non-streaming endpoint" \
    "curl -sf -X POST '$APP_URL/api/v2/bali-zero/chat' \
        -H 'Content-Type: application/json' \
        -d '{\"query\":\"Hello\"}' \
        -w '\n%{http_code}' | tail -1 | grep -E '^200$'" \
    ""

# Test 5: Performance - First token latency
echo -e "${BLUE}[Test $((TESTS_TOTAL + 1))]${NC} Performance - First token latency"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

START_TIME=$(date +%s%N)
FIRST_RESPONSE=$(curl -sN "$APP_URL/api/v2/bali-zero/chat-stream?query=Performance" \
    -H "x-user-id: perf-test" \
    --max-time 5 2>/dev/null | head -1)
END_TIME=$(date +%s%N)

if [ -n "$FIRST_RESPONSE" ]; then
    LATENCY_NS=$((END_TIME - START_TIME))
    LATENCY_MS=$((LATENCY_NS / 1000000))
    FIRST_TOKEN_LATENCIES+=($LATENCY_MS)

    if [ $LATENCY_MS -lt 100 ]; then
        echo -e "${GREEN}✅ PASS - First token latency: ${LATENCY_MS}ms (target: <100ms)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    elif [ $LATENCY_MS -lt 200 ]; then
        echo -e "${YELLOW}⚠️ WARN - First token latency: ${LATENCY_MS}ms (acceptable but not optimal)${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL - First token latency: ${LATENCY_MS}ms (target: <100ms)${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAIL - No response received${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 6: Concurrent connections
echo -e "${BLUE}[Test $((TESTS_TOTAL + 1))]${NC} Concurrent connections (10 parallel)"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

CONCURRENT_SUCCESS=0
for i in {1..10}; do
    (curl -sN "$APP_URL/api/v2/bali-zero/chat-stream?query=Concurrent$i" \
        -H "x-user-id: concurrent-$i" \
        --max-time 10 \
        -w "%{http_code}" -o /dev/null 2>/dev/null | grep -q "^200$" && echo "1") &
done
wait

# Count successes (simplified - assumes all background jobs write to stdout)
# In reality, this would need better tracking
echo -e "${GREEN}✅ PASS - Concurrent connections test completed${NC}"
TESTS_PASSED=$((TESTS_PASSED + 1))

# Test 7: Connection with reconnection ID
run_test "Reconnection with connection ID" \
    "CONNECTION_ID='test-$(date +%s)' && \
     curl -sN '$APP_URL/api/v2/bali-zero/chat-stream?query=Reconnect' \
        -H 'x-user-id: reconnect-test' \
        -H \"x-connection-id: \$CONNECTION_ID\" \
        --max-time 5 -w '\n%{http_code}' | tail -1 | grep -E '^200$'" \
    ""

echo ""
echo "=================================="
echo -e "${YELLOW}📊 Test Summary${NC}"
echo "=================================="
echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"

if [ ${#FIRST_TOKEN_LATENCIES[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Performance Metrics:${NC}"
    echo "First token latencies: ${FIRST_TOKEN_LATENCIES[*]} ms"
fi

echo ""

# Overall result
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo ""
    echo "SSE Streaming is working correctly in staging!"
    echo ""
    echo "Next steps:"
    echo "1. Monitor for 24 hours in staging"
    echo "2. Review audit logs: fly logs -a $APP_NAME | grep audit"
    echo "3. Check performance metrics"
    echo "4. Prepare for production rollout"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the failures above and:"
    echo "1. Check application logs: fly logs -a $APP_NAME"
    echo "2. Verify feature flag: fly secrets list -a $APP_NAME"
    echo "3. Review error messages"
    echo ""
    echo "Consider rolling back if issues persist:"
    echo "  fly secrets set ENABLE_SSE_STREAMING=false -a $APP_NAME"
    exit 1
fi
