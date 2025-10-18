#!/bin/bash

# Setup Google Chat App - ZANTARA
echo "🤖 Configuring ZANTARA Google Chat App..."

PROJECT_ID="involuted-box-469105-r0"
BOT_URL="https://224d3f4e1c3c.ngrok-free.app/chatbot"

echo "Project: $PROJECT_ID"
echo "Bot URL: $BOT_URL"

# Enable Google Chat API (if not already enabled)
echo "Enabling Google Chat API..."
gcloud services enable chat.googleapis.com --project=$PROJECT_ID

# Check if Google Chat API is configured
echo "Checking Google Chat API configuration..."
gcloud apis chat describe --project=$PROJECT_ID 2>/dev/null || echo "Chat API not configured yet"

# Manual configuration instructions
echo ""
echo "🔧 MANUAL CONFIGURATION REQUIRED:"
echo "1. Go to: https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=$PROJECT_ID"
echo "2. Click 'Configuration' tab"
echo "3. Fill in:"
echo "   - App name: ZANTARA"
echo "   - Avatar URL: https://storage.googleapis.com/gweb-cloudblog-publish/images/google-chat.max-1000x1000.png"
echo "   - Description: AI Assistant for Bali Zero"
echo "   - Enable Interactive features: YES"
echo "   - Bot URL: $BOT_URL"
echo "   - Connection settings: HTTP"
echo "   - Permissions: Add to spaces and direct messages"
echo "4. Save configuration"
echo ""
echo "✅ Once configured, test with: @ZANTARA help"