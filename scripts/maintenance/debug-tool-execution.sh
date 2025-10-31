#!/bin/bash

echo "======================================================================"
echo "🔧 DEBUG TOOL EXECUTION - COMPLETE DIAGNOSTIC"
echo "======================================================================"
echo ""

# Test 1: Health Check
echo "🏥 TEST 1: Backend Health"
echo "-----------------------------------"
HEALTH=$(curl -s "https://nuzantara-rag.fly.dev/health")
echo "Status: $(echo $HEALTH | jq -r '.status // "Unknown"')"
echo ""

# Test 2: Tool Executor Status
echo "🔧 TEST 2: Tool Executor Status"
echo "-----------------------------------"
echo "Tool Executor: $(echo $HEALTH | jq -r '.tool_executor_status // "Not available"')"
echo "Zantara Tools: $(echo $HEALTH | jq -r '.zantara_tools_status // "Not available"')"
echo ""

# Test 3: Available Tools
echo "🛠️ TEST 3: Available Tools"
echo "-----------------------------------"
TOOLS=$(curl -s "https://nuzantara-rag.fly.dev/api/tools")
if [ "$TOOLS" != "null" ] && [ "$TOOLS" != "" ]; then
    echo "Total tools: $(echo $TOOLS | jq -r '.tools | length // 0')"
    echo "Pricing tools: $(echo $TOOLS | jq -r '.tools[] | select(.name | contains("pricing")) | .name' | wc -l)"
    echo "get_pricing tool: $(echo $TOOLS | jq -r '.tools[] | select(.name == "get_pricing") | .name // "NOT FOUND"')"
else
    echo "❌ Tools endpoint not available"
fi
echo ""

# Test 4: Tool Execution Test
echo "🧪 TEST 4: Tool Execution Test"
echo "-----------------------------------"
echo "Testing get_pricing tool execution..."
RESULT=$(curl -X POST "https://nuzantara-rag.fly.dev/bali-zero/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(curl -X POST "https://nuzantara-backend.fly.dev/team.login" -H "Content-Type: application/json" -d '{"email": "zero@balizero.com", "pin": "010719", "name": "Zero"}' -s | jq -r '.token')" \
  -d '{"query": "Usa il tool get_pricing per darmi il prezzo KITAS E23", "user_email": "zero@balizero.com", "user_role": "member"}' \
  -s | jq -r '.response' | head -3)

echo "Response: $RESULT"
echo ""

# Test 5: System Analysis
echo "📊 TEST 5: System Analysis"
echo "-----------------------------------"
echo "✅ Services initialized:"
echo "  - PricingService: $(echo $HEALTH | jq -r '.pricing_service_status // "Unknown"')"
echo "  - ZantaraTools: $(echo $HEALTH | jq -r '.zantara_tools_status // "Unknown"')"
echo "  - ToolExecutor: $(echo $HEALTH | jq -r '.tool_executor_status // "Unknown"')"
echo ""

echo "❌ Problems identified:"
if [ "$(echo $TOOLS | jq -r '.tools[] | select(.name == "get_pricing") | .name // "NOT FOUND"')" = "NOT FOUND" ]; then
    echo "  - get_pricing tool not available in all_tools"
fi
if [ "$(echo $HEALTH | jq -r '.tool_executor_status // "Not available"')" = "Not available" ]; then
    echo "  - ToolExecutor not initialized"
fi
if [ "$(echo $HEALTH | jq -r '.zantara_tools_status // "Not available"')" = "Not available" ]; then
    echo "  - ZantaraTools not initialized"
fi
echo ""

echo "🎯 ROOT CAUSE ANALYSIS:"
echo "  Tool execution chain is broken at multiple levels:"
echo "  1. ToolExecutor initialization may have failed"
echo "  2. ZantaraTools may not be passed correctly"
echo "  3. Tool loading in IntelligentRouter may fail"
echo "  4. Tool execution may fail"
echo ""

echo "🔧 RECOMMENDED FIXES:"
echo "  1. Check ToolExecutor initialization logs"
echo "  2. Verify ZantaraTools is passed to ToolExecutor"
echo "  3. Check IntelligentRouter tool loading"
echo "  4. Test tool execution flow"
echo ""

echo "======================================================================"
echo "🎯 DIAGNOSTIC COMPLETE"
echo "======================================================================"
