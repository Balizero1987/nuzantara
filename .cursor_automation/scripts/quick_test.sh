#!/bin/bash
# AGENTE 3: Quick Test Script
# Esegue test specifici rapidamente per debugging

PROJECT_ROOT="/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY"

cd "$PROJECT_ROOT"

# Check arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 <test-name>"
    echo ""
    echo "Examples:"
    echo "  $0 oracle           # Run oracle.test.ts"
    echo "  $0 gmail            # Run gmail.test.ts"
    echo "  $0 example-modern   # Run example-modern-handler.test.ts"
    echo ""
    echo "Available tests:"
    find src/handlers -name "*.test.ts" | sed 's|src/handlers/||' | sed 's|/__tests__/|/|' | sed 's|\.test\.ts$||' | sort
    exit 1
fi

TEST_NAME="$1"

echo "🧪 Quick Test: $TEST_NAME"
echo "================================================"

# Run test with coverage
npm test -- "$TEST_NAME" --coverage

echo ""
echo "================================================"
echo "✅ Test completed"
