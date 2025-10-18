#!/bin/bash
# Quick test of handler loading

echo "🧪 Testing Handler Registry..."
echo ""

# Start server in background
PORT=8899 node dist/index.js > /tmp/zantara-test.log 2>&1 &
SERVER_PID=$!

# Wait for startup
sleep 5

# Check logs
echo "📋 Server Logs:"
cat /tmp/zantara-test.log

# Kill server
kill $SERVER_PID 2>/dev/null

echo ""
echo "✅ Test complete"
