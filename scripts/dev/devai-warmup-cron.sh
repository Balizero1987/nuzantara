#!/bin/bash
#
# DevAI Warm-up Cron Job
# Keeps RunPod workers alive by pinging every 90 seconds
# Prevents cold starts (30-60s delay)
#
# Installation:
# 1. Make executable: chmod +x scripts/devai-warmup-cron.sh
# 2. Add to crontab: crontab -e
# 3. Add line: */2 * * * * /Users/antonellosiano/Desktop/NUZANTARA-2/scripts/devai-warmup-cron.sh >> /tmp/devai-warmup.log 2>&1
#
# (*/2 = every 2 minutes, which is 120s, just under the 120s idle timeout)

API_URL="https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app/call"
API_KEY="zantara-internal-dev-key-2025"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] DevAI warm-up ping..."

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{"key":"devai.warmup"}')

STATUS=$(echo "$RESPONSE" | jq -r '.ok // "error"')

if [ "$STATUS" = "true" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ DevAI warm (worker ready)"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  DevAI warmup failed: $RESPONSE"
fi

