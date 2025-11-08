#!/bin/bash
set -e

echo "🚀 ZANTARA Webapp Deployment Script"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "login.html" ] || [ ! -f "chat.html" ]; then
  echo -e "${RED}❌ Error: Must run from apps/webapp directory${NC}"
  exit 1
fi

# Check git status
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Warning: Uncommitted changes detected${NC}"
  git status --short
  echo ""
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
  fi
fi

# Get current commit
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --pretty=%B)

echo -e "${GREEN}📝 Deploying commit: $COMMIT_HASH${NC}"
echo "   Message: $COMMIT_MSG"
echo ""

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."

# Check required files exist
REQUIRED_FILES=(
  "login.html"
  "chat.html"
  "js/auth-auto-login.js"
  "js/message-search.js"
  "js/conversation-client.js"
  "js/app.js"
)

MISSING_FILES=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ Missing: $file${NC}"
    MISSING_FILES=1
  else
    echo -e "${GREEN}✅ Found: $file${NC}"
  fi
done

if [ $MISSING_FILES -eq 1 ]; then
  echo -e "${RED}❌ Missing required files. Deployment aborted.${NC}"
  exit 1
fi

echo ""
echo "🌍 Deploying to Cloudflare Pages..."

# Deploy with wrangler
npx wrangler pages deploy . \
  --project-name=zantara-v4 \
  --branch=main \
  --commit-hash="$COMMIT_HASH" \
  --commit-message="$COMMIT_MSG" \
  --commit-dirty=true

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ Deployment successful!${NC}"
  echo ""
  echo "🔗 URLs:"
  echo "   Production: https://zantara.balizero.com"
  echo "   Latest deploy: Check wrangler output above"
  echo ""
  echo "⏱️  Cache propagation: ~2-5 minutes"
  echo ""
  echo -e "${YELLOW}💡 Tip: Test on deploy URL first, then wait for production cache refresh${NC}"
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi
