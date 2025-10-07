#!/bin/bash
# THE SCRAPING - Quick Setup Script
# Run this to set up the environment quickly

echo "🚀 THE SCRAPING - Quick Setup"
echo "================================"
echo ""

# Check Python version
echo "✓ Checking Python version..."
python3 --version || { echo "❌ Python 3 not found. Please install Python 3.8+"; exit 1; }

# Create virtual environment (optional but recommended)
echo ""
read -p "📦 Create virtual environment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating venv..."
    python3 -m venv venv
    source venv/bin/activate
    echo "✅ Virtual environment created and activated"
fi

# Install Python packages
echo ""
echo "📦 Installing Python packages..."
pip install -r requirements.txt

# Install Playwright browsers
echo ""
echo "🎭 Installing Playwright browsers..."
playwright install

# Check Ollama installation
echo ""
echo "🦙 Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama found"
    
    # Check if llama3.2 is installed
    if ollama list | grep -q "llama3.2"; then
        echo "✅ LLAMA 3.2 model found"
    else
        echo "📥 Pulling LLAMA 3.2 model (this may take a few minutes)..."
        ollama pull llama3.2:3b
    fi
else
    echo "⚠️  Ollama not found. Please install from: https://ollama.ai/download"
    echo "   After installing, run: ollama pull llama3.2:3b"
fi

# Setup .env file
echo ""
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created from template"
    echo "⚠️  Please edit .env and add your ANTHROPIC_API_KEY"
else
    echo "✓ .env file already exists"
fi

# Check API key
echo ""
if grep -q "sk-ant-your-key-here" .env 2>/dev/null || ! grep -q "ANTHROPIC_API_KEY=" .env 2>/dev/null; then
    echo "⚠️  ANTHROPIC_API_KEY not configured in .env"
    read -p "Enter your Anthropic API key (or press Enter to skip): " api_key
    if [ ! -z "$api_key" ]; then
        sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
        echo "✅ API key saved to .env"
    else
        echo "⏭️  Skipped. You can add it later to .env"
    fi
else
    echo "✅ ANTHROPIC_API_KEY found in .env"
fi

# Create directory structure
echo ""
echo "📁 Creating directory structure..."
mkdir -p logs data/articles data/rag_ready data/reviewed data/social_media data/chromadb

# Verify INTEL_SCRAPING folders exist
if [ -d "INTEL_SCRAPING" ]; then
    echo "✅ INTEL_SCRAPING directory found"
else
    echo "⚠️  Creating INTEL_SCRAPING directories..."
    mkdir -p INTEL_SCRAPING/{immigration,business_bkpm,real_estate,events_culture,social_media,competitors,general_news,health_wellness,tax_djp,jobs,lifestyle,ai_tech_global,dev_code_library,future_trends}
fi

echo ""
echo "================================"
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify .env has your ANTHROPIC_API_KEY"
echo "   2. Run a test: python master_orchestrator.py --full --test"
echo "   3. Check logs/ for results"
echo ""
echo "💡 Quick commands:"
echo "   Full run:  python master_orchestrator.py --full"
echo "   Test run:  python master_orchestrator.py --full --test"
echo "   Stage 1:   python master_orchestrator.py --stage 1"
echo ""
echo "📚 Read README.md for full documentation"
echo "================================"
