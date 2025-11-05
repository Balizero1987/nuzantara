/**
 * TAX PLATFORM - Authentication Handlers
 *
 * Endpoints:
 * - POST /api/tax/auth/login
 * - POST /api/tax/auth/logout
 * - GET  /api/tax/auth/me
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import logger from '../../services/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// TODO: Replace with actual database queries
// For now, using mock data - will connect to tax_consultants table
const MOCK_USERS = [
  {
    id: 'veronika-uuid',
    email: 'veronika@balizero.com',
    full_name: 'Veronika',
    role: 'tax_manager',
    password_hash: '$2a$10$MOCK_HASH', // In real DB, this is hashed
    permissions: {
      can_view_all_clients: true,
      can_create_calculations: true,
      can_approve_calculations: true,
      can_manage_users: true,
      can_send_to_portal: true,
      can_create_invoices: true
    }
  },
  {
    id: 'angel-uuid',
    email: 'angel@balizero.com',
    full_name: 'Angel',
    role: 'tax_expert',
    password_hash: '$2a$10$MOCK_HASH',
    permissions: {
      can_view_all_clients: true,
      can_create_calculations: true,
      can_approve_calculations: false,
      can_manage_users: false,
      can_send_to_portal: true,
      can_create_invoices: true
    }
  }
];

/**
 * POST /api/tax/auth/login
 * Authenticate user and return JWT token
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: 'Email and password are required'
      });
    }

    // TODO: Query database for user
    // const user = await db.query('SELECT * FROM tax_consultants WHERE email = $1 AND active = true', [email]);

    // Mock user lookup
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      logger.warn(`Login attempt for non-existent user: ${email}`);
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }

    // TODO: Verify password with bcrypt
    // const passwordMatch = await bcrypt.compare(password, user.password_hash);

    // Mock password check (for development)
    const passwordMatch = password === 'demo123'; // REMOVE IN PRODUCTION

    if (!passwordMatch) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({
        ok: false,
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // TODO: Update last_login in database
    // await db.query('UPDATE tax_consultants SET last_login = NOW() WHERE id = $1', [user.id]);

    logger.info(`User logged in: ${user.email} (${user.role})`);

    // Return user info and token
    return res.json({
      ok: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          permissions: user.permissions
        },
        expires_in: JWT_EXPIRES_IN
      }
    });

  } catch (error: any) {
    logger.error('Login error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Login failed. Please try again.'
    });
  }
}

/**
 * POST /api/tax/auth/logout
 * Logout user (client-side token removal)
 */
export async function logout(req: Request, res: Response) {
  try {
    // JWT is stateless, so logout is primarily client-side
    // We just log the action

    const user = (req as any).user;
    if (user) {
      logger.info(`User logged out: ${user.email}`);
    }

    return res.json({
      ok: true,
      message: 'Logged out successfully'
    });

  } catch (error: any) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Logout failed'
    });
  }
}

/**
 * GET /api/tax/auth/me
 * Get current authenticated user info
 */
export async function me(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Not authenticated'
      });
    }

    // TODO: Fetch fresh user data from database
    // const dbUser = await db.query('SELECT * FROM tax_consultants WHERE id = $1', [user.sub]);

    // Return current user info
    return res.json({
      ok: true,
      data: {
        user: {
          id: user.sub,
          email: user.email,
          role: user.role,
          permissions: user.permissions
        }
      }
    });

  } catch (error: any) {
    logger.error('Get current user error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to get user info'
    });
  }
}

/**
 * Middleware: Verify JWT token
 * Add this to protected routes
 */
export function verifyToken(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        ok: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user to request
    (req as any).user = decoded;

    next();

  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'Token expired'
      });
    }

    return res.status(401).json({
      ok: false,
      error: 'Invalid token'
    });
  }
}

/**
 * Middleware: Check user role
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: 'Not authenticated'
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}

/**
 * Middleware: Check specific permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: Function) => {
    const user = (req as any).user;

    if (!user || !user.permissions) {
      return res.status(401).json({
        ok: false,
        error: 'Not authenticated'
      });
    }

    if (!user.permissions[permission]) {
      return res.status(403).json({
        ok: false,
        error: `Permission denied: ${permission}`
      });
    }

    next();
  };
}
