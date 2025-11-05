#!/bin/bash

# ZANTARA Design v4 - Local Development Server

PORT=8002
DIR="/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/webapp-next/design-v4"

echo ""
echo "🎨 ZANTARA Design v4 - Local Dev Server"
echo "========================================"
echo ""
echo "📂 Directory: $DIR"
echo "🌐 Port: $PORT"
echo ""
echo "URLs:"
echo "  - Login: http://localhost:$PORT/login.html"
echo "  - Chat:  http://localhost:$PORT/chat.html"
echo "  - Index: http://localhost:$PORT/"
echo ""
echo "⚡ Backend: https://nuzantara-backend.fly.dev"
echo ""
echo "Press Ctrl+C to stop"
echo ""
echo "========================================"
echo ""

cd "$DIR" && python3 -m http.server $PORT
