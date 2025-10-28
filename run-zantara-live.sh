#!/bin/bash

# ZANTARA Live Test Runner
# Runs the 102-question test visibly on screen

echo "🚀 Starting ZANTARA Live Test..."
echo "📝 102 questions in Bahasa Indonesia"
echo "👁️  Browser will be visible"
echo ""

# Run the test
npx playwright test e2e-tests/zantara-live-test.spec.ts --headed --project=chromium

echo ""
echo "✅ Test completed"
