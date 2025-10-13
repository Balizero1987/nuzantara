#!/bin/bash

# Setup ZANTARA as Google Workspace Chat App

echo "🌸 ZANTARA Google Workspace Integration Setup"
echo "============================================"

PROJECT_ID="involuted-box-469105-r0"
APP_NAME="ZANTARA AI Assistant"
DEPLOYMENT_URL="https://zantara-bridge-v2-prod-1064094238013.europe-west1.run.app"

echo ""
echo "📋 Steps to add ZANTARA to your Google Workspace:"
echo ""
echo "1. Go to Google Cloud Console:"
echo "   https://console.cloud.google.com/apis/library/chat.googleapis.com?project=$PROJECT_ID"
echo ""
echo "2. Enable Google Chat API (if not already enabled)"
echo ""
echo "3. Configure Chat App:"
echo "   https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=$PROJECT_ID"
echo ""
echo "4. Click 'Configuration' and set:"
echo "   - App name: $APP_NAME"
echo "   - Avatar URL: Upload the ZANTARA lotus logo"
echo "   - Description: AI-powered assistant for Bali Zero operations"
echo "   - Functionality: Check all (1:1 messages, Spaces, etc.)"
echo "   - Connection settings:"
echo "     - App URL: $DEPLOYMENT_URL/chat/webhook"
echo "     - Or use Pub/Sub if preferred"
echo "   - Permissions: Domain-wide (for your workspace)"
echo ""
echo "5. Save and publish to your domain"
echo ""
echo "6. Test in Google Chat by typing: @ZANTARA"
echo ""

# Create the webhook endpoint for Google Chat
cat > google-chat-webhook.ts << 'EOF'
// Google Chat Webhook Handler for ZANTARA
import { Request, Response } from 'express';
import { Bridge } from './bridge.js';

export async function handleChatWebhook(req: Request, res: Response) {
  const { type, message, space, user } = req.body;

  if (type === 'ADDED_TO_SPACE') {
    return res.json({
      text: `🌸 ZANTARA Online! I'm here to help with:
• AI Chat (Gemini, Claude, GPT-4, Cohere)
• Google Workspace (Drive, Calendar, Gmail)
• Memory & Search
• Notifications (Slack, Discord)

Just @ mention me with your request!`
    });
  }

  if (type === 'MESSAGE') {
    const text = message?.text || '';
    const bridge = new Bridge();

    try {
      // Use unified AI to process the message
      const response = await bridge.call({
        key: 'ai.chat',
        params: {
          prompt: text.replace(/@ZANTARA/gi, '').trim(),
          context: `You are ZANTARA, an AI assistant for ${space?.displayName || 'this workspace'}.`
        }
      });

      return res.json({
        text: response.result?.response || 'Processing...',
        thread: message.thread
      });
    } catch (error: any) {
      return res.json({
        text: `❌ Error: ${error.message}`,
        thread: message.thread
      });
    }
  }

  return res.json({ text: 'Unknown event type' });
}
EOF

echo ""
echo "✅ Webhook handler created!"
echo ""
echo "🎨 Don't forget to:"
echo "1. Upload the ZANTARA lotus logo as the bot avatar"
echo "2. Set a purple accent color (#7B68EE) in the configuration"
echo "3. Add helpful slash commands like /memory, /search, /help"
echo ""
echo "📱 Once configured, ZANTARA will appear in:"
echo "- Google Chat direct messages"
echo "- Gmail chat sidebar"
echo "- Google Spaces for team collaboration"
echo ""
echo "🌸 ZANTARA + Gemini = Ultimate Workspace AI! 🚀"