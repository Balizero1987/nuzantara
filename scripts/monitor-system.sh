#!/bin/bash

# Real-time monitoring dashboard
echo "📊 ZANTARA Router-Only System Monitor"
echo "======================================"
echo ""

while true; do
    clear
    echo "📊 ZANTARA Router-Only System Monitor"
    echo "======================================"
    echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # Check services health
    echo "🔍 Service Health:"
    echo "-------------------"

    # Router
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ FLAN Router: HEALTHY (http://localhost:8000)"
    else
        echo "❌ FLAN Router: DOWN"
    fi

    # Orchestrator
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Orchestrator: HEALTHY (http://localhost:3000)"
    else
        echo "❌ Orchestrator: DOWN"
    fi

    echo ""
    echo "📈 Performance Metrics:"
    echo "----------------------"

    # Get metrics
    METRICS=$(curl -s http://localhost:3000/api/metrics 2>/dev/null)

    if [ ! -z "$METRICS" ]; then
        TOTAL_REQ=$(echo "$METRICS" | jq -r '.totalRequests' 2>/dev/null || echo "N/A")
        AVG_ROUTER=$(echo "$METRICS" | jq -r '.performance.avgRouterLatency' 2>/dev/null || echo "N/A")
        AVG_HAIKU=$(echo "$METRICS" | jq -r '.performance.avgHaikuLatency' 2>/dev/null || echo "N/A")
        AVG_TOTAL=$(echo "$METRICS" | jq -r '.performance.avgTotalLatency' 2>/dev/null || echo "N/A")
        IMPROVEMENT=$(echo "$METRICS" | jq -r '.performance.improvement' 2>/dev/null || echo "N/A")
        ERROR_RATE=$(echo "$METRICS" | jq -r '.errorRate' 2>/dev/null || echo "N/A")
        SUCCESS_RATE=$(echo "$METRICS" | jq -r '.successRate' 2>/dev/null || echo "N/A")

        echo "Total Requests: $TOTAL_REQ"
        echo "Avg Router Latency: ${AVG_ROUTER}ms"
        echo "Avg Haiku Latency: ${AVG_HAIKU}ms"
        echo "Avg Total Latency: ${AVG_TOTAL}ms"
        echo "Improvement vs Baseline (450ms): $IMPROVEMENT"
        echo "Error Rate: $ERROR_RATE"
        echo "Success Rate: $SUCCESS_RATE"

        echo ""
        echo "🔧 Tool Usage:"
        echo "--------------"
        echo "$METRICS" | jq -r '.toolUsage | to_entries[] | "\(.key): \(.value)"' 2>/dev/null || echo "No tool usage data"
    else
        echo "Unable to fetch metrics (orchestrator may be down)"
    fi

    echo ""
    echo "Press Ctrl+C to exit"
    echo ""

    sleep 5
done
