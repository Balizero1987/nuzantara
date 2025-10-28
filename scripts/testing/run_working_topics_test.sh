#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 ZANTARA WORKING TOPICS TEST (20 QUERIES - VISIBLE MODE)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 Testing 20 queries on topics that work 100%${NC}"
echo -e "${YELLOW}👀 Browser will be VISIBLE so you can watch the automation${NC}"
echo -e "${GREEN}📊 Categories: KITAS E23 Pricing, Multilingual Greetings, Business Queries${NC}"
echo ""

# Navigate to the test directory
cd tests/integration

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🚀 Starting Playwright test (VISIBLE MODE)...${NC}"
echo -e "${YELLOW}👀 Watch the browser window - automation will be visible!${NC}"
echo ""

# Run the test
node test_20_working_topics_playwright.js

# Navigate back to the root
cd ../..

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ WORKING TOPICS TEST COMPLETED"
echo "═══════════════════════════════════════════════════════════════"


