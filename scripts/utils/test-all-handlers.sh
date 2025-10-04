#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 ZANTARA v5.2.0 - COMPLETE HANDLER TEST SUITE"
echo "================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
SKIPPED=0

test_handler() {
    local name=$1
    local cmd=$2
    local expected=$3
    
    echo -n "Testing $name... "
    result=$(eval "$cmd" 2>&1)
    
    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    elif echo "$result" | grep -q "error\|Error\|failed\|Failed"; then
        echo -e "${RED}❌ FAIL${NC}"
        echo "   Error: $(echo "$result" | jq -r '.error // .message // "Unknown error"' 2>/dev/null || echo "$result" | head -n 1)"
        ((FAILED++))
        return 1
    else
        echo -e "${YELLOW}⚠️  UNEXPECTED${NC}"
        ((FAILED++))
        return 1
    fi
}

skip_handler() {
    local name=$1
    local reason=$2
    echo -e "Skipping $name... ${YELLOW}⏭️  SKIP${NC} ($reason)"
    ((SKIPPED++))
}

echo "📦 1. SYSTEM & HEALTH"
echo "--------------------"
test_handler "health" "curl -s $BASE_URL/health" "healthy"
test_handler "metrics" "curl -s $BASE_URL/metrics" "requests"
test_handler "docs" "curl -s $BASE_URL/docs" "endpoints\|swagger"

echo ""
echo "🧠 2. MEMORY SYSTEM"
echo "-------------------"
test_handler "memory.save" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"memory.save\",\"params\":{\"userId\":\"test\",\"key\":\"test_key\",\"content\":\"test data\"}}'" \
    "ok.*true"

test_handler "memory.search" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"memory.search\",\"params\":{\"query\":\"test\",\"userId\":\"test\"}}'" \
    "ok"

test_handler "memory.retrieve" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"memory.retrieve\",\"params\":{\"key\":\"test_key\"}}'" \
    "ok"

echo ""
echo "🤖 3. AI CORE"
echo "-------------"
test_handler "ai.chat" \
    "curl -s -X POST $BASE_URL/ai.chat -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"prompt\":\"Say hello\"}'" \
    "response"

test_handler "openai.chat" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"openai.chat\",\"params\":{\"prompt\":\"Hi\"}}'" \
    "response"

test_handler "claude.chat" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"claude.chat\",\"params\":{\"prompt\":\"Hi\"}}'" \
    "response\|ok"

test_handler "gemini.chat" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"gemini.chat\",\"params\":{\"prompt\":\"Hi\"}}'" \
    "response\|ok"

test_handler "cohere.chat" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"cohere.chat\",\"params\":{\"prompt\":\"Hi\"}}'" \
    "response\|ok"

echo ""
echo "🧠 4. AI ADVANCED"
echo "-----------------"
test_handler "ai.anticipate" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"ai.anticipate\",\"params\":{\"scenario\":\"test\",\"timeframe\":\"week\"}}'" \
    "ok"

test_handler "ai.learn" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"ai.learn\",\"params\":{\"feedback\":{\"score\":5}}}'" \
    "ok"

test_handler "xai.explain" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"xai.explain\",\"params\":{\"decision\":\"test decision\"}}'" \
    "ok"

echo ""
echo "🔮 5. ORACLE SYSTEM"
echo "-------------------"
test_handler "oracle.simulate" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"oracle.simulate\",\"params\":{\"service\":\"visa\"}}'" \
    "ok\|simulation"

test_handler "oracle.predict" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"oracle.predict\",\"params\":{\"service\":\"visa\",\"timeframe\":\"Q1\"}}'" \
    "ok\|prediction"

test_handler "oracle.analyze" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"oracle.analyze\",\"params\":{\"service\":\"visa\",\"data\":{}}}'" \
    "ok\|analysis"

echo ""
echo "📋 6. ADVISORY SYSTEM"
echo "---------------------"
test_handler "document.prepare" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"document.prepare\",\"params\":{\"service\":\"visa\",\"type\":\"B211A\"}}'" \
    "ok\|documents"

test_handler "assistant.route" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"assistant.route\",\"params\":{\"query\":\"visa help\"}}'" \
    "ok\|route"

echo ""
echo "💼 7. BUSINESS HANDLERS"
echo "-----------------------"
test_handler "contact.info" \
    "curl -s -X GET $BASE_URL/contact.info -H 'x-api-key: $API_KEY'" \
    "Bali Zero"

test_handler "lead.save" \
    "curl -s -X POST $BASE_URL/lead.save -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"name\":\"Test\",\"email\":\"test@test.com\",\"service\":\"visa\"}'" \
    "leadId"

test_handler "quote.generate" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"quote.generate\",\"params\":{\"service\":\"visa\",\"details\":\"B211A\"}}'" \
    "ok\|quote"

test_handler "pricing.official" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"pricing.official\",\"params\":{}}'" \
    "ok\|IDR"

test_handler "team.list" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"team.list\",\"params\":{}}'" \
    "ok\|members"

echo ""
echo "📋 8. KBLI BUSINESS CODES"
echo "-------------------------"
test_handler "kbli.lookup" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"kbli.lookup\",\"params\":{\"query\":\"restaurant\"}}'" \
    "ok\|56101"

test_handler "kbli.requirements" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"kbli.requirements\",\"params\":{\"businessType\":\"restaurant\"}}'" \
    "ok\|requirements"

echo ""
echo "👤 9. IDENTITY SYSTEM"
echo "---------------------"
test_handler "identity.resolve" \
    "curl -s -X POST $BASE_URL/identity.resolve -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"email\":\"zero@balizero.com\"}'" \
    "ok\|collaboratorId"

test_handler "onboarding.start" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"onboarding.ambaradam.start\",\"params\":{\"email\":\"new@test.com\",\"ambaradam_name\":\"Test\"}}'" \
    "ok"

echo ""
echo "🌍 10. TRANSLATION"
echo "------------------"
test_handler "translate.text" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"translate.text\",\"params\":{\"text\":\"Hello\",\"targetLanguage\":\"it\"}}'" \
    "ok\|translatedText"

test_handler "translate.detect" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"translate.detect\",\"params\":{\"text\":\"Ciao\"}}'" \
    "ok\|language"

echo ""
echo "🎨 11. CREATIVE AI"
echo "------------------"
test_handler "language.sentiment" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"language.sentiment\",\"params\":{\"text\":\"Great service\"}}'" \
    "ok\|sentiment"

skip_handler "vision.analyze" "requires image URL"
skip_handler "vision.extract" "requires image data"
skip_handler "speech.transcribe" "requires audio data"
skip_handler "speech.synthesize" "requires text-to-speech processing"

echo ""
echo "🧠 12. ZANTARA INTELLIGENCE"
echo "---------------------------"
test_handler "zantara.personality.profile" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"zantara.personality.profile\",\"params\":{\"collaboratorId\":\"zero\"}}'" \
    "ok\|personality"

test_handler "zantara.attune" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"zantara.attune\",\"params\":{\"collaboratorId\":\"zero\",\"interaction_context\":\"test\"}}'" \
    "ok"

test_handler "zantara.synergy.map" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"zantara.synergy.map\",\"params\":{\"team_members\":[\"zero\",\"zainal\"]}}'" \
    "ok"

test_handler "zantara.mood.sync" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"zantara.mood.sync\",\"params\":{\"team_members\":[\"zero\"]}}'" \
    "ok"

test_handler "zantara.growth.track" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"zantara.growth.track\",\"params\":{\"collaboratorId\":\"zero\"}}'" \
    "ok"

echo ""
echo "💬 13. COMMUNICATION (Config Needed)"
echo "-------------------------------------"
skip_handler "slack.notify" "requires webhook URL"
skip_handler "discord.notify" "requires webhook URL"
skip_handler "googlechat.notify" "requires webhook URL"

echo ""
echo "📄 14. GOOGLE WORKSPACE (Domain Delegation Needed)"
echo "---------------------------------------------------"
test_handler "sheets.create" \
    "curl -s -X POST $BASE_URL/call -H 'x-api-key: $API_KEY' -H 'Content-Type: application/json' -d '{\"key\":\"sheets.create\",\"params\":{\"title\":\"Test Sheet\"}}'" \
    "ok\|spreadsheetId"

skip_handler "drive.list" "requires domain delegation"
skip_handler "calendar.list" "requires domain delegation"
skip_handler "gmail.send" "requires domain delegation"

echo ""
echo "================================================"
echo "📊 TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}"
echo -e "${RED}❌ FAILED: $FAILED${NC}"
echo -e "${YELLOW}⏭️  SKIPPED: $SKIPPED${NC}"
echo "TOTAL: $((PASSED + FAILED + SKIPPED))"
echo ""
SUCCESS_RATE=$((PASSED * 100 / (PASSED + FAILED)))
echo "Success Rate: ${SUCCESS_RATE}% (of testable handlers)"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check errors above.${NC}"
    exit 1
fi
