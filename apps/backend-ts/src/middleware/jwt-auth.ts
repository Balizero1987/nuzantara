import type { Error } from "express";
/**
 * JWT Authentication Middleware - Enhanced Security Edition
 * 
 * Features:
 * - Enhanced token validation with multiple field support
 * - Rate limiting for failed attempts
 * - Audit trail for authentication events
 * - GDPR-compliant logging (no sensitive data)
 * - Backward compatibility with existing tokens
 * 
 * Version: 2.0 - Security Enhanced
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../logging/unified-logger.js';

// Feature flags for gradual rollout
const ENABLE_STRICT_VALIDATION = process.env.JWT_STRICT_VALIDATION === 'true';
const ENABLE_AUDIT_LOGGING = process.env.JWT_AUDIT_LOGGING !== 'false'; // Default true
const ENABLE_RATE_LIMITING = process.env.JWT_RATE_LIMITING !== 'false'; // Default true

// Rate limiting for failed JWT attempts (anti-brute force)
const failedAuthAttempts = new Map<string, { count: number; timestamp: number; blockedUntil?: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes block

interface AuditEvent {
  event: 'auth_success' | 'auth_failure' | 'auth_error' | 'token_expired' | 'invalid_token';
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  timestamp: string;
}

/**
 * Audit logging for authentication events (GDPR compliant - no passwords/tokens)
 */
function auditLog(event: AuditEvent): void {
  if (!ENABLE_AUDIT_LOGGING) return;

  logger.info('JWT_AUTH_AUDIT', {
    event: event.event,
    userId: event.userId || 'unknown',
    email: event.email ? event.email.substring(0, 3) + '***' : 'unknown', // Partial email for privacy
    ip: event.ip || 'unknown',
    userAgent: event.userAgent?.substring(0, 50) || 'unknown', // Truncated
    reason: event.reason,
    timestamp: event.timestamp
  });
}

/**
 * Check rate limiting for authentication attempts
 */
function checkRateLimit(identifier: string): { allowed: boolean; reason?: string } {
  if (!ENABLE_RATE_LIMITING) return { allowed: true };

  const attempts = failedAuthAttempts.get(identifier);
  
  if (!attempts) return { allowed: true };

  // Check if blocked
  if (attempts.blockedUntil && Date.now() < attempts.blockedUntil) {
    const minutesLeft = Math.ceil((attempts.blockedUntil - Date.now()) / 60000);
    return { 
      allowed: false, 
      reason: `Too many failed attempts. Blocked for ${minutesLeft} more minutes.` 
    };
  }

  // Check if within rate limit window
  const timeSinceFirstAttempt = Date.now() - attempts.timestamp;
  if (timeSinceFirstAttempt < RATE_LIMIT_WINDOW_MS && attempts.count >= MAX_FAILED_ATTEMPTS) {
    // Block user
    attempts.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    failedAuthAttempts.set(identifier, attempts);
    
    auditLog({
      event: 'auth_failure',
      reason: 'rate_limit_exceeded',
      timestamp: new Date().toISOString()
    });

    return { 
      allowed: false, 
      reason: `Too many failed attempts. Blocked for ${Math.ceil(BLOCK_DURATION_MS / 60000)} minutes.` 
    };
  }

  // Reset if window expired
  if (timeSinceFirstAttempt >= RATE_LIMIT_WINDOW_MS) {
    failedAuthAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record failed authentication attempt
 */
function recordFailedAttempt(identifier: string): void {
  if (!ENABLE_RATE_LIMITING) return;

  const attempts = failedAuthAttempts.get(identifier) || { count: 0, timestamp: Date.now() };
  attempts.count += 1;
  attempts.timestamp = attempts.timestamp || Date.now();
  failedAuthAttempts.set(identifier, attempts);
}

/**
 * Clear failed attempts on successful authentication
 */
function clearFailedAttempts(identifier: string): void {
  if (!ENABLE_RATE_LIMITING) return;
  failedAuthAttempts.delete(identifier);
}

export interface RequestWithJWT extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    name?: string; // For adminAuth compatibility
    department?: string; // For team login compatibility
    sessionId?: string; // For session tracking
    isDemo?: boolean; // For demo user compatibility
  };
}

/**
 * JWT Authentication Middleware
 */
export function jwtAuth(req: RequestWithJWT, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const clientIP = req.header('x-forwarded-for') || req.ip || req.connection?.remoteAddress || 'unknown';
  const userAgent = req.header('user-agent') || 'unknown';
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      auditLog({
        event: 'auth_failure',
        reason: 'missing_auth_header',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Authorization header missing or invalid'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Rate limiting check
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      auditLog({
        event: 'auth_failure',
        reason: 'rate_limit',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(429).json({
        ok: false,
        error: rateCheck.reason || 'Too many authentication attempts'
      });
    }
    
    // BUG FIX: Check for JWT_SECRET in environment (NO HARDCODED FALLBACK)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured in environment variables');
      
      auditLog({
        event: 'auth_error',
        reason: 'misconfiguration',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(500).json({
        ok: false,
        error: 'Authentication service misconfigured'
      });
    }
    
    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (verifyError: any) {
      // Record failed attempt
      recordFailedAttempt(clientIP);

      // Handle specific JWT errors
      if (verifyError.name === 'JsonWebTokenError') {
        auditLog({
          event: 'invalid_token',
          reason: 'invalid_signature',
          ip: clientIP,
          userAgent,
          timestamp: new Date().toISOString()
        });

        return res.status(401).json({
          ok: false,
          error: 'Invalid token'
        });
      }
      
      if (verifyError.name === 'TokenExpiredError') {
        auditLog({
          event: 'token_expired',
          ip: clientIP,
          userAgent,
          timestamp: new Date().toISOString()
        });

        return res.status(401).json({
          ok: false,
          error: 'Token expired'
        });
      }
      
      // Unexpected error
      logger.error('JWT verification unexpected error:', {
        name: verifyError.name,
        message: verifyError.message,
        stack: verifyError.stack
      });

      auditLog({
        event: 'auth_error',
        reason: verifyError.name,
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Token verification failed'
      });
    }
    
    // BUG FIX: Validate decoded token structure
    if (!decoded || typeof decoded !== 'object') {
      recordFailedAttempt(clientIP);
      
      auditLog({
        event: 'invalid_token',
        reason: 'invalid_payload_structure',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Invalid token payload'
      });
    }
    
    // BUG FIX: Handle multiple ID field names (userId, id, sub) for backward compatibility
    const userId = decoded.userId || decoded.id || decoded.sub;
    
    // BUG FIX: Validate required fields are present
    if (ENABLE_STRICT_VALIDATION && (!userId || !decoded.email)) {
      recordFailedAttempt(clientIP);
      
      auditLog({
        event: 'invalid_token',
        reason: 'missing_required_fields',
        userId: userId || 'unknown',
        email: decoded.email ? decoded.email.substring(0, 3) + '***' : 'none',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Token missing required user information'
      });
    }
    
    // Extract user info from token (handle all possible field names for backward compatibility)
    const extractedEmail = decoded.email || decoded.email_address || '';
    const extractedUserId = userId || 'unknown';
    
    // Final validation
    if (!extractedEmail || extractedUserId === 'unknown') {
      recordFailedAttempt(clientIP);
      
      auditLog({
        event: 'invalid_token',
        reason: 'invalid_user_data',
        ip: clientIP,
        userAgent,
        timestamp: new Date().toISOString()
      });

      return res.status(401).json({
        ok: false,
        error: 'Token contains invalid user data'
      });
    }

    // Build user object with all compatible fields
    req.user = {
      userId: extractedUserId,
      email: extractedEmail,
      role: decoded.role || decoded.user_role || 'member',
      name: decoded.name || decoded.username || extractedEmail.split('@')[0], // For adminAuth
      department: decoded.department, // Optional, for team login
      sessionId: decoded.sessionId, // Optional, for session tracking
      isDemo: decoded.isDemo || false // Optional, default false
    };
    
    // Clear failed attempts on successful authentication
    clearFailedAttempts(clientIP);

    // Success audit log
    const processingTime = Date.now() - startTime;
    auditLog({
      event: 'auth_success',
      userId: req.user.userId,
      email: req.user.email,
      ip: clientIP,
      userAgent,
      reason: `authenticated in ${processingTime}ms`,
      timestamp: new Date().toISOString()
    });
    
    next();
    
  } catch (error: any) {
    recordFailedAttempt(clientIP);
    
    // Use logger instead of console.error
    logger.error('JWT Auth unexpected error:', { 
      error: error.message, 
      name: error.name,
      stack: error.stack,
      ip: clientIP
    });

    auditLog({
      event: 'auth_error',
      reason: error.name || 'unexpected_error',
      ip: clientIP,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to client
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
    
    // BUG FIX: Check for JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.warn('JWT_SECRET not configured, skipping optional JWT auth');
      return next();
    }
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (verifyError: any) {
      // Token invalid, but continue without user (no rate limiting for optional)
      logger.debug('Optional JWT Auth: Token verification failed', { 
        error: verifyError.message 
      });
      return next();
    }
    
    // BUG FIX: Validate decoded token
    if (!decoded || typeof decoded !== 'object') {
      logger.debug('Optional JWT Auth: Invalid token payload');
      return next();
    }
    
    // BUG FIX: Handle multiple ID field names
    const userId = decoded.userId || decoded.id || decoded.sub;
    const extractedEmail = decoded.email || decoded.email_address || '';
    
    if (!userId || !extractedEmail) {
      logger.debug('Optional JWT Auth: Missing required fields');
      req.user = undefined;
      return next();
    }
    
    req.user = {
      userId: userId,
      email: extractedEmail,
      role: decoded.role || decoded.user_role || 'member',
      name: decoded.name || decoded.username || extractedEmail.split('@')[0],
      department: decoded.department,
      sessionId: decoded.sessionId,
      isDemo: decoded.isDemo || false
    };
    
    // Only set user if we have valid data
    if (!req.user.email || req.user.userId === 'unknown') {
      req.user = undefined;
    }
    
    next();
    
  } catch (error: any) {
    // Token invalid, but continue without user
    logger.debug('Optional JWT Auth warning:', { 
      error: error.message,
      name: error.name 
    });
    next();
  }
}

export default jwtAuth;
