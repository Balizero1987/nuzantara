#!/bin/bash
# Local development server per webapp-next drafts

echo "🚀 Starting ZANTARA Draft Development Server"
echo "=============================================="
echo ""
echo "📂 Serving from: apps/webapp-next/"
echo "🌐 Login:  http://localhost:8001/login-draft/login-v1.html"
echo "💬 Chat:   http://localhost:8001/chat-draft/chat-v1.html"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8001
