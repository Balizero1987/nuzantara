/**
 * Demo User Authentication
 * 
 * Creates a secure demo user with limited permissions for public access
 * Allows frontend to access handlers without exposing real credentials
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface RequestWithDemo extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    isDemo: boolean;
  };
}

/**
 * Demo user configuration
 */
const DEMO_USER = {
  userId: 'demo-user-001',
  email: 'demo@zantara.com',
  name: 'Demo User',
  role: 'demo', // Special role with limited permissions
  password: 'demo123' // Public password for demo purposes
};

/**
 * Handlers allowed for demo user (read-only, safe operations)
 */
const DEMO_ALLOWED_HANDLERS = new Set([
  // System info (safe)
  'system.handlers.list',
  'system.handlers.category',
  'system.handlers.get',
  'system.handlers.tools',
  
  // Search & RAG (read-only)
  'rag.query',
  'rag.search',
  'pricing.official',
  'pricing.search',
  
  // AI Chat (safe, rate-limited)
  'ai.chat',
  'ai.chat.stream',
  
  // Bali Zero chat (safe)
  'bali.zero.chat',
  
  // Bali Zero pricing (read-only, safe)
  'bali.zero.pricing',        // FIX: Add pricing handler
  'bali.zero.price',          // FIX: Add price lookup
  'price.lookup',             // FIX: Add price lookup alias
  
  // Team authentication (public)
  'team.list',
  'team.members',
  'team.login',   // Allow team login for authentication
  'team.logout',  // Allow logout
  
  // Oracle queries (read-only)
  'oracle.query',
  
  // Memory read (own data only)
  'memory.retrieve',
  
  // Intel search (read-only)
  'intel.news.search'
]);

/**
 * Handlers FORBIDDEN for demo user (write operations, sensitive data)
 */
const DEMO_FORBIDDEN_HANDLERS = new Set([
  // Admin operations
  'team.create',
  'team.delete',
  'team.update',
  'admin.*',
  
  // Data modification
  'gmail.send',
  'gmail.delete',
  'drive.delete',
  'sheets.update',
  'calendar.create',
  'calendar.delete',
  
  // Memory write
  'memory.save',
  'memory.delete',
  
  // CRM operations
  'crm.*',
  
  // Work sessions
  'session.end',
  'end_user_session',
  
  // Sensitive data
  'client.*',
  'practice.*',
  'interaction.*'
]);

/**
 * Check if demo user can access handler
 */
export function isDemoAllowed(handlerKey: string): boolean {
  // Check explicit allow list
  if (DEMO_ALLOWED_HANDLERS.has(handlerKey)) {
    return true;
  }
  
  // Check forbidden patterns
  for (const pattern of Array.from(DEMO_FORBIDDEN_HANDLERS)) {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      if (handlerKey.startsWith(prefix)) {
        return false;
      }
    }
    if (pattern === handlerKey) {
      return false;
    }
  }
  
  // Default: deny (safe by default)
  return false;
}

/**
 * Demo user authentication middleware
 * 
 * Allows public demo access with limited permissions
 */
export function demoUserAuth(req: RequestWithDemo, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for JWT token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      
      try {
        const decoded = jwt.verify(token, jwtSecret) as any;
        
        // Set user from JWT
        req.user = {
          userId: decoded.userId || 'unknown',
          email: decoded.email || 'unknown',
          role: decoded.role || 'member',
          isDemo: decoded.email === DEMO_USER.email
        };
        
        return next();
      } catch (jwtError) {
        // Invalid JWT, fall through to demo user check
      }
    }
    
    // No valid JWT - check for demo credentials in body
    const { handler, key } = req.body;
    const handlerKey = handler || key;
    
    // Create demo user context
    req.user = {
      userId: DEMO_USER.userId,
      email: DEMO_USER.email,
      role: DEMO_USER.role,
      isDemo: true
    };
    
    // Check if handler is allowed for demo
    if (handlerKey && !isDemoAllowed(handlerKey)) {
      return res.status(403).json({
        ok: false,
        error: 'Demo user cannot access this handler',
        handler: handlerKey,
        message: 'This operation requires authentication. Please login with your credentials.',
        allowed_handlers: Array.from(DEMO_ALLOWED_HANDLERS).slice(0, 10)
      });
    }
    
    next();
    
  } catch (error: any) {
    console.error('Demo auth error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Create demo user JWT token
 */
export function createDemoToken(): string {
  const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
  
  return jwt.sign(
    {
      userId: DEMO_USER.userId,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      role: DEMO_USER.role,
      isDemo: true
    },
    jwtSecret,
    {
      expiresIn: '24h'
    }
  );
}

/**
 * Demo user login endpoint data
 */
export function getDemoUserCredentials() {
  return {
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    note: 'Public demo credentials - read-only access to safe handlers'
  };
}

export default demoUserAuth;

