#!/bin/bash

# ZANTARA Monitoring Cron Setup Script
# Part of ZANTARA-PERFECT-100 Release

echo "🚀 ZANTARA Monitoring Cron Setup"
echo "================================"

# Path to the monitoring script
MONITOR_SCRIPT="/Users/antonellosiano/Desktop/NUZANTARA-FLY/scripts/auto_monitor_zantara.js"
NODE_PATH="/usr/bin/node"

# Check if script exists
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "❌ Error: Monitor script not found at $MONITOR_SCRIPT"
    exit 1
fi

# Check if node exists
if [ ! -f "$NODE_PATH" ]; then
    # Try to find node in common locations
    NODE_PATH=$(which node)
    if [ -z "$NODE_PATH" ]; then
        echo "❌ Error: Node.js not found. Please install Node.js first."
        exit 1
    fi
    echo "✅ Found Node.js at: $NODE_PATH"
fi

# Create cron job entry
CRON_JOB="0 6 * * * $NODE_PATH $MONITOR_SCRIPT >> /tmp/ZANTARA_AUTOMONITOR_CRON.log 2>&1"

# Check if cron job already exists
crontab -l 2>/dev/null | grep -q "auto_monitor_zantara.js"
if [ $? -eq 0 ]; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove old cron job
    crontab -l 2>/dev/null | grep -v "auto_monitor_zantara.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# Verify installation
if crontab -l | grep -q "auto_monitor_zantara.js"; then
    echo "✅ Cron job successfully installed!"
    echo ""
    echo "📋 Cron Schedule:"
    echo "   Daily at 06:00 AM"
    echo ""
    echo "📁 Output locations:"
    echo "   Videos: /tmp/zantara_audit_videos/"
    echo "   Logs: /tmp/ZANTARA_AUTOMONITOR.log"
    echo "   Cron logs: /tmp/ZANTARA_AUTOMONITOR_CRON.log"
    echo ""
    echo "🔍 To view current cron jobs: crontab -l"
    echo "❌ To remove cron job: crontab -l | grep -v 'auto_monitor_zantara.js' | crontab -"
    echo ""

    # Create output directories
    mkdir -p /tmp/zantara_audit_videos
    touch /tmp/ZANTARA_AUTOMONITOR.log
    touch /tmp/ZANTARA_AUTOMONITOR_CRON.log

    echo "✅ All directories and log files created."
    echo ""
    echo "🎯 Setup complete! ZANTARA will be monitored daily at 06:00 AM."
else
    echo "❌ Failed to install cron job."
    exit 1
fi