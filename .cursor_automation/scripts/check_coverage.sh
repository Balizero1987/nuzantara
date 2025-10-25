#!/bin/bash
# AGENTE 3: Coverage Check Script
# Controlla la copertura dei test per ogni modulo

set -e

PROJECT_ROOT="/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY"
REPORT_DIR="/tmp/cursor_automation/reports"
THRESHOLD=80

cd "$PROJECT_ROOT"

echo "📊 AGENTE 3: Coverage Check Starting..."
echo "Target: ${THRESHOLD}% coverage"
echo "================================================"

# Generate coverage report
npm test -- --coverage --json --outputFile="$REPORT_DIR/coverage_check.json" > /dev/null 2>&1

# Parse coverage by module
echo ""
echo "📋 Coverage by Module:"
echo "================================================"

for module in admin ai-services analytics auth bali-zero communication google-workspace identity intel maps memory rag system zantara zero; do
    MODULE_DIR="src/handlers/$module"
    if [ -d "$MODULE_DIR" ]; then
        # Count handlers in module
        HANDLER_COUNT=$(find "$MODULE_DIR" -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" ! -name "registry.ts" | wc -l)

        # Count tests in module
        TEST_COUNT=$(find "$MODULE_DIR" -name "*.test.ts" 2>/dev/null | wc -l || echo "0")

        # Calculate percentage
        if [ "$HANDLER_COUNT" -gt 0 ]; then
            PERCENTAGE=$((TEST_COUNT * 100 / HANDLER_COUNT))
        else
            PERCENTAGE=0
        fi

        # Display with color coding
        if [ "$PERCENTAGE" -ge "$THRESHOLD" ]; then
            echo "✅ $module: $TEST_COUNT/$HANDLER_COUNT tests (${PERCENTAGE}%)"
        elif [ "$PERCENTAGE" -ge 50 ]; then
            echo "⚠️  $module: $TEST_COUNT/$HANDLER_COUNT tests (${PERCENTAGE}%)"
        else
            echo "❌ $module: $TEST_COUNT/$HANDLER_COUNT tests (${PERCENTAGE}%)"
        fi
    fi
done

echo "================================================"

# Generate module coverage report
cat > "$REPORT_DIR/module_coverage.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "threshold": $THRESHOLD,
  "modules": [
EOF

FIRST=true
for module in admin ai-services analytics auth bali-zero communication google-workspace identity intel maps memory rag system zantara zero; do
    MODULE_DIR="src/handlers/$module"
    if [ -d "$MODULE_DIR" ]; then
        HANDLER_COUNT=$(find "$MODULE_DIR" -name "*.ts" ! -name "*.test.ts" ! -name "index.ts" ! -name "registry.ts" | wc -l)
        TEST_COUNT=$(find "$MODULE_DIR" -name "*.test.ts" 2>/dev/null | wc -l || echo "0")

        if [ "$HANDLER_COUNT" -gt 0 ]; then
            PERCENTAGE=$((TEST_COUNT * 100 / HANDLER_COUNT))
        else
            PERCENTAGE=0
        fi

        if [ "$FIRST" = true ]; then
            FIRST=false
        else
            echo "    }," >> "$REPORT_DIR/module_coverage.json"
        fi

        cat >> "$REPORT_DIR/module_coverage.json" <<ENTRY
    {
      "module": "$module",
      "handlers": $HANDLER_COUNT,
      "tests": $TEST_COUNT,
      "percentage": $PERCENTAGE
ENTRY
    fi
done

cat >> "$REPORT_DIR/module_coverage.json" <<EOF
    }
  ]
}
EOF

echo ""
echo "✅ Module coverage report saved: $REPORT_DIR/module_coverage.json"
