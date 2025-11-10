#!/bin/bash
################################################################################
# NUZANTARA - ACTIVATE SAFE AGENTS
# Attiva SOLO i 4 agenti sicuri
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

################################################################################
# Configuration
################################################################################

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_TS="$PROJECT_ROOT/apps/backend-ts"
BACKEND_RAG="$PROJECT_ROOT/apps/backend-rag"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
}

print_step() {
    echo -e "\n${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

################################################################################
# Main Script
################################################################################

print_header "🟢 NUZANTARA - ACTIVATE SAFE AGENTS"

echo ""
echo -e "${CYAN}This script will activate ONLY the 4 safe agents:${NC}"
echo ""
echo -e "  ${GREEN}✅${NC} 1. Health Check (monitoring every 15 min)"
echo -e "  ${GREEN}✅${NC} 2. Daily Report (metrics daily 9 AM)"
echo -e "  ${GREEN}✅${NC} 3. Autonomous Research Service (on-demand)"
echo -e "  ${GREEN}✅${NC} 4. Agent Orchestrator (infrastructure)"
echo ""
echo -e "${RED}❌ DANGEROUS AGENTS DISABLED:${NC}"
echo -e "  ${RED}❌${NC} Refactoring Agent (modifies code)"
echo -e "  ${RED}❌${NC} Test Generator (generates tests)"
echo -e "  ${RED}❌${NC} PR Agent (creates PRs)"
echo -e "  ${RED}❌${NC} Self-Healing Agent (auto-fixes)"
echo -e "  ${RED}❌${NC} Conversation Trainer (modifies prompts)"
echo -e "  ${RED}❌${NC} Client Value Predictor (sends WhatsApp)"
echo -e "  ${RED}❌${NC} Compliance Monitor (sends alerts)"
echo ""

read -p "Continue? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo "Activation cancelled."
    exit 0
fi

################################################################################
# STEP 1: Check Prerequisites
################################################################################

print_header "STEP 1: CHECK PREREQUISITES"

# Check Node.js
print_step "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION installed"
else
    print_error "Node.js not found. Install from https://nodejs.org"
    exit 1
fi

# Check Python
print_step "Checking Python..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "$PYTHON_VERSION installed"
else
    print_error "Python 3 not found. Install from https://python.org"
    exit 1
fi

# Check if project directories exist
print_step "Checking project structure..."
if [ ! -d "$BACKEND_TS" ]; then
    print_error "Backend TypeScript not found at $BACKEND_TS"
    exit 1
fi
print_success "Backend TypeScript found"

if [ ! -d "$BACKEND_RAG" ]; then
    print_error "Backend RAG not found at $BACKEND_RAG"
    exit 1
fi
print_success "Backend RAG found"

################################################################################
# STEP 2: Setup Environment Files
################################################################################

print_header "STEP 2: SETUP ENVIRONMENT FILES"

# Backend TypeScript
print_step "Setting up Backend TypeScript .env..."
if [ -f "$BACKEND_TS/.env" ]; then
    print_warning ".env already exists. Creating backup..."
    cp "$BACKEND_TS/.env" "$BACKEND_TS/.env.backup.$(date +%Y%m%d-%H%M%S)"
    print_success "Backup created"
fi

if [ -f "$PROJECT_ROOT/.env.safe" ]; then
    cp "$PROJECT_ROOT/.env.safe" "$BACKEND_TS/.env"
    print_success ".env.safe copied to backend-ts/.env"
else
    print_error ".env.safe not found at $PROJECT_ROOT/.env.safe"
    exit 1
fi

# Backend RAG
print_step "Setting up Backend RAG .env..."
if [ -f "$BACKEND_RAG/.env" ]; then
    print_warning ".env already exists. Creating backup..."
    cp "$BACKEND_RAG/.env" "$BACKEND_RAG/.env.backup.$(date +%Y%m%d-%H%M%S)"
    print_success "Backup created"
fi

if [ -f "$BACKEND_RAG/.env.safe" ]; then
    cp "$BACKEND_RAG/.env.safe" "$BACKEND_RAG/.env"
    print_success ".env.safe copied to backend-rag/.env"
else
    print_error ".env.safe not found at $BACKEND_RAG/.env.safe"
    exit 1
fi

################################################################################
# STEP 3: Configure Required Values
################################################################################

print_header "STEP 3: CONFIGURE REQUIRED VALUES"

print_warning "You need to update the following values in the .env files:"
echo ""
echo "Backend TypeScript ($BACKEND_TS/.env):"
echo "  - DATABASE_URL"
echo "  - REDIS_URL"
echo "  - JWT_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "Backend RAG ($BACKEND_RAG/.env):"
echo "  - DATABASE_URL"
echo "  - REDIS_URL"
echo "  - ANTHROPIC_API_KEY (for Autonomous Research)"
echo "  - CHROMA_HOST and CHROMA_PORT"
echo ""

read -p "Have you updated these values? (yes/no): " -r
echo
if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo ""
    print_warning "Please update the values manually:"
    echo "  vi $BACKEND_TS/.env"
    echo "  vi $BACKEND_RAG/.env"
    echo ""
    echo "Then run this script again."
    exit 0
fi

################################################################################
# STEP 4: Verify Configuration
################################################################################

print_header "STEP 4: VERIFY CONFIGURATION"

print_step "Checking Backend TypeScript .env..."

# Check ENABLE_CRON
if grep -q "^ENABLE_CRON=true" "$BACKEND_TS/.env"; then
    print_success "ENABLE_CRON=true ✓"
else
    print_error "ENABLE_CRON not set to true"
    exit 1
fi

# Check dangerous agents are disabled
if grep -q "^CRON_SELF_HEALING=" "$BACKEND_TS/.env" | grep -v "^#"; then
    print_error "Self-Healing Agent is ENABLED (dangerous!)"
    exit 1
else
    print_success "Self-Healing Agent DISABLED ✓"
fi

if grep -q "^CRON_AUTO_TESTS=" "$BACKEND_TS/.env" | grep -v "^#"; then
    print_error "Test Generator Agent is ENABLED (dangerous!)"
    exit 1
else
    print_success "Test Generator Agent DISABLED ✓"
fi

if grep -q "^CRON_WEEKLY_PR=" "$BACKEND_TS/.env" | grep -v "^#"; then
    print_error "PR Agent is ENABLED (dangerous!)"
    exit 1
else
    print_success "PR Agent DISABLED ✓"
fi

print_step "Checking Backend RAG .env..."

# Check ANTHROPIC_API_KEY exists (needed for Autonomous Research)
if grep -q "^ANTHROPIC_API_KEY=your-anthropic-api-key" "$BACKEND_RAG/.env"; then
    print_warning "ANTHROPIC_API_KEY not configured (needed for Autonomous Research)"
else
    if grep -q "^ANTHROPIC_API_KEY=" "$BACKEND_RAG/.env" | grep -v "^#"; then
        print_success "ANTHROPIC_API_KEY configured ✓"
    else
        print_warning "ANTHROPIC_API_KEY not set"
    fi
fi

################################################################################
# STEP 5: Create Tracking Directories
################################################################################

print_header "STEP 5: CREATE TRACKING DIRECTORIES"

print_step "Creating .ai-automation directory..."
mkdir -p "$PROJECT_ROOT/.ai-automation"
print_success "Directory created"

# Create empty tracking files (safe agents don't need them, but good to have structure)
touch "$PROJECT_ROOT/.ai-automation/health-check-history.json"
touch "$PROJECT_ROOT/.ai-automation/daily-report-history.json"
print_success "Tracking files created"

################################################################################
# STEP 6: Installation Check
################################################################################

print_header "STEP 6: CHECK DEPENDENCIES"

print_step "Checking Backend TypeScript dependencies..."
cd "$BACKEND_TS"
if [ -d "node_modules" ]; then
    print_success "node_modules found"
else
    print_warning "node_modules not found. Run: npm install"
fi

print_step "Checking Backend RAG dependencies..."
cd "$BACKEND_RAG"
if [ -d "venv" ] || [ -d ".venv" ]; then
    print_success "Python virtual environment found"
else
    print_warning "Python venv not found. Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
fi

################################################################################
# STEP 7: Summary
################################################################################

print_header "✅ SAFE AGENTS CONFIGURATION COMPLETE"

echo ""
echo -e "${GREEN}Configuration Summary:${NC}"
echo ""
echo -e "${CYAN}ACTIVE AGENTS:${NC}"
echo "  ✅ Health Check - Monitoring every 15 minutes"
echo "  ✅ Daily Report - Metrics report daily at 9 AM"
echo "  ✅ Autonomous Research - On-demand intelligent search"
echo "  ✅ Agent Orchestrator - Task coordination"
echo ""
echo -e "${RED}DISABLED AGENTS (safe mode):${NC}"
echo "  ❌ Self-Healing Agent"
echo "  ❌ Test Generator Agent"
echo "  ❌ PR Agent"
echo "  ❌ Refactoring Agent"
echo "  ❌ Conversation Trainer"
echo "  ❌ Client Value Predictor"
echo "  ❌ Compliance Monitor"
echo ""

################################################################################
# STEP 8: Next Steps
################################################################################

print_header "NEXT STEPS"

echo ""
echo -e "${CYAN}1. Start Backend TypeScript:${NC}"
echo "   cd $BACKEND_TS"
echo "   npm run dev"
echo ""
echo -e "${CYAN}2. Start Backend RAG (separate terminal):${NC}"
echo "   cd $BACKEND_RAG"
echo "   source venv/bin/activate"
echo "   python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo -e "${CYAN}3. Start ChromaDB (separate terminal):${NC}"
echo "   docker run -d -p 8001:8000 chromadb/chroma"
echo ""
echo -e "${CYAN}4. Verify agents are active:${NC}"
echo "   ./scripts/health-check-agents.sh"
echo ""
echo -e "${CYAN}5. Check cron status:${NC}"
echo "   curl http://localhost:8080/api/monitoring/cron-status | jq ."
echo ""
echo -e "${CYAN}6. Test Autonomous Research:${NC}"
echo "   curl -X POST http://localhost:8000/api/research/autonomous \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\": \"Come aprire PT PMA?\", \"max_iterations\": 5}'"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "   - Monitor logs for the first 24 hours"
echo "   - Check health check runs every 15 minutes"
echo "   - Daily report will run tomorrow at 9 AM"
echo "   - Dangerous agents remain DISABLED for safety"
echo ""
echo -e "${GREEN}🎉 Safe agents are ready to use!${NC}"
echo ""

exit 0
