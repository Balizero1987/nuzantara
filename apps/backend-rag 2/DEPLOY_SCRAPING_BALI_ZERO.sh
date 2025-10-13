#!/bin/bash
# 🚀 ZANTARA - Backend Scraping + Bali Zero Deployment Script

set -e  # Exit on error

echo "🚀 ZANTARA Backend Scraping + Bali Zero Deployment"
echo "===================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check API keys
echo -e "\n${BLUE}[1/7]${NC} Checking API keys..."
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not set${NC}"
    echo "   Get key from: https://makersuite.google.com/app/apikey"
    echo "   Set: export GEMINI_API_KEY='your-key'"
else
    echo -e "${GREEN}✅ GEMINI_API_KEY found${NC}"
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set${NC}"
    echo "   Get key from: https://console.anthropic.com/"
    echo "   Set: export ANTHROPIC_API_KEY='your-key'"
else
    echo -e "${GREEN}✅ ANTHROPIC_API_KEY found${NC}"
fi

# Step 2: Verify dependencies
echo -e "\n${BLUE}[2/7]${NC} Verifying Python dependencies..."
REQUIRED_PACKAGES="google-generativeai anthropic beautifulsoup4 chromadb loguru schedule sentence-transformers"
MISSING=""

for pkg in $REQUIRED_PACKAGES; do
    if ! pip3 show "$pkg" > /dev/null 2>&1; then
        MISSING="$MISSING $pkg"
    fi
done

if [ -n "$MISSING" ]; then
    echo -e "${YELLOW}Installing missing packages:$MISSING${NC}"
    pip3 install -q $MISSING
fi
echo -e "${GREEN}✅ All dependencies OK${NC}"

# Step 3: Verify file structure
echo -e "\n${BLUE}[3/7]${NC} Verifying file structure..."
FILES=(
    "backend/scrapers/immigration_scraper.py"
    "backend/llm/anthropic_client.py"
    "backend/llm/bali_zero_router.py"
    "backend/llm/__init__.py"
    "backend/bali_zero_rag.py"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "   ${GREEN}✓${NC} $file"
    else
        echo -e "   ${RED}✗${NC} $file (missing)"
        exit 1
    fi
done

# Step 4: Test imports
echo -e "\n${BLUE}[4/7]${NC} Testing Python imports..."
python3 << 'EOF'
try:
    from backend.scrapers.immigration_scraper import ImmigrationScraper
    from backend.llm.anthropic_client import AnthropicClient
    from backend.llm.bali_zero_router import BaliZeroRouter
    from backend.bali_zero_rag import BaliZeroRAG
    print("✅ All imports OK")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)
EOF

# Step 5: Run scraper (if API key set)
if [ -n "$GEMINI_API_KEY" ]; then
    echo -e "\n${BLUE}[5/7]${NC} Running immigration scraper (test mode)..."
    echo "   This will scrape T1/T2/T3 sources and analyze with Gemini Flash"
    echo "   Estimated time: 5-10 minutes"
    echo ""
    read -p "   Run scraper now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 backend/scrapers/immigration_scraper.py --mode once
        echo -e "${GREEN}✅ Scraper completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipped. Run manually: python3 backend/scrapers/immigration_scraper.py --mode once${NC}"
    fi
else
    echo -e "\n${BLUE}[5/7]${NC} ${YELLOW}Skipping scraper (GEMINI_API_KEY not set)${NC}"
fi

# Step 6: Check ChromaDB
echo -e "\n${BLUE}[6/7]${NC} Checking immigration KB status..."
if [ -d "data/immigration_kb" ]; then
    python3 << 'EOF'
import chromadb
try:
    client = chromadb.PersistentClient('./data/immigration_kb')
    for tier in ['t1', 't2', 't3']:
        col = client.get_collection(f'immigration_{tier}')
        print(f"   {tier.upper()}: {col.count()} documents")
except Exception as e:
    print(f"   ⚠️  KB not populated yet (run scraper first)")
EOF
else
    echo "   ⚠️  KB directory not found (run scraper first)"
fi

# Step 7: Summary
echo -e "\n${BLUE}[7/7]${NC} Deployment summary"
echo "===================================================="
echo -e "${GREEN}✅ File structure${NC} - All files present"
echo -e "${GREEN}✅ Dependencies${NC} - All packages installed"
echo -e "${GREEN}✅ Imports${NC} - All modules OK"

if [ -n "$GEMINI_API_KEY" ]; then
    echo -e "${GREEN}✅ Gemini API${NC} - Key configured"
else
    echo -e "${YELLOW}⚠️  Gemini API${NC} - Key not set"
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "${GREEN}✅ Anthropic API${NC} - Key configured"
else
    echo -e "${YELLOW}⚠️  Anthropic API${NC} - Key not set"
fi

echo ""
echo "🎯 Next steps:"
echo ""
echo "   1. Set API keys (if not done):"
echo "      export GEMINI_API_KEY='...'"
echo "      export ANTHROPIC_API_KEY='...'"
echo ""
echo "   2. Run scraper (if not done):"
echo "      python3 backend/scrapers/immigration_scraper.py --mode once"
echo ""
echo "   3. Update backend/app/main.py:"
echo "      Add Bali Zero endpoint (see ZANTARA_SCRAPING_BALI_ZERO_COMPLETE.md Step 5)"
echo ""
echo "   4. Start server:"
echo "      cd backend && uvicorn app.main:app --reload --port 8000"
echo ""
echo "   5. Test:"
echo "      curl -X POST http://localhost:8000/bali-zero/chat -d '{\"query\":\"KITAS?\"}'"
echo ""
echo -e "${GREEN}🎉 Backend Scraping + Bali Zero ready!${NC}"