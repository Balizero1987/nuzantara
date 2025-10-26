#!/bin/bash

# ZANTARA Perfect Speaker Browser Automation Test Runner
# Installs dependencies and runs browser automation tests

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 ZANTARA PERFECT SPEAKER BROWSER AUTOMATION TEST"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Installing dependencies...${NC}"
cd tests/integration

# Install Puppeteer
echo "Installing Puppeteer..."
npm install puppeteer

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Puppeteer${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo ""

# Make the test script executable
chmod +x test_perfect_speaker_browser_automation.js

echo -e "${BLUE}🚀 Starting browser automation test...${NC}"
echo "This will open a browser window to test the webapp interactively."
echo "You can watch the tests run in real-time!"
echo ""

# Run the browser automation test
node test_perfect_speaker_browser_automation.js

# Check if test completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Browser automation test completed successfully!${NC}"
    echo -e "${BLUE}📄 Check the generated report: TEST_PERFECT_SPEAKER_RESULTS_2025-01-27.md${NC}"
else
    echo ""
    echo -e "${RED}❌ Browser automation test failed${NC}"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 ZANTARA Perfect Speaker Browser Test Complete!${NC}"
echo "═══════════════════════════════════════════════════════════════"


