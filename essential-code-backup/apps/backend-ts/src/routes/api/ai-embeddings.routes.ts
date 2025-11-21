/**
 * AI Embeddings & Completions Routes
 * Handler #13-14: Text embeddings and completions
 */

import { Router, Request, Response } from 'express';
import { generateEmbeddings, getCompletions } from '../../handlers/ai-services/ai.js';
import { logger } from '../../logging/unified-logger.js';

const router = Router();

/**
 * POST /api/ai/embed
 * Handler #13: Generate text embeddings
 *
 * Body:
 * {
 *   "text": "string",          // Text to embed (required)
 *   "model": "string"         // Embedding model (optional, default: all-MiniLM-L6-v2)
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "embeddings": [{
 *     "text": "string",
 *     "vector": [number[]],
 *     "dimension": number,
 *     "model": "string"
 *   }],
 *   "model": "string",
 *   "timestamp": number
 * }
 */
router.post('/embed', async (req: Request, res: Response) => {
  try {
    const { text, model } = req.body || {};

    // Validation
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required and must be a string',
      });
    }

    if (text.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Text cannot be empty',
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long (max 10,000 characters)',
      });
    }

    // Generate embeddings
    const result = await generateEmbeddings({
      text,
      model,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Generate embeddings route error');
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to generate embeddings',
    });
  }
});

/**
 * POST /api/ai/completions
 * Handler #14: Generate text completions
 *
 * Body:
 * {
 *   "prompt": "string",                // Text prompt (required)
 *   "model": "string",                 // Model to use (optional, default: zantara)
 *   "max_tokens": number,              // Max tokens (optional, default: 256)
 *   "temperature": number,             // Temperature (optional, default: 0.7)
 *   "top_p": number,                   // Top-p (optional, default: 0.9)
 *   "frequency_penalty": number,       // Frequency penalty (optional)
 *   "presence_penalty": number,        // Presence penalty (optional)
 *   "stop": [string]                   // Stop sequences (optional)
 * }
 *
 * Response:
 * {
 *   "success": boolean,
 *   "completion": "string",
 *   "prompt": "string",
 *   "model": "string",
 *   "tokens": {
 *     "prompt_tokens": number,
 *     "completion_tokens": number,
 *     "total_tokens": number
 *   },
 *   "finish_reason": "string",
 *   "timestamp": number
 * }
 */
router.post('/completions', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      model,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
    } = req.body || {};

    // Validation
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string',
      });
    }

    if (prompt.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Prompt cannot be empty',
      });
    }

    if (max_tokens && (typeof max_tokens !== 'number' || max_tokens < 1 || max_tokens > 4000)) {
      return res.status(400).json({
        success: false,
        error: 'max_tokens must be between 1 and 4000',
      });
    }

    if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return res.status(400).json({
        success: false,
        error: 'temperature must be between 0 and 2',
      });
    }

    if (top_p && (typeof top_p !== 'number' || top_p < 0 || top_p > 1)) {
      return res.status(400).json({
        success: false,
        error: 'top_p must be between 0 and 1',
      });
    }

    // Get completions
    const result = await getCompletions({
      prompt,
      model,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get completions route error');
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to get completions',
    });
  }
});

export default router;
