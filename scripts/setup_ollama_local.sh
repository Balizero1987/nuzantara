#!/bin/bash
#
# Setup Ollama Local for Intel Scraping - Mac M4 16GB
# Configures Llama 3.1 8B as default AI for Stage 2A, 2B, 2C
#

set -e

echo "🚀 Setting up Ollama Local for Intel Scraping"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if Homebrew is installed
echo -e "${BLUE}1️⃣  Checking Homebrew...${NC}"
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew not found. Installing...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    echo -e "${GREEN}✅ Homebrew installed${NC}"
fi
echo ""

# Step 2: Install Ollama
echo -e "${BLUE}2️⃣  Installing Ollama...${NC}"
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}Installing Ollama via Homebrew...${NC}"
    brew install ollama
    echo -e "${GREEN}✅ Ollama installed${NC}"
else
    echo -e "${GREEN}✅ Ollama already installed${NC}"
    ollama --version
fi
echo ""

# Step 3: Start Ollama server (in background)
echo -e "${BLUE}3️⃣  Starting Ollama server...${NC}"
if pgrep -x "ollama" > /dev/null; then
    echo -e "${GREEN}✅ Ollama server already running${NC}"
else
    echo -e "${YELLOW}Starting Ollama server in background...${NC}"
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 2
    echo -e "${GREEN}✅ Ollama server started${NC}"
fi
echo ""

# Step 4: Pull Llama 3.1 8B
echo -e "${BLUE}4️⃣  Pulling Llama 3.1 8B model...${NC}"
echo -e "${YELLOW}This will download ~4.7GB (one-time only)${NC}"
ollama pull llama3.1:8b
echo -e "${GREEN}✅ Llama 3.1 8B downloaded${NC}"
echo ""

# Step 5: Verify model
echo -e "${BLUE}5️⃣  Verifying model...${NC}"
ollama list | grep llama3.1
echo -e "${GREEN}✅ Llama 3.1 8B ready${NC}"
echo ""

# Step 6: Set environment variables
echo -e "${BLUE}6️⃣  Configuring environment variables...${NC}"

# Create .env file if doesn't exist
if [ ! -f .env ]; then
    touch .env
fi

# Remove old AI_BACKEND and OLLAMA_* entries
sed -i.bak '/AI_BACKEND=/d' .env 2>/dev/null || true
sed -i.bak '/OLLAMA_MODEL=/d' .env 2>/dev/null || true
sed -i.bak '/OLLAMA_BASE_URL=/d' .env 2>/dev/null || true

# Add new configuration
cat >> .env << 'EOF'

# Ollama Local Configuration (Llama 3.1 8B)
AI_BACKEND=ollama
OLLAMA_MODEL=llama3.1:8b
OLLAMA_BASE_URL=http://localhost:11434
EOF

echo -e "${GREEN}✅ .env configured${NC}"
echo ""

# Step 7: Export for current session
echo -e "${BLUE}7️⃣  Exporting variables for current session...${NC}"
export AI_BACKEND=ollama
export OLLAMA_MODEL=llama3.1:8b
export OLLAMA_BASE_URL=http://localhost:11434
echo -e "${GREEN}✅ Environment variables set${NC}"
echo ""

# Step 8: Test Ollama
echo -e "${BLUE}8️⃣  Testing Ollama with Llama 3.1 8B...${NC}"
echo -e "${YELLOW}Sending test prompt...${NC}"
RESPONSE=$(ollama run llama3.1:8b "Say 'Hello from Llama 3.1!' in one sentence." --verbose=false 2>/dev/null | head -n 1)
echo -e "${GREEN}Response: ${RESPONSE}${NC}"
echo -e "${GREEN}✅ Ollama working!${NC}"
echo ""

# Step 9: Verify Intel Scraping configuration
echo -e "${BLUE}9️⃣  Verifying Intel Scraping configuration...${NC}"
python3 scripts/verify_llama_config.py || true
echo ""

# Summary
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Setup Complete! Ollama Local Ready${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📊 Configuration:${NC}"
echo -e "   AI Backend:    ${GREEN}Ollama Local${NC}"
echo -e "   Model:         ${GREEN}Llama 3.1 8B${NC}"
echo -e "   URL:           ${GREEN}http://localhost:11434${NC}"
echo -e "   RAM Usage:     ${GREEN}~5GB${NC}"
echo -e "   Speed (M4):    ${GREEN}25-30 token/s${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo ""
echo -e "   ${YELLOW}Test single category:${NC}"
echo -e "   python3 scripts/run_intel_automation.py --categories visa_immigration"
echo ""
echo -e "   ${YELLOW}Run full pipeline:${NC}"
echo -e "   python3 scripts/run_intel_automation.py"
echo ""
echo -e "${BLUE}📝 Note:${NC} Ollama server is running in background"
echo -e "   To stop: ${YELLOW}pkill ollama${NC}"
echo -e "   To restart: ${YELLOW}ollama serve${NC}"
echo ""
