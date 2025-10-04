#!/bin/bash

echo "🚀 ZANTARA Bot - Ngrok Setup"
echo "============================"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    brew install ngrok
fi

echo "🔗 Starting ngrok tunnel..."
echo "Server: http://localhost:8080"
echo ""

# Start ngrok and show the public URL
ngrok http 8080