#!/bin/bash
# Deploy Monitor - Controlla stato deploy e costi
# Usage: ./monitor-deploy.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📊 ZANTARA Deploy Monitor${NC}"
echo "=========================="

# Check active deployments
echo -e "${YELLOW}🔍 Active Deployments:${NC}"
ACTIVE_COUNT=$(gh run list --status in_progress --json status --jq length 2>/dev/null || echo "0")

if [ "$ACTIVE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✅ No active deployments${NC}"
else
    echo -e "${YELLOW}⚠️  $ACTIVE_COUNT active deployment(s)${NC}"
    gh run list --status in_progress --json status,name,createdAt,headBranch --jq '.[] | "\(.name) (\(.headBranch)) - \(.createdAt)"'
fi

echo ""

# Check recent deployments (last 24h)
echo -e "${YELLOW}📈 Recent Deployments (24h):${NC}"
TODAY=$(date +%Y-%m-%d)
gh run list --created ">=$TODAY" --json status,name,createdAt,conclusion --jq '.[] | "\(.name) - \(.status) - \(.createdAt)"' | head -10

echo ""

# Check service health
echo -e "${YELLOW}🏥 Service Health:${NC}"

# RAG Backend
echo -n "RAG Backend: "
if curl -s --max-time 5 "https://zantara-rag-backend-himaadsxua-ew.a.run.app/health" > /dev/null; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Down${NC}"
fi

# TypeScript Backend
echo -n "TS Backend:  "
if curl -s --max-time 5 "https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/health" > /dev/null; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Down${NC}"
fi

# WebApp
echo -n "WebApp:      "
if curl -s --max-time 5 "https://zantara.balizero.com" > /dev/null; then
    echo -e "${GREEN}✅ Healthy${NC}"
else
    echo -e "${RED}❌ Down${NC}"
fi

echo ""

# Cost monitoring
echo -e "${YELLOW}💰 Cost Monitoring:${NC}"
echo "GitHub Actions: $(gh run list --created ">=$TODAY" --json status --jq length) runs today"
echo "GCP Status: Check https://console.cloud.google.com/billing"

echo ""
echo -e "${BLUE}🚀 Quick Deploy Commands:${NC}"
echo "  ./scripts/deploy-smart.sh rag     # Deploy RAG Backend"
echo "  ./scripts/deploy-smart.sh backend # Deploy TypeScript Backend"
echo "  ./scripts/deploy-smart.sh webapp  # Deploy WebApp"
echo ""
echo -e "${BLUE}📊 More Info:${NC}"
echo "  gh run list --status in_progress  # Active deployments"
echo "  gh run list --created today      # Today's deployments"
