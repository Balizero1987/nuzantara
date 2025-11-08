#!/bin/bash
# 🚀 ZANTARA Frontend-Backend Fixes Deployment Script
# Usage: ./deploy-fixes.sh [--skip-rag] [--skip-frontend] [--verify-only]

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RAG_APP="nuzantara-rag"
FRONTEND_APP="nuzantara-webapp"
BRANCH="claude/analyze-frontend-backend-coordination-011CUu1coX6KFraX8AVtgein"

# Parse arguments
SKIP_RAG=false
SKIP_FRONTEND=false
VERIFY_ONLY=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-rag)
      SKIP_RAG=true
      shift
      ;;
    --skip-frontend)
      SKIP_FRONTEND=true
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--skip-rag] [--skip-frontend] [--verify-only]"
      exit 1
      ;;
  esac
done

# Helper functions
print_header() {
  echo -e "${BLUE}======================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}======================================${NC}"
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

# Check prerequisites
check_prerequisites() {
  print_header "Checking Prerequisites"

  # Check git
  if ! command -v git &> /dev/null; then
    print_error "git not found. Please install git."
    exit 1
  fi
  print_success "git installed"

  # Check fly CLI
  if ! command -v fly &> /dev/null; then
    print_warning "fly CLI not found. Install with: curl -L https://fly.io/install.sh | sh"
    read -p "Continue without fly CLI? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    print_success "fly CLI installed"
  fi

  # Check current branch
  CURRENT_BRANCH=$(git branch --show-current)
  if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    print_warning "Not on deployment branch. Current: $CURRENT_BRANCH"
    read -p "Checkout $BRANCH? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git checkout "$BRANCH"
      print_success "Checked out $BRANCH"
    else
      print_error "Deployment cancelled"
      exit 1
    fi
  else
    print_success "On correct branch: $BRANCH"
  fi

  # Check git status
  if [ -n "$(git status --porcelain)" ]; then
    print_warning "Working directory not clean"
    git status --short
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  else
    print_success "Working directory clean"
  fi

  echo ""
}

# Verify changes
verify_changes() {
  print_header "Verifying Changes"

  # Check if auth endpoint exists
  if grep -q "POST /api/auth/demo" apps/backend-rag/backend/app/main_cloud.py; then
    print_success "Auth endpoint found in RAG server"
  else
    print_error "Auth endpoint NOT found in RAG server"
    exit 1
  fi

  # Check if API_CONFIG exposed globally
  if grep -q "window.API_CONFIG = API_CONFIG" apps/webapp/js/api-config.js; then
    print_success "API_CONFIG exposed globally"
  else
    print_error "API_CONFIG NOT exposed globally"
    exit 1
  fi

  # Check if unified-auth exists
  if [ -f "apps/webapp/js/auth/unified-auth.js" ]; then
    print_success "UnifiedAuth file exists"
  else
    print_error "UnifiedAuth file NOT found"
    exit 1
  fi

  echo ""
}

# Deploy RAG server
deploy_rag() {
  print_header "Deploying RAG Server"

  cd apps/backend-rag

  print_info "Building RAG server..."
  fly deploy --app $RAG_APP --verbose

  if [ $? -eq 0 ]; then
    print_success "RAG server deployed successfully"
  else
    print_error "RAG server deployment failed"
    exit 1
  fi

  cd ../..
  echo ""
}

# Deploy frontend
deploy_frontend() {
  print_header "Deploying Frontend"

  cd apps/webapp

  print_info "Building frontend..."
  fly deploy --app $FRONTEND_APP --verbose

  if [ $? -eq 0 ]; then
    print_success "Frontend deployed successfully"
  else
    print_error "Frontend deployment failed"
    exit 1
  fi

  cd ../..
  echo ""
}

# Test deployments
test_deployment() {
  print_header "Testing Deployment"

  # Test RAG server health
  print_info "Testing RAG server health..."
  RAG_HEALTH=$(curl -s https://nuzantara-rag.fly.dev/health)
  if echo "$RAG_HEALTH" | grep -q '"status":"healthy"'; then
    print_success "RAG server healthy"
  else
    print_error "RAG server health check failed"
    echo "$RAG_HEALTH"
  fi

  # Test auth endpoint
  print_info "Testing auth endpoint..."
  AUTH_RESPONSE=$(curl -s -X POST https://nuzantara-rag.fly.dev/api/auth/demo \
    -H "Content-Type: application/json" \
    -d '{"userId":"test"}')

  if echo "$AUTH_RESPONSE" | grep -q '"token"'; then
    print_success "Auth endpoint working"
    echo "$AUTH_RESPONSE" | jq -r '.token'
  else
    print_error "Auth endpoint failed"
    echo "$AUTH_RESPONSE"
  fi

  # Test V3 endpoint
  print_info "Testing V3 Zantara unified endpoint..."
  V3_RESPONSE=$(curl -s -X POST https://nuzantara-rag.fly.dev/api/v3/zantara/unified \
    -H "Content-Type: application/json" \
    -d '{"query":"test","user_id":"test","stream":false}')

  if echo "$V3_RESPONSE" | grep -q '"success":true'; then
    print_success "V3 endpoint working"
  else
    print_error "V3 endpoint failed"
    echo "$V3_RESPONSE"
  fi

  echo ""
}

# Main execution
main() {
  echo ""
  print_header "🚀 ZANTARA Frontend-Backend Fixes Deployment"
  echo ""

  check_prerequisites
  verify_changes

  if [ "$VERIFY_ONLY" = true ]; then
    print_success "Verification complete. Skipping deployment."
    exit 0
  fi

  # Confirm deployment
  echo -e "${YELLOW}About to deploy:${NC}"
  echo "  - RAG Server: $([[ $SKIP_RAG == true ]] && echo 'SKIP' || echo 'DEPLOY')"
  echo "  - Frontend: $([[ $SKIP_FRONTEND == true ]] && echo 'SKIP' || echo 'DEPLOY')"
  echo ""
  read -p "Continue with deployment? (y/N) " -n 1 -r
  echo

  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 0
  fi

  echo ""

  # Deploy RAG server first (CRITICAL)
  if [ "$SKIP_RAG" = false ]; then
    deploy_rag
  else
    print_warning "Skipping RAG server deployment"
  fi

  # Deploy frontend second
  if [ "$SKIP_FRONTEND" = false ]; then
    deploy_frontend
  else
    print_warning "Skipping frontend deployment"
  fi

  # Test deployments
  test_deployment

  print_header "✅ Deployment Complete"
  echo ""
  print_success "All systems operational!"
  echo ""
  echo "Next steps:"
  echo "  1. Open https://nuzantara-webapp.fly.dev"
  echo "  2. Test login flow"
  echo "  3. Verify console has no errors"
  echo "  4. Check Network tab for correct URLs"
  echo ""
}

# Run main
main
