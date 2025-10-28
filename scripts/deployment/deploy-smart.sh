#!/bin/bash
# Smart Deploy Script - Velocità + Controllo Costi
# Usage: ./deploy-smart.sh [rag|backend|webapp] [--force]

set -e

SERVICE=$1
FORCE=$2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 ZANTARA Smart Deploy System${NC}"
echo "=================================="

# Check if service is specified
if [ -z "$SERVICE" ]; then
    echo -e "${RED}❌ Usage: ./deploy-smart.sh [rag|backend|webapp] [--force]${NC}"
    echo ""
    echo "Services:"
    echo "  rag     - Deploy RAG Backend (Python)"
    echo "  backend - Deploy TypeScript Backend"
    echo "  webapp  - Deploy WebApp to GitHub Pages"
    echo ""
    echo "Options:"
    echo "  --force - Skip active deploy check"
    exit 1
fi

# Check for active deployments (unless --force)
if [ "$FORCE" != "--force" ]; then
    echo -e "${YELLOW}🔍 Checking for active deployments...${NC}"
    
    # Count active deployments
    ACTIVE_DEPLOYS=$(gh run list --status in_progress --json status --jq length 2>/dev/null || echo "0")
    
    if [ "$ACTIVE_DEPLOYS" -gt 0 ]; then
        echo -e "${RED}❌ Found $ACTIVE_DEPLOYS active deployment(s)${NC}"
        echo -e "${YELLOW}💡 Use --force to skip this check${NC}"
        echo ""
        echo "Active deployments:"
        gh run list --status in_progress --json status,name,createdAt --jq '.[] | "\(.name) - \(.createdAt)"'
        exit 1
    fi
    
    echo -e "${GREEN}✅ No active deployments found${NC}"
fi

# Deploy based on service
case $SERVICE in
    "rag")
        echo -e "${BLUE}🐍 Deploying RAG Backend (Python)...${NC}"
        gh workflow run "Deploy RAG Backend (AMD64)" --ref main
        echo -e "${GREEN}✅ RAG Backend deploy triggered${NC}"
        echo -e "${YELLOW}⏱️  Deploy time: ~3-4 minutes${NC}"
        ;;
        
    "backend")
        echo -e "${BLUE}⚡ Deploying TypeScript Backend...${NC}"
        gh workflow run "Deploy Backend API (TypeScript)" --ref main
        echo -e "${GREEN}✅ TypeScript Backend deploy triggered${NC}"
        echo -e "${YELLOW}⏱️  Deploy time: ~2-3 minutes${NC}"
        ;;
        
    "webapp")
        echo -e "${BLUE}🌐 Deploying WebApp to GitHub Pages...${NC}"
        gh workflow run "Sync Webapp to GitHub Pages" --ref main
        echo -e "${GREEN}✅ WebApp deploy triggered${NC}"
        echo -e "${YELLOW}⏱️  Deploy time: ~1-2 minutes${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown service: $SERVICE${NC}"
        echo "Valid services: rag, backend, webapp"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Deploy triggered successfully!${NC}"
echo -e "${BLUE}📊 Monitor progress:${NC}"
echo "  gh run list --status in_progress"
echo ""
echo -e "${BLUE}🔗 Check status:${NC}"
echo "  RAG Backend: https://zantara-rag-backend-himaadsxua-ew.a.run.app/health"
echo "  TS Backend:  https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health"
echo "  WebApp:      https://zantara.balizero.com"
