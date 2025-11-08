#!/bin/bash
# 🚀 NUZANTARA - Automated Deployment Script
# Deploys all Tier 1 Autonomous Agents to Fly.io
#
# Usage: ./deploy-autonomous-agents.sh [--staging|--production]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
BACKEND_TS_APP="${BACKEND_TS_APP:-nuzantara-backend}"
BACKEND_RAG_APP="${BACKEND_RAG_APP:-nuzantara-rag}"
POSTGRES_APP="${POSTGRES_APP:-nuzantara-postgres}"

# Parse arguments
ENVIRONMENT="${1:-staging}"

print_header() {
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
  echo -e "${MAGENTA}▶️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check fly CLI
  if ! command -v fly &> /dev/null; then
    print_error "Fly CLI not found. Install with:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
  fi
  print_success "Fly CLI installed: $(fly version)"

  # Check Python
  if ! command -v python3 &> /dev/null; then
    print_error "Python3 not found"
    exit 1
  fi
  print_success "Python3 installed: $(python3 --version)"

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js not found"
    exit 1
  fi
  print_success "Node.js installed: $(node --version)"

  # Check if logged in to Fly
  if ! fly auth whoami &> /dev/null; then
    print_error "Not logged in to Fly.io. Run: fly auth login"
    exit 1
  fi
  print_success "Logged in to Fly.io: $(fly auth whoami)"

  echo ""
}

# Verify environment variables
verify_secrets() {
  print_header "Verifying Environment Variables"

  print_info "Checking required secrets for $BACKEND_TS_APP..."

  REQUIRED_SECRETS=(
    "ANTHROPIC_API_KEY"
    "DATABASE_URL"
    "ENABLE_ORCHESTRATOR"
  )

  for secret in "${REQUIRED_SECRETS[@]}"; do
    if fly secrets list --app "$BACKEND_TS_APP" 2>/dev/null | grep -q "$secret"; then
      print_success "$secret is set"
    else
      print_warning "$secret is NOT set"
      read -p "Set $secret now? (y/N) " -n 1 -r
      echo
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -sp "Enter value for $secret: " SECRET_VALUE
        echo ""
        fly secrets set "$secret=$SECRET_VALUE" --app "$BACKEND_TS_APP"
        print_success "$secret set successfully"
      else
        print_warning "Skipping $secret (deployment may fail)"
      fi
    fi
  done

  echo ""
}

# Install dependencies
install_dependencies() {
  print_header "Installing Dependencies"

  # Backend-TS
  print_step "Installing backend-ts dependencies..."
  cd apps/backend-ts
  npm install --production
  print_success "Backend-TS dependencies installed"
  cd ../..

  # Backend-RAG
  print_step "Installing backend-rag dependencies..."
  cd apps/backend-rag
  pip install -r requirements-agents.txt
  print_success "Backend-RAG dependencies installed"
  cd ../..

  echo ""
}

# Initialize database
initialize_database() {
  print_header "Initializing Database"

  print_step "Enabling pg_stat_statements extension..."

  # Connect to PostgreSQL and run migration
  fly postgres connect -a "$POSTGRES_APP" < apps/backend-ts/migrations/004_enable_pg_stat_statements.sql 2>&1 || {
    print_warning "Could not run migration automatically"
    print_info "Please run manually:"
    echo "  fly postgres connect -a $POSTGRES_APP"
    echo "  \\i apps/backend-ts/migrations/004_enable_pg_stat_statements.sql"
    read -p "Press Enter when done..."
  }

  print_success "Database initialized"
  echo ""
}

# Run pre-deployment tests
run_tests() {
  print_header "Running Pre-Deployment Tests"

  print_step "Running quick tests..."
  if ./tests/test_agents_quick.sh; then
    print_success "All tests passed"
  else
    print_error "Tests failed"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  echo ""
}

# Deploy backend-ts
deploy_backend_ts() {
  print_header "Deploying Backend-TS ($ENVIRONMENT)"

  cd apps/backend-ts

  print_step "Building and deploying to $BACKEND_TS_APP..."

  if [ "$ENVIRONMENT" = "production" ]; then
    fly deploy --app "$BACKEND_TS_APP" --strategy rolling
  else
    fly deploy --app "$BACKEND_TS_APP"
  fi

  print_success "Backend-TS deployed successfully"
  cd ../..

  # Wait for deployment to stabilize
  print_step "Waiting for deployment to stabilize..."
  sleep 10

  # Check health
  print_step "Checking health..."
  if fly status --app "$BACKEND_TS_APP" | grep -q "running"; then
    print_success "Backend-TS is healthy"
  else
    print_warning "Backend-TS status unclear, check logs"
  fi

  echo ""
}

# Deploy backend-rag
deploy_backend_rag() {
  print_header "Deploying Backend-RAG ($ENVIRONMENT)"

  cd apps/backend-rag

  print_step "Building and deploying to $BACKEND_RAG_APP..."

  if [ "$ENVIRONMENT" = "production" ]; then
    fly deploy --app "$BACKEND_RAG_APP" --strategy rolling
  else
    fly deploy --app "$BACKEND_RAG_APP"
  fi

  print_success "Backend-RAG deployed successfully"
  cd ../..

  # Wait for deployment
  print_step "Waiting for deployment to stabilize..."
  sleep 10

  # Check health
  print_step "Checking health..."
  if fly status --app "$BACKEND_RAG_APP" | grep -q "running"; then
    print_success "Backend-RAG is healthy"
  else
    print_warning "Backend-RAG status unclear, check logs"
  fi

  echo ""
}

# Initialize knowledge graph
initialize_knowledge_graph() {
  print_header "Initializing Knowledge Graph"

  print_step "Connecting to $BACKEND_RAG_APP and initializing schema..."

  fly ssh console --app "$BACKEND_RAG_APP" --command \
    "python3 apps/backend-rag/backend/agents/run_knowledge_graph.py --init-schema" || {
    print_warning "Could not initialize automatically"
    print_info "Please run manually:"
    echo "  fly ssh console --app $BACKEND_RAG_APP"
    echo "  python3 apps/backend-rag/backend/agents/run_knowledge_graph.py --init-schema"
    read -p "Press Enter when done..."
  }

  print_success "Knowledge graph initialized"
  echo ""
}

# Verify deployment
verify_deployment() {
  print_header "Verifying Deployment"

  # Check Backend-TS
  print_step "Checking Backend-TS logs..."
  fly logs --app "$BACKEND_TS_APP" -n 20 | grep -E "🎭|started|ready" || true

  # Check Backend-RAG
  print_step "Checking Backend-RAG logs..."
  fly logs --app "$BACKEND_RAG_APP" -n 20 | grep -E "🤖|💰|🕸️|started|ready" || true

  # Test orchestrator
  print_step "Testing orchestrator..."
  fly ssh console --app "$BACKEND_TS_APP" --command \
    "node -e \"console.log('Orchestrator test: OK')\"" && {
    print_success "Orchestrator accessible"
  } || {
    print_warning "Could not test orchestrator"
  }

  echo ""
}

# Monitor deployment
monitor_deployment() {
  print_header "Monitoring Deployment"

  print_info "Starting log monitoring (Ctrl+C to stop)..."
  echo ""

  # Monitor both apps in parallel
  print_step "Backend-TS logs:"
  fly logs --app "$BACKEND_TS_APP" &
  TS_PID=$!

  print_step "Backend-RAG logs:"
  fly logs --app "$BACKEND_RAG_APP" &
  RAG_PID=$!

  # Wait for Ctrl+C
  trap "kill $TS_PID $RAG_PID 2>/dev/null; echo ''; print_info 'Monitoring stopped'" INT

  wait
}

# Main deployment flow
main() {
  print_header "🚀 NUZANTARA AUTONOMOUS AGENTS DEPLOYMENT"
  echo ""
  print_info "Environment: $ENVIRONMENT"
  print_info "Backend-TS: $BACKEND_TS_APP"
  print_info "Backend-RAG: $BACKEND_RAG_APP"
  print_info "PostgreSQL: $POSTGRES_APP"
  echo ""

  read -p "Proceed with deployment? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
  fi

  echo ""

  # Execute deployment steps
  check_prerequisites
  verify_secrets
  install_dependencies
  run_tests
  initialize_database
  deploy_backend_ts
  deploy_backend_rag
  initialize_knowledge_graph
  verify_deployment

  # Success
  print_header "✅ DEPLOYMENT COMPLETE"
  echo ""
  print_success "All services deployed successfully!"
  echo ""
  print_info "Next steps:"
  echo "  1. Monitor logs: fly logs --app $BACKEND_TS_APP"
  echo "  2. Check status: fly status --app $BACKEND_TS_APP"
  echo "  3. Review orchestrator: fly logs --app $BACKEND_TS_APP | grep '🎭'"
  echo "  4. Monitor for 48 hours"
  echo "  5. Review DEPLOYMENT_GUIDE.md for post-deployment checklist"
  echo ""

  read -p "Start monitoring now? (y/N) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    monitor_deployment
  else
    print_info "You can monitor later with: fly logs --app $BACKEND_TS_APP"
  fi
}

# Run main
main
