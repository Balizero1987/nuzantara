#!/bin/bash
# Stop ZANTARA full stack

echo "🛑 Stopping ZANTARA services..."

# Stop Python backend
if [ -f /tmp/zantara-python.pid ]; then
    PYTHON_PID=$(cat /tmp/zantara-python.pid)
    if kill $PYTHON_PID 2>/dev/null; then
        echo "✅ Python backend stopped (PID: $PYTHON_PID)"
    fi
    rm /tmp/zantara-python.pid
else
    # Try to find and kill uvicorn
    pkill -f "uvicorn.*main_integrated" && echo "✅ Python backend stopped"
fi

# Stop TypeScript backend
if [ -f /tmp/zantara-typescript.pid ]; then
    TYPESCRIPT_PID=$(cat /tmp/zantara-typescript.pid)
    if kill $TYPESCRIPT_PID 2>/dev/null; then
        echo "✅ TypeScript backend stopped (PID: $TYPESCRIPT_PID)"
    fi
    rm /tmp/zantara-typescript.pid
else
    # Try to find and kill node process
    pkill -f "node.*dist/index.js" && echo "✅ TypeScript backend stopped"
fi

# Optionally stop Ollama (commented out by default)
# pkill -f "ollama serve" && echo "✅ Ollama stopped"

echo "✅ All services stopped"
echo ""
echo "Verify with: ps aux | grep -E 'uvicorn|node|ollama'"