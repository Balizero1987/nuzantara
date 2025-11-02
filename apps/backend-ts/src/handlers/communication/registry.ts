/**
 * Communication Module Registry
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { slackNotify, discordNotify, googleChatNotify } from './communication.js';
import {
  whatsappWebhookVerify,
  whatsappWebhookReceiver,
  getGroupAnalytics,
  sendManualMessage
} from './whatsapp.js';
import {
  instagramWebhookVerify,
  instagramWebhookReceiver,
  getInstagramUserAnalytics,
  sendManualInstagramMessage
} from './instagram.js';
import { translateHandlers } from './translate.js';

export function registerCommunicationHandlers() {
  // Slack/Discord/Google Chat
  globalRegistry.registerModule('communication', {
    'slack.notify': slackNotify,
    'discord.notify': discordNotify,
    'google.chat.notify': googleChatNotify
  }, { requiresAuth: true });

  // WhatsApp
  globalRegistry.registerModule('communication', {
    'whatsapp.webhook.verify': whatsappWebhookVerify,
    'whatsapp.webhook.receiver': whatsappWebhookReceiver,
    'whatsapp.analytics': getGroupAnalytics,
    'whatsapp.send': sendManualMessage
  }, { requiresAuth: true });

  // Instagram
  globalRegistry.registerModule('communication', {
    'instagram.webhook.verify': instagramWebhookVerify,
    'instagram.webhook.receiver': instagramWebhookReceiver,
    'instagram.analytics': getInstagramUserAnalytics,
    'instagram.send': sendManualInstagramMessage
  }, { requiresAuth: true });

  // Translate handlers (object-based)
  if (translateHandlers && typeof translateHandlers === 'object') {
    for (const [key, handler] of Object.entries(translateHandlers)) {
      globalRegistry.register({
        key: `translate.${key}`,
        handler,
        module: 'communication',
        requiresAuth: true
      });
    }
  }

  logger.info('✅ Communication handlers registered');
}

registerCommunicationHandlers();
