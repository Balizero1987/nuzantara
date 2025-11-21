/**
 * Creative AI Routes
 * Extracted from router.ts (modular refactor)
 * Vision, Speech, Language processing endpoints
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { creativeHandlers } from '../../handlers/ai-services/creative.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Vision schemas
const VisionAnalyzeSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageData: z.string().optional(),
    prompt: z.string().optional(),
  })
  .refine((data) => data.imageUrl || data.imageData, {
    message: 'Either imageUrl or imageData is required',
  });

const VisionExtractSchema = z
  .object({
    imageUrl: z.string().url().optional(),
    imageData: z.string().optional(),
    documentType: z.enum(['invoice', 'receipt', 'form', 'general']).optional(),
  })
  .refine((data) => data.imageUrl || data.imageData, {
    message: 'Either imageUrl or imageData is required',
  });

// Speech schemas
const SpeechTranscribeSchema = z
  .object({
    audioUrl: z.string().url().optional(),
    audioData: z.string().optional(),
    language: z.string().optional(),
  })
  .refine((data) => data.audioUrl || data.audioData, {
    message: 'Either audioUrl or audioData is required',
  });

const SpeechSynthesizeSchema = z.object({
  text: z.string(),
  voice: z.string().optional(),
  language: z.string().optional(),
  speed: z.number().optional(),
});

// Language schemas
const LanguageSentimentSchema = z.object({
  text: z.string(),
  language: z.string().optional(),
});

/**
 * POST /api/creative/vision/analyze
 * Analyze image with AI vision
 */
router.post('/vision/analyze', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = VisionAnalyzeSchema.parse(req.body);
    const result = await creativeHandlers['vision.analyze'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/creative/vision/extract
 * Extract data from document images
 */
router.post('/vision/extract', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = VisionExtractSchema.parse(req.body);
    const result = await creativeHandlers['vision.extract'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/creative/speech/transcribe
 * Transcribe audio to text
 */
router.post('/speech/transcribe', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = SpeechTranscribeSchema.parse(req.body);
    const result = await creativeHandlers['speech.transcribe'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/creative/speech/synthesize
 * Convert text to speech
 */
router.post('/speech/synthesize', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = SpeechSynthesizeSchema.parse(req.body);
    const result = await creativeHandlers['speech.synthesize'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/creative/language/sentiment
 * Analyze text sentiment
 */
router.post('/language/sentiment', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = LanguageSentimentSchema.parse(req.body);
    const result = await creativeHandlers['language.sentiment'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
