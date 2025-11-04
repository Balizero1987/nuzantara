/**
 * User Authentication Routes
 * Complete authentication system: register, login, password management, profile
 * Feature #11: User Authentication System
 */

import { Router, Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  verifyEmail,
  getAllUsers,
} from '../../../handlers/auth/user-auth.js';
import { requireAuth } from '../../../middleware/auth.middleware.js';
import { logger } from '../../../logging/unified-logger.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register new user
 *
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "name": "John Doe",
 *   "phone": "+1234567890",    // optional
 *   "company": "My Company"    // optional
 * }
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, company } = req.body || {};

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required',
      });
    }

    if (!password) {
      return res.status(400).json({
        ok: false,
        error: 'Password is required',
      });
    }

    if (!name) {
      return res.status(400).json({
        ok: false,
        error: 'Name is required',
      });
    }

    const result = await registerUser({
      email,
      password,
      name,
      phone,
      company,
    });

    res.status(201).json(result);
  } catch (error: any) {
    logger.error('Register route error:', error);
    res.status(400).json({
      ok: false,
      error: error?.message || 'Registration failed',
    });
  }
});

/**
 * POST /api/auth/login
 * Login user
 *
 * Body:
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required',
      });
    }

    const result = await loginUser({ email, password });

    res.json(result);
  } catch (error: any) {
    logger.error('Login route error:', error);
    res.status(401).json({
      ok: false,
      error: error?.message || 'Login failed',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 *
 * Body:
 * {
 *   "refresh_token": "..."
 * }
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body || {};

    if (!refresh_token) {
      return res.status(400).json({
        ok: false,
        error: 'Refresh token is required',
      });
    }

    const result = await refreshToken(refresh_token);

    res.json(result);
  } catch (error: any) {
    logger.error('Refresh token route error:', error);
    res.status(401).json({
      ok: false,
      error: error?.message || 'Token refresh failed',
    });
  }
});

/**
 * GET /api/auth/profile
 * Get user profile (requires authentication)
 *
 * Headers:
 * Authorization: Bearer <token>
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User ID not found',
      });
    }

    const result = await getUserProfile(userId);

    res.json(result);
  } catch (error: any) {
    logger.error('Get profile route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to get profile',
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Body:
 * {
 *   "name": "New Name",       // optional
 *   "phone": "+1234567890",   // optional
 *   "company": "New Company", // optional
 *   "role": "Manager"         // optional
 * }
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User ID not found',
      });
    }

    const { name, phone, company, role } = req.body || {};

    const result = await updateUserProfile(userId, {
      name,
      phone,
      company,
      role,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Update profile route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to update profile',
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 *
 * Headers:
 * Authorization: Bearer <token>
 *
 * Body:
 * {
 *   "current_password": "oldpass123",
 *   "new_password": "newpass123"
 * }
 */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User ID not found',
      });
    }

    const { current_password, new_password } = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({
        ok: false,
        error: 'Current and new password are required',
      });
    }

    const result = await changePassword(userId, {
      current_password,
      new_password,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Change password route error:', error);
    res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to change password',
    });
  }
});

/**
 * POST /api/auth/request-reset
 * Request password reset
 *
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 */
router.post('/request-reset', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        ok: false,
        error: 'Email is required',
      });
    }

    const result = await requestPasswordReset(email);

    res.json(result);
  } catch (error: any) {
    logger.error('Request reset route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to request password reset',
    });
  }
});

/**
 * POST /api/auth/reset-password
 * Reset password with token
 *
 * Body:
 * {
 *   "reset_token": "...",
 *   "new_password": "newpass123"
 * }
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { reset_token, new_password } = req.body || {};

    if (!reset_token || !new_password) {
      return res.status(400).json({
        ok: false,
        error: 'Reset token and new password are required',
      });
    }

    const result = await resetPassword({
      reset_token,
      new_password,
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Reset password route error:', error);
    res.status(400).json({
      ok: false,
      error: error?.message || 'Failed to reset password',
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address (requires authentication)
 *
 * Headers:
 * Authorization: Bearer <token>
 */
router.post('/verify-email', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User ID not found',
      });
    }

    const result = await verifyEmail(userId);

    res.json(result);
  } catch (error: any) {
    logger.error('Verify email route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to verify email',
    });
  }
});

/**
 * GET /api/auth/users
 * Get all users (for testing/admin only)
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const result = await getAllUsers();
    res.json(result);
  } catch (error: any) {
    logger.error('Get users route error:', error);
    res.status(500).json({
      ok: false,
      error: error?.message || 'Failed to get users',
    });
  }
});

export default router;
