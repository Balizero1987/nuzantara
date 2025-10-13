#!/bin/bash

# Zantara AI Dashboard Launcher
echo "🚀 Starting Zantara AI Dashboard..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express
fi

# Check if Chart.js is installed
if [ ! -d "node_modules/chart.js" ]; then
    echo "📊 Installing Chart.js..."
    npm install chart.js
fi

# Start the dashboard
echo "✨ Launching dashboard server..."
node integrate-dashboard.js &

# Get the PID
DASHBOARD_PID=$!

# Wait a moment for server to start
sleep 2

# Open dashboard in browser
echo "🌐 Opening dashboard in browser..."
open "http://localhost:8081/dashboard"

echo ""
echo "✅ Dashboard is running!"
echo "📊 Access at: http://localhost:8081/dashboard"
echo ""
echo "To stop the dashboard, run:"
echo "  kill $DASHBOARD_PID"
echo ""
echo "Or press Ctrl+C to stop now."

# Wait for user interrupt
wait $DASHBOARD_PID