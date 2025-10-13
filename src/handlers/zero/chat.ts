/**
 * Zero Chat Handler - ZANTARA-ONLY for Zero
 *
 * When userId === 'zero', ZANTARA gains access to:
 * - File operations (read, edit, write)
 * - Bash execution
 * - Git operations
 * - Deployment triggers
 * - Production monitoring
 *
 * Security: ZERO_ONLY access enforced via middleware
 */

import logger from '../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
import { aiChat } from "../ai-services/ai.js";

/**
 * Zero Chat - ZANTARA-ONLY mode
 * Uses ZANTARA for all Zero interactions
 */
export async function zeroChat(params: any) {
  const { prompt, message, context, userId } = params || {};
  const actualPrompt = prompt || message;
  
  if (!actualPrompt) {
    throw new BadRequestError('prompt or message is required');
  }

  // Verify Zero access
  if (userId !== 'zero') {
    throw new BadRequestError('Zero access required');
  }

  try {
    // Use ZANTARA for Zero chat
    const result = await aiChat({
      prompt: actualPrompt,
      context: context || 'Zero administrative access',
      provider: 'zantara',
      userId: 'zero'
    });

    const responseData: any = result.data || result;
    
    return ok({
      response: responseData.response || responseData.answer,
      model: 'zantara-zero',
      usage: responseData.usage || responseData.tokens,
      ts: Date.now()
    });
  } catch (error: any) {
    logger.error('Zero chat error:', error);
    throw new BadRequestError(`Zero chat failed: ${error.message}`);
  }
}