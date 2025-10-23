/**
 * Drive Routes
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { driveUpload, driveList, driveSearch, driveRead } from '../../handlers/google-workspace/drive.js';

const router = Router();

// Drive schemas
const DriveUploadSchema = z.object({
  name: z.string().optional(),
  fileName: z.string().optional(),
  content: z.string().optional(),
  body: z.union([z.string(), z.instanceof(Buffer)]).optional(),
  mimeType: z.string().optional(),
  parents: z.array(z.string()).optional(),
  supportsAllDrives: z.boolean().optional(),
  requestBody: z.object({
    name: z.string().optional(),
    parents: z.array(z.string()).optional(),
  }).optional(),
  resource: z.object({
    name: z.string().optional(),
    parents: z.array(z.string()).optional(),
  }).optional(),
  media: z.object({
    mimeType: z.string().optional(),
    body: z.union([z.string(), z.instanceof(Buffer)]).optional(),
  }).optional(),
}).refine(
  (data) => data.content || data.body || data.media?.body,
  { message: 'One of content, body, or media.body is required' }
);

const DriveListSchema = z.object({
  q: z.string().optional(),
  folderId: z.string().optional(),
  mimeType: z.string().optional(),
  pageSize: z.number().optional().default(25),
  fields: z.string().optional(),
});

const DriveSearchSchema = z.object({
  query: z.string().optional(),
  folderId: z.string().optional(),
  mimeType: z.string().optional(),
  pageSize: z.number().optional().default(25),
  fields: z.string().optional(),
}).refine(
  (data) => data.query || data.folderId || data.mimeType,
  { message: 'At least one of query, folderId, or mimeType is required' }
);

const DriveReadSchema = z.object({
  fileId: z.string().optional(),
});

/**
 * POST /api/drive/upload
 * Upload file to Google Drive
 */
router.post('/upload', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveUploadSchema.parse(req.body);
    const result = await driveUpload(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/drive/list
 * List files in Google Drive
 */
router.post('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveListSchema.parse(req.body);
    const result = await driveList(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * GET /api/drive/list (legacy support)
 * List files in Google Drive
 */
router.get('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveListSchema.parse({
      q: req.query.q,
      folderId: req.query.folderId,
      mimeType: req.query.mimeType,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 25,
      fields: req.query.fields,
    });
    const result = await driveList(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/drive/search
 * Search files in Google Drive
 */
router.post('/search', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveSearchSchema.parse(req.body);
    const result = await driveSearch(params);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

/**
 * POST /api/drive/read
 * Read file metadata and content from Google Drive
 */
router.post('/read', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = DriveReadSchema.parse(req.body);
    const result = await driveRead(params as any);
    return res.json(ok(result));
  } catch (error: any) {
    return res.status(400).json(err(error.message));
  }
});

export default router;
