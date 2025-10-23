/**
 * Docs Routes
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { docsCreate, docsRead, docsUpdate } from '../../handlers/google-workspace/docs.js';

const router = Router();

// Docs schemas
const DocsCreateSchema = z.object({
  title: z.string().optional().default('Untitled Document'),
  content: z.string().optional().default(''),
});

const DocsReadSchema = z.object({
  documentId: z.string().optional(),
});

const DocsUpdateSchema = z.object({
  documentId: z.string().optional(),
  requests: z.array(z.any()).optional(),
  content: z.string().optional(),
}).refine(
  (data) => data.requests || data.content,
  { message: 'Either requests array or content is required' }
);

/**
 * POST /api/docs/create
 * Create a new Google Doc
 */
router.post('/create', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DocsCreateSchema.parse(req.body);
    const result = await docsCreate(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/docs/read
 * Read a Google Doc's content
 */
router.post('/read', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DocsReadSchema.parse(req.body);
    const result = await docsRead(params as any);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/docs/update
 * Update a Google Doc
 */
router.post('/update', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DocsUpdateSchema.parse(req.body);
    const result = await docsUpdate(params as any);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
