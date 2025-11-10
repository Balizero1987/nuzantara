#!/bin/bash
################################################################################
# NUZANTARA - AI AGENTS HEALTH CHECK SCRIPT
# Verifica automatica dello stato di tutti gli agenti AI
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_TS_URL="${BACKEND_TS_URL:-http://localhost:3000}"
BACKEND_RAG_URL="${BACKEND_RAG_URL:-http://localhost:8000}"
CHROMA_URL="${CHROMA_URL:-http://localhost:8001}"
DATABASE_URL="${DATABASE_URL:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Results storage
ERRORS=()
WARNINGS=()

################################################################################
# Helper Functions
################################################################################

log_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check() {
    local name=$1
    local command=$2
    local error_msg=$3

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $name"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}❌${NC} $name"
        ERRORS+=("$name: $error_msg")
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

warn() {
    local name=$1
    local message=$2

    echo -e "${YELLOW}⚠️${NC}  $name: $message"
    WARNINGS+=("$name: $message")
    WARNING_CHECKS=$((WARNING_CHECKS + 1))
}

get_json() {
    local url=$1
    curl -s -f "$url" 2>/dev/null || echo "{}"
}

################################################################################
# Health Checks
################################################################################

log_section "🚀 BACKEND TYPESCRIPT HEALTH CHECKS"

# Check if backend is running
if check "Backend TypeScript Running" \
    "curl -s -f $BACKEND_TS_URL/health" \
    "Backend TypeScript not responding"; then

    # Check Cron Scheduler
    CRON_STATUS=$(get_json "$BACKEND_TS_URL/api/monitoring/cron-status")
    CRON_ENABLED=$(echo "$CRON_STATUS" | jq -r '.enabled // false' 2>/dev/null)

    if [ "$CRON_ENABLED" = "true" ]; then
        echo -e "${GREEN}✅${NC} Cron Scheduler Enabled"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))

        JOB_COUNT=$(echo "$CRON_STATUS" | jq -r '.jobCount // 0' 2>/dev/null)
        if [ "$JOB_COUNT" -ge 5 ]; then
            echo -e "${GREEN}✅${NC} Cron Jobs Running ($JOB_COUNT/5)"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warn "Cron Jobs" "Only $JOB_COUNT/5 jobs running"
        fi
    else
        warn "Cron Scheduler" "Disabled (set ENABLE_CRON=true)"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

    # Check Agent Orchestrator
    TASKS=$(get_json "$BACKEND_TS_URL/api/agents/tasks")
    TASK_COUNT=$(echo "$TASKS" | jq '. | length' 2>/dev/null || echo 0)
    echo -e "${GREEN}✅${NC} Agent Orchestrator (${TASK_COUNT} tasks in queue)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Check AI Usage Stats
    if check "OpenRouter Client" \
        "curl -s -f $BACKEND_TS_URL/api/ai/usage-stats" \
        "OpenRouter client not accessible"; then

        USAGE=$(get_json "$BACKEND_TS_URL/api/ai/usage-stats")
        BUDGET_USED=$(echo "$USAGE" | jq -r '.budget_used_today // 0' 2>/dev/null)
        echo "   💰 Budget used today: \$$BUDGET_USED"
    fi
fi

################################################################################

log_section "🧠 BACKEND PYTHON RAG HEALTH CHECKS"

# Check if backend is running
if check "Backend Python RAG Running" \
    "curl -s -f $BACKEND_RAG_URL/health" \
    "Backend Python RAG not responding"; then

    # Check Autonomous Agents Status
    AGENT_STATUS=$(get_json "$BACKEND_RAG_URL/api/autonomous-agents/status")

    # Check Tier 1 Agents
    CONVERSATION_TRAINER=$(echo "$AGENT_STATUS" | jq -r '.conversation_trainer.status // "unknown"' 2>/dev/null)
    CLIENT_PREDICTOR=$(echo "$AGENT_STATUS" | jq -r '.client_value_predictor.status // "unknown"' 2>/dev/null)
    KG_BUILDER=$(echo "$AGENT_STATUS" | jq -r '.knowledge_graph_builder.status // "unknown"' 2>/dev/null)

    if [ "$CONVERSATION_TRAINER" = "ready" ] || [ "$CONVERSATION_TRAINER" = "active" ]; then
        echo -e "${GREEN}✅${NC} Conversation Trainer ($CONVERSATION_TRAINER)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        warn "Conversation Trainer" "Status: $CONVERSATION_TRAINER"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$CLIENT_PREDICTOR" = "ready" ] || [ "$CLIENT_PREDICTOR" = "active" ]; then
        echo -e "${GREEN}✅${NC} Client Value Predictor ($CLIENT_PREDICTOR)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        warn "Client Value Predictor" "Status: $CLIENT_PREDICTOR"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$KG_BUILDER" = "ready" ] || [ "$KG_BUILDER" = "active" ]; then
        echo -e "${GREEN}✅${NC} Knowledge Graph Builder ($KG_BUILDER)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        warn "Knowledge Graph Builder" "Status: $KG_BUILDER"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    # Check All Agents Status
    ALL_AGENTS=$(get_json "$BACKEND_RAG_URL/api/agents/status")
    TOTAL_AGENTS=$(echo "$ALL_AGENTS" | jq '. | length' 2>/dev/null || echo 0)
    ACTIVE_AGENTS=$(echo "$ALL_AGENTS" | jq '[.[] | select(.status == "active" or .status == "ready")] | length' 2>/dev/null || echo 0)

    echo -e "${GREEN}✅${NC} Agent Status: $ACTIVE_AGENTS/$TOTAL_AGENTS agents active"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

################################################################################

log_section "🗄️  CHROMADB HEALTH CHECKS"

check "ChromaDB Running" \
    "curl -s -f $CHROMA_URL/api/v1/heartbeat" \
    "ChromaDB not responding"

if [ $? -eq 0 ]; then
    # Check collections
    COLLECTIONS=$(curl -s -f "$CHROMA_URL/api/v1/collections" 2>/dev/null || echo "[]")
    COLLECTION_COUNT=$(echo "$COLLECTIONS" | jq '. | length' 2>/dev/null || echo 0)

    if [ "$COLLECTION_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅${NC} Collections: $COLLECTION_COUNT found"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))

        # List collections
        echo "$COLLECTIONS" | jq -r '.[].name' 2>/dev/null | while read -r col; do
            echo "   📚 $col"
        done
    else
        warn "Collections" "No collections found"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

################################################################################

log_section "🐘 DATABASE HEALTH CHECKS"

if [ -n "$DATABASE_URL" ]; then
    if check "PostgreSQL Connection" \
        "psql '$DATABASE_URL' -c 'SELECT 1' -t" \
        "Cannot connect to database"; then

        # Check key tables
        TABLES=("conversations" "crm_clients" "crm_interactions" "kg_entities" "kg_relationships" "compliance_alerts")

        for table in "${TABLES[@]}"; do
            if psql "$DATABASE_URL" -c "SELECT 1 FROM $table LIMIT 1" -t > /dev/null 2>&1; then
                ROW_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $table" 2>/dev/null | xargs)
                echo -e "${GREEN}✅${NC} Table '$table' ($ROW_COUNT rows)"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                warn "Table $table" "Not found or not accessible"
            fi
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        done
    fi
else
    warn "Database" "DATABASE_URL not configured"
fi

################################################################################

log_section "📁 FILE SYSTEM HEALTH CHECKS"

# Check tracking files
TRACKING_DIR=".ai-automation"
if [ -d "$TRACKING_DIR" ]; then
    echo -e "${GREEN}✅${NC} Tracking directory exists"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))

    TRACKING_FILES=("refactoring-history.json" "test-generation-history.json")
    for file in "${TRACKING_FILES[@]}"; do
        if [ -f "$TRACKING_DIR/$file" ]; then
            FILE_SIZE=$(du -h "$TRACKING_DIR/$file" | cut -f1)
            echo -e "${GREEN}✅${NC} $file (${FILE_SIZE})"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            warn "Tracking file" "$file not found"
        fi
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    done
else
    warn "Tracking directory" "$TRACKING_DIR not found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check disk space
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✅${NC} Disk usage: ${DISK_USAGE}%"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
elif [ "$DISK_USAGE" -lt 90 ]; then
    warn "Disk space" "Usage at ${DISK_USAGE}% (warning threshold 80%)"
else
    echo -e "${RED}❌${NC} Disk usage: ${DISK_USAGE}% (CRITICAL)"
    ERRORS+=("Disk space: Critical usage at ${DISK_USAGE}%")
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Check log directory
if [ -d "logs" ]; then
    LOG_COUNT=$(find logs -name "*.log" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅${NC} Log directory ($LOG_COUNT log files)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
else
    warn "Log directory" "logs/ not found"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

################################################################################

log_section "🔑 ENVIRONMENT VARIABLES CHECK"

# Required env vars
ENV_VARS=(
    "OPENROUTER_API_KEY"
    "DEEPSEEK_API_KEY"
    "ANTHROPIC_API_KEY"
    "DATABASE_URL"
)

for var in "${ENV_VARS[@]}"; do
    if [ -n "${!var:-}" ]; then
        # Mask the key
        MASKED="${!var:0:10}...${!var: -4}"
        echo -e "${GREEN}✅${NC} $var ($MASKED)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        warn "Environment" "$var not set"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Optional but recommended
OPTIONAL_VARS=(
    "TWILIO_ACCOUNT_SID"
    "SLACK_WEBHOOK_URL"
    "GITHUB_TOKEN"
)

for var in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!var:-}" ]; then
        echo -e "${GREEN}✅${NC} $var (optional - configured)"
    else
        echo -e "${YELLOW}⚠️${NC}  $var (optional - not configured)"
    fi
done

################################################################################

log_section "📊 HEALTH CHECK SUMMARY"

echo ""
echo -e "Total Checks:  ${BLUE}${TOTAL_CHECKS}${NC}"
echo -e "Passed:        ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Warnings:      ${YELLOW}${WARNING_CHECKS}${NC}"
echo -e "Failed:        ${RED}${FAILED_CHECKS}${NC}"
echo ""

# Calculate health percentage
HEALTH_PCT=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

if [ $HEALTH_PCT -ge 90 ]; then
    echo -e "Overall Health: ${GREEN}${HEALTH_PCT}% - EXCELLENT${NC} 🎉"
    EXIT_CODE=0
elif [ $HEALTH_PCT -ge 75 ]; then
    echo -e "Overall Health: ${YELLOW}${HEALTH_PCT}% - GOOD${NC} ✅"
    EXIT_CODE=0
elif [ $HEALTH_PCT -ge 50 ]; then
    echo -e "Overall Health: ${YELLOW}${HEALTH_PCT}% - DEGRADED${NC} ⚠️"
    EXIT_CODE=1
else
    echo -e "Overall Health: ${RED}${HEALTH_PCT}% - CRITICAL${NC} 🚨"
    EXIT_CODE=2
fi

# Print errors and warnings
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ ERRORS:${NC}"
    for error in "${ERRORS[@]}"; do
        echo "   - $error"
    done
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNINGS:${NC}"
    for warning in "${WARNINGS[@]}"; do
        echo "   - $warning"
    done
fi

################################################################################

# Send to Slack if configured
if [ -n "$SLACK_WEBHOOK_URL" ] && [ $FAILED_CHECKS -gt 0 ]; then
    SLACK_MESSAGE="🚨 *NUZANTARA AI Agents Health Check Alert*

Health: ${HEALTH_PCT}%
Passed: ${PASSED_CHECKS}/${TOTAL_CHECKS}
Failed: ${FAILED_CHECKS}
Warnings: ${WARNING_CHECKS}

Errors:
$(printf '%s\n' "${ERRORS[@]}" | sed 's/^/• /')

Run manual check: \`./scripts/health-check-agents.sh\`"

    curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":$(echo "$SLACK_MESSAGE" | jq -Rs .)}" > /dev/null

    echo ""
    echo "📤 Alert sent to Slack"
fi

################################################################################

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Health check completed at $(date)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exit $EXIT_CODE
