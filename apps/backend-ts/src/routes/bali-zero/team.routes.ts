/**
 * Team Routes
 * Bali Zero team directory and information
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { jwtAuth, RequestWithJWT } from '../../middleware/jwt-auth.js';
import { teamList, teamGet, teamDepartments } from '../../handlers/bali-zero/team.js';
import { teamRecentActivity } from '../../handlers/bali-zero/team-activity.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// ... (schemas remain the same) ...

// ... (other routes remain the same) ...

/**
 * GET /api/team/my-status
 * Get current user's timesheet status
 */
router.get('/my-status', jwtAuth as any, async (req: RequestWithJWT, res) => {
  try {
    const userId = req.query.user_id as string || req.user?.userId;

    if (!userId) {
      return res.status(400).json(err('User ID is required'));
    }

    // Return timesheet status for the user
    // This is a placeholder - should be replaced with actual database query
    const status = {
      user_id: userId,
      status: 'active', // active, away, offline
      current_task: null,
      hours_today: 0,
      hours_this_week: 0,
      last_update: new Date().toISOString(),
      timezone: 'Asia/Jakarta',
    };

    return res.json({
      ok: true,
      data: status,
    });
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
