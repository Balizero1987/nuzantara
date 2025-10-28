#!/bin/bash

# 🔍 ZANTARA 50 Test Results Analyzer
# Quick analysis and filtering of test results

RESULTS_DIR="test-results/zantara-50"
SUMMARY_FILE="$RESULTS_DIR/summary.json"

if [ ! -f "$SUMMARY_FILE" ]; then
    echo "❌ No test results found. Run the test first:"
    echo "   ./scripts/run-zantara-50-test.sh"
    exit 1
fi

echo "📊 ZANTARA 50 Test Results Analysis"
echo "════════════════════════════════════════════════"
echo ""

# Show overall summary
echo "📈 Overall Summary:"
cat "$SUMMARY_FILE" | jq -r '
    "   Test Date: \(.test_date | split("T")[0])",
    "   Duration: \((.test_duration_ms / 1000 / 60) | floor) minutes",
    "   Total Conversations: \(.total_conversations)",
    "   Passed: \(.passed) (\(.pass_rate))",
    "   Failed: \(.failed)",
    "   Average Score: \(.average_score)/100"
'
echo ""

# Score distribution
echo "⭐ Score Distribution:"
cat "$SUMMARY_FILE" | jq -r '
    "   ⭐⭐⭐⭐⭐ Perfetto (90-100): \(.score_distribution.perfetto)",
    "   ⭐⭐⭐⭐ Ottimo (80-89):     \(.score_distribution.ottimo)",
    "   ⭐⭐⭐ Buono (70-79):       \(.score_distribution.buono)",
    "   ❌ Fail (<70):            \(.score_distribution.fail)"
'
echo ""

# Tier performance
echo "🎯 Tier Performance:"
cat "$SUMMARY_FILE" | jq -r '
    "   Tier 1 Correctness:  \(.tier_performance.tier1_correctness)/40",
    "   Tier 2 Performance:  \(.tier_performance.tier2_performance)/25",
    "   Tier 3 Quality:      \(.tier_performance.tier3_quality)/20",
    "   Tier 4 Technical:    \(.tier_performance.tier4_technical)/15"
'
echo ""

# Tools coverage
echo "🔧 Tools Coverage:"
cat "$SUMMARY_FILE" | jq -r '
    "   Unique Tools Used: \(.tools_coverage.total_unique_tools)"
'
echo ""

# Show failed conversations if any
FAILED_COUNT=$(cat "$SUMMARY_FILE" | jq '.failed')
if [ "$FAILED_COUNT" -gt 0 ]; then
    echo "❌ Failed Conversations:"
    cat "$SUMMARY_FILE" | jq -r '
        .results[] | 
        select(.passed == false) | 
        "   #\(.id): \(.title) (\(.score)/100)"
    '
    echo ""
fi

# Show top 5 and bottom 5 performers
echo "🏆 Top 5 Performers:"
cat "$SUMMARY_FILE" | jq -r '
    .results | 
    sort_by(-.score) | 
    .[0:5] | 
    .[] | 
    "   #\(.id | tostring | .[0:2]): \(.title[0:40]) - \(.score)/100 \(.rating)"
'
echo ""

echo "⚠️  Bottom 5 Performers:"
cat "$SUMMARY_FILE" | jq -r '
    .results | 
    sort_by(.score) | 
    .[0:5] | 
    .[] | 
    "   #\(.id | tostring | .[0:2]): \(.title[0:40]) - \(.score)/100 \(.rating)"
'
echo ""

# Categories breakdown
echo "📂 Performance by Category:"
cat "$SUMMARY_FILE" | jq -r '
    .results | 
    group_by(.category) | 
    map({
        category: .[0].category,
        count: length,
        avg_score: (map(.score) | add / length | floor)
    }) | 
    sort_by(-.avg_score) |
    .[] | 
    "   \(.category): \(.avg_score)/100 (\(.count) conv)"
'
echo ""

echo "════════════════════════════════════════════════"
echo ""
echo "💡 Commands:"
echo "   View full report:    npx playwright show-report"
echo "   View summary JSON:   cat $SUMMARY_FILE | jq"
echo "   View conversation:   cat $RESULTS_DIR/conversation-01.json | jq"
echo "   List all tools:      cat $SUMMARY_FILE | jq '.tools_coverage.tools_by_conversation'"
echo ""
