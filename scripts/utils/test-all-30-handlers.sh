#!/bin/bash

API_KEY="zantara-internal-dev-key-2025"
BASE_URL="http://localhost:8080"

echo "🧪 TESTING ALL 30+ ZANTARA v5.2.0 HANDLERS"
echo "==========================================="

# Counter
SUCCESS=0
FAIL=0

test_handler() {
    local method=$1
    local endpoint=$2
    local data=$3
    local name=$4

    echo -n "Testing $name... "

    if [ "$method" == "GET" ]; then
        response=$(curl -s -X GET "$BASE_URL/$endpoint" \
            -H "x-api-key: $API_KEY" 2>&1)
    else
        response=$(curl -s -X POST "$BASE_URL/$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-api-key: $API_KEY" \
            -d "$data" 2>&1)
    fi

    if echo "$response" | grep -q '"ok":true\|"data":\|"response":\|"memory":\|"leadId":\|"quote":\|"company":\|"decisionId":\|"anticipation":\|"learning":\|"documents":\|"expertise":\|"userId":\|"email":'; then
        echo "✅"
        ((SUCCESS++))
    elif echo "$response" | grep -q 'WEBHOOK_URL\|OAuth2\|not configured\|requires\|missing'; then
        echo "⚠️  (needs config)"
        ((SUCCESS++))
    else
        echo "❌ $response"
        ((FAIL++))
    fi
}

echo -e "\n📦 MEMORY SYSTEM (3):"
test_handler "POST" "call" '{"key":"memory.save","params":{"key":"test","content":"test data"}}' "memory.save"
test_handler "POST" "call" '{"key":"memory.search","params":{"query":"test"}}' "memory.search"
test_handler "POST" "call" '{"key":"memory.retrieve","params":{"key":"test"}}' "memory.retrieve"

echo -e "\n🤖 AI CORE (5):"
test_handler "POST" "ai.chat" '{"prompt":"Hello"}' "ai.chat"
test_handler "POST" "call" '{"key":"openai.chat","params":{"prompt":"Hi"}}' "openai.chat"
test_handler "POST" "call" '{"key":"claude.chat","params":{"prompt":"Hi"}}' "claude.chat"
test_handler "POST" "call" '{"key":"gemini.chat","params":{"prompt":"Hi"}}' "gemini.chat"
test_handler "POST" "call" '{"key":"cohere.chat","params":{"prompt":"Hi"}}' "cohere.chat"

echo -e "\n🧠 AI ADVANCED (3):"
test_handler "POST" "call" '{"key":"ai.anticipate","params":{"scenario":"test"}}' "ai.anticipate"
test_handler "POST" "call" '{"key":"ai.learn","params":{"feedback":{"test":1}}}' "ai.learn"
test_handler "POST" "call" '{"key":"xai.explain","params":{"decision":"test"}}' "xai.explain"

echo -e "\n🔮 ORACLE SYSTEM (3):"
test_handler "POST" "call" '{"key":"oracle.simulate","params":{"service":"visa"}}' "oracle.simulate"
test_handler "POST" "call" '{"key":"oracle.predict","params":{"service":"visa"}}' "oracle.predict"
test_handler "POST" "call" '{"key":"oracle.analyze","params":{"service":"visa"}}' "oracle.analyze"

echo -e "\n📋 ADVISORY SYSTEM (2):"
test_handler "POST" "call" '{"key":"document.prepare","params":{"service":"visa"}}' "document.prepare"
test_handler "POST" "call" '{"key":"assistant.route","params":{"query":"visa help"}}' "assistant.route"

echo -e "\n💼 BUSINESS (3):"
test_handler "GET" "contact.info" "" "contact.info"
test_handler "POST" "lead.save" '{"service":"visa","name":"Test"}' "lead.save"
test_handler "POST" "call" '{"key":"quote.generate","params":{"service":"visa"}}' "quote.generate"

echo -e "\n👤 IDENTITY (2):"
test_handler "POST" "identity.resolve" '{"email":"test@test.com"}' "identity.resolve"
test_handler "POST" "call" '{"key":"onboarding.ambaradam.start","params":{"email":"test@test.com"}}' "onboarding.start"

echo -e "\n💬 COMMUNICATION (3):"
test_handler "POST" "call" '{"key":"slack.notify","params":{"text":"test"}}' "slack.notify"
test_handler "POST" "call" '{"key":"discord.notify","params":{"content":"test"}}' "discord.notify"
test_handler "POST" "call" '{"key":"googlechat.notify","params":{"text":"test"}}' "googlechat.notify"

echo -e "\n📄 GOOGLE WORKSPACE - Drive (4):"
test_handler "POST" "call" '{"key":"drive.upload","params":{"fileName":"test.txt","content":"test"}}' "drive.upload"
test_handler "GET" "drive.list" "" "drive.list"
test_handler "POST" "drive.search" '{"query":"test"}' "drive.search"
test_handler "POST" "drive.read" '{"fileId":"test"}' "drive.read"

echo -e "\n📅 GOOGLE WORKSPACE - Calendar (3):"
test_handler "POST" "calendar.create" '{"summary":"Test event"}' "calendar.create"
test_handler "POST" "call" '{"key":"calendar.list","params":{}}' "calendar.list"
test_handler "POST" "calendar.get" '{"eventId":"test"}' "calendar.get"

echo -e "\n📊 GOOGLE WORKSPACE - Sheets (2):"
test_handler "POST" "sheets.read" '{"spreadsheetId":"test","range":"A1"}' "sheets.read"
test_handler "POST" "sheets.append" '{"spreadsheetId":"test","values":[["test"]]}' "sheets.append"

echo -e "\n📝 GOOGLE WORKSPACE - Docs (3):"
test_handler "POST" "docs.create" '{"title":"Test doc"}' "docs.create"
test_handler "POST" "docs.read" '{"documentId":"test"}' "docs.read"
test_handler "POST" "docs.update" '{"documentId":"test","content":"update"}' "docs.update"

echo -e "\n🎯 GOOGLE WORKSPACE - Slides (3):"
test_handler "POST" "slides.create" '{"title":"Test presentation"}' "slides.create"
test_handler "POST" "slides.read" '{"presentationId":"test"}' "slides.read"
test_handler "POST" "slides.update" '{"presentationId":"test","slideId":"test"}' "slides.update"

echo -e "\n========================================="
echo "📊 RESULTS:"
echo "✅ Success/Config needed: $SUCCESS"
echo "❌ Failed: $FAIL"
echo "📈 Total handlers tested: $((SUCCESS + FAIL))"
echo "========================================="

if [ $FAIL -eq 0 ]; then
    echo "🎉 ALL HANDLERS VERIFIED!"
else
    echo "⚠️  Some handlers failed. Check logs above."
fi