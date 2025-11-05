#!/bin/bash
echo "🔑 Opening API key consoles in browser..."
echo ""
echo "1️⃣ Anthropic Console (Claude API)"
open https://console.anthropic.com/settings/keys
sleep 2

echo "2️⃣ Google AI Studio (Gemini API)"
open https://aistudio.google.com/apikey
sleep 1

echo ""
echo "✅ Both consoles opened in browser"
echo ""
echo "After getting your API keys:"
echo "  1. Edit .env file: nano .env"
echo "  2. Paste your keys"
echo "  3. Run: bash run_poc.sh"
