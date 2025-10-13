#!/bin/bash
# Manual sync webapp to GitHub Pages (one-time use until auto-sync is configured)

set -e

echo "🔄 Manual Webapp Sync to GitHub Pages"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
MONOREPO_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
WEBAPP_REPO="https://github.com/Balizero1987/zantara_webapp.git"
TEMP_DIR="/tmp/zantara-webapp-sync-$$"

echo -e "${BLUE}📍 Monorepo:${NC} $MONOREPO_DIR"
echo -e "${BLUE}📍 Target:${NC} $WEBAPP_REPO"
echo ""

# Step 1: Clone target repo
echo -e "${YELLOW}⏳ Step 1/5: Cloning target repository...${NC}"
git clone --depth 1 "$WEBAPP_REPO" "$TEMP_DIR"
cd "$TEMP_DIR"
echo -e "${GREEN}✅ Cloned to: $TEMP_DIR${NC}"
echo ""

# Step 2: Clear target (except .git)
echo -e "${YELLOW}⏳ Step 2/5: Clearing target directory...${NC}"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
echo -e "${GREEN}✅ Target cleared${NC}"
echo ""

# Step 3: Copy webapp files
echo -e "${YELLOW}⏳ Step 3/5: Copying webapp files from monorepo...${NC}"
cp -r "$MONOREPO_DIR/apps/webapp/"* .
echo -e "${GREEN}✅ Webapp files copied${NC}"

# Copy production HTML as index.html
if [ -f "$MONOREPO_DIR/static/zantara-production.html" ]; then
    cp "$MONOREPO_DIR/static/zantara-production.html" ./index.html
    echo -e "${GREEN}✅ Production HTML copied as index.html${NC}"
fi
echo ""

# Add deployment marker
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SOURCE_COMMIT=$(cd "$MONOREPO_DIR" && git rev-parse --short HEAD)
echo "<!-- Deployed: $TIMESTAMP -->" >> index.html
echo "<!-- Source: https://github.com/Balizero1987/nuzantara/commit/$SOURCE_COMMIT -->" >> index.html
echo -e "${GREEN}✅ Added deployment timestamp${NC}"
echo ""

# Step 4: Check for changes
echo -e "${YELLOW}⏳ Step 4/5: Checking for changes...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${BLUE}ℹ️ No changes to sync. Webapp is already up to date.${NC}"
    rm -rf "$TEMP_DIR"
    exit 0
fi

git status --short
echo -e "${GREEN}✅ Changes detected${NC}"
echo ""

# Step 5: Commit and push
echo -e "${YELLOW}⏳ Step 5/5: Committing and pushing changes...${NC}"

git config user.name "ZANTARA Manual Sync"
git config user.email "noreply@zantara.balizero.com"

COMMIT_MSG="sync: manual update from monorepo @ $TIMESTAMP

Source commit: $SOURCE_COMMIT
Synced by: scripts/sync-webapp-manual.sh

🔧 Manual sync (before auto-sync setup)"

git add .
git commit -m "$COMMIT_MSG"

echo ""
echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"
git push origin main

echo -e "${GREEN}✅ Successfully pushed to zantara_webapp repository${NC}"
echo ""

# Cleanup
cd /
rm -rf "$TEMP_DIR"
echo -e "${GREEN}✅ Cleaned up temporary directory${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✅ Sync Complete!${NC}"
echo ""
echo "📍 Live URLs (will update in 2-3 minutes):"
echo "   - https://zantara.balizero.com/"
echo "   - https://balizero1987.github.io/zantara_webapp/"
echo ""
echo "🔍 Verify deployment:"
echo "   curl -s https://zantara.balizero.com/ | grep 'Deployed:'"
echo ""
echo "📊 GitHub Pages deployments:"
echo "   https://github.com/Balizero1987/zantara_webapp/deployments"
echo ""
echo -e "${BLUE}💡 Next step: Setup auto-sync (see .github/workflows/WEBAPP_SYNC_SETUP.md)${NC}"
