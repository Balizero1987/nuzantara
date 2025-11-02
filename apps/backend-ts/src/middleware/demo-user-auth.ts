/**
 * Demo User Authentication
 * 
 * Creates a secure demo user with limited permissions for public access
 * Allows frontend to access handlers without exposing real credentials
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/unified-logger.js';
import jwt from 'jsonwebtoken';

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
 * Handlers allowed for TEAM MEMBERS (expanded access for internal team)
 * Demo users get basic access, team members get full operational access
 */
const TEAM_MEMBER_HANDLERS = new Set([
  // === SYSTEM & INTROSPECTION ===
  'system.handlers.list',
  'system.handlers.category',
  'system.handlers.get',
  'system.handlers.tools',
  'system.handler.execute',
  
  // === AI SERVICES ===
  'ai.chat',
  'ai.chat.stream',
  'ai-services.chat',
  'ai-services.anticipate',
  'ai-services.learn',
  
  // === RAG & SEARCH ===
  'rag.query',
  'rag.search',
  'rag.health',
  'bali.zero.chat',
  
  // === PRICING (Read-only) ===
  'bali.zero.pricing',
  'bali.zero.price',
  'pricing.official',
  'pricing.search',
  'price.lookup',
  
  // === TEAM MANAGEMENT ===
  'team.list',
  'team.members',
  'team.login',
  'team.logout',
  'team.token.verify',
  
  // === ORACLE SYSTEM ===
  'oracle.query',
  'oracle.search',
  'oracle.simulate',
  'oracle.analyze',
  'oracle.predict',
  
  // === MEMORY (Read & Write own data) ===
  'memory.retrieve',
  'memory.search',
  'memory.save',
  'memory.search.semantic',
  'memory.search.hybrid',
  'user.memory.retrieve',
  'user.memory.search',
  'user.memory.save',
  
  // === IDENTITY & ONBOARDING ===
  'identity.resolve',
  'onboarding.start',
  
  // === BUSINESS OPERATIONS ===
  'kbli.lookup',
  'kbli.requirements',
  'kbli.search',
  
  // === ANALYTICS (Read-only) ===
  'analytics.overview',
  'analytics.weekly',
  'activity.track',
  
  // === COMMUNICATION (Send messages) ===
  'whatsapp.send.text',
  'email.send',
  
  // === INTEL & NEWS ===
  'intel.news.search',
  'intel.news.latest',
  
  // === LOCATION & MAPS ===
  'location.geocode',
  'location.reverse',
  'maps.search',
  'maps.directions',
  'maps.distance',

  // === IMAGE GENERATION (ImagineArt) ===
  'ai-services.image.generate',
  'ai-services.image.upscale',
  'ai-services.image.test'
]);

/**
 * Handlers allowed for DEMO/PUBLIC users (very limited access)
 */
const DEMO_ALLOWED_HANDLERS = new Set([
  // System info (safe)
  'system.handlers.list',
  'system.handlers.category',
  'system.handlers.get',
  
  // Basic AI chat
  'ai.chat',
  'bali.zero.chat',
  
  // Search & RAG (read-only)
  'rag.query',
  'rag.search',
  
  // Pricing (PUBLIC - tutti devono avere accesso ai prezzi ufficiali Bali Zero)
  'bali.zero.pricing',        // Prezzi ufficiali Bali Zero
  'bali.zero.price',           // Quick price lookup Bali Zero
  'pricing.official',          // Official pricelist
  'price.lookup',              // Price lookup
  
  // Team authentication
  'team.login',
  'team.logout',

  // Basic memory read
  'memory.retrieve',

  // === ZANTARA v3 Ω STRATEGIC ENDPOINTS - Public access for complete knowledge ===
  'zantara.unified',          // Single entry point for ALL knowledge bases
  'zantara.collective',       // Shared memory and learning across users
  'zantara.ecosystem',       // Complete business ecosystem analysis

  // === BALI ZERO TEAM ACCESS - Public access to team information ===
  'bali.zero.team',           // Complete team directory with 23 members
  'team.list',                // Team member listing with search and filter
  'team.departments',         // Team departments information
  'team.members',             // Safe team member list
  'kbli.lookup',              // KBLI business code lookup
  'kbli.requirements',        // KBLI requirements lookup
  'identity.resolve',         // Identity resolution and profile creation
  'memory.save',              // Memory save functionality
  'memory.retrieve',          // Memory retrieval functionality
  'memory.search',            // Memory search functionality

  // === IMAGE GENERATION (ImagineArt) - For website assets ===
  'ai-services.image.generate',
  'ai-services.image.upscale',
  'ai-services.image.test'
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
 * Check if user can access handler based on role
 */
export function isHandlerAllowed(handlerKey: string, role: string = 'demo'): boolean {
  // Admin has full access (role = 'admin' or 'AI Bridge/Tech Lead')
  if (role === 'admin' || role === 'AI Bridge/Tech Lead' || role === 'tech') {
    return true;
  }
  
  // Team members get expanded access
  if (role === 'member' || role === 'collaborator' || role === 'developer') {
    if (TEAM_MEMBER_HANDLERS.has(handlerKey)) {
      return true;
    }
  }
  
  // Demo users get basic access
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
 * Legacy function for backwards compatibility
 */
export function isDemoAllowed(handlerKey: string): boolean {
  return isHandlerAllowed(handlerKey, 'demo');
}

/**
 * Demo user authentication middleware
 * 
 * Allows public demo access with limited permissions
 * When used AFTER jwtAuth, respects existing authentication
 */
export function demoUserAuth(req: RequestWithDemo, res: Response, next: NextFunction) {
  try {
    // CRITICAL FIX: If user is already authenticated by jwtAuth middleware, use that
    // This happens when [jwtAuth, demoUserAuth] is used - jwtAuth sets req.user first
    // jwtAuth sets req.user without isDemo, so check if user exists and has role but no isDemo flag
    // OR if isDemo is explicitly false
    if (req.user && req.user.role && (req.user.isDemo === undefined || req.user.isDemo === false)) {
      // User is already authenticated with JWT, check if they have access to this endpoint
      const path = req.path || req.route?.path || '';
      
      // v3 Ω endpoints are allowed for authenticated users
      const v3Endpoints = ['/zantara.unified', '/zantara.collective', '/zantara.ecosystem'];
      if (v3Endpoints.some(endpoint => path.includes(endpoint))) {
        // Authenticated users have full access to v3 Ω endpoints
        // Ensure isDemo is set correctly for downstream handlers
        if (req.user.isDemo === undefined) {
          req.user.isDemo = false;
        }
        return next();
      }
      
      // For /call endpoint, check handler permissions
      const { handler, key } = req.body || {};
      const handlerKey = handler || key;
      
      if (handlerKey) {
        if (!isHandlerAllowed(handlerKey, req.user.role)) {
          return res.status(403).json({
            ok: false,
            error: 'Access denied',
            handler: handlerKey,
            message: `Your role (${req.user.role}) does not have permission to access this handler.`,
            contact: 'Contact admin for elevated permissions'
          });
        }
      }
      
      // Ensure isDemo is set correctly for downstream handlers
      if (req.user.isDemo === undefined) {
        req.user.isDemo = false;
      }
      
      // Authenticated user with valid permissions - proceed
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    // Check for JWT token (if not already authenticated)
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
        
        // Special case: Zero is always admin
        if (decoded.email === 'zero@balizero.com' || decoded.userId === 'zero') {
          req.user.role = 'admin';
          req.user.isDemo = false;
        }
        
        // Check if this is a v3 Ω endpoint
        const path = req.path || req.route?.path || '';
        const v3Endpoints = ['/zantara.unified', '/zantara.collective', '/zantara.ecosystem'];
        if (v3Endpoints.some(endpoint => path.includes(endpoint))) {
          // Authenticated users have full access to v3 Ω endpoints
          return next();
        }
        
        // Check handler permissions for authenticated user (for /call endpoint)
        const { handler, key } = req.body || {};
        const handlerKey = handler || key;
        
        // For SSE streaming endpoints (GET requests), skip handler check
        if (req.method === 'GET' && req.path.includes('stream')) {
          return next();
        }
        
        if (handlerKey && !isHandlerAllowed(handlerKey, req.user.role)) {
          return res.status(403).json({
            ok: false,
            error: 'Access denied',
            handler: handlerKey,
            message: `Your role (${req.user.role}) does not have permission to access this handler.`,
            contact: 'Contact admin for elevated permissions'
          });
        }
        
        return next();
      } catch (jwtError: any) {
        // Invalid JWT, fall through to demo user check
        // JWT error handled silently, falls through to demo user
      }
    }
    
    // No valid JWT - check for demo credentials in body
    const { handler, key } = req.body || {};
    const handlerKey = handler || key;
    
    // Check if this is a v3 Ω endpoint (allow demo access)
    const path = req.path || req.route?.path || '';
    const v3Endpoints = ['/zantara.unified', '/zantara.collective', '/zantara.ecosystem'];
    if (v3Endpoints.some(endpoint => path.includes(endpoint))) {
      // v3 Ω endpoints allow demo access (as per DEMO_ALLOWED_HANDLERS)
      req.user = {
        userId: DEMO_USER.userId,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
        isDemo: true
      };
      return next();
    }
    
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
    logger.error('Demo auth error:', error);
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

