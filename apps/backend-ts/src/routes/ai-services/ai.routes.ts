/**
 * AI Services Routes - ZANTARA-ONLY
 * Simplified routes with only ZANTARA/LLAMA support
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { aiChat } from '../../handlers/ai-services/ai.js';
import { zantaraChat } from '../../handlers/ai-services/zantara-llama.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// AI chat schemas - ZANTARA-ONLY
const AIChatSchema = z.object({
  prompt: z.string().optional(),
  message: z.string().optional(),
  context: z.string().optional(),
  provider: z.enum(['zantara', 'llama']).optional().default('zantara'),
  model: z.string().optional(),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  userName: z.string().optional(),
  userIdentification: z.string().optional(),
  sessionId: z.string().optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
}).refine(
  (data) => data.prompt || data.message,
  { message: 'Either prompt or message is required' }
);

/**
 * POST /api/ai/chat
 * ZANTARA-ONLY AI chat endpoint
 */
router.post('/chat', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = AIChatSchema.parse(req.body);
    const result = await aiChat(params);
    return res.json(ok(result?.data ?? result));
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
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
    const params = AIChatSchema.parse(req.body);
    const result = await zantaraChat({
      message: params.prompt || params.message || '',
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      context: params.context
    });
    return res.json(ok(result?.data ?? result));
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;