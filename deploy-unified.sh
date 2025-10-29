#!/bin/bash

set -e

echo "🚀 Deploying Unified Service Architecture..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop existing services
print_info "Stopping existing services..."
docker-compose down 2>/dev/null || true
print_status "Existing services stopped"

# Check if .env file exists
if [ ! -f .env ]; then
    print_info "Creating .env file from template..."
    cat > .env << EOF
# NUZANTARA Unified Backend - Environment Variables

# Redis
REDIS_URL=redis://redis:6379

# PostgreSQL
DATABASE_URL=postgresql://admin:nuzantara_secret_2024@postgres:5432/nuzantara
DB_PASSWORD=nuzantara_secret_2024

# API Configuration
API_KEY=nuzantara_api_key_2024
PORT=8080
NODE_ENV=production
LOG_LEVEL=info

# Cache
CACHE_TTL=3600

# Allowed Origins (comma-separated)
ALLOWED_ORIGINS=*

# Kong
KONG_ADMIN_URL=http://kong:8001
EOF
    print_status ".env file created"
fi

# Build unified backend
print_info "Building unified backend..."
cd apps/unified-backend
npm install 2>/dev/null || print_info "Skipping npm install (will run in Docker)"
cd ../..
print_status "Unified backend prepared"

# Start Kong and services
print_info "Starting Kong Gateway and services..."
docker-compose -f docker-compose.unified.yml up -d --build

# Wait for Kong to be ready
print_info "Waiting for Kong to initialize..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8001/status > /dev/null 2>&1; then
        break
    fi
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done
echo ""

if [ $attempt -eq $max_attempts ]; then
    print_error "Kong failed to start within timeout"
    docker-compose -f docker-compose.unified.yml logs kong
    exit 1
fi

print_status "Kong is running"

# Verify Kong is running
print_info "Verifying Kong status..."
kong_status=$(curl -s http://localhost:8001/status | grep -o '"database":{"reachable":[^}]*}' || echo "error")
if [[ $kong_status == *"error"* ]]; then
    print_error "Kong health check failed"
    exit 1
fi
print_status "Kong health check passed"

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 5

# Test unified endpoints
echo ""
echo "Testing unified endpoints..."
echo ""

# Test Kong proxy
print_info "Testing Kong proxy..."
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    print_status "Kong proxy is responding"
else
    print_error "Kong proxy is not responding"
fi

# Test unified backend through Kong (if available)
print_info "Testing backend health endpoint..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    print_status "Backend health endpoint responding"
    curl -s http://localhost:8080/health | python3 -m json.tool 2>/dev/null || true
else
    print_info "Backend health endpoint not yet available (this is normal on first run)"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Unified Service Architecture Deployed                    ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║  Services:                                                    ║"
echo "║  - Kong Gateway:     http://localhost:8000                    ║"
echo "║  - Kong Admin:       http://localhost:8001                    ║"
echo "║  - Unified Backend:  http://localhost:8080                    ║"
echo "║  - Redis:            redis://localhost:6379                   ║"
echo "║  - PostgreSQL:       postgresql://localhost:5432/nuzantara    ║"
echo "║                                                               ║"
echo "║  Endpoints:                                                   ║"
echo "║  - Health:    GET  /health                                    ║"
echo "║  - Metrics:   GET  /metrics                                   ║"
echo "║                                                               ║"
echo "║  Kong Routes:                                                 ║"
echo "║  - TS Backend:  /api/v1/ts/*                                  ║"
echo "║  - RAG Backend: /api/v1/rag/*                                 ║"
echo "║  - Orchestrator: /api/v1/query                                ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

print_status "Deployment complete!"

# Show logs option
echo ""
read -p "View logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose -f docker-compose.unified.yml logs -f
fi
