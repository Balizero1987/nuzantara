/**
 * Admin Authentication Middleware
 * 
 * Restricts access to admin-only routes for the analytics dashboard.
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.js';

// List of users with admin access to the dashboard
const ADMIN_USERS = ['Zero', 'Veronika', 'Ruslana'];

export interface RequestWithAdmin extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    name: string;
  };
}

/**
 * Admin Authentication Middleware
 */
export function adminAuth(req: RequestWithAdmin, res: Response, next: NextFunction) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('Admin Auth: User not authenticated', {
        path: req.path,
        ip: req.ip || 'unknown'
      });

      return res.status(401).json({
        ok: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has admin access
    if (!ADMIN_USERS.includes(req.user.name)) {
      logger.warn('Admin Auth: Access denied', {
        userId: req.user.userId,
        email: req.user.email.substring(0, 3) + '***',
        name: req.user.name,
        path: req.path,
        ip: req.ip || 'unknown'
      });

      logger.info('ADMIN_ACCESS_AUDIT', {
        event: 'access_denied',
        userId: req.user.userId,
        email: req.user.email.substring(0, 3) + '***',
        name: req.user.name,
        path: req.path,
        ip: req.ip || 'unknown',
        timestamp: new Date().toISOString()
      });

      return res.status(403).json({
        ok: false,
        error: 'Access denied. Admin access required.'
      });
    }

    // Audit successful admin access
    logger.info('ADMIN_ACCESS_AUDIT', {
      event: 'access_granted',
      userId: req.user.userId,
      email: req.user.email.substring(0, 3) + '***',
      name: req.user.name,
      path: req.path,
      ip: req.ip || 'unknown',
      timestamp: new Date().toISOString()
    });
    
    next();
    
  } catch (error: any) {
    // BUG FIX: Use logger instead of console.error
    logger.error('Admin Auth error:', {
      error: error.message,
      stack: error.stack,
      path: req.path
    });

    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}