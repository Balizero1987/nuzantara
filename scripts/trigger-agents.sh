#!/bin/bash
################################################################################
# NUZANTARA - AI AGENTS MANUAL TRIGGER SCRIPT
# Trigger manuale di tutti gli agenti AI per testing e manutenzione
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
BACKEND_TS_URL="${BACKEND_TS_URL:-http://localhost:3000}"
BACKEND_RAG_URL="${BACKEND_RAG_URL:-http://localhost:8000}"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_agent() {
    echo -e "\n${CYAN}▶ $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

run_trigger() {
    local name=$1
    local method=$2
    local url=$3
    local data=${4:-}

    echo -e "${YELLOW}🚀 Triggering: $name${NC}"
    echo -e "   URL: $url"

    if [ -n "$data" ]; then
        echo -e "   Data: $data"
        RESPONSE=$(curl -s -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    else
        RESPONSE=$(curl -s -X "$method" "$url" 2>&1)
    fi

    STATUS=$?

    if [ $STATUS -eq 0 ]; then
        echo -e "${GREEN}✅ Success!${NC}"
        echo -e "   Response:"

        # Try to pretty print JSON
        if echo "$RESPONSE" | jq . > /dev/null 2>&1; then
            echo "$RESPONSE" | jq . | sed 's/^/   /'
        else
            echo "$RESPONSE" | sed 's/^/   /'
        fi
        return 0
    else
        echo -e "${RED}❌ Failed!${NC}"
        echo -e "   Error: $RESPONSE"
        return 1
    fi
}

show_menu() {
    echo -e "\n${MAGENTA}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║         NUZANTARA AI AGENTS - MANUAL TRIGGERS           ║${NC}"
    echo -e "${MAGENTA}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}BACKEND TYPESCRIPT AGENTS:${NC}"
    echo "  1) Refactoring Agent          - Auto-refactor codebase"
    echo "  2) Test Generator Agent       - Generate missing tests"
    echo "  3) Self-Healing Agent         - Scan and fix errors"
    echo "  4) PR Agent                   - Create improvement PR"
    echo "  5) Agent Orchestrator Status  - View task queue"
    echo ""
    echo -e "${CYAN}BACKEND PYTHON RAG AGENTS:${NC}"
    echo "  6) Conversation Trainer       - Improve prompts from top conversations"
    echo "  7) Client Value Predictor     - Run LTV calculation + nurturing"
    echo "  8) Knowledge Graph Builder    - Build knowledge graph from conversations"
    echo "  9) Compliance Monitor         - Check compliance alerts (with auto-notify)"
    echo " 10) Client Journey (Create)    - Create test journey"
    echo ""
    echo -e "${CYAN}MONITORING & STATUS:${NC}"
    echo " 11) View All Agent Executions  - Recent execution history"
    echo " 12) View Agent Analytics       - Performance analytics"
    echo " 13) Health Check               - Run full health check"
    echo ""
    echo -e "${CYAN}BULK OPERATIONS:${NC}"
    echo " 14) Trigger All TS Agents      - Run all TypeScript agents"
    echo " 15) Trigger All RAG Agents     - Run all Python RAG agents"
    echo " 16) Trigger Everything         - Nuclear option (all agents)"
    echo ""
    echo "  0) Exit"
    echo ""
    echo -ne "${YELLOW}Select option [0-16]: ${NC}"
}

################################################################################
# TypeScript Agents
################################################################################

trigger_refactoring_agent() {
    print_agent "REFACTORING AGENT"
    run_trigger "Refactoring Agent" "POST" "$BACKEND_TS_URL/api/agents/refactoring/run"
}

trigger_test_generator() {
    print_agent "TEST GENERATOR AGENT"
    run_trigger "Test Generator" "POST" "$BACKEND_TS_URL/api/agents/test-generation/run"
}

trigger_self_healing() {
    print_agent "SELF-HEALING AGENT"
    local payload='{"action": "scan-and-fix", "description": "Manual trigger scan"}'
    run_trigger "Self-Healing Agent" "POST" "$BACKEND_TS_URL/api/agents/tasks" "$payload"
}

trigger_pr_agent() {
    print_agent "PR AGENT"
    local payload='{"agentType": "pr-agent", "payload": {"action": "create-summary"}}'
    run_trigger "PR Agent" "POST" "$BACKEND_TS_URL/api/agents/tasks" "$payload"
}

view_orchestrator_status() {
    print_agent "AGENT ORCHESTRATOR STATUS"
    echo -e "${YELLOW}📊 Current Task Queue:${NC}"
    TASKS=$(curl -s "$BACKEND_TS_URL/api/agents/tasks")

    if echo "$TASKS" | jq . > /dev/null 2>&1; then
        TOTAL=$(echo "$TASKS" | jq '. | length')
        PENDING=$(echo "$TASKS" | jq '[.[] | select(.status == "pending")] | length')
        RUNNING=$(echo "$TASKS" | jq '[.[] | select(.status == "running")] | length')
        COMPLETED=$(echo "$TASKS" | jq '[.[] | select(.status == "completed")] | length')
        FAILED=$(echo "$TASKS" | jq '[.[] | select(.status == "failed")] | length')

        echo ""
        echo "Total Tasks:     $TOTAL"
        echo "Pending:         $PENDING"
        echo "Running:         $RUNNING"
        echo "Completed:       $COMPLETED"
        echo "Failed:          $FAILED"

        echo ""
        echo -e "${CYAN}Recent Tasks:${NC}"
        echo "$TASKS" | jq -r '.[] | "  [\(.status)] \(.agentType) - \(.metadata.timestamp // "unknown")"' | head -10
    else
        echo -e "${RED}❌ Failed to fetch tasks${NC}"
    fi
}

################################################################################
# Python RAG Agents
################################################################################

trigger_conversation_trainer() {
    print_agent "CONVERSATION TRAINER"
    echo "Analyzing conversations from last 7 days..."
    local payload='{"days_back": 7}'
    run_trigger "Conversation Trainer" "POST" "$BACKEND_RAG_URL/api/autonomous-agents/conversation-trainer/run" "$payload"
}

trigger_client_value_predictor() {
    print_agent "CLIENT VALUE PREDICTOR"
    echo "Running LTV calculation and nurturing campaign..."
    run_trigger "Client Value Predictor" "POST" "$BACKEND_RAG_URL/api/autonomous-agents/client-value-predictor/run"
}

trigger_knowledge_graph() {
    print_agent "KNOWLEDGE GRAPH BUILDER"
    echo "Building knowledge graph from last 30 days of conversations..."
    local payload='{"days_back": 30, "init_schema": false}'
    run_trigger "Knowledge Graph Builder" "POST" "$BACKEND_RAG_URL/api/autonomous-agents/knowledge-graph-builder/run" "$payload"
}

trigger_compliance_monitor() {
    print_agent "COMPLIANCE MONITOR"
    echo "Checking compliance alerts and auto-notifying..."
    run_trigger "Compliance Monitor" "GET" "$BACKEND_RAG_URL/api/agents/compliance/alerts?auto_notify=true"
}

create_test_journey() {
    print_agent "CLIENT JOURNEY (CREATE TEST)"
    echo "Creating test KITAS application journey..."
    local payload='{
        "client_id": "test-'$(date +%s)'",
        "template": "kitas_application",
        "metadata": {"test_mode": true}
    }'
    run_trigger "Client Journey" "POST" "$BACKEND_RAG_URL/api/agents/journey/create" "$payload"
}

################################################################################
# Monitoring
################################################################################

view_executions() {
    print_agent "AGENT EXECUTION HISTORY"
    echo -e "${YELLOW}📋 Recent Executions:${NC}"

    EXECUTIONS=$(curl -s "$BACKEND_RAG_URL/api/autonomous-agents/executions")

    if echo "$EXECUTIONS" | jq . > /dev/null 2>&1; then
        echo "$EXECUTIONS" | jq -r '.executions[] | "  [\(.status)] \(.agent_name) - \(.started_at) (duration: \(.duration_seconds // 0)s)"' | head -20
    else
        echo -e "${RED}❌ Failed to fetch executions${NC}"
    fi
}

view_analytics() {
    print_agent "AGENT ANALYTICS"
    echo -e "${YELLOW}📊 Performance Analytics:${NC}"

    ANALYTICS=$(curl -s "$BACKEND_RAG_URL/api/agents/analytics/summary")

    if echo "$ANALYTICS" | jq . > /dev/null 2>&1; then
        echo "$ANALYTICS" | jq .
    else
        echo -e "${RED}❌ Failed to fetch analytics${NC}"
    fi
}

run_health_check() {
    print_agent "HEALTH CHECK"
    if [ -f "./scripts/health-check-agents.sh" ]; then
        bash ./scripts/health-check-agents.sh
    else
        echo -e "${RED}❌ Health check script not found${NC}"
    fi
}

################################################################################
# Bulk Operations
################################################################################

trigger_all_ts() {
    print_header "🚀 TRIGGERING ALL TYPESCRIPT AGENTS"
    trigger_refactoring_agent
    sleep 2
    trigger_test_generator
    sleep 2
    trigger_self_healing
    sleep 2
    echo -e "\n${GREEN}✅ All TypeScript agents triggered${NC}"
}

trigger_all_rag() {
    print_header "🚀 TRIGGERING ALL PYTHON RAG AGENTS"
    trigger_conversation_trainer
    sleep 2
    trigger_client_value_predictor
    sleep 2
    trigger_knowledge_graph
    sleep 2
    trigger_compliance_monitor
    sleep 2
    echo -e "\n${GREEN}✅ All RAG agents triggered${NC}"
}

trigger_everything() {
    print_header "🚀 TRIGGERING EVERYTHING (NUCLEAR OPTION)"
    echo -e "${RED}⚠️  WARNING: This will trigger ALL agents simultaneously!${NC}"
    echo -ne "${YELLOW}Are you sure? (yes/no): ${NC}"
    read -r confirm

    if [ "$confirm" = "yes" ]; then
        trigger_all_ts
        echo ""
        trigger_all_rag
        echo ""
        echo -e "${GREEN}✅ ALL AGENTS TRIGGERED!${NC}"
        echo -e "${CYAN}💡 Check agent orchestrator and execution logs for status${NC}"
    else
        echo -e "${YELLOW}⚠️  Cancelled${NC}"
    fi
}

################################################################################
# Main Menu Loop
################################################################################

main() {
    print_header "🤖 NUZANTARA AI AGENTS CONTROL CENTER"

    while true; do
        show_menu
        read -r choice

        case $choice in
            1) trigger_refactoring_agent ;;
            2) trigger_test_generator ;;
            3) trigger_self_healing ;;
            4) trigger_pr_agent ;;
            5) view_orchestrator_status ;;
            6) trigger_conversation_trainer ;;
            7) trigger_client_value_predictor ;;
            8) trigger_knowledge_graph ;;
            9) trigger_compliance_monitor ;;
            10) create_test_journey ;;
            11) view_executions ;;
            12) view_analytics ;;
            13) run_health_check ;;
            14) trigger_all_ts ;;
            15) trigger_all_rag ;;
            16) trigger_everything ;;
            0)
                echo -e "\n${GREEN}👋 Goodbye!${NC}\n"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option${NC}"
                ;;
        esac

        echo ""
        echo -ne "${YELLOW}Press Enter to continue...${NC}"
        read -r
    done
}

################################################################################
# Script Entry Point
################################################################################

# Check if running in non-interactive mode
if [ "${1:-}" = "--agent" ]; then
    case "${2:-}" in
        refactoring) trigger_refactoring_agent ;;
        test-generator) trigger_test_generator ;;
        self-healing) trigger_self_healing ;;
        pr-agent) trigger_pr_agent ;;
        conversation-trainer) trigger_conversation_trainer ;;
        client-predictor) trigger_client_value_predictor ;;
        knowledge-graph) trigger_knowledge_graph ;;
        compliance) trigger_compliance_monitor ;;
        all-ts) trigger_all_ts ;;
        all-rag) trigger_all_rag ;;
        all) trigger_everything ;;
        *)
            echo "Usage: $0 --agent [refactoring|test-generator|self-healing|pr-agent|conversation-trainer|client-predictor|knowledge-graph|compliance|all-ts|all-rag|all]"
            exit 1
            ;;
    esac
else
    main
fi
