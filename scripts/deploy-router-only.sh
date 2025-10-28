#!/bin/bash

# Deploy script with fallback and automatic rollback
set -e

echo "🚀 Starting Router-Only Deployment..."
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 not found${NC}"
        exit 1
    fi

    # Check Node
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found${NC}"
        exit 1
    fi

    # Check if services are running
    if lsof -i:8080 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 8080 in use (TS Backend running)${NC}"
    fi

    if lsof -i:8001 > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port 8001 in use (Python Backend running)${NC}"
    fi

    echo -e "${GREEN}✅ Prerequisites OK${NC}"
}

# Start FLAN Router
start_flan_router() {
    echo "Starting FLAN-T5 Router..."

    cd apps/flan-router

    # Check if venv exists
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi

    # Activate and install
    source venv/bin/activate
    pip install -q -r requirements.txt

    # Start in background
    nohup uvicorn router_only:app --host 0.0.0.0 --port 8000 > router.log 2>&1 &
    ROUTER_PID=$!
    echo $ROUTER_PID > .router.pid

    # Wait for startup
    echo "Waiting for router to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8000/health > /dev/null; then
            echo -e "${GREEN}✅ Router started (PID: $ROUTER_PID)${NC}"
            cd ../..
            return 0
        fi
        sleep 1
        echo -n "."
    done

    echo -e "${RED}❌ Router failed to start${NC}"
    kill $ROUTER_PID 2>/dev/null
    cd ../..
    return 1
}

# Update TypeScript backend
update_ts_backend() {
    echo "Updating TypeScript backend..."

    cd apps/backend-ts

    # Check if migration files exist
    if [ ! -f "src/handlers/router-system/migration-adapter.ts" ]; then
        echo -e "${RED}❌ Migration adapter not found. Files should already be created.${NC}"
        cd ../..
        return 1
    fi

    echo -e "${GREEN}✅ TypeScript backend router-system ready${NC}"
    cd ../..
}

# Start orchestrator
start_orchestrator() {
    echo "Starting Orchestrator..."

    cd apps/orchestrator

    # Install dependencies
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install --silent
    fi

    # Compile TypeScript
    echo "Building orchestrator..."
    npm run build

    # Check for ANTHROPIC_API_KEY
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set. Orchestrator will fail without it.${NC}"
        echo "Please set it: export ANTHROPIC_API_KEY=your-key-here"
    fi

    # Start in background
    nohup node dist/main.js > orchestrator.log 2>&1 &
    ORCH_PID=$!
    echo $ORCH_PID > .orchestrator.pid

    # Wait for startup
    sleep 3

    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✅ Orchestrator started (PID: $ORCH_PID)${NC}"
        cd ../..
        return 0
    else
        echo -e "${RED}❌ Orchestrator failed to start${NC}"
        cd ../..
        return 1
    fi
}

# Test the system
test_system() {
    echo "Running system tests..."

    # Test 1: Router health
    echo -n "Testing router health... "
    if curl -s http://localhost:8000/health | grep -q "healthy"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi

    # Test 2: Orchestrator health
    echo -n "Testing orchestrator health... "
    if curl -s http://localhost:3000/health | grep -q "healthy\|degraded"; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi

    # Test 3: End-to-end query
    echo "Testing end-to-end query..."
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/query \
        -H 'Content-Type: application/json' \
        -d '{"query": "What is the price of KITAS?"}' 2>/dev/null)

    if [ ! -z "$RESPONSE" ] && echo "$RESPONSE" | grep -q "response"; then
        echo -e "${GREEN}✅ End-to-end test passed${NC}"
        # Extract latency if available
        LATENCY=$(echo "$RESPONSE" | jq -r '.metadata.performance.totalLatency' 2>/dev/null || echo "N/A")
        echo "Total latency: ${LATENCY}ms"
    else
        echo -e "${RED}❌ End-to-end test failed${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi

    # Test 4: Check tool selection
    echo "Testing tool selection..."
    TOOLS=$(echo "$RESPONSE" | jq -r '.metadata.routing.tools[]' 2>/dev/null || echo "")
    if [ ! -z "$TOOLS" ]; then
        echo -e "${GREEN}✅ Tools selected: $TOOLS${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not extract tool selection${NC}"
    fi
}

# Rollback function
rollback() {
    echo -e "${YELLOW}Rolling back...${NC}"

    # Kill router
    if [ -f "apps/flan-router/.router.pid" ]; then
        kill $(cat apps/flan-router/.router.pid) 2>/dev/null
        rm apps/flan-router/.router.pid
    fi

    # Kill orchestrator
    if [ -f "apps/orchestrator/.orchestrator.pid" ]; then
        kill $(cat apps/orchestrator/.orchestrator.pid) 2>/dev/null
        rm apps/orchestrator/.orchestrator.pid
    fi

    echo -e "${GREEN}✅ Rollback complete${NC}"
}

# Main deployment flow
main() {
    echo "======================================="
    echo "  Router-Only Deployment"
    echo "  Mode: FLAN selects tools, Haiku generates"
    echo "======================================="

    check_prerequisites

    # Trap errors for rollback
    trap rollback ERR

    # Start services
    start_flan_router || exit 1
    update_ts_backend || exit 1
    start_orchestrator || exit 1

    # Test
    echo ""
    echo "======================================="
    echo "  Running Tests"
    echo "======================================="

    if test_system; then
        echo ""
        echo -e "${GREEN}=======================================${NC}"
        echo -e "${GREEN}  ✅ DEPLOYMENT SUCCESSFUL${NC}"
        echo -e "${GREEN}=======================================${NC}"
        echo ""
        echo "System is running with:"
        echo "- FLAN Router: http://localhost:8000"
        echo "- Orchestrator: http://localhost:3000"
        echo "- Metrics: http://localhost:3000/api/metrics"
        echo ""
        echo "Monitor logs:"
        echo "- Router: tail -f apps/flan-router/router.log"
        echo "- Orchestrator: tail -f apps/orchestrator/orchestrator.log"
        echo ""
        echo "Test query:"
        echo "curl -X POST http://localhost:3000/api/query \\"
        echo "  -H 'Content-Type: application/json' \\"
        echo "  -d '{\"query\": \"What is the price of KITAS?\"}'"
    else
        echo -e "${RED}Tests failed. Rolling back...${NC}"
        rollback
        exit 1
    fi
}

# Run main
main
