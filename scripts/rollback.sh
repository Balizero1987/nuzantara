#!/bin/bash

echo "🔙 Rolling back to original system..."

# Stop new services
echo "Stopping router-only services..."

# Kill FLAN router
if [ -f "apps/flan-router/.router.pid" ]; then
    PID=$(cat apps/flan-router/.router.pid)
    kill $PID 2>/dev/null && echo "✅ Router stopped (PID: $PID)" || echo "⚠️  Router already stopped"
    rm apps/flan-router/.router.pid
else
    pkill -f "router_only" && echo "✅ Router processes killed" || echo "ℹ️  No router processes found"
fi

# Kill orchestrator
if [ -f "apps/orchestrator/.orchestrator.pid" ]; then
    PID=$(cat apps/orchestrator/.orchestrator.pid)
    kill $PID 2>/dev/null && echo "✅ Orchestrator stopped (PID: $PID)" || echo "⚠️  Orchestrator already stopped"
    rm apps/orchestrator/.orchestrator.pid
else
    pkill -f "orchestrator" && echo "✅ Orchestrator processes killed" || echo "ℹ️  No orchestrator processes found"
fi

echo ""
echo "✅ Rollback complete"
echo ""
echo "Original services should still be running:"
echo "- TS Backend: http://localhost:8080"
echo "- Python RAG Backend: http://localhost:8001"
