/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens
 */

import { Request, Response, NextFunction, Router } from 'express';
import crypto from 'crypto';
import logger from '../services/logger.js';

// Store CSRF tokens in memory (use Redis for production)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Token expiry: 1 hour
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate CSRF token for session
 */
export function generateCsrfToken(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.headers['x-session-id'] as string || crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');
    
    csrfTokens.set(sessionId, {
      token,
      expiresAt: Date.now() + TOKEN_EXPIRY,
    });

    // Cleanup expired tokens
    cleanupExpiredTokens();

    // Set token in response headers
    res.setHeader('X-CSRF-Token', token);
    res.setHeader('X-Session-Id', sessionId);

    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error instanceof Error ? error : new Error(String(error)));
    next(error);
  }
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for the csrf-token endpoint itself
  if (req.path === '/api/csrf-token') {
    return next();
  }

  // Skip CSRF for authentication endpoints (JWT handles security)
  if (req.path && (req.path.startsWith('/auth/') || req.path.startsWith('/api/auth/'))) {
    return next();
  }

  try {
    const sessionId = req.headers['x-session-id'] as string;
    const token = req.headers['x-csrf-token'] as string;

    if (!sessionId || !token) {
      logger.warn('CSRF validation failed: Missing token or session');
      return res.status(403).json({ 
        ok: false, 
        error: 'CSRF token required' 
      });
    }

    const stored = csrfTokens.get(sessionId);

    if (!stored) {
      logger.warn(`CSRF validation failed: Session ${sessionId} not found`);
      return res.status(403).json({ 
        ok: false, 
        error: 'Invalid session' 
      });
    }

    if (stored.expiresAt < Date.now()) {
      logger.warn(`CSRF validation failed: Token expired for session ${sessionId}`);
      csrfTokens.delete(sessionId);
      return res.status(403).json({ 
        ok: false, 
        error: 'CSRF token expired' 
      });
    }

    if (stored.token !== token) {
      logger.warn(`CSRF validation failed: Token mismatch for session ${sessionId}`);
      return res.status(403).json({ 
        ok: false, 
        error: 'Invalid CSRF token' 
      });
    }

    // Token valid, regenerate for next request
    const newToken = crypto.randomBytes(32).toString('hex');
    csrfTokens.set(sessionId, {
      token: newToken,
      expiresAt: Date.now() + TOKEN_EXPIRY,
    });
    res.setHeader('X-CSRF-Token', newToken);

    next();
  } catch (error) {
    logger.error('CSRF validation error:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ ok: false, error: 'CSRF validation failed' });
  }
}

/**
 * Cleanup expired tokens (run periodically)
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (data.expiresAt < now) {
      csrfTokens.delete(sessionId);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

/**
 * CSRF Routes
 */
export const csrfRoutes = Router();

// Get CSRF token endpoint
csrfRoutes.get('/csrf-token', (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'] as string || crypto.randomUUID();
    const token = crypto.randomBytes(32).toString('hex');

    csrfTokens.set(sessionId, {
      token,
      expiresAt: Date.now() + TOKEN_EXPIRY,
    });

    res.setHeader('X-CSRF-Token', token);
    res.setHeader('X-Session-Id', sessionId);

    res.json({
      ok: true,
      csrfToken: token,
      sessionId: sessionId,
      expiresIn: TOKEN_EXPIRY / 1000 // seconds
    });
  } catch (error) {
    logger.error('CSRF token endpoint error:', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ ok: false, error: 'Failed to generate CSRF token' });
  }
});

