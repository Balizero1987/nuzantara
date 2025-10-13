/**
 * Sheets Routes
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { sheetsRead, sheetsAppend, sheetsCreate } from '../../handlers/google-workspace/sheets.js';

const router = Router();

// Sheets schemas
const SheetsReadSchema = z.object({
  spreadsheetId: z.string(),
  range: z.string(),
});

const SheetsAppendSchema = z.object({
  spreadsheetId: z.string(),
  range: z.string(),
  values: z.array(z.array(z.any())),
  valueInputOption: z.enum(['RAW', 'USER_ENTERED']).optional().default('RAW'),
});

const SheetsCreateSchema = z.object({
  title: z.string(),
  data: z.array(z.array(z.any())).optional(),
});

/**
 * POST /api/sheets/read
 * Read values from a spreadsheet range
 */
router.post('/read', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = SheetsReadSchema.parse(req.body);
    const result = await sheetsRead(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/sheets/append
 * Append rows to a spreadsheet
 */
router.post('/append', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = SheetsAppendSchema.parse(req.body);
    const result = await sheetsAppend(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/sheets/create
 * Create a new spreadsheet
 */
router.post('/create', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = SheetsCreateSchema.parse(req.body);
    const result = await sheetsCreate(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
