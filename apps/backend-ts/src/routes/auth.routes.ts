/**
 * Authentication Routes
 * Handles login, token validation, and user profile
 */

import { Router, Request, Response } from 'express';
import { ok, err } from '../utils/response.js';
import { jwtAuth, RequestWithJWT } from '../middleware/jwt-auth.js';
import { verifyToken } from '../handlers/auth/verify.js';
import { getTeamMemberByEmail, getTeamMemberById } from '../config/team-members.js';

const router = Router();

// REMOVED: POST /api/auth/login - Consolidated to /api/auth/team/login
// All login functionality is now handled by /api/auth/team/login route

/**
 * GET /api/auth/check
 * Verify if current token is valid
 */
router.get('/check', jwtAuth as any, (async (req: RequestWithJWT, res: Response) => {
  try {
    // If jwtAuth middleware passed, token is valid
    const userId = req.user?.userId || req.user?.email;

    // Find full user data
    const user = await getTeamMemberById(String(userId)) || await getTeamMemberByEmail(String(userId));

    if (!user) {
      return res.status(401).json(err('User not found'));
    }

    return res.status(200).json(
      ok({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          position: user.position,
        },
      })
    );
  } catch (error: any) {
    return res.status(401).json(err('Authentication failed'));
  }
}) as any);

/**
 * POST /api/auth/verify
 * Verify JWT token validity
 */
router.post('/verify', verifyToken);

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    // In a stateless JWT system, logout is client-side
    // Server just confirms the action
    return res.status(200).json(
      ok({
        message: 'Logged out successfully',
        action: 'Please remove token from client storage',
      })
    );
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Logout failed'));
  }
});

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', jwtAuth as any, (async (req: RequestWithJWT, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?.email;

    // Find user
    const user = await getTeamMemberById(String(userId)) || await getTeamMemberByEmail(String(userId));

    if (!user) {
      return res.status(404).json(err('User not found'));
    }

    return res.status(200).json(
      ok({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        position: user.position,
        // Add more profile fields as needed
        settings: {
          language: 'en',
          timezone: 'Asia/Jakarta',
          notifications: true,
        },
      })
    );
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Failed to fetch profile'));
  }
}) as any);

export default router;
