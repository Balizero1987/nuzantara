#!/bin/bash
################################################################################
# NUZANTARA - SETUP REQUIRED SERVICES
# Avvia PostgreSQL, Redis e ChromaDB con Docker
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          NUZANTARA - SETUP REQUIRED SERVICES               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found${NC}"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  https://www.docker.com/products/docker-desktop"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Docker found${NC}"
echo ""

# Function to start container
start_container() {
    local name=$1
    local image=$2
    local port=$3
    local extra_args=${4:-}

    echo -e "${BLUE}▶ Starting $name...${NC}"

    # Check if container exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${name}$"; then
        # Container exists, check if running
        if docker ps --format '{{.Names}}' | grep -q "^${name}$"; then
            echo -e "${GREEN}✅ $name already running${NC}"
        else
            # Start existing container
            docker start "$name"
            echo -e "${GREEN}✅ $name started${NC}"
        fi
    else
        # Create and start new container
        docker run -d --name "$name" -p "$port" $extra_args "$image"
        echo -e "${GREEN}✅ $name created and started${NC}"
    fi
}

################################################################################
# PostgreSQL
################################################################################

start_container \
    "nuzantara-postgres" \
    "postgres:15" \
    "5432:5432" \
    "-e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=zantara"

################################################################################
# Redis
################################################################################

start_container \
    "nuzantara-redis" \
    "redis:7-alpine" \
    "6379:6379"

################################################################################
# ChromaDB
################################################################################

start_container \
    "nuzantara-chromadb" \
    "chromadb/chroma:latest" \
    "8001:8000"

################################################################################
# Summary
################################################################################

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ALL SERVICES STARTED                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Services running:${NC}"
echo "  ✅ PostgreSQL on localhost:5432"
echo "     - Database: zantara"
echo "     - User: postgres"
echo "     - Password: postgres"
echo ""
echo "  ✅ Redis on localhost:6379"
echo ""
echo "  ✅ ChromaDB on localhost:8001"
echo ""
echo -e "${YELLOW}Connection strings (already in .env.configured):${NC}"
echo "  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zantara"
echo "  REDIS_URL=redis://localhost:6379"
echo "  CHROMA_HOST=localhost"
echo "  CHROMA_PORT=8001"
echo ""
echo -e "${BLUE}To stop services:${NC}"
echo "  docker stop nuzantara-postgres nuzantara-redis nuzantara-chromadb"
echo ""
echo -e "${BLUE}To remove services:${NC}"
echo "  docker rm nuzantara-postgres nuzantara-redis nuzantara-chromadb"
echo ""
echo -e "${GREEN}✅ Ready to start Nuzantara backends!${NC}"
echo ""
