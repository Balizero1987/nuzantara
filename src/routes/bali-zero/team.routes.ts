/**
 * Team Routes
 * Bali Zero team directory and information
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { teamList, teamGet, teamDepartments } from '../../handlers/bali-zero/team.js';
import { teamRecentActivity } from '../../handlers/bali-zero/team-activity.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Team schemas
const TeamListSchema = z.object({
  department: z.string().optional(),
  role: z.string().optional(),
  search: z.string().optional(),
});

const TeamGetSchema = z.object({
  memberId: z.string(),
});

const TeamActivitySchema = z.object({
  hours: z.number().default(24),
  department: z.string().optional(),
  limit: z.number().optional(),
});

/**
 * POST /api/team/list
 * Get team member list with optional filters
 */
router.post('/list', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    TeamListSchema.parse(req.body);
    // Team handlers expect Request/Response, so we pass req/res directly
    return await teamList(req as any, res as any);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/team/get
 * Get specific team member details
 */
router.post('/get', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    TeamGetSchema.parse(req.body);
    return await teamGet(req as any, res as any);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/team/departments
 * Get department information and statistics
 */
router.post('/departments', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    return await teamDepartments(req as any, res as any);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/team/activity/recent
 * Get recent team activity
 */
router.post('/activity/recent', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    TeamActivitySchema.parse(req.body);
    const result = await teamRecentActivity(req.body, res);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
