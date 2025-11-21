/**
 * Authentication Middleware
 * JWT token verification for protected routes
 * Feature #11: User Authentication System
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../handlers/auth/team-login-secure.js';
import { logger } from '../logging/unified-logger.js';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

/**
 * Require Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        error: 'Authorization header is required',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Authorization header must start with Bearer',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Token is required',
      });
    }

    // Verify token
    const result = await verifyToken(token);

    if (!result.ok) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid or expired token',
      });
    }

    // Attach user info to request
    req.user = {
      userId: result.userId,
      email: result.email,
    };

    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(401).json({
      ok: false,
      error: error?.message || 'Authentication failed',
    });
  }
}

/**
 * Optional Authentication Middleware
 * Verifies token if present, but allows request to continue if not
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user info
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const result = await verifyToken(token);
      if (result.ok) {
        req.user = {
          userId: result.userId,
          email: result.email,
        };
      }
    } catch (error: any) {
      // Invalid token, but don't block request
      logger.warn('Optional auth failed:', error.message);
    }

    next();
  } catch (error: any) {
    logger.error('Optional auth middleware error:', error instanceof Error ? error : new Error(String(error)));
    next(); // Continue anyway
  }
}
