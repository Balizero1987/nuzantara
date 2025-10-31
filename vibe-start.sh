#!/bin/bash
# VIBE War Machine - Startup Script
# Starts dashboard + swarm agent

echo "🚀 Starting VIBE War Machine..."
echo ""

# Colors
GREEN='\033[0;32m'
GOLD='\033[1;33m'
NC='\033[0m' # No Color

# Check if services already running
if lsof -Pi :3030 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GOLD}⚠️  Dashboard already running on port 3030${NC}"
else
    echo -e "${GREEN}▶ Starting Dashboard (localhost:3030)...${NC}"
    cd apps/vibe-dashboard && npm run dev > /dev/null 2>&1 &
    sleep 3
fi

if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GOLD}⚠️  Swarm Agent already running on port 8080${NC}"
else
    echo -e "${GREEN}▶ Starting Swarm Agent (localhost:8080)...${NC}"
    cd apps/swarm-agent && export FLY_API_TOKEN="${FLY_API_TOKEN:-test}" && python3 main.py > /dev/null 2>&1 &
    sleep 2
fi

echo ""
echo -e "${GOLD}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ VIBE War Machine Ready!${NC}"
echo -e "${GOLD}════════════════════════════════════════${NC}"
echo ""
echo "📊 Dashboard:    http://localhost:3030"
echo "🤖 Swarm Agent:  http://localhost:8080"
echo "🔑 PIN:          1987"
echo ""
echo -e "${GOLD}Commands:${NC}"
echo "  ./vibe-stop.sh    Stop all services"
echo "  ./vibe-status.sh  Check service status"
echo ""
