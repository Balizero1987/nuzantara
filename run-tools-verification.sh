#!/bin/bash

# ZANTARA Tools Verification Test
# Checks that each tool is properly integrated and used by ZANTARA

echo "🔍 Starting ZANTARA Tools Integration Verification..."
echo "📝 Testing 15+ critical tools across 5 categories"
echo "👁️  Browser will be visible"
echo ""

# Run the test
npx playwright test e2e-tests/zantara-tools-verification.spec.ts --headed --project=chromium

echo ""
echo "✅ Verification completed"
