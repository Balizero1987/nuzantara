#!/bin/bash

# 🎯 ZANTARA 50 Conversations Test Runner
# Executes comprehensive test with full conversation capture

echo "🚀 Starting ZANTARA 50 Conversations Test..."
echo ""
echo "📋 Test Configuration:"
echo "   - Conversations: 50"
echo "   - User: Zero (zero@balizero.com)"
echo "   - Language: Italian"
echo "   - Execution: Sequential (one by one)"
echo "   - Browser: Visible (headed mode)"
echo "   - Timeout: None (unlimited per conversation)"
echo "   - Retry: 1 automatic retry on failure"
echo "   - Capture: Full (HTML, messages, scores, timestamps)"
echo ""
echo "⏱️  Estimated duration: 60-90 minutes"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create test results directory
RESULTS_DIR="$PROJECT_ROOT/test-results/zantara-50"
mkdir -p "$RESULTS_DIR"

# Clear previous results
if [ -d "$RESULTS_DIR" ]; then
    echo "🧹 Clearing previous test results..."
    rm -rf "$RESULTS_DIR"/*
fi

echo ""
echo "▶️  Starting test in 3 seconds..."
sleep 3

# Run the test
npx playwright test e2e-tests/zantara-50-conversations.spec.ts \
  --project=chromium \
  --headed \
  --reporter=list,html \
  --output="$RESULTS_DIR"

# Capture exit code
EXIT_CODE=$?

echo ""
echo "════════════════════════════════════════════════"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ TEST COMPLETED SUCCESSFULLY!"
    echo ""
    echo "📊 Results saved to:"
    echo "   - Summary: $RESULTS_DIR/summary.json"
    echo "   - Individual: $RESULTS_DIR/conversation-*.json"
    echo ""
    echo "🌐 View HTML report:"
    echo "   npx playwright show-report"
else
    echo "⚠️  TEST HAD FAILURES"
    echo ""
    echo "🔍 Debug suggestions:"
    echo "   1. Check individual conversation results in:"
    echo "      $RESULTS_DIR/conversation-*.json"
    echo "   2. View HTML report for details:"
    echo "      npx playwright show-report"
    echo "   3. Check failed conversations in summary:"
    echo "      cat $RESULTS_DIR/summary.json | jq '.results[] | select(.passed == false)'"
fi

echo "════════════════════════════════════════════════"
echo ""

# Print quick summary if summary.json exists
if [ -f "$RESULTS_DIR/summary.json" ]; then
    echo "📈 Quick Summary:"
    cat "$RESULTS_DIR/summary.json" | jq -r '
        "   Total: \(.total_conversations)",
        "   Passed: \(.passed) (\(.pass_rate))",
        "   Failed: \(.failed)",
        "   Average Score: \(.average_score)/100",
        "   Target Met: \(if .passed >= 45 then "✅ YES" else "❌ NO" end)"
    '
    echo ""
fi

# Exit with original test exit code
exit $EXIT_CODE
