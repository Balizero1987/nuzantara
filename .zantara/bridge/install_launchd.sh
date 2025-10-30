#!/bin/bash
################################################################################
# Install ZANTARA Bridge as macOS LaunchAgent
# This will auto-start bridge server and watcher at login
################################################################################

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BRIDGE_DIR="/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/.zantara/bridge"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ZANTARA Bridge - LaunchAgent Installation                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create LaunchAgents directory if not exists
mkdir -p "$LAUNCHD_DIR"

# Create plist for bridge server
echo -e "${BLUE}➤ Creating LaunchAgent for Bridge Server...${NC}"
cat > "$LAUNCHD_DIR/com.zantara.bridge.server.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zantara.bridge.server</string>

    <key>ProgramArguments</key>
    <array>
        <string>$BRIDGE_DIR/../../.venv/bin/python</string>
        <string>$BRIDGE_DIR/bridge_server.py</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$BRIDGE_DIR</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$BRIDGE_DIR/logs/server_launchd.log</string>

    <key>StandardErrorPath</key>
    <string>$BRIDGE_DIR/logs/server_launchd_error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

# Create plist for bridge watcher
echo -e "${BLUE}➤ Creating LaunchAgent for Bridge Watcher...${NC}"
cat > "$LAUNCHD_DIR/com.zantara.bridge.watcher.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zantara.bridge.watcher</string>

    <key>ProgramArguments</key>
    <array>
        <string>$BRIDGE_DIR/../../.venv/bin/python</string>
        <string>$BRIDGE_DIR/bridge_watcher.py</string>
    </array>

    <key>WorkingDirectory</key>
    <string>$BRIDGE_DIR</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$BRIDGE_DIR/logs/watcher_launchd.log</string>

    <key>StandardErrorPath</key>
    <string>$BRIDGE_DIR/logs/watcher_launchd_error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

# Load LaunchAgents
echo -e "${BLUE}➤ Loading LaunchAgents...${NC}"
launchctl load "$LAUNCHD_DIR/com.zantara.bridge.server.plist" 2>/dev/null || true
launchctl load "$LAUNCHD_DIR/com.zantara.bridge.watcher.plist" 2>/dev/null || true

# Wait a bit for services to start
sleep 2

# Check if services are running
echo ""
echo -e "${BLUE}➤ Checking services status...${NC}"

if launchctl list | grep -q "com.zantara.bridge.server"; then
    echo -e "${GREEN}✓ Bridge Server is running${NC}"
else
    echo -e "${YELLOW}⚠ Bridge Server not running${NC}"
fi

if launchctl list | grep -q "com.zantara.bridge.watcher"; then
    echo -e "${GREEN}✓ Bridge Watcher is running${NC}"
else
    echo -e "${YELLOW}⚠ Bridge Watcher not running${NC}"
fi

# Test server
echo ""
echo -e "${BLUE}➤ Testing bridge server...${NC}"
if curl -s http://127.0.0.1:5050/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Bridge server is responding${NC}"
else
    echo -e "${YELLOW}⚠ Bridge server not responding (may need a moment to start)${NC}"
fi

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Installation Complete!                                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "The bridge will now start automatically at login."
echo ""
echo "Useful commands:"
echo "  Check status:   launchctl list | grep zantara"
echo "  Stop services:  ./uninstall_launchd.sh"
echo "  View logs:      tail -f logs/server_launchd.log"
echo ""
