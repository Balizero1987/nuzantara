/**
 * Admin Authentication Middleware
 * 
 * Restricts access to admin-only routes for the analytics dashboard.
 */

import { Request, Response, NextFunction } from 'express';

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
      return res.status(401).json({
        ok: false,
        error: 'User not authenticated'
      });
    }

    // Check if user has admin access
    if (!ADMIN_USERS.includes(req.user.name)) {
      return res.status(403).json({
        ok: false,
        error: 'Access denied. Admin access required.'
      });
    }
    
    next();
    
  } catch (error: any) {
    console.error('Admin Auth error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
}