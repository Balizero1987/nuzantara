#!/bin/bash
################################################################################
# ZANTARA BRIDGE TEST SCRIPT v1.0
################################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Testing ZANTARA Bridge...${NC}"
echo ""

# Test 1: Server health
echo "Test 1: Server health check"
RESPONSE=$(curl -s http://127.0.0.1:5050/health)
if echo "$RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✓ Server is healthy${NC}"
else
    echo -e "${RED}✗ Server health check failed${NC}"
    exit 1
fi

# Test 2: Submit task
echo ""
echo "Test 2: Submit test task"
RESPONSE=$(curl -s -X POST http://127.0.0.1:5050/commit \
  -H "Content-Type: application/json" \
  -d '{"task":"Test task from bridge test","context":"test","priority":"low"}')

if echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Task submitted successfully${NC}"
    TASK_ID=$(echo "$RESPONSE" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)
    echo "  Task ID: $TASK_ID"
else
    echo -e "${RED}✗ Task submission failed${NC}"
    exit 1
fi

# Test 3: Check status
echo ""
echo "Test 3: Check status"
RESPONSE=$(curl -s http://127.0.0.1:5050/status)
if echo "$RESPONSE" | grep -q "inbox"; then
    echo -e "${GREEN}✓ Status endpoint working${NC}"
else
    echo -e "${RED}✗ Status check failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All tests passed!${NC}"
