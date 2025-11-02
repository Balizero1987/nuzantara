#!/bin/bash
################################################################################
# Uninstall ZANTARA Bridge LaunchAgent
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

LAUNCHD_DIR="$HOME/Library/LaunchAgents"

echo -e "${BLUE}Stopping and unloading LaunchAgents...${NC}"

launchctl unload "$LAUNCHD_DIR/com.zantara.bridge.server.plist" 2>/dev/null || true
launchctl unload "$LAUNCHD_DIR/com.zantara.bridge.watcher.plist" 2>/dev/null || true

echo -e "${BLUE}Removing plist files...${NC}"

rm -f "$LAUNCHD_DIR/com.zantara.bridge.server.plist"
rm -f "$LAUNCHD_DIR/com.zantara.bridge.watcher.plist"

echo -e "${GREEN}✓ LaunchAgents uninstalled${NC}"
echo "You can now start the bridge manually with: ./run.sh"
