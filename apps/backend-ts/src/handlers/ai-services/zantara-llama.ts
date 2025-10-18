/**
 * ZANTARA RAG Backend Integration
 * Communicates with RAG backend for enhanced responses with knowledge base
 * Supports Santai (quick) and Pikiran (detailed) modes
 */

import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { ENV } from '../../config/index.js';

// RAG Backend Configuration
const RAG_BACKEND_URL = ENV.RAG_BACKEND_URL;

interface ZantaraParams {
  message: string;
  max_tokens?: number;
  temperature?: number;
  context?: string;
  mode?: 'santai' | 'pikiran';
  user_email?: string;  // CRITICAL: For collaborator identification
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
  const user_email = params.user_email || 'guest'; // Use provided email or default to guest

  logger.info(`🎯 [ZANTARA RAG] Mode: ${mode}, User: ${user_email}, Message: ${message.substring(0, 50)}...`);

  try {
    // Call RAG Backend with shorter timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const response = await fetch(`${RAG_BACKEND_URL}/bali-zero/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: message,
        mode: mode,
        user_email: user_email, // CRITICAL: Pass actual user email for identification
        user_role: 'member'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`RAG Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
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
            prompt: `You are ZANTARA, Indonesian AI assistant for Bali Zero. Respond in the same language as the user. Mode: ${mode.toUpperCase()}. User message: ${message}`,
            max_tokens: mode === 'santai' ? 100 : 300,
            temperature: 0.7
          }
        })
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json() as any;
        logger.info(`✅ [ZANTARA FALLBACK] Direct RunPod success`);
        
        // Clean up response formatting
        let cleanAnswer = 'ZANTARA is thinking...';
        
        if (fallbackData.output) {
          if (Array.isArray(fallbackData.output)) {
            // Handle array of tokens/choices
            cleanAnswer = fallbackData.output
              .map((item: any) => {
                if (item.choices && Array.isArray(item.choices)) {
                  return item.choices.map((choice: any) => {
                    if (choice.tokens && Array.isArray(choice.tokens)) {
                      return choice.tokens.join('');
                    }
                    return choice.text || choice.content || '';
                  }).join('');
                }
                return item.text || item.content || '';
              })
              .join('')
              .trim();
          } else if (typeof fallbackData.output === 'string') {
            cleanAnswer = fallbackData.output.trim();
          }
        }
        
        // Clean up any remaining formatting issues
        cleanAnswer = cleanAnswer
          .replace(/\[PRICE\]/g, '')
          .replace(/\[PRICE\]/g, '')
          .replace(/\n\n+/g, '\n')
          .trim();
        
        return ok({
          answer: cleanAnswer || 'ZANTARA is thinking...',
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
