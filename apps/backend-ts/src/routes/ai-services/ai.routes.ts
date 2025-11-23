/**
 * AI Services Routes - ZANTARA-ONLY
 * Simplified routes with only ZANTARA/LLAMA support
 */

import { Router } from 'express';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { aiSchemas } from '../../utils/validation-schemas.js';
import { aiChat } from '../../handlers/ai-services/ai.js';
import { zantaraChat } from '../../handlers/ai-services/zantara-llama.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

/**
 * POST /api/ai/chat
 * ZANTARA-ONLY AI chat endpoint
 */
router.post('/chat', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = aiSchemas.chat.parse(req.body);
    const result = await aiChat(params);
    return res.json(ok(result?.data ?? result));
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json(err(`Validation failed: ${error.message}`));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/ai/zantara
 * ZANTARA Llama 3.1 - Custom trained model for Indonesian business
 */
router.post('/zantara', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = aiSchemas.chat.parse(req.body);
    const result = await zantaraChat({
      message: params.prompt || params.message || '',
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      context: params.context,
    });
    return res.json(ok(result?.data ?? result));
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json(err(`Validation failed: ${error.message}`));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
