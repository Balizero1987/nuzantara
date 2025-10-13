/**
 * ZANTARA-ONLY AI Services Module Registry
 * Simplified AI system using only ZANTARA/LLAMA
 */

import logger from '../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { aiChat } from './ai.js';
import { aiAnticipate, aiLearn, xaiExplain } from './advanced-ai.js';
import { creativeHandlers } from './creative.js';

export function registerAIServicesHandlers() {
  // Single ZANTARA AI handler (no multi-provider complexity)
  globalRegistry.registerModule('ai-services', {
    'chat': aiChat
  }, {
    requiresAuth: true,
    description: 'ZANTARA AI chat service (LLAMA-based)'
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

  logger.info('✅ AI Services handlers registered');
}

registerAIServicesHandlers();
