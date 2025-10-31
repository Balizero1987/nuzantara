#!/bin/bash
# Fly.io Deployment Script for ZANTARA
# Optimized deployment script for Fly.io platform

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(pwd)"
BACKEND_RAG_DIR="$PROJECT_ROOT/apps/backend-rag"
POSTGRES_DIR="$PROJECT_ROOT/apps/postgres"
QDRANT_DIR="$PROJECT_ROOT/apps/qdrant-service"

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

    if ! command -v fly &> /dev/null; then
        missing_deps+=("fly")
    fi

    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
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

# Check if logged in to Fly.io
check_fly_auth() {
    log_info "Checking Fly.io authentication..."

    if ! fly auth whoami &> /dev/null; then
        log_error "Not logged in to Fly.io. Please run 'fly auth login' first."
        exit 1
    fi

    log_success "Authenticated with Fly.io"
}

# Deploy RAG Backend
deploy_rag_backend() {
    log_info "Deploying RAG backend to Fly.io..."

    cd "$BACKEND_RAG_DIR"

    # Deploy with Fly.io
    fly deploy --app nuzantara-rag

    # Wait for deployment
    log_info "Waiting for RAG backend deployment..."
    sleep 15

    # Health check
    if curl -f "https://nuzantara-rag.fly.dev/health" > /dev/null 2>&1; then
        log_success "RAG backend deployed successfully: https://nuzantara-rag.fly.dev"
    else
        log_warning "RAG backend health check failed, but deployment may still be in progress"
    fi
}

# Deploy PostgreSQL (if needed)
deploy_postgres() {
    if [ "${DEPLOY_POSTGRES:-false}" = "true" ]; then
        log_info "Deploying PostgreSQL to Fly.io..."

        cd "$POSTGRES_DIR"
        fly deploy --app nuzantara-postgres

        log_success "PostgreSQL deployment initiated: nuzantara-postgres"
    fi
}

# Deploy Qdrant (if needed)
deploy_qdrant() {
    if [ "${DEPLOY_QDRANT:-false}" = "true" ]; then
        log_info "Deploying Qdrant to Fly.io..."

        cd "$QDRANT_DIR"
        fly deploy --app nuzantara-qdrant

        log_success "Qdrant deployment initiated: nuzantara-qdrant"
    fi
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Check RAG backend
    log_info "Checking RAG backend health..."
    if curl -f "https://nuzantara-rag.fly.dev/health" > /dev/null 2>&1; then
        log_success "✅ RAG backend is healthy"
    else
        log_error "❌ RAG backend health check failed"
        return 1
    fi

    # Check SSE streaming
    log_info "Testing SSE streaming..."
    if timeout 10 curl -N "https://nuzantara-rag.fly.dev/bali-zero/chat-stream?query=test" > /dev/null 2>&1; then
        log_success "✅ SSE streaming is working"
    else
        log_warning "⚠️  SSE streaming test failed (may still be starting up)"
    fi

    # Check metrics endpoint
    log_info "Checking metrics endpoint..."
    if curl -f "https://nuzantara-rag.fly.dev/metrics" > /dev/null 2>&1; then
        log_success "✅ Metrics endpoint is available"
    else
        log_warning "⚠️  Metrics endpoint not available"
    fi
}

# Show deployment status
show_status() {
    log_info "Deployment status:"

    fly status --app nuzantara-rag

    if [ "${DEPLOY_POSTGRES:-false}" = "true" ]; then
        fly status --app nuzantara-postgres
    fi

    if [ "${DEPLOY_QDRANT:-false}" = "true" ]; then
        fly status --app nuzantara-qdrant
    fi
}

# Show logs
show_logs() {
    log_info "Recent deployment logs:"
    fly logs --app nuzantara-rag --tail 50
}

# Main function
main() {
    log_info "Starting Fly.io deployment process for ZANTARA..."

    # Parse command line arguments
    local skip_verify=false
    local show_logs_flag=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-verify)
                skip_verify=true
                shift
                ;;
            --logs)
                show_logs_flag=true
                shift
                ;;
            --deploy-postgres)
                export DEPLOY_POSTGRES=true
                shift
                ;;
            --deploy-qdrant)
                export DEPLOY_QDRANT=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-verify    Skip deployment verification"
                echo "  --logs           Show deployment logs"
                echo "  --deploy-postgres Deploy PostgreSQL database"
                echo "  --deploy-qdrant  Deploy Qdrant vector database"
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

    # Check authentication
    check_fly_auth

    # Deploy services
    deploy_rag_backend
    deploy_postgres
    deploy_qdrant

    # Verify deployment
    if [ "$skip_verify" = "false" ]; then
        verify_deployment
    fi

    # Show status
    show_status

    # Show logs if requested
    if [ "$show_logs_flag" = "true" ]; then
        show_logs
    fi

    log_success "🎉 Fly.io deployment completed successfully!"
    echo ""
    echo "📱 Production URLs:"
    echo "  • RAG Backend: https://nuzantara-rag.fly.dev"
    echo "  • Health Check: https://nuzantara-rag.fly.dev/health"
    echo "  • Metrics: https://nuzantara-rag.fly.dev/metrics"
    echo ""
    echo "🔧 Management Commands:"
    echo "  • Status: fly status --app nuzantara-rag"
    echo "  • Logs: fly logs --app nuzantara-rag"
    echo "  • Restart: fly restart --app nuzantara-rag"
}

# Run main function
main "$@"