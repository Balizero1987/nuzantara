#!/bin/bash

# 🤖 ZANTARA Self-Healing System - Automated Deployment Script

set -e

echo "🤖 ZANTARA Self-Healing System Deployment"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v fly &> /dev/null; then
    echo -e "${RED}❌ Fly.io CLI not found. Install: https://fly.io/docs/hands-on/install-flyctl/${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️ jq not found. Install for better output: brew install jq${NC}"
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Step 1: Deploy Orchestrator
echo "🧠 Step 1: Deploying Central Orchestrator..."
echo "--------------------------------------------"

cd orchestrator

# Check if app exists
if ! fly apps list | grep -q "nuzantara-orchestrator"; then
    echo "Creating new Fly.io app..."
    fly apps create nuzantara-orchestrator --org personal
fi

# Set secrets (prompt if not set)
if ! fly secrets list -a nuzantara-orchestrator | grep -q "OPENAI_API_KEY"; then
    echo -e "${YELLOW}⚠️ OPENAI_API_KEY not set${NC}"
    read -p "Enter OpenAI API Key: " OPENAI_KEY
    fly secrets set OPENAI_API_KEY="$OPENAI_KEY" -a nuzantara-orchestrator
fi

# Deploy
echo "Deploying orchestrator..."
fly deploy -a nuzantara-orchestrator

# Wait for deployment
echo "Waiting for orchestrator to start..."
sleep 10

# Health check
echo "Running health check..."
HEALTH=$(curl -s https://nuzantara-orchestrator.fly.dev/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Orchestrator deployed successfully${NC}"
else
    echo -e "${RED}❌ Orchestrator health check failed${NC}"
    echo "$HEALTH"
    exit 1
fi

cd ..
echo ""

# Step 2: Deploy Frontend Agent
echo "🌐 Step 2: Deploying Frontend Agent..."
echo "--------------------------------------"

# Create directory if not exists
mkdir -p ../webapp/js/self-healing

# Copy agent
cp agents/frontend-agent.js ../webapp/js/self-healing/

# Check if already integrated in chat.html
if ! grep -q "frontend-agent.js" ../webapp/chat.html; then
    echo -e "${YELLOW}⚠️ Frontend agent not integrated in chat.html${NC}"
    echo "Add this line before </body>:"
    echo '<script type="module" src="js/self-healing/frontend-agent.js"></script>'
    read -p "Press Enter to continue after adding..."
else
    echo -e "${GREEN}✅ Frontend agent already integrated${NC}"
fi

echo ""

# Step 3: Deploy Backend Agents
echo "⚙️ Step 3: Deploying Backend Agents..."
echo "--------------------------------------"

# RAG Service
if [ -d "../backend-rag" ]; then
    echo "Integrating agent into RAG service..."
    mkdir -p ../backend-rag/backend/self_healing
    cp agents/backend_agent.py ../backend-rag/backend/self_healing/
    touch ../backend-rag/backend/self_healing/__init__.py

    # Check if requirements updated
    if ! grep -q "psutil" ../backend-rag/requirements.txt; then
        echo "Updating requirements.txt..."
        cat agents/requirements.txt >> ../backend-rag/requirements.txt
    fi

    echo -e "${GREEN}✅ RAG agent integrated${NC}"
else
    echo -e "${YELLOW}⚠️ RAG service not found${NC}"
fi

# Memory Service
if [ -d "../memory-service" ]; then
    echo "Integrating agent into Memory service..."
    mkdir -p ../memory-service/src/self_healing
    cp agents/backend_agent.py ../memory-service/src/self_healing/
    touch ../memory-service/src/self_healing/__init__.py

    echo -e "${GREEN}✅ Memory agent integrated${NC}"
else
    echo -e "${YELLOW}⚠️ Memory service not found${NC}"
fi

echo ""

# Step 4: Test Deployment
echo "🧪 Step 4: Testing Deployment..."
echo "-------------------------------"

echo "Testing orchestrator API..."
STATUS=$(curl -s https://nuzantara-orchestrator.fly.dev/api/status)
if [ -n "$STATUS" ]; then
    echo -e "${GREEN}✅ Orchestrator API responding${NC}"

    if command -v jq &> /dev/null; then
        echo ""
        echo "System Status:"
        echo "$STATUS" | jq '.system_state'
    fi
else
    echo -e "${RED}❌ Orchestrator API not responding${NC}"
fi

echo ""

# Summary
echo "======================================"
echo "🎉 Deployment Complete!"
echo "======================================"
echo ""
echo "📊 URLs:"
echo "  Orchestrator: https://nuzantara-orchestrator.fly.dev"
echo "  Health Check: https://nuzantara-orchestrator.fly.dev/api/health"
echo "  Status API:   https://nuzantara-orchestrator.fly.dev/api/status"
echo ""
echo "🔍 Monitoring:"
echo "  Orchestrator logs: fly logs -a nuzantara-orchestrator"
echo "  Backend logs:      fly logs -a nuzantara-rag | grep 'Backend Agent'"
echo "  Frontend logs:     Browser console -> Filter: [Frontend Agent]"
echo ""
echo "🧪 Testing:"
echo "  Frontend: Open webapp and type getAgentStatus() in console"
echo "  Backend:  fly logs -a nuzantara-rag | grep 'Backend Agent'"
echo "  API:      curl https://nuzantara-orchestrator.fly.dev/api/status"
echo ""
echo "📚 Documentation:"
echo "  See DEPLOYMENT.md for detailed guide"
echo "  See README.md for architecture overview"
echo ""
echo -e "${GREEN}✅ System is ready for autonomous healing!${NC}"
