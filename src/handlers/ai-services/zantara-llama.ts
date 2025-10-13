/**
 * ZANTARA RAG Backend Integration
 * Communicates with RAG backend for enhanced responses with knowledge base
 * Supports Santai (quick) and Pikiran (detailed) modes
 */

import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { ENV } from '../../config.js';

// RAG Backend Configuration
const RAG_BACKEND_URL = ENV.RAG_BACKEND_URL;

interface ZantaraParams {
  message: string;
  max_tokens?: number;
  temperature?: number;
  context?: string;
  mode?: 'santai' | 'pikiran';
}

/**
 * Call ZANTARA RAG Backend
 * Communicates with RAG backend for enhanced responses with knowledge base
 */
export async function zantaraChat(params: ZantaraParams) {
  if (!params.message) {
    throw new BadRequestError('message is required');
  }

  const message = String(params.message).trim();
  const mode = params.mode || 'santai'; // Default to Santai mode

  logger.info(`🎯 [ZANTARA RAG] Mode: ${mode}, Message: ${message.substring(0, 50)}...`);

  try {
    // Call RAG Backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout
    
    const response = await fetch(`${RAG_BACKEND_URL}/bali-zero/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        mode: mode,
        user_email: 'guest', // Default user
        user_role: 'member'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`RAG Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`RAG Backend failed: ${data.response || 'Unknown error'}`);
    }

    logger.info(`✅ [ZANTARA RAG] Response received (${mode} mode)`);

    return ok({
      answer: data.response,
      model: data.model_used || 'zantara-llama-3.1-8b',
      provider: 'rag-backend',
      tokens: data.usage?.output_tokens || 0,
      executionTime: `${Date.now() - Date.now()}ms`,
      mode: mode
    });

  } catch (error: any) {
    logger.error(`❌ [ZANTARA RAG] Error: ${error.message}`);
    
    // FALLBACK: Direct RunPod call if RAG backend fails
    logger.info(`🔄 [ZANTARA FALLBACK] Trying direct RunPod...`);
    
    try {
      const fallbackResponse = await fetch('https://api.runpod.ai/v2/itz2q5gmid4cyt/runsync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.RUNPOD_API_KEY}`
        },
        body: JSON.stringify({
          input: {
            prompt: `[MODE: ${mode.toUpperCase()}] ${message}`,
            max_tokens: mode === 'santai' ? 100 : 300,
            temperature: 0.7
          }
        })
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        logger.info(`✅ [ZANTARA FALLBACK] Direct RunPod success`);
        
        return ok({
          answer: fallbackData.output || 'ZANTARA is thinking...',
          model: 'zantara-llama-3.1-8b-fallback',
          provider: 'runpod-direct',
          tokens: 0,
          executionTime: 'fallback',
          mode: mode
        });
      }
    } catch (fallbackError: any) {
      logger.error(`❌ [ZANTARA FALLBACK] Failed: ${fallbackError.message}`);
    }
    
    throw new Error(`RAG Backend unavailable: ${error.message}`);
  }
}
