/**
 * JWT Token Verification Endpoint
 * Validates token and returns user info
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../../services/logger.js';
import { ok, err } from '../../utils/response.js';

const JWT_SECRET: string = process.env.JWT_SECRET || '';
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for token verification');
}

export async function verifyToken(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(err('No token provided'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token is in blacklist (implement later)
    // const isBlacklisted = await checkTokenBlacklist(token);
    // if (isBlacklisted) {
    //   return res.status(401).json(err('Token has been revoked'));
    // }

    logger.info(`✅ Token verified for user: ${decoded.userId || decoded.user_id || decoded.email}`);

    return res.json(ok({
      valid: true,
      user: {
        id: decoded.userId || decoded.user_id,
        email: decoded.email,
        role: decoded.role,
        department: decoded.department,
      },
      expiresAt: decoded.exp ? decoded.exp * 1000 : null, // Convert to milliseconds
    }));

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired');
      return res.status(401).json(err('Token expired'));
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token');
      return res.status(401).json(err('Invalid token'));
    }

    logger.error('Token verification error:', error instanceof Error ? error : new Error(String(error)));
    return res.status(500).json(err('Token verification failed'));
  }
}

