#!/bin/bash
# AGENTE 3: Test Verification Script
# Verifica che tutti i test siano stati generati correttamente

set -e

PROJECT_ROOT="/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY"
REPORT_DIR="/tmp/cursor_automation/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

cd "$PROJECT_ROOT"

echo "🔍 AGENTE 3: Test Verification Starting..."
echo "================================================"

# Create reports directory
mkdir -p "$REPORT_DIR"

# 1. Count test files
echo ""
echo "📊 Step 1: Counting test files..."
TOTAL_TESTS=$(find src/handlers -name "*.test.ts" | wc -l)
echo "✅ Found $TOTAL_TESTS test files"

# 2. List all test files
echo ""
echo "📋 Step 2: Listing all test files..."
find src/handlers -name "*.test.ts" | sort > "$REPORT_DIR/test_files_list.txt"
echo "✅ Test file list saved to: $REPORT_DIR/test_files_list.txt"

# 3. Run all tests
echo ""
echo "🧪 Step 3: Running all tests..."
if npm test 2>&1 | tee "$REPORT_DIR/test_run_${TIMESTAMP}.log"; then
    echo "✅ All tests PASSED"
    TEST_STATUS="PASSED"
else
    echo "⚠️  Some tests FAILED - see log for details"
    TEST_STATUS="FAILED"
fi

# 4. Generate coverage report
echo ""
echo "📈 Step 4: Generating coverage report..."
npm test -- --coverage --json --outputFile="$REPORT_DIR/coverage_${TIMESTAMP}.json" 2>&1 | tee "$REPORT_DIR/coverage_run_${TIMESTAMP}.log"

# 5. Extract coverage percentage
echo ""
echo "📊 Step 5: Extracting coverage metrics..."
if [ -f "$REPORT_DIR/coverage_${TIMESTAMP}.json" ]; then
    COVERAGE=$(jq -r '.total.lines.pct // "N/A"' "$REPORT_DIR/coverage_${TIMESTAMP}.json" 2>/dev/null || echo "N/A")
    echo "✅ Overall coverage: ${COVERAGE}%"
else
    COVERAGE="N/A"
    echo "⚠️  Coverage JSON not found"
fi

# 6. Find handlers without tests
echo ""
echo "🔍 Step 6: Finding handlers without tests..."
find src/handlers -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" ! -name "registry.ts" | while read handler; do
    test_file=$(echo "$handler" | sed 's|src/handlers/|src/handlers/|' | sed 's|\.ts$|.test.ts|' | sed 's|\([^/]*\)\.test\.ts$|__tests__/\1.test.ts|')
    if [ ! -f "$test_file" ]; then
        echo "❌ Missing test: $handler"
    fi
done > "$REPORT_DIR/missing_tests.txt"

MISSING_COUNT=$(wc -l < "$REPORT_DIR/missing_tests.txt")
echo "⚠️  Found $MISSING_COUNT handlers without tests"

# 7. Generate summary report
echo ""
echo "📝 Step 7: Generating summary report..."
cat > "$REPORT_DIR/verification_summary_${TIMESTAMP}.md" <<EOF
# Test Verification Report
Generated: $(date)

## Summary
- **Test Status**: ${TEST_STATUS}
- **Total Test Files**: ${TOTAL_TESTS}
- **Overall Coverage**: ${COVERAGE}%
- **Missing Tests**: ${MISSING_COUNT}

## Test Execution
See: \`test_run_${TIMESTAMP}.log\`

## Coverage Details
See: \`coverage_${TIMESTAMP}.json\`

## Missing Tests
$(cat "$REPORT_DIR/missing_tests.txt")

## Next Steps
1. Review failed tests (if any)
2. Improve coverage for low-coverage files
3. Generate tests for missing handlers
4. Re-run verification

## Status
$(if [ "$TEST_STATUS" = "PASSED" ] && [ "$MISSING_COUNT" -lt 10 ]; then
    echo "✅ **VERIFICATION PASSED** - Project ready for production"
else
    echo "⚠️  **VERIFICATION INCOMPLETE** - See action items above"
fi)
EOF

echo "✅ Summary report saved to: $REPORT_DIR/verification_summary_${TIMESTAMP}.md"

# 8. Display summary
echo ""
echo "================================================"
echo "🎯 VERIFICATION SUMMARY"
echo "================================================"
cat "$REPORT_DIR/verification_summary_${TIMESTAMP}.md"
echo "================================================"

# 9. Exit with appropriate code
if [ "$TEST_STATUS" = "PASSED" ] && [ "$MISSING_COUNT" -lt 10 ]; then
    echo "✅ Verification PASSED"
    exit 0
else
    echo "⚠️  Verification needs attention"
    exit 1
fi
