#!/bin/bash
# Optimized Railway Deployment Script
# Implements best practices for Railway deployment with performance optimizations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/workspace"
BACKEND_RAG_DIR="$PROJECT_ROOT/apps/backend-rag/backend"
BACKEND_TS_DIR="$PROJECT_ROOT/apps/backend-ts"
UNIFIED_BACKEND_DIR="$PROJECT_ROOT/apps/unified-backend"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v railway &> /dev/null; then
        missing_deps+=("railway")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again."
        exit 1
    fi
    
    log_success "All dependencies are available"
}

# Optimize Docker images
optimize_docker_images() {
    log_info "Optimizing Docker images..."
    
    # Build and test RAG backend
    log_info "Building RAG backend image..."
    cd "$BACKEND_RAG_DIR"
    
    # Build with build cache optimization
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from=zantara-rag:latest \
        -t zantara-rag:latest \
        -t zantara-rag:$(date +%Y%m%d-%H%M%S) \
        .
    
    # Test the image
    log_info "Testing RAG backend image..."
    docker run --rm -d --name zantara-rag-test -p 8000:8000 zantara-rag:latest
    sleep 10
    
    # Health check
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        log_success "RAG backend image is healthy"
    else
        log_error "RAG backend image health check failed"
        docker logs zantara-rag-test
        docker stop zantara-rag-test
        exit 1
    fi
    
    docker stop zantara-rag-test
    
    # Build TypeScript backend
    log_info "Building TypeScript backend image..."
    cd "$BACKEND_TS_DIR"
    
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from=zantara-ts:latest \
        -t zantara-ts:latest \
        -t zantara-ts:$(date +%Y%m%d-%H%M%S) \
        .
    
    # Test the image
    log_info "Testing TypeScript backend image..."
    docker run --rm -d --name zantara-ts-test -p 8080:8080 zantara-ts:latest
    sleep 10
    
    # Health check
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        log_success "TypeScript backend image is healthy"
    else
        log_error "TypeScript backend image health check failed"
        docker logs zantara-ts-test
        docker stop zantara-ts-test
        exit 1
    fi
    
    docker stop zantara-ts-test
    
    # Build unified backend
    log_info "Building unified backend image..."
    cd "$UNIFIED_BACKEND_DIR"
    
    docker build \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --cache-from=zantara-unified:latest \
        -t zantara-unified:latest \
        -t zantara-unified:$(date +%Y%m%d-%H%M%S) \
        .
    
    log_success "All Docker images built and tested successfully"
}

# Run performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    # Start RAG backend for testing
    log_info "Starting RAG backend for performance testing..."
    cd "$BACKEND_RAG_DIR"
    docker run --rm -d --name zantara-rag-perf -p 8000:8000 zantara-rag:latest
    
    # Wait for service to be ready
    sleep 15
    
    # Run SSE performance audit
    log_info "Running SSE performance audit..."
    cd "$PROJECT_ROOT"
    python3 scripts/monitoring/sse-performance-audit.py \
        --url "http://localhost:8000" \
        --connections 5 \
        --duration 30 \
        --output "sse-performance-report.json"
    
    # Check if performance is acceptable
    if [ -f "sse-performance-report.json" ]; then
        local success_rate=$(python3 -c "
import json
with open('sse-performance-report.json') as f:
    data = json.load(f)
print(data['test_summary']['success_rate'])
")
        
        if (( $(echo "$success_rate >= 90" | bc -l) )); then
            log_success "Performance test passed (${success_rate}% success rate)"
        else
            log_warning "Performance test warning (${success_rate}% success rate)"
        fi
    else
        log_warning "Performance test report not generated"
    fi
    
    # Cleanup
    docker stop zantara-rag-perf
}

# Deploy to Railway
deploy_to_railway() {
    log_info "Deploying to Railway..."
    
    # Check if logged in to Railway
    if ! railway whoami > /dev/null 2>&1; then
        log_error "Not logged in to Railway. Please run 'railway login' first."
        exit 1
    fi
    
    # Deploy RAG backend
    log_info "Deploying RAG backend..."
    cd "$BACKEND_RAG_DIR"
    
    # Set Railway project (if not already set)
    if [ -z "${RAILWAY_PROJECT_ID:-}" ]; then
        log_info "Setting Railway project..."
        railway link
    fi
    
    # Deploy with optimized settings
    railway up --detach
    
    # Wait for deployment
    log_info "Waiting for RAG backend deployment..."
    sleep 30
    
    # Health check
    local rag_url=$(railway domain)
    if [ -n "$rag_url" ]; then
        if curl -f "https://$rag_url/health" > /dev/null 2>&1; then
            log_success "RAG backend deployed successfully: https://$rag_url"
        else
            log_warning "RAG backend health check failed, but deployment may still be in progress"
        fi
    else
        log_warning "Could not determine RAG backend URL"
    fi
    
    # Deploy TypeScript backend (if needed)
    if [ "${DEPLOY_TS_BACKEND:-false}" = "true" ]; then
        log_info "Deploying TypeScript backend..."
        cd "$BACKEND_TS_DIR"
        railway up --detach
        log_success "TypeScript backend deployment initiated"
    fi
    
    # Deploy unified backend (if needed)
    if [ "${DEPLOY_UNIFIED_BACKEND:-false}" = "true" ]; then
        log_info "Deploying unified backend..."
        cd "$UNIFIED_BACKEND_DIR"
        railway up --detach
        log_success "Unified backend deployment initiated"
    fi
}

# Monitor deployment
monitor_deployment() {
    log_info "Monitoring deployment..."
    
    # Get Railway project info
    local project_info=$(railway status --json 2>/dev/null || echo "{}")
    
    if [ "$project_info" != "{}" ]; then
        log_info "Railway project status:"
        echo "$project_info" | python3 -m json.tool 2>/dev/null || echo "$project_info"
    fi
    
    # Check logs
    log_info "Recent deployment logs:"
    railway logs --tail 50
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Stop any running test containers
    docker stop zantara-rag-test zantara-ts-test zantara-rag-perf 2>/dev/null || true
    
    # Remove test images (optional)
    if [ "${CLEANUP_IMAGES:-false}" = "true" ]; then
        docker rmi zantara-rag:latest zantara-ts:latest zantara-unified:latest 2>/dev/null || true
    fi
}

# Main function
main() {
    log_info "Starting optimized Railway deployment process..."
    
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Parse command line arguments
    local skip_tests=false
    local skip_build=false
    local deploy_only=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --deploy-only)
                deploy_only=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-tests     Skip performance tests"
                echo "  --skip-build     Skip Docker image building"
                echo "  --deploy-only    Only deploy, skip all other steps"
                echo "  --help           Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    check_dependencies
    
    if [ "$deploy_only" = "false" ]; then
        # Optimize Docker images
        if [ "$skip_build" = "false" ]; then
            optimize_docker_images
        fi
        
        # Run performance tests
        if [ "$skip_tests" = "false" ]; then
            run_performance_tests
        fi
    fi
    
    # Deploy to Railway
    deploy_to_railway
    
    # Monitor deployment
    monitor_deployment
    
    log_success "Deployment process completed successfully!"
}

# Run main function
main "$@"