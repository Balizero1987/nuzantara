#!/bin/bash
# Test Autonomous Agents HTTP Endpoints
#
# Usage:
#   ./scripts/test_autonomous_agents.sh [BASE_URL]
#
# Examples:
#   ./scripts/test_autonomous_agents.sh                           # Test localhost:8000
#   ./scripts/test_autonomous_agents.sh https://nuzantara-rag.fly.dev  # Test production

set -e

BASE_URL="${1:-http://localhost:8000}"

echo "🧪 Testing Autonomous Agents Endpoints"
echo "======================================"
echo "Base URL: $BASE_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4

    echo -n "Testing: $description ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $http_code)"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "$body"
    fi

    echo ""
}

# 1. Test agent status endpoint
test_endpoint "GET" "/api/autonomous-agents/status" "Get agents status"

# 2. Test Knowledge Graph Builder (init schema)
echo -e "${YELLOW}⚠️  Initializing Knowledge Graph schema...${NC}"
test_endpoint "POST" "/api/autonomous-agents/knowledge-graph-builder/run?init_schema=true&days_back=7" \
    "Knowledge Graph Builder (init + 7 days)" \
    '{}'

# Wait a bit for async execution
echo "⏳ Waiting 5 seconds for agent to start..."
sleep 5

# 3. Test Conversation Trainer (7 days lookback)
test_endpoint "POST" "/api/autonomous-agents/conversation-trainer/run?days_back=7" \
    "Conversation Trainer (7 days)" \
    '{}'

# Wait for async execution
echo "⏳ Waiting 5 seconds for agent to start..."
sleep 5

# 4. List recent executions
test_endpoint "GET" "/api/autonomous-agents/executions?limit=5" "List recent executions"

echo ""
echo "======================================"
echo -e "${GREEN}✅ All endpoint tests completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check execution status: GET $BASE_URL/api/autonomous-agents/executions"
echo "  2. View specific execution: GET $BASE_URL/api/autonomous-agents/executions/{execution_id}"
echo "  3. Monitor logs for agent completion"
echo ""
echo "For automated scheduling, run:"
echo "  python scripts/autonomous_agents_scheduler.py"
