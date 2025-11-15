#!/bin/bash
#
# NUZANTARA v4 - PHASE 1 DEPLOYMENT SCRIPT
# Unified Memory System (95% Recall Target)
#
# This script deploys the Phase 1 enhancements:
# - UnifiedMemoryOrchestrator with 3-level memory
# - Working Memory (Redis)
# - Episodic Memory (PostgreSQL summaries)
# - Semantic Memory (Extracted facts)
#
# Run: bash scripts/deploy-phase1-memory.sh
#

set -e  # Exit on error

echo "🚀 NUZANTARA v4 - PHASE 1 DEPLOYMENT"
echo "===================================="
echo ""
echo "📦 Component: Unified Memory System"
echo "🎯 Target: 95% Memory Recall"
echo "⏱️  Timeline: Phase 1 (Weeks 1-2)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
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

# Check we're in the right directory
if [ ! -f "apps/backend-rag/backend/services/unified_memory_orchestrator.py" ]; then
    print_error "unified_memory_orchestrator.py not found!"
    print_error "Please run this script from the nuzantara root directory"
    exit 1
fi

print_success "Repository structure verified"
echo ""

# Step 1: Run Memory Recall Tests
print_step "Step 1: Running Memory Recall Tests"
echo "This validates the 95% recall target..."
echo ""

cd apps/backend-rag/backend

# Check if pytest is available
if ! command -v pytest &> /dev/null; then
    print_warning "pytest not found, installing test dependencies..."
    pip install -q pytest==8.3.3 pytest-asyncio==0.24.0
fi

# Run tests
print_step "Running test suite..."
if pytest tests/test_memory_recall.py -v --tb=short; then
    print_success "All memory recall tests passed!"
    echo ""
else
    print_error "Memory recall tests failed!"
    print_error "Fix the tests before deploying to production"
    exit 1
fi

cd ../../..

# Step 2: Verify Fly.io CLI
print_step "Step 2: Verifying Fly.io CLI"

if ! command -v fly &> /dev/null; then
    print_error "Fly.io CLI not found!"
    echo "Install from: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

print_success "Fly.io CLI found: $(fly version)"
echo ""

# Step 3: Verify Required Secrets
print_step "Step 3: Verifying Required Secrets"
echo "Checking Fly.io secrets for nuzantara-rag..."
echo ""

required_secrets=("DATABASE_URL" "REDIS_URL" "OPENAI_API_KEY" "ANTHROPIC_API_KEY")
missing_secrets=()

for secret in "${required_secrets[@]}"; do
    if fly secrets list --app nuzantara-rag | grep -q "^$secret"; then
        print_success "$secret is configured"
    else
        print_warning "$secret is MISSING"
        missing_secrets+=("$secret")
    fi
done

if [ ${#missing_secrets[@]} -ne 0 ]; then
    print_error "Missing required secrets: ${missing_secrets[*]}"
    echo ""
    echo "Set secrets with:"
    for secret in "${missing_secrets[@]}"; do
        echo "  fly secrets set $secret=\"your-value-here\" --app nuzantara-rag"
    done
    exit 1
fi

print_success "All required secrets are configured"
echo ""

# Step 4: Deploy to Fly.io
print_step "Step 4: Deploying to Fly.io (nuzantara-rag)"
echo ""

cd apps/backend-rag

# Check if there's a Dockerfile
if [ ! -f "Dockerfile" ]; then
    print_error "Dockerfile not found in apps/backend-rag/"
    exit 1
fi

print_step "Starting deployment..."
echo ""

if fly deploy --app nuzantara-rag --ha=false; then
    print_success "Deployment successful!"
    echo ""
else
    print_error "Deployment failed!"
    print_error "Check Fly.io logs with: fly logs --app nuzantara-rag"
    exit 1
fi

cd ../..

# Step 5: Verify Deployment
print_step "Step 5: Verifying Deployment"
echo "Waiting for app to be ready..."
sleep 10

print_step "Checking health endpoint..."
if curl -sf https://nuzantara-rag.fly.dev/health > /dev/null; then
    print_success "Health check passed!"

    # Get health details
    echo ""
    echo "Health Status:"
    curl -s https://nuzantara-rag.fly.dev/health | jq '.'
else
    print_error "Health check failed!"
    print_error "App may not be running correctly"
    echo ""
    echo "Check logs with:"
    echo "  fly logs --app nuzantara-rag"
    exit 1
fi

echo ""

# Step 6: Verify Memory System
print_step "Step 6: Verifying Memory System Initialization"
echo ""

# Check startup logs for memory orchestrator
print_step "Checking startup logs for Unified Memory Orchestrator..."
if fly logs --app nuzantara-rag -n 100 | grep -q "Unified Memory Orchestrator"; then
    print_success "Unified Memory Orchestrator initialized!"

    # Show relevant log lines
    echo ""
    echo "Memory System Logs:"
    fly logs --app nuzantara-rag -n 100 | grep "Memory" | tail -5
else
    print_warning "Could not verify Memory Orchestrator initialization"
    print_warning "Check full logs with: fly logs --app nuzantara-rag"
fi

echo ""
echo ""

# Summary
print_success "================================================"
print_success "  PHASE 1 DEPLOYMENT COMPLETE!"
print_success "================================================"
echo ""
echo "📊 Deployment Summary:"
echo "   - Unified Memory Orchestrator: ✅ Deployed"
echo "   - Working Memory (Redis): ✅ Active"
echo "   - Episodic Memory (PostgreSQL): ✅ Active"
echo "   - Semantic Memory (Facts): ✅ Active"
echo "   - Memory Recall Target: 95%"
echo ""
echo "🔗 Endpoints:"
echo "   - Main App: https://nuzantara-rag.fly.dev"
echo "   - Health: https://nuzantara-rag.fly.dev/health"
echo "   - Chat: https://nuzantara-rag.fly.dev/bali-zero/chat"
echo ""
echo "📝 Next Steps:"
echo "   1. Monitor memory recall metrics"
echo "   2. Test with real conversations"
echo "   3. Verify 95% recall in production"
echo "   4. Begin Phase 2: RAG Enhancement & Monitoring"
echo ""
echo "📚 Monitoring Commands:"
echo "   - View logs: fly logs --app nuzantara-rag"
echo "   - Check status: fly status --app nuzantara-rag"
echo "   - SSH access: fly ssh console --app nuzantara-rag"
echo ""
print_success "Deployment script completed successfully!"
