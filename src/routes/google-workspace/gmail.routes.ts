/**
 * Gmail Routes
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.ts';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.ts';
import { gmailHandlers } from '../../handlers/google-workspace/gmail.ts';

const router = Router();

// Gmail schemas
const GmailSendSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  body: z.string(),
  cc: z.string().email().optional(),
  bcc: z.string().email().optional(),
});

const GmailListSchema = z.object({
  maxResults: z.number().optional().default(10),
  query: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

const GmailReadSchema = z.object({
  messageId: z.string(),
});

/**
 * POST /api/gmail/send
 * Send email via Gmail
 */
router.post('/send', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = GmailSendSchema.parse(req.body);
    const result = await gmailHandlers['gmail.send'](params);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/gmail/list
 * List emails from Gmail
 */
router.post('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = GmailListSchema.parse(req.body);
    const result = await gmailHandlers['gmail.list'](params);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/gmail/read
 * Read specific email by ID
 */
router.post('/read', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = GmailReadSchema.parse(req.body);
    const result = await gmailHandlers['gmail.read'](params);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/gmail/search
 * Search emails by query
 */
router.post('/search', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = z.object({
      query: z.string(),
      maxResults: z.number().optional().default(20),
    }).parse(req.body);

    const result = await gmailHandlers['gmail.search'](params);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
