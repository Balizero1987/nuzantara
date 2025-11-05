#!/bin/bash
# Quick setup and run POC benchmark

set -e

echo "🚀 ZANTARA POC Benchmark Setup"
echo "================================"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your API keys:"
    echo "   - ANTHROPIC_API_KEY (get from https://console.anthropic.com/settings/keys)"
    echo "   - GOOGLE_API_KEY (get from https://aistudio.google.com/apikey)"
    echo ""
    echo "After adding keys, run: bash run_poc.sh"
    exit 1
fi

# Load .env
export $(cat .env | xargs)

# Check API keys
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set in .env"
    exit 1
fi

if [ -z "$GOOGLE_API_KEY" ]; then
    echo "❌ GOOGLE_API_KEY not set in .env"
    exit 1
fi

echo "✅ API keys found"

# Check Python dependencies
echo ""
echo "📦 Checking dependencies..."

if ! python3 -c "import anthropic" 2>/dev/null; then
    echo "Installing anthropic..."
    pip3 install anthropic
fi

if ! python3 -c "import google.generativeai" 2>/dev/null; then
    echo "Installing google-generativeai..."
    pip3 install google-generativeai
fi

echo "✅ Dependencies installed"

# Run benchmark
echo ""
echo "🧪 Starting POC benchmark (100 queries, ~5-10 minutes)..."
echo "================================"
echo ""

python3 gemini_vs_haiku_poc.py

echo ""
echo "✅ Benchmark completed!"
echo ""
echo "📊 Results saved to: benchmark_results_*.json"
echo ""
echo "📖 Next steps:"
echo "   1. Review benchmark summary above"
echo "   2. Check detailed results JSON file"
echo "   3. Decide: Gemini / Hybrid / Keep Haiku"
echo ""
