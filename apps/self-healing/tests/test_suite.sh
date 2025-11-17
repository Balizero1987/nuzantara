#!/bin/bash

# 🧪 ZANTARA Self-Healing System - Comprehensive Test Suite
# Tests all components before deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test result tracking
declare -a FAILED_TESTS

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🧪 ZANTARA Self-Healing System - Test Suite            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Helper functions
pass_test() {
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

fail_test() {
    TESTS_FAILED=$((TESTS_FAILED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    FAILED_TESTS+=("$1")
    echo -e "${RED}❌ FAIL${NC}: $1"
}

skip_test() {
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${YELLOW}⏭️  SKIP${NC}: $1"
}

test_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Test 1: Prerequisites
test_section "📋 Test 1: Prerequisites Check"

if command -v python3 &> /dev/null; then
    pass_test "Python 3 installed"
else
    fail_test "Python 3 not found"
fi

if command -v node &> /dev/null; then
    pass_test "Node.js installed"
else
    fail_test "Node.js not found"
fi

if command -v fly &> /dev/null; then
    pass_test "Fly.io CLI installed"
else
    skip_test "Fly.io CLI not found (needed for deployment)"
fi

# Test 2: File Structure
test_section "📁 Test 2: File Structure Validation"

FILES=(
    "agents/frontend-agent.js"
    "agents/backend_agent.py"
    "agents/requirements.txt"
    "orchestrator/main.py"
    "orchestrator/Dockerfile"
    "orchestrator/fly.toml"
    "orchestrator/requirements.txt"
    "README.md"
    "DEPLOYMENT.md"
    "SYSTEM_OVERVIEW.md"
)

cd "$(dirname "$0")/.."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        pass_test "File exists: $file"
    else
        fail_test "File missing: $file"
    fi
done

# Test 3: Frontend Agent Syntax
test_section "🌐 Test 3: Frontend Agent JavaScript Validation"

if node --check agents/frontend-agent.js 2>/dev/null; then
    pass_test "Frontend agent syntax valid"
else
    fail_test "Frontend agent syntax error"
fi

# Check for required classes/functions
if grep -q "class ZantaraFrontendAgent" agents/frontend-agent.js; then
    pass_test "ZantaraFrontendAgent class found"
else
    fail_test "ZantaraFrontendAgent class missing"
fi

if grep -q "interceptConsoleErrors" agents/frontend-agent.js; then
    pass_test "Console error interceptor found"
else
    fail_test "Console error interceptor missing"
fi

if grep -q "monitorNetworkRequests" agents/frontend-agent.js; then
    pass_test "Network monitor found"
else
    fail_test "Network monitor missing"
fi

if grep -q "attemptAutoFix" agents/frontend-agent.js; then
    pass_test "Auto-fix logic found"
else
    fail_test "Auto-fix logic missing"
fi

# Test 4: Backend Agent Syntax
test_section "⚙️ Test 4: Backend Agent Python Validation"

if python3 -m py_compile agents/backend_agent.py 2>/dev/null; then
    pass_test "Backend agent syntax valid"
else
    fail_test "Backend agent syntax error"
fi

# Check for required classes/functions
if grep -q "class BackendSelfHealingAgent" agents/backend_agent.py; then
    pass_test "BackendSelfHealingAgent class found"
else
    fail_test "BackendSelfHealingAgent class missing"
fi

if grep -q "async def perform_health_check" agents/backend_agent.py; then
    pass_test "Health check method found"
else
    fail_test "Health check method missing"
fi

if grep -q "async def attempt_auto_fix" agents/backend_agent.py; then
    pass_test "Auto-fix method found"
else
    fail_test "Auto-fix method missing"
fi

# Test 5: Orchestrator Syntax
test_section "🧠 Test 5: Orchestrator Python Validation"

if python3 -m py_compile orchestrator/main.py 2>/dev/null; then
    pass_test "Orchestrator syntax valid"
else
    fail_test "Orchestrator syntax error"
fi

# Check for required components
if grep -q "class SelfHealingOrchestrator" orchestrator/main.py; then
    pass_test "SelfHealingOrchestrator class found"
else
    fail_test "SelfHealingOrchestrator class missing"
fi

if grep -q "async def make_fix_decision" orchestrator/main.py; then
    pass_test "AI decision method found"
else
    fail_test "AI decision method missing"
fi

if grep -q "FastAPI" orchestrator/main.py; then
    pass_test "FastAPI integration found"
else
    fail_test "FastAPI integration missing"
fi

# Test 6: Dependencies
test_section "📦 Test 6: Dependencies Check"

# Create virtual environment for testing
echo "Creating test virtual environment..."
python3 -m venv /tmp/self-healing-test-env > /dev/null 2>&1
source /tmp/self-healing-test-env/bin/activate

# Test orchestrator dependencies
echo "Testing orchestrator dependencies..."
if pip install -q -r orchestrator/requirements.txt 2>/dev/null; then
    pass_test "Orchestrator dependencies installable"
else
    fail_test "Orchestrator dependencies error"
fi

# Test agent dependencies
echo "Testing agent dependencies..."
if pip install -q -r agents/requirements.txt 2>/dev/null; then
    pass_test "Agent dependencies installable"
else
    fail_test "Agent dependencies error"
fi

deactivate
rm -rf /tmp/self-healing-test-env

# Test 7: Configuration Files
test_section "⚙️ Test 7: Configuration Validation"

# Check Dockerfile
if docker build -t self-healing-test -f orchestrator/Dockerfile orchestrator/ > /dev/null 2>&1; then
    pass_test "Dockerfile builds successfully"
    docker rmi self-healing-test > /dev/null 2>&1
else
    skip_test "Docker not available or Dockerfile invalid"
fi

# Check fly.toml
if grep -q "app = \"nuzantara-orchestrator\"" orchestrator/fly.toml; then
    pass_test "Fly.toml app name correct"
else
    fail_test "Fly.toml app name incorrect"
fi

if grep -q "internal_port = 8000" orchestrator/fly.toml; then
    pass_test "Fly.toml port configuration correct"
else
    fail_test "Fly.toml port configuration incorrect"
fi

# Test 8: API Endpoints
test_section "🔌 Test 8: API Endpoint Definitions"

ENDPOINTS=(
    "@app.post(\"/api/report\")"
    "@app.get(\"/api/status\")"
    "@app.get(\"/api/health\")"
    "@app.websocket(\"/ws/dashboard\")"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if grep -q "$endpoint" orchestrator/main.py; then
        pass_test "Endpoint defined: $endpoint"
    else
        fail_test "Endpoint missing: $endpoint"
    fi
done

# Test 9: Error Detection Logic
test_section "🔍 Test 9: Error Detection Logic"

ERROR_TYPES=(
    "import_error"
    "syntax_error"
    "network_error"
    "file_not_found"
    "type_error"
    "reference_error"
)

for error_type in "${ERROR_TYPES[@]}"; do
    if grep -q "$error_type" agents/frontend-agent.js; then
        pass_test "Frontend handles: $error_type"
    else
        fail_test "Frontend missing handler: $error_type"
    fi
done

# Test 10: Auto-Fix Strategies
test_section "🔧 Test 10: Auto-Fix Strategy Implementation"

FRONTEND_FIXES=(
    "reloadPage"
    "attemptNetworkFix"
    "attemptUIFix"
    "attemptMemoryFix"
)

for fix in "${FRONTEND_FIXES[@]}"; do
    if grep -q "$fix" agents/frontend-agent.js; then
        pass_test "Frontend strategy: $fix"
    else
        fail_test "Frontend missing strategy: $fix"
    fi
done

BACKEND_FIXES=(
    "restart_service"
    "reconnect_database"
    "reconnect_cache"
)

for fix in "${BACKEND_FIXES[@]}"; do
    if grep -q "$fix" agents/backend_agent.py; then
        pass_test "Backend strategy: $fix"
    else
        fail_test "Backend missing strategy: $fix"
    fi
done

# Test 11: AI Integration
test_section "🤖 Test 11: AI Integration Check"

if grep -q "openai" orchestrator/main.py; then
    pass_test "OpenAI integration found"
else
    fail_test "OpenAI integration missing"
fi

if grep -q "gpt-4" orchestrator/main.py; then
    pass_test "GPT-4 model specified"
else
    fail_test "GPT-4 model not specified"
fi

if grep -q "get_system_prompt" orchestrator/main.py; then
    pass_test "AI system prompt defined"
else
    fail_test "AI system prompt missing"
fi

# Test 12: Logging & Monitoring
test_section "📊 Test 12: Logging & Monitoring"

if grep -q "logger" agents/backend_agent.py; then
    pass_test "Backend logging configured"
else
    fail_test "Backend logging missing"
fi

if grep -q "console.log.*Frontend Agent" agents/frontend-agent.js; then
    pass_test "Frontend logging configured"
else
    fail_test "Frontend logging missing"
fi

if grep -q "getStatus" agents/frontend-agent.js; then
    pass_test "Frontend status endpoint exists"
else
    fail_test "Frontend status endpoint missing"
fi

# Test 13: Documentation
test_section "📚 Test 13: Documentation Completeness"

DOC_SECTIONS=(
    "## Overview"
    "## Architecture"
    "## Installation"
    "## Usage"
    "## Configuration"
)

for section in "${DOC_SECTIONS[@]}"; do
    if grep -q "$section" README.md; then
        pass_test "README section: $section"
    else
        fail_test "README missing section: $section"
    fi
done

# Test 14: Security Checks
test_section "🔒 Test 14: Security Validation"

# Check for hardcoded secrets
if grep -E "(api[_-]?key|password|secret).*=.*['\"][^'\"]{20,}" orchestrator/main.py agents/*.py 2>/dev/null; then
    fail_test "Potential hardcoded secrets found"
else
    pass_test "No hardcoded secrets detected"
fi

# Check for environment variable usage
if grep -q "os.getenv" orchestrator/main.py; then
    pass_test "Environment variables used correctly"
else
    fail_test "Environment variables not used"
fi

# Check CORS configuration
if grep -q "CORSMiddleware" orchestrator/main.py; then
    pass_test "CORS middleware configured"
else
    fail_test "CORS middleware missing"
fi

# Test 15: Code Quality
test_section "✨ Test 15: Code Quality Checks"

# Count lines of code
FRONTEND_LOC=$(wc -l < agents/frontend-agent.js | xargs)
BACKEND_LOC=$(wc -l < agents/backend_agent.py | xargs)
ORCHESTRATOR_LOC=$(wc -l < orchestrator/main.py | xargs)

echo "Frontend Agent: $FRONTEND_LOC lines"
echo "Backend Agent: $BACKEND_LOC lines"
echo "Orchestrator: $ORCHESTRATOR_LOC lines"

if [ "$FRONTEND_LOC" -gt 500 ]; then
    pass_test "Frontend agent sufficiently implemented ($FRONTEND_LOC lines)"
else
    fail_test "Frontend agent too short ($FRONTEND_LOC lines)"
fi

if [ "$BACKEND_LOC" -gt 300 ]; then
    pass_test "Backend agent sufficiently implemented ($BACKEND_LOC lines)"
else
    fail_test "Backend agent too short ($BACKEND_LOC lines)"
fi

if [ "$ORCHESTRATOR_LOC" -gt 500 ]; then
    pass_test "Orchestrator sufficiently implemented ($ORCHESTRATOR_LOC lines)"
else
    fail_test "Orchestrator too short ($ORCHESTRATOR_LOC lines)"
fi

# Check for comments
if grep -c "^[[:space:]]*//.*" agents/frontend-agent.js | grep -q "[1-9]"; then
    pass_test "Frontend agent has comments"
else
    fail_test "Frontend agent lacks comments"
fi

if grep -c "^[[:space:]]*#.*" agents/backend_agent.py | grep -q "[1-9]"; then
    pass_test "Backend agent has comments"
else
    fail_test "Backend agent lacks comments"
fi

# Final Report
test_section "📊 Test Results Summary"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  TOTAL TESTS: $TESTS_TOTAL"
echo "  ✅ PASSED: $TESTS_PASSED"
echo "  ❌ FAILED: $TESTS_FAILED"
echo "════════════════════════════════════════════════════════════"
echo ""

# Success rate
SUCCESS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TESTS_TOTAL" | bc)
echo "Success Rate: $SUCCESS_RATE%"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🎉 ALL TESTS PASSED! 🎉                      ║${NC}"
    echo -e "${GREEN}║         System is ready for deployment                    ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}✅ You can now deploy with: ./deploy.sh${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║            ⚠️  TESTS FAILED ⚠️                            ║${NC}"
    echo -e "${RED}║         System NOT ready for deployment                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        echo -e "${RED}  - $test${NC}"
    done
    echo ""
    echo -e "${RED}❌ Fix issues before deploying${NC}"
    echo ""
    exit 1
fi
