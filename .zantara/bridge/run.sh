#!/bin/bash
################################################################################
# ZANTARA BRIDGE RUN SCRIPT v1.0
################################################################################
# Purpose: Convenient script to start bridge server and watcher
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${BLUE}"
echo "=============================================================================="
echo "  ZANTARA BRIDGE v1.0"
echo "=============================================================================="
echo -e "${NC}"

# Check if setup has been run
if [ ! -f "requirements.txt" ]; then
    echo -e "${YELLOW}⚠ Bridge not set up yet${NC}"
    echo "Run setup first: ./setup.sh"
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "../../.venv" ]; then
    echo -e "${BLUE}➤ Activating virtual environment...${NC}"
    source ../../.venv/bin/activate
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down ZANTARA Bridge...${NC}"
    kill $SERVER_PID 2>/dev/null || true
    kill $WATCHER_PID 2>/dev/null || true
    echo -e "${GREEN}✓ Bridge stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start server in background
echo -e "${BLUE}➤ Starting bridge server on port 5050...${NC}"
python bridge_server.py > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server started successfully
if ! curl -s http://127.0.0.1:5050/health > /dev/null 2>&1; then
    echo -e "${RED}✗ Failed to start bridge server${NC}"
    echo "Check logs: cat logs/server.log"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✓ Bridge server started (PID: $SERVER_PID)${NC}"

# Start watcher in background
echo -e "${BLUE}➤ Starting bridge watcher...${NC}"
python bridge_watcher.py > logs/watcher.log 2>&1 &
WATCHER_PID=$!

sleep 1

# Check if watcher started
if ! ps -p $WATCHER_PID > /dev/null 2>&1; then
    echo -e "${RED}✗ Failed to start bridge watcher${NC}"
    echo "Check logs: cat logs/watcher.log"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}✓ Bridge watcher started (PID: $WATCHER_PID)${NC}"

# Display status
echo ""
echo -e "${GREEN}=============================================================================="
echo "  ZANTARA Bridge is running!"
echo "==============================================================================${NC}"
echo ""
echo "Server:   http://127.0.0.1:5050"
echo "Health:   http://127.0.0.1:5050/health"
echo "Status:   http://127.0.0.1:5050/status"
echo ""
echo "Logs:"
echo "  Server:  tail -f logs/server.log"
echo "  Watcher: tail -f logs/watcher.log"
echo ""
echo "Submit task:"
echo "  ./bridge_client.sh 'Your task' 'context' 'priority'"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Keep script running and display logs
tail -f logs/server.log logs/watcher.log 2>/dev/null &
TAIL_PID=$!

# Wait for user interrupt
wait $TAIL_PID
