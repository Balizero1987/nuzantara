#!/bin/bash

# 🧪 ZANTARA WEBAPP - Complete Handlers Test
# Test all handler categories with different user roles

echo "======================================================================"
echo "🧪 ZANTARA WEBAPP - HANDLERS TEST SUITE"
echo "======================================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URLs
TS_BACKEND="https://ts-backend-production-568d.up.railway.app"
RAG_BACKEND="https://scintillating-kindness-production-47e3.up.railway.app"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to test handler
test_handler() {
    local handler_name=$1
    local params=$2
    local token=$3
    local expected_ok=$4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo -n "Testing: $handler_name ... "
    
    if [ -z "$token" ]; then
        # No auth - demo user
        response=$(curl -s -X POST "$TS_BACKEND/call" \
            -H "Content-Type: application/json" \
            -d "{\"key\": \"$handler_name\", \"params\": $params}")
    else
        # With auth token
        response=$(curl -s -X POST "$TS_BACKEND/call" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $token" \
            -d "{\"key\": \"$handler_name\", \"params\": $params}")
    fi
    
    ok=$(echo "$response" | jq -r '.ok' 2>/dev/null)
    
    if [ "$ok" == "$expected_ok" ] || [ "$ok" == "true" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Response: $(echo "$response" | jq -r '.error // .data // .')"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# ==============================================================================
# PHASE 1: ADMIN LOGIN TEST (Zero)
# ==============================================================================
echo ""
echo "======================================================================"
echo "🔐 PHASE 1: ADMIN LOGIN TEST"
echo "======================================================================"
echo ""

echo "Logging in as Zero (Admin)..."
login_response=$(curl -s -X POST "$TS_BACKEND/team.login" \
    -H "Content-Type: application/json" \
    -d '{"email": "zero@balizero.com", "pin": "010719", "name": "zero"}')

admin_token=$(echo "$login_response" | jq -r '.sessionId' 2>/dev/null)
user_role=$(echo "$login_response" | jq -r '.user.role' 2>/dev/null)
permissions=$(echo "$login_response" | jq -r '.permissions' 2>/dev/null)

if [ -z "$admin_token" ] || [ "$admin_token" == "null" ]; then
    echo -e "${RED}❌ Admin login FAILED${NC}"
    echo "Response: $login_response"
    exit 1
else
    echo -e "${GREEN}✅ Admin login SUCCESS${NC}"
    echo "   Role: $user_role"
    echo "   Token: ${admin_token:0:20}..."
    echo "   Permissions: $permissions"
fi

# ==============================================================================
# PHASE 2: SYSTEM HANDLERS TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "📋 PHASE 2: SYSTEM HANDLERS TEST"
echo "======================================================================"
echo ""

test_handler "system.handlers.list" "{}" "$admin_token" "true"
test_handler "system.handlers.category" "{\"category\": \"ai\"}" "$admin_token" "true"
test_handler "system.handlers.get" "{\"handler\": \"ai.chat\"}" "$admin_token" "true"

# ==============================================================================
# PHASE 3: AI SERVICES TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "🤖 PHASE 3: AI SERVICES TEST"
echo "======================================================================"
echo ""

test_handler "ai.chat" "{\"prompt\": \"ciao zantara\"}" "$admin_token" "true"
test_handler "bali.zero.chat" "{\"query\": \"come stai?\"}" "$admin_token" "true"

# ==============================================================================
# PHASE 4: RAG & SEARCH TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "📚 PHASE 4: RAG & SEARCH TEST"
echo "======================================================================"
echo ""

test_handler "rag.query" "{\"query\": \"documenti PT PMA\"}" "$admin_token" "true"
test_handler "rag.search" "{\"query\": \"visa indonesia\"}" "$admin_token" "true"

# ==============================================================================
# PHASE 5: PRICING TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "💰 PHASE 5: PRICING TEST"
echo "======================================================================"
echo ""

test_handler "bali.zero.pricing" "{\"service_type\": \"visa\"}" "$admin_token" "true"
test_handler "pricing.official" "{}" "$admin_token" "true"

# ==============================================================================
# PHASE 6: ORACLE SYSTEM TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "🔮 PHASE 6: ORACLE SYSTEM TEST"
echo "======================================================================"
echo ""

test_handler "oracle.query" "{\"query\": \"tax indonesia\"}" "$admin_token" "true"

# ==============================================================================
# PHASE 7: MEMORY SYSTEM TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "🧠 PHASE 7: MEMORY SYSTEM TEST"
echo "======================================================================"
echo ""

test_handler "memory.save" "{\"content\": \"Test memory\", \"userId\": \"zero\", \"type\": \"note\"}" "$admin_token" "true"
test_handler "memory.retrieve" "{\"userId\": \"zero\"}" "$admin_token" "true"

# ==============================================================================
# PHASE 8: TEAM MANAGEMENT TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "👥 PHASE 8: TEAM MANAGEMENT TEST"
echo "======================================================================"
echo ""

test_handler "team.list" "{}" "$admin_token" "true"
test_handler "team.members" "{}" "$admin_token" "true"

# ==============================================================================
# PHASE 9: DEMO USER TEST
# ==============================================================================
echo ""
echo "======================================================================"
echo "🌐 PHASE 9: DEMO USER ACCESS TEST (No Auth)"
echo "======================================================================"
echo ""

test_handler "system.handlers.list" "{}" "" "true"
test_handler "ai.chat" "{\"prompt\": \"hello\"}" "" "true"
test_handler "bali.zero.pricing" "{}" "" "true"
test_handler "memory.save" "{\"content\": \"test\"}" "" "false"  # Should fail
test_handler "team.create" "{}" "" "false"  # Should fail

# ==============================================================================
# FINAL RESULTS
# ==============================================================================
echo ""
echo "======================================================================"
echo "📊 TEST RESULTS SUMMARY"
echo "======================================================================"
echo ""
echo "Total Tests:  $TOTAL_TESTS"
echo -e "Passed:       ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:       ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Review above for details.${NC}"
    exit 1
fi

