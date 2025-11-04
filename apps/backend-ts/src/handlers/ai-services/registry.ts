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
  zantaraCallDevAI,
  zantaraOrchestrateWorkflow,
  zantaraGetConversationHistory,
  zantaraGetSharedContext,
  zantaraClearWorkflow,
} from './ai-bridge.js';
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

  // ZANTARA Bridge handlers for AI communication
  globalRegistry.registerModule(
    'ai-services',
    {
      'zantara.call-devai': zantaraCallDevAI,
      'zantara.orchestrate': zantaraOrchestrateWorkflow,
      'zantara.history': zantaraGetConversationHistory,
      'zantara.context': zantaraGetSharedContext,
      'zantara.clear': zantaraClearWorkflow,
    },
    {
      requiresAuth: true,
      description: 'ZANTARA AI communication bridge',
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
