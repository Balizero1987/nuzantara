#!/bin/bash
# Quick launcher for Zantara AutoFix

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🤖 Zantara AutoFix Launcher${NC}\n"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}❌ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Check ANTHROPIC_API_KEY
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  ANTHROPIC_API_KEY not set${NC}"
    echo "You can set it with:"
    echo "  export ANTHROPIC_API_KEY='your-key-here'"
    echo ""
    read -p "Enter your Claude API key (or press Enter to skip): " api_key
    if [ -n "$api_key" ]; then
        export ANTHROPIC_API_KEY="$api_key"
    else
        echo -e "${YELLOW}❌ Cannot proceed without API key${NC}"
        exit 1
    fi
fi

# Check/install dependencies
if ! python3 -c "import anthropic" &> /dev/null; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    pip install -r "$(dirname "$0")/requirements.txt"
fi

# Run orchestrator
echo -e "${GREEN}🚀 Starting AutoFix...${NC}\n"
python3 "$(dirname "$0")/orchestrator.py" "$@"
