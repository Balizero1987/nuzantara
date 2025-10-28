#!/bin/bash

echo "🚀 ZANTARA 100 Questions Test - FINAL VERSION"
echo ""
echo "✓ Login automatico (Krisna)"
echo "✓ 102 domande in Bahasa Indonesia"
echo "✓ Flusso continuo (800ms tra domande)"
echo "✓ NO timeout"
echo "✓ Browser visibile"
echo ""
echo "⏱️  Durata stimata: 8-10 minuti"
echo ""
sleep 2

npx playwright test e2e-tests/zantara-100-final.spec.ts --project=chromium --headed --reporter=list

echo ""
if [ $? -eq 0 ]; then
    echo "✅ TEST COMPLETATO CON SUCCESSO!"
else
    echo "❌ TEST FALLITO"
fi
