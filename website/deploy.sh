#!/bin/bash

# Bali Zero Blog - One-Click Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: production, preview, development

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="balizero-blog"
DOMAIN="welcome.balizero.com"
ENVIRONMENT="${1:-production}"

echo -e "${GREEN}🚀 Bali Zero Blog Deployment${NC}"
echo -e "${YELLOW}Environment: ${ENVIRONMENT}${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Pre-flight checks
echo -e "\n${YELLOW}📋 Step 1: Pre-flight checks${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"

# Step 2: Install dependencies
echo -e "\n${YELLOW}📦 Step 2: Installing dependencies${NC}"
npm install --quiet
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Run type check
echo -e "\n${YELLOW}🔍 Step 3: Type checking${NC}"
npm run typecheck
echo -e "${GREEN}✅ Type check passed${NC}"

# Step 4: Build project
echo -e "\n${YELLOW}🏗️  Step 4: Building project${NC}"
npm run build
echo -e "${GREEN}✅ Build successful${NC}"

# Step 5: Test build locally
echo -e "\n${YELLOW}🧪 Step 5: Testing build locally${NC}"
echo "Starting local server on http://localhost:3000..."
echo "(Press Ctrl+C to continue to deployment)"

# Start server in background
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test homepage
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ Local build test passed${NC}"
else
    echo -e "${RED}❌ Local build test failed${NC}"
    kill $SERVER_PID
    exit 1
fi

# Kill test server
kill $SERVER_PID

# Step 6: Deploy to Vercel
echo -e "\n${YELLOW}🚀 Step 6: Deploying to Vercel${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

# Deploy based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to production (${DOMAIN})..."
    vercel --prod --yes
elif [ "$ENVIRONMENT" = "preview" ]; then
    echo "Deploying preview build..."
    vercel --yes
else
    echo "Deploying to development..."
    vercel --yes
fi

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${GREEN}🌐 Your site is live at:${NC}"
    echo -e "${GREEN}   https://${DOMAIN}${NC}"
    echo ""
    echo -e "${YELLOW}📊 Next steps:${NC}"
    echo "   1. Verify site loads: https://${DOMAIN}"
    echo "   2. Check Vercel Dashboard: https://vercel.com/dashboard"
    echo "   3. Monitor analytics"
    echo "   4. Test all article pages"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
