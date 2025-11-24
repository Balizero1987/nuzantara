/**
 * Authentication Routes
 * Handles login, token validation, and user profile
 */

import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ok, err } from '../utils/response.js';
import { jwtAuth, RequestWithJWT } from '../middleware/jwt-auth.js';
import { verifyToken } from '../handlers/auth/verify.js';
import { getTeamMemberByEmail, getTeamMemberById } from '../config/team-members.js';

const router = Router();

// JWT Secret from environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for authentication routes');
}
const JWT_EXPIRY = '7d'; // 7 days

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email(),
  pin: z.string().min(4).max(6),
});

/**
 * POST /api/auth/login
 * Authenticate user with email and PIN
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, pin } = LoginSchema.parse(req.body);

    // Find user
    const user = getTeamMemberByEmail(email);

    if (!user) {
      return res.status(401).json(err('Invalid credentials'));
    }

    // Verify PIN
    if (user.pin !== pin) {
      return res.status(401).json(err('Invalid credentials'));
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        user_id: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Return success with token and user data
    return res.status(200).json(
      ok({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          position: user.position,
        },
        expires_in: JWT_EXPIRY,
      })
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(err('Invalid request: ' + error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal server error'));
  }
});

/**
 * GET /api/auth/check
 * Verify if current token is valid
 */
router.get('/check', jwtAuth as any, (async (req: RequestWithJWT, res: Response) => {
  try {
    // If jwtAuth middleware passed, token is valid
    const userId = req.user?.userId || req.user?.email;

    // Find full user data
    const user = getTeamMemberById(userId) || getTeamMemberByEmail(userId);

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
    const user = getTeamMemberById(userId) || getTeamMemberByEmail(userId);

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
