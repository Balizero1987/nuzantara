#!/bin/bash

echo "🤖 ZANTARA - Google Chat Local Setup"
echo "====================================="
echo ""

# Check if server is running
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Server is running on port 8080"
else
    echo "❌ Server not running. Starting it now..."
    npm start &
    sleep 5
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok not found. Installing..."
    brew install ngrok
fi

# Start ngrok tunnel
echo ""
echo "🌐 Starting ngrok tunnel..."
ngrok http 8080 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
sleep 3

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL"
    exit 1
fi

echo "✅ Ngrok tunnel active: $NGROK_URL"

# Test the chatbot endpoint
echo ""
echo "🔍 Testing chatbot endpoint..."
TEST_RESPONSE=$(curl -s -X POST "$NGROK_URL/chatbot" \
  -H "Content-Type: application/json" \
  -d '{"type": "MESSAGE", "message": {"text": "test"}, "user": {"displayName": "Test User"}}')

if [ $? -eq 0 ]; then
    echo "✅ Chatbot endpoint responding"
else
    echo "❌ Chatbot endpoint not responding"
fi

echo ""
echo "📋 Google Chat Configuration Instructions:"
echo "=========================================="
echo ""
echo "1. Go to: https://console.cloud.google.com/apis/api/chat.googleapis.com"
echo ""
echo "2. Click on 'Configuration' tab"
echo ""
echo "3. Update your Chat app with:"
echo "   - App name: ZANTARA"
echo "   - Avatar URL: https://i.imgur.com/7Gv8YLQ.png"
echo "   - Description: AI Assistant powered by Bali Zero"
echo "   - Functionality: ✅ Receive 1:1 messages"
echo "                    ✅ Join spaces and group conversations"
echo ""
echo "4. Connection settings:"
echo "   - Select: HTTP endpoint URL"
echo "   - Bot URL: $NGROK_URL/chatbot"
echo ""
echo "5. Permissions:"
echo "   - ✅ Everyone in your domain"
echo ""
echo "6. Click 'Save' and wait 1-2 minutes for propagation"
echo ""
echo "7. Test the bot:"
echo "   - Open Google Chat"
echo "   - Click + > Find apps"
echo "   - Search for 'ZANTARA'"
echo "   - Send: 'hello'"
echo ""
echo "📌 Ngrok URL: $NGROK_URL/chatbot"
echo "📌 Ngrok PID: $NGROK_PID"
echo ""
echo "To stop ngrok: kill $NGROK_PID"
echo ""

# Save configuration
echo "NGROK_URL=$NGROK_URL" > .chat-local-config
echo "NGROK_PID=$NGROK_PID" >> .chat-local-config
echo "Configuration saved to .chat-local-config"