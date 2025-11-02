/**
 * JWT Authentication Middleware
 * 
 * Handles JWT token verification and user extraction for protected routes.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface RequestWithJWT extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * JWT Authentication Middleware
 */
export function jwtAuth(req: RequestWithJWT, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
    
    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Extract user info from token
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error: any) {
    console.error('JWT Auth error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'Token expired'
      });
    }
    
    return res.status(500).json({
      ok: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Optional JWT Authentication Middleware
 * Doesn't fail if no token is provided
 */
export function optionalJwtAuth(req: RequestWithJWT, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
    
  } catch (error: any) {
    // Token invalid, but continue without user
    console.warn('Optional JWT Auth warning:', error.message);
    next();
  }
}

export default jwtAuth;
