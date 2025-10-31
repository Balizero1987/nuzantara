#!/bin/bash
# VIBE War Machine - Status Check

echo "📊 VIBE War Machine Status"
echo "═══════════════════════════════════════"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
GOLD='\033[1;33m'
NC='\033[0m'

# Check Dashboard
if lsof -Pi :3030 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Dashboard:    RUNNING${NC}  http://localhost:3030"
else
    echo -e "${RED}✗ Dashboard:    STOPPED${NC}"
fi

# Check Swarm Agent
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Swarm Agent:  RUNNING${NC}  http://localhost:8080"
else
    echo -e "${RED}✗ Swarm Agent:  STOPPED${NC}"
fi

echo ""

# Test swarm agent if running
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GOLD}Available Agents:${NC}"
    curl -s http://localhost:8080/ | python3 -c "import sys, json; data=json.load(sys.stdin); print('  - ' + '\n  - '.join(data.get('agents', [])))" 2>/dev/null || echo "  Could not fetch agent list"
fi

echo ""
