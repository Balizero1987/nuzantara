#!/bin/bash
# VIBE War Machine - Stop Script

echo "🛑 Stopping VIBE War Machine..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop dashboard (port 3030)
DASHBOARD_PID=$(lsof -ti:3030)
if [ ! -z "$DASHBOARD_PID" ]; then
    kill $DASHBOARD_PID 2>/dev/null
    echo -e "${GREEN}✓ Dashboard stopped${NC}"
else
    echo -e "${RED}✗ Dashboard not running${NC}"
fi

# Stop swarm agent (port 8080)
SWARM_PID=$(lsof -ti:8080)
if [ ! -z "$SWARM_PID" ]; then
    kill $SWARM_PID 2>/dev/null
    echo -e "${GREEN}✓ Swarm Agent stopped${NC}"
else
    echo -e "${RED}✗ Swarm Agent not running${NC}"
fi

echo ""
echo "All services stopped."
