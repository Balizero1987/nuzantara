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
