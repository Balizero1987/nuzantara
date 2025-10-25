---
name: intel-status
description: Check Intel Scraping system health and recent activity
---

Show current Intel Scraping system status:

```bash
cd /Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/website/INTEL_SCRAPING

# Show health status
if [ -f "HEALTH.md" ]; then
  echo "📊 INTEL SCRAPING - SYSTEM HEALTH"
  echo "=================================="
  cat HEALTH.md
else
  echo "⚠️  Health check file not found. Run the orchestrator first."
fi

echo ""
echo "📋 RECENT LOGS (Last 30 lines)"
echo "=================================="

# Find most recent log file
LATEST_LOG=$(ls -t logs/*.log 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
  tail -30 "$LATEST_LOG"
else
  echo "⚠️  No log files found."
fi

echo ""
echo "📁 DATA DIRECTORIES"
echo "=================================="
echo "Recent raw data:"
ls -lt data/raw/ 2>/dev/null | head -5 || echo "  No raw data found"

echo ""
echo "Recent processed data:"
ls -lt data/processed/ 2>/dev/null | head -5 || echo "  No processed data found"
```

Quick status check for debugging and monitoring.
