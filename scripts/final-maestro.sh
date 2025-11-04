#!/bin/bash
# 🏆 FINAL MAESTRO - Python HTTP Upload Strategy
set -e

echo "🏆 FINAL MAESTRO MIGRATION"
echo "Strategy: Python SimpleHTTPServer → curl download on Fly.io"
echo ""

APP="nuzantara-rag"
TIMESTAMP="20251104_172928"
TARBALL="/tmp/chromadb_${TIMESTAMP}.tar.gz"

# Step 1: Start Python HTTP server in background
echo "🌐 Starting local HTTP server on port 8888..."
cd /tmp
python3 -m http.server 8888 > /dev/null 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"
sleep 2
echo "✅ Server running"
echo ""

# Step 2: Get local IP
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "📍 Local IP: $LOCAL_IP"
echo ""

# Step 3: Download from Fly.io
echo "📥 Downloading tarball on Fly.io from $LOCAL_IP:8888..."
fly ssh console --app "$APP" --command \
    "curl -o /tmp/chromadb.tar.gz http://${LOCAL_IP}:8888/$(basename $TARBALL) --max-time 300"

# Stop server
kill $SERVER_PID 2>/dev/null || true
echo "✅ Downloaded"
echo ""

# Step 4: Extract and replace
echo "🔄 Extracting and replacing ChromaDB..."
fly ssh console --app "$APP" --command \
    "cd /data && mv chroma_db chroma_db.old_${TIMESTAMP} && tar -xzf /tmp/chromadb.tar.gz && mv chromadb chroma_db && rm /tmp/chromadb.tar.gz && echo '✅ Extraction complete' && du -sh chroma_db"

echo "✅ ChromaDB replaced!"
echo ""

# Step 5: Restart
echo "🔄 Restarting app..."
fly apps restart "$APP"

echo ""
echo "═══════════════════════════════════════════════"
echo "🎉 MIGRATION COMPLETE!"
echo "═══════════════════════════════════════════════"
