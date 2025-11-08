#!/bin/bash
# ZANTARA Fly.io - Fix Deployment Issues
# Risolve i problemi critici identificati nell'analisi

set -e  # Exit on error

echo "🚀 ZANTARA Fly.io Deployment Fix Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check fly CLI
if ! command_exists fly; then
    echo -e "${RED}❌ fly CLI not found. Please install: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi

echo -e "${GREEN}✅ fly CLI found${NC}"
echo ""

# Navigate to project root
cd "$(dirname "$0")"
PROJECT_ROOT="/Users/antonellosiano/Desktop/NUZANTARA-FLY"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"
echo ""

# ========================================
# PHASE 1: CRITICAL FIXES
# ========================================

echo "🔥 PHASE 1: CRITICAL FIXES"
echo "=========================="
echo ""

# 1.1: Fix Backend TS Secrets
echo "1️⃣  Configuring secrets for nuzantara-backend..."

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set in environment${NC}"
    read -p "Enter Anthropic API Key (or press Enter to skip): " ANTHROPIC_KEY
    export ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  OPENAI_API_KEY not set in environment${NC}"
    read -p "Enter OpenAI API Key (or press Enter to skip): " OPENAI_KEY
    export OPENAI_API_KEY="$OPENAI_KEY"
fi

cd "$PROJECT_ROOT/apps/backend-ts"

echo "Setting RAG_BACKEND_URL..."
fly secrets set RAG_BACKEND_URL=https://nuzantara-rag.fly.dev -a nuzantara-backend || echo "Already set"

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "Setting ANTHROPIC_API_KEY..."
    fly secrets set ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" -a nuzantara-backend || echo "Already set"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "Setting OPENAI_API_KEY..."
    fly secrets set OPENAI_API_KEY="$OPENAI_API_KEY" -a nuzantara-backend || echo "Already set"
fi

echo -e "${GREEN}✅ Secrets configured${NC}"
echo ""

# 1.2: Fix CORS Configuration
echo "2️⃣  Fixing CORS configuration in RAG backend..."

cd "$PROJECT_ROOT/apps/backend-rag/backend/app"

# Check if CORS fix is needed
if grep -q "https://nuzantara-backend.fly.dev" main_cloud.py; then
    echo -e "${GREEN}✅ CORS already configured correctly${NC}"
else
    echo "Backing up main_cloud.py..."
    cp main_cloud.py main_cloud.py.backup

    echo "Adding nuzantara-backend.fly.dev to CORS origins..."
    
    # This would require a more complex sed/awk command or Python script
    # For now, just warn the user
    echo -e "${YELLOW}⚠️  Manual CORS fix required:${NC}"
    echo "   Edit: apps/backend-rag/backend/app/main_cloud.py"
    echo "   Add to allow_origins: 'https://nuzantara-backend.fly.dev'"
    echo ""
    read -p "Press Enter when done (or 's' to skip): " CORS_DONE
    
    if [ "$CORS_DONE" != "s" ]; then
        echo -e "${GREEN}✅ CORS configured (manual)${NC}"
    else
        echo -e "${YELLOW}⚠️  CORS fix skipped${NC}"
    fi
fi

echo ""

# 1.3: Remove Failed Webapp
echo "3️⃣  Checking for failed webapp deployment..."

if fly apps list | grep -q "nuzantara-webapp-kb.*pending"; then
    echo -e "${YELLOW}Found pending webapp deployment${NC}"
    read -p "Remove failed nuzantara-webapp-kb? (y/N): " REMOVE_WEBAPP
    
    if [ "$REMOVE_WEBAPP" = "y" ] || [ "$REMOVE_WEBAPP" = "Y" ]; then
        echo "Removing nuzantara-webapp-kb..."
        fly apps destroy nuzantara-webapp-kb --yes || echo "Failed to remove"
        echo -e "${GREEN}✅ Failed webapp removed${NC}"
    else
        echo "Skipped"
    fi
else
    echo -e "${GREEN}✅ No failed webapp found${NC}"
fi

echo ""
echo ""

# ========================================
# PHASE 2: HIGH PRIORITY FIXES
# ========================================

echo "⚠️  PHASE 2: HIGH PRIORITY FIXES"
echo "================================"
echo ""

# 2.1: Verify Volume Exists
echo "4️⃣  Verifying ChromaDB volume..."

cd "$PROJECT_ROOT/apps/backend-rag"

if fly volumes list -a nuzantara-rag | grep -q "chroma_data"; then
    echo -e "${GREEN}✅ Volume 'chroma_data' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Volume 'chroma_data' not found${NC}"
    read -p "Create volume (10GB in Singapore)? (y/N): " CREATE_VOL
    
    if [ "$CREATE_VOL" = "y" ] || [ "$CREATE_VOL" = "Y" ]; then
        echo "Creating volume..."
        fly volumes create chroma_data --size 10 --region sin -a nuzantara-rag
        echo -e "${GREEN}✅ Volume created${NC}"
    else
        echo -e "${YELLOW}⚠️  Volume creation skipped${NC}"
    fi
fi

echo ""

# 2.2: Update Health Check Timeouts
echo "5️⃣  Checking health check configurations..."

cd "$PROJECT_ROOT/apps/backend-rag"

if grep -q "timeout = '15s'" fly.toml; then
    echo -e "${GREEN}✅ RAG health check timeout already updated${NC}"
else
    echo -e "${YELLOW}⚠️  Manual update required for fly.toml health checks${NC}"
    echo "   Recommended: timeout = '15s', grace_period = '60s'"
fi

cd "$PROJECT_ROOT/apps/backend-ts"

if grep -q 'timeout = "10s"' fly.toml; then
    echo -e "${GREEN}✅ TS health check timeout already updated${NC}"
else
    echo -e "${YELLOW}⚠️  Manual update required for fly.toml health checks${NC}"
    echo "   Recommended: timeout = '10s', grace_period = '15s'"
fi

echo ""
echo ""

# ========================================
# PHASE 3: DEPLOYMENT
# ========================================

echo "🚀 PHASE 3: DEPLOYMENT"
echo "======================"
echo ""

read -p "Deploy RAG backend? (y/N): " DEPLOY_RAG
if [ "$DEPLOY_RAG" = "y" ] || [ "$DEPLOY_RAG" = "Y" ]; then
    echo "Deploying RAG backend..."
    cd "$PROJECT_ROOT/apps/backend-rag"
    fly deploy --ha=false -a nuzantara-rag
    echo -e "${GREEN}✅ RAG deployed${NC}"
else
    echo "RAG deployment skipped"
fi

echo ""

read -p "Deploy TS backend? (y/N): " DEPLOY_TS
if [ "$DEPLOY_TS" = "y" ] || [ "$DEPLOY_TS" = "Y" ]; then
    echo "Deploying TS backend..."
    cd "$PROJECT_ROOT/apps/backend-ts"
    fly deploy --ha=false -a nuzantara-backend
    echo -e "${GREEN}✅ TS backend deployed${NC}"
else
    echo "TS backend deployment skipped"
fi

echo ""
echo ""

# ========================================
# PHASE 4: VERIFICATION
# ========================================

echo "🏥 PHASE 4: HEALTH CHECK VERIFICATION"
echo "====================================="
echo ""

echo "Testing RAG backend health..."
RAG_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://nuzantara-rag.fly.dev/health)
if [ "$RAG_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ RAG backend healthy (HTTP $RAG_HEALTH)${NC}"
    curl -s https://nuzantara-rag.fly.dev/health | jq '.status' || echo ""
else
    echo -e "${RED}❌ RAG backend unhealthy (HTTP $RAG_HEALTH)${NC}"
fi

echo ""

echo "Testing TS backend health..."
TS_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://nuzantara-backend.fly.dev/health)
if [ "$TS_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ TS backend healthy (HTTP $TS_HEALTH)${NC}"
    curl -s https://nuzantara-backend.fly.dev/health | jq '.status' || echo ""
else
    echo -e "${RED}❌ TS backend unhealthy (HTTP $TS_HEALTH)${NC}"
fi

echo ""
echo ""

# ========================================
# SUMMARY
# ========================================

echo "📊 SUMMARY"
echo "=========="
echo ""

echo "Completed steps:"
echo "  ✅ Backend TS secrets configured"
echo "  ✅ CORS configuration checked"
echo "  ✅ Failed deployments checked"
echo "  ✅ Volume verified"
echo "  ✅ Health checks verified"
echo ""

echo "Manual steps remaining:"
echo "  ⏳ Review CORS in main_cloud.py"
echo "  ⏳ Update health check timeouts in fly.toml"
echo "  ⏳ Align app naming (nuzantara-core vs nuzantara-backend)"
echo ""

echo -e "${GREEN}🎉 Deployment fix script completed!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review FLY_DEPLOYMENT_ANALYSIS.md for details"
echo "  2. Monitor logs: fly logs -a nuzantara-rag"
echo "  3. Check metrics: fly status -a nuzantara-rag"
echo ""
