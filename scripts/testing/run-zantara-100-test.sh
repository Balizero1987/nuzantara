#!/bin/bash

# 🎯 ZANTARA 100 Questions Test Runner
# Esegue il test completo con browser visibile su Mac

echo "🚀 Starting ZANTARA 100 Questions Test..."
echo "📋 Test details:"
echo "   - 102 questions total (100 + 2 bonus)"
echo "   - User: Krisna (krisna@balizero.com)"
echo "   - Language: Bahasa Indonesia"
echo "   - Browser: Chromium (visible)"
echo "   - Timeout: NONE (unlimited)"
echo "   - Speed: Human-like (500ms slowMo)"
echo "   - Viewport: 1400x900 (Mac optimized)"
echo ""
echo "⏱️  Estimated duration: 45-60 minutes"
echo ""

# Navigate to project root
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run the test
echo "▶️  Starting test in 3 seconds..."
sleep 3

npx playwright test e2e-tests/zantara-100-questions-krisna.spec.ts \
  --project=chromium \
  --headed \
  --reporter=list \
  --debug

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ TEST COMPLETATO CON SUCCESSO!"
    echo ""
    echo "📊 Per vedere il report HTML:"
    echo "   npx playwright show-report"
else
    echo ""
    echo "❌ TEST FALLITO - Controlla i log sopra"
    echo ""
    echo "🔍 Debug suggestions:"
    echo "   1. Verifica che https://zantara.balizero.com sia online"
    echo "   2. Controlla che le credenziali Krisna siano corrette"
    echo "   3. Verifica SSE streaming funzionante"
    echo "   4. Controlla Fly.io backend status"
fi

echo ""
echo "📁 Test results salvati in: test-results/"
echo "📊 HTML report disponibile: playwright-report/"
