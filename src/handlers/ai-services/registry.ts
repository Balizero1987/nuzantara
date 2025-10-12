/**
 * AI Services Module Registry
 * Auto-registers all AI/LLM handlers
 */

import { globalRegistry } from '../../core/handler-registry.js';
import { aiChat, openaiChat, claudeChat, geminiChat, cohereChat } from './ai.js';
import { aiAnticipate, aiLearn, xaiExplain } from './advanced-ai.js';
import { creativeHandlers } from './creative.js';

export function registerAIServicesHandlers() {
  // Core AI handlers
  globalRegistry.registerModule('ai-services', {
    'chat': aiChat,
    'openai.chat': openaiChat,
    'claude.chat': claudeChat,
    'gemini.chat': geminiChat,
    'cohere.chat': cohereChat
  }, {
    requiresAuth: true,
    description: 'AI/LLM chat services'
  });

  // Advanced AI handlers
  globalRegistry.registerModule('ai-services', {
    'anticipate': aiAnticipate,
    'learn': aiLearn,
    'xai.explain': xaiExplain
  }, {
    requiresAuth: true,
    description: 'Advanced AI capabilities'
  });

  // Creative handlers (object-based)
  if (creativeHandlers && typeof creativeHandlers === 'object') {
    for (const [key, handler] of Object.entries(creativeHandlers)) {
      globalRegistry.register({
        key: `creative.${key}`,
        handler,
        module: 'ai-services',
        requiresAuth: true
      });
    }
  }

  console.log('✅ AI Services handlers registered');
}

registerAIServicesHandlers();
