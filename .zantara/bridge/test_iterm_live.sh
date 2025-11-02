#!/bin/bash
################################################################################
# Test ZANTARA Bridge with Live iTerm2 Window
################################################################################

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║  ZANTARA BRIDGE - Live iTerm2 Test                                        ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if bridge server is running
echo -e "${BLUE}➤ Checking bridge server...${NC}"
if ! curl -s http://127.0.0.1:5050/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Bridge server not running${NC}"
    echo "Start with: cd .zantara/bridge && ./run.sh"
    exit 1
fi
echo -e "${GREEN}✓ Bridge server is online${NC}"
echo ""

# Submit test task
echo -e "${BLUE}➤ Submitting test task...${NC}"
echo "This will open a NEW iTerm2 window where you'll see Claude working LIVE"
echo ""
sleep 2

./bridge_client.sh "Analyze the current project structure and list the main directories" "live-test" "medium"

echo ""
echo -e "${GREEN}Watch the new iTerm2 window that just opened!${NC}"
echo -e "${YELLOW}You'll see Claude Code CLI working in real-time${NC}"
echo ""
