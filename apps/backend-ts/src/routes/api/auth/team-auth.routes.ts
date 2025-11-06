/**
 * ZANTARA Team Authentication Routes
 * Provides team member login, logout, and session management
 */

import { Router, Request, Response } from 'express';
import {
  teamLogin,
  getTeamMembers,
  logoutSession,
  validateSession,
} from '../../../handlers/auth/team-login.js';
import { logger } from '../../../logging/unified-logger.js';

const router = Router();

/**
 * POST /api/auth/team/login
 * Team member login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, pin } = req.body || {};

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required for login',
      });
    }

    if (!pin) {
      return res.status(400).json({
        ok: false,
        error: 'PIN is required for login',
      });
    }

    // Validate PIN format
    if (!/^[0-9]{4,8}$/.test(pin)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid PIN format. Must be 4-8 digits.',
      });
    }

    const result = await teamLogin({ email, pin });

    res.json(result);
  } catch (error: any) {
    logger.error('Team login error:', error);
    res.status(error.statusCode || 500).json({
      ok: false,
      error: error.message || 'Login failed',
    });
  }
});

/**
 * GET /api/auth/team/members
 * Get list of all team members
 */
router.get('/members', async (_req: Request, res: Response) => {
  try {
    const members = getTeamMembers();

    res.json({
      ok: true,
      data: {
        members,
        total: members.length,
      },
    });
  } catch (error: any) {
    logger.error('Get team members error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to get team members',
    });
  }
});

/**
 * POST /api/auth/team/logout
 * Logout team member session
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: 'Session ID required for logout',
      });
    }

    const success = logoutSession(sessionId);

    res.json({
      ok: true,
      data: {
        success,
        message: success ? 'Logged out successfully' : 'Session not found',
      },
    });
  } catch (error: any) {
    logger.error('Team logout error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Logout failed',
    });
  }
});

/**
 * GET /api/auth/team/validate
 * Validate current session
 */
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(401).json({
        ok: false,
        error: 'No session provided',
      });
    }

    const session = validateSession(sessionId);

    if (!session) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid or expired session',
      });
    }

    res.json({
      ok: true,
      data: {
        valid: true,
        session: {
          id: session.id,
          user: session.user,
          permissions: session.permissions,
          loginTime: session.loginTime,
          lastActivity: session.lastActivity,
        },
      },
    });
  } catch (error: any) {
    logger.error('Session validation error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Validation failed',
    });
  }
});

/**
 * GET /api/auth/team/profile
 * Get current user profile from session
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(401).json({
        ok: false,
        error: 'No session provided',
      });
    }

    const session = validateSession(sessionId);

    if (!session) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid or expired session',
      });
    }

    res.json({
      ok: true,
      data: {
        user: session.user,
        permissions: session.permissions,
        loginTime: session.loginTime,
      },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to get profile',
    });
  }
});

export default router;
