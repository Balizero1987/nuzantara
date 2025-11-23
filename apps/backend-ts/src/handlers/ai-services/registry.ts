/**
 * ZANTARA-ONLY AI Services Module Registry
 * Simplified AI system using only ZANTARA/LLAMA
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';
import { aiChat } from './ai.js';
import { aiAnticipate, aiLearn, xaiExplain } from './advanced-ai.js';
import { creativeHandlers } from './creative.js';
import {
  callAI,
  orchestrateWorkflow,
  getConversationHistory,
  getSharedContext,
  clearWorkflow,
} from './ai-integration.js';
import { aiImageGenerate, aiImageUpscale, aiImageTest } from './imagine-art-handler.js';

export function registerAIServicesHandlers() {
  // Single ZANTARA AI handler (no multi-provider complexity)
  globalRegistry.registerModule(
    'ai-services',
    {
      chat: aiChat,
    },
    {
      requiresAuth: true,
      description: 'ZANTARA AI chat service (LLAMA-based)',
    }
  );

  // Advanced AI handlers
  globalRegistry.registerModule(
    'ai-services',
    {
      anticipate: aiAnticipate,
      learn: aiLearn,
      'xai.explain': xaiExplain,
    },
    {
      requiresAuth: true,
      description: 'Advanced AI capabilities',
    }
  );

  // ZANTARA AI integration handlers
  globalRegistry.registerModule(
    'ai-services',
    {
      'zantara.call-ai': callAI,
      'zantara.orchestrate': orchestrateWorkflow,
      'zantara.history': getConversationHistory,
      'zantara.context': getSharedContext,
      'zantara.clear': clearWorkflow,
    },
    {
      requiresAuth: true,
      description: 'ZANTARA AI integration services',
    }
  );

  // Creative handlers (object-based)
  if (creativeHandlers && typeof creativeHandlers === 'object') {
    for (const [key, handler] of Object.entries(creativeHandlers)) {
      globalRegistry.register({
        key: `creative.${key}`,
        handler,
        module: 'ai-services',
        requiresAuth: true,
      });
    }
  }

  // Imagine.art image generation handlers
  globalRegistry.registerModule(
    'ai-services',
    {
      'image.generate': aiImageGenerate,
      'image.upscale': aiImageUpscale,
      'image.test': aiImageTest,
    },
    {
      requiresAuth: false, // Can be public or require auth based on use case
      description: 'Imagine.art AI image generation',
    }
  );

  logger.info('✅ AI Services handlers registered (including Imagine.art)');
}

registerAIServicesHandlers();
