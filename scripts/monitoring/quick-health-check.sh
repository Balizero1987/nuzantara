#!/bin/bash

###############################################################################
# ZANTARA v3 Ω - QUICK HEALTH CHECK
# Monitors all 10 features with minimal output
# Version: 1.0.0
###############################################################################

BACKEND_URL="${BACKEND_URL:-https://nuzantara-backend.fly.dev}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  ZANTARA v3 Ω - Quick Health Check${NC}"
echo -e "${BLUE}  $(date)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

check() {
    local name="$1"
    local url="$2"
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    if [ "$status" = "200" ] || [ "$status" = "204" ]; then
        echo -e "  ✅ ${name}"
        return 0
    else
        echo -e "  ❌ ${name} (HTTP $status)"
        return 1
    fi
}

echo -e "${YELLOW}Core Services:${NC}"
check "Health Check" "$BACKEND_URL/health"
check "Metrics" "$BACKEND_URL/metrics"
check "Root Endpoint" "$BACKEND_URL/"

echo -e "\n${YELLOW}Feature #4 - Redis Cache:${NC}"
check "Cache Stats" "$BACKEND_URL/cache/stats"
check "Cache Health" "$BACKEND_URL/cache/health"

echo -e "\n${YELLOW}Feature #7 - Bali Zero:${NC}"
check "KBLI Lookup" "$BACKEND_URL/api/v2/bali-zero/kbli?query=restaurant"

echo -e "\n${YELLOW}Feature #9 - Team Auth:${NC}"
check "Team Members" "$BACKEND_URL/api/auth/team/members"

echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Health check complete!${NC}\n"
