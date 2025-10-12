/**
 * Translation Routes
 * Multi-language translation services
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.ts';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.ts';
import { translateHandlers } from '../../handlers/communication/translate.ts';
import { BadRequestError } from '../../utils/errors.ts';

const router = Router();

// Translation schemas
const TranslateTextSchema = z.object({
  text: z.string(),
  targetLanguage: z.string(),
  sourceLanguage: z.string().optional(),
});

const TranslateBatchSchema = z.object({
  texts: z.array(z.string()),
  targetLanguage: z.string(),
  sourceLanguage: z.string().optional(),
});

const DetectLanguageSchema = z.object({
  text: z.string(),
});

const TranslateBusinessTemplateSchema = z.object({
  template: z.string(),
  targetLanguage: z.string(),
  variables: z.record(z.string()).optional(),
});

/**
 * POST /api/translate/text
 * Translate text to target language
 */
router.post('/text', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = TranslateTextSchema.parse(req.body);
    const result = await translateHandlers['translate.text'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/translate/batch
 * Translate multiple texts at once
 */
router.post('/batch', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = TranslateBatchSchema.parse(req.body);
    const result = await translateHandlers['translate.batch'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/translate/detect
 * Detect language of provided text
 */
router.post('/detect', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DetectLanguageSchema.parse(req.body);
    const result = await translateHandlers['translate.detect'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/translate/template
 * Translate business template with variables
 */
router.post('/template', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = TranslateBusinessTemplateSchema.parse(req.body);
    const result = await translateHandlers['translate.template'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
