/**
 * Unified Authentication Strategy Pattern
 *
 * Consolidates 3 different JWT systems into 1 unified architecture:
 * 1. Enhanced JWT Auth (GLM 4.6)
 * 2. Team Login JWT (team-login.ts)
 * 3. Legacy JWT (various handlers)
 *
 * @author Gemini Pro 2.5 Recommendations
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../../services/logger.js';
import { enhancedJWTAuth, EnhancedUser } from '../../middleware/enhanced-jwt-auth.js';

// Unified User Interface - compatible with all systems
export interface UnifiedUser {
  id: string;
  userId: string; // Compatibility layer
  email: string;
  name: string;
  role: string;
  department: string;
  permissions: string[];
  subscriptionTier?: 'free' | 'premium' | 'enterprise';
  isActive: boolean;
  lastLogin?: Date;
  metadata?: Record<string, any>;
  // Extended properties for different auth types
  authType: 'enhanced' | 'team' | 'legacy';
  sessionId?: string;
  language?: string;
  personalizedResponse?: string;
}

// Authentication Strategy Interface
export interface AuthenticationStrategy {
  readonly name: string;
  readonly priority: number;

  // Check if this strategy can handle the request
  canHandle(req: Request): boolean;

  // Authenticate the request
  authenticate(req: Request): Promise<UnifiedUser | null>;

  // Generate token for this strategy
  generateToken(user: UnifiedUser): Promise<string>;

  // Validate token for this strategy
  validateToken(token: string): Promise<UnifiedUser | null>;

  // Refresh token for this strategy
  refreshToken?(token: string): Promise<string | null>;

  // Revoke token for this strategy
  revokeToken?(token: string): Promise<boolean>;
}

// Enhanced JWT Strategy (GLM 4.6)
export class EnhancedJWTStrategy implements AuthenticationStrategy {
  readonly name = 'enhanced';
  readonly priority = 100;

  canHandle(req: Request): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;

    // Enhanced JWTs have specific claims structure
    try {
      const token = authHeader.substring(7);
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.iss === 'nuzantara-backend' && decoded.aud === 'nuzantara-users';
    } catch {
      return false;
    }
  }

  async authenticate(req: Request): Promise<UnifiedUser | null> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return null;

      // Use enhanced JWT auth system
      return new Promise((resolve, reject) => {
        const middleware = enhancedJWTAuth.authenticate();
        middleware(req, {} as Response, (error?: any) => {
          if (error) {
            reject(error);
          } else {
            const enhancedReq = req as any;
            if (enhancedReq.user) {
              const unifiedUser: UnifiedUser = {
                ...enhancedReq.user,
                authType: 'enhanced',
              };
              resolve(unifiedUser);
            } else {
              resolve(null);
            }
          }
        });
      });
    } catch (error) {
      logger.error('Enhanced JWT authentication failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async generateToken(user: UnifiedUser): Promise<string> {
    const enhancedUser: EnhancedUser = {
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      department: user.department,
      name: user.name,
      permissions: user.permissions,
      subscriptionTier: user.subscriptionTier,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      metadata: user.metadata,
    };

    return enhancedJWTAuth.createEnhancedToken(enhancedUser);
  }

  async validateToken(token: string): Promise<UnifiedUser | null> {
    try {
      // Use enhanced JWT validation
      const payload = enhancedJWTAuth['verifyToken'](token);

      const userStatus = await enhancedJWTAuth['checkUserStatus'](payload.userId);

      return {
        id: payload.userId,
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        department: payload.department,
        name: payload.name,
        permissions: payload.permissions,
        subscriptionTier: payload.subscriptionTier as any,
        isActive: userStatus.isActive,
        lastLogin: new Date(),
        metadata: userStatus.metadata,
        authType: 'enhanced',
      };
    } catch (error) {
      logger.error('Enhanced JWT token validation failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async refreshToken(token: string): Promise<string | null> {
    try {
      const user = await this.validateToken(token);
      if (!user || !user.isActive) return null;

      return this.generateToken(user);
    } catch (error) {
      logger.error('Enhanced JWT token refresh failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async revokeToken(token: string): Promise<boolean> {
    try {
      await enhancedJWTAuth.blacklistToken(token);
      return true;
    } catch (error) {
      logger.error('Enhanced JWT token revocation failed:', error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }
}

// Team Login JWT Strategy
export class TeamLoginJWTStrategy implements AuthenticationStrategy {
  readonly name = 'team';
  readonly priority = 80;
  private jwtSecret = process.env.JWT_SECRET;

  constructor() {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required for Team Login authentication');
    }
  }

  canHandle(req: Request): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;

    try {
      const token = authHeader.substring(7);
      const decoded = JSON.parse(atob(token.split('.')[1]));
      // Team login tokens have sessionId claim
      return !!decoded.sessionId;
    } catch {
      return false;
    }
  }

  async authenticate(req: Request): Promise<UnifiedUser | null> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return null;

      const token = authHeader.substring(7);
      const jwt = await import('jsonwebtoken');

      const decoded = (await jwt).verify(token, this.jwtSecret) as any;

      // Get team member data
      const teamMember = await this.getTeamMember(decoded.userId);
      if (!teamMember) return null;

      return {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        department: decoded.department,
        name: teamMember.name,
        permissions: this.getPermissionsForRole(decoded.role),
        isActive: true,
        lastLogin: new Date(),
        sessionId: decoded.sessionId,
        language: teamMember.language,
        personalizedResponse: teamMember.personalizedResponse,
        authType: 'team',
      };
    } catch (error) {
      logger.error('Team login JWT authentication failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async generateToken(user: UnifiedUser): Promise<string> {
    const jwt = await import('jsonwebtoken');
    const sessionId = `session_${Date.now()}_${user.id}`;

    return (await jwt).sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        sessionId: sessionId,
      },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  async validateToken(token: string): Promise<UnifiedUser | null> {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = (await jwt).verify(token, this.jwtSecret) as any;

      const teamMember = await this.getTeamMember(decoded.userId);
      if (!teamMember) return null;

      return {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        department: decoded.department,
        name: teamMember.name,
        permissions: this.getPermissionsForRole(decoded.role),
        isActive: true,
        lastLogin: new Date(),
        sessionId: decoded.sessionId,
        language: teamMember.language,
        personalizedResponse: teamMember.personalizedResponse,
        authType: 'team',
      };
    } catch (error) {
      logger.error('Team login JWT validation failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async refreshToken(token: string): Promise<string | null> {
    try {
      const user = await this.validateToken(token);
      if (!user) return null;

      return this.generateToken(user);
    } catch (error) {
      logger.error('Team login JWT refresh failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  private async getTeamMember(_userId: string): Promise<any> {
    // This would integrate with the team-login.ts data
    // For now, return mock data
    return {
      name: 'Team Member',
      language: 'English',
      personalizedResponse: 'Welcome back!',
    };
  }

  private getPermissionsForRole(role: string): string[] {
    const permissions: { [key: string]: string[] } = {
      CEO: ['all', 'admin', 'finance', 'hr', 'tech', 'marketing'],
      'Tech Lead': ['all', 'tech', 'admin', 'finance'],
      'Executive Consultant': ['setup', 'finance', 'clients', 'reports'],
      'Junior Consultant': ['setup', 'clients'],
      'Tax Manager': ['tax', 'finance', 'reports', 'clients'],
      'Marketing Specialist': ['marketing', 'clients', 'reports'],
      Reception: ['clients', 'appointments'],
    };

    return permissions[role] || ['clients'];
  }
}


// LEGACY CODE: Legacy JWT Strategy (kept for backward compatibility only)
// TODO: Migrate to modern JWT strategy
export class LegacyJWTStrategy implements AuthenticationStrategy {
  readonly name = 'legacy';
  readonly priority = 20;

  private jwtSecret = process.env.JWT_SECRET;

  constructor() {
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required for Legacy authentication');
    }
  }

  canHandle(req: Request): boolean {
    const authHeader = req.headers.authorization;
    return !!authHeader?.startsWith('Bearer ');
  }

  async authenticate(req: Request): Promise<UnifiedUser | null> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) return null;

      const token = authHeader.substring(7);
      const jwt = await import('jsonwebtoken');

      const decoded = (await jwt).verify(token, this.jwtSecret) as any;

      return {
        id: decoded.userId || decoded.sub,
        userId: decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'User',
        department: decoded.department || 'general',
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        permissions: decoded.permissions || ['read'],
        isActive: true,
        lastLogin: new Date(),
        authType: 'legacy',
      };
    } catch (error) {
      logger.error('Legacy JWT authentication failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  async generateToken(user: UnifiedUser): Promise<string> {
    const jwt = await import('jsonwebtoken');

    return (await jwt).sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        department: user.department,
        name: user.name,
        permissions: user.permissions,
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  async validateToken(token: string): Promise<UnifiedUser | null> {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = (await jwt).verify(token, this.jwtSecret) as any;

      return {
        id: decoded.userId || decoded.sub,
        userId: decoded.userId || decoded.sub,
        email: decoded.email,
        role: decoded.role || 'User',
        department: decoded.department || 'general',
        name: decoded.name || decoded.email?.split('@')[0] || 'User',
        permissions: decoded.permissions || ['read'],
        isActive: true,
        lastLogin: new Date(),
        authType: 'legacy',
      };
    } catch (error) {
      logger.error('Legacy JWT validation failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }
}

// Unified Authentication Manager
export class UnifiedAuthenticationManager {
  private strategies: AuthenticationStrategy[] = [];
  private static instance: UnifiedAuthenticationManager;

  static getInstance(): UnifiedAuthenticationManager {
    if (!UnifiedAuthenticationManager.instance) {
      UnifiedAuthenticationManager.instance = new UnifiedAuthenticationManager();
    }
    return UnifiedAuthenticationManager.instance;
  }

  constructor() {
    // Register strategies in priority order
    this.registerStrategy(new EnhancedJWTStrategy());
    this.registerStrategy(new TeamLoginJWTStrategy());
    this.registerStrategy(new LegacyJWTStrategy());

    logger.info(
      `🔐 Unified Authentication Manager initialized with strategies: ${this.strategies.map((s) => s.name).join(', ')}`
    );
  }

  registerStrategy(strategy: AuthenticationStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
    logger.info(
      `✅ Registered authentication strategy: ${strategy.name} (priority: ${strategy.priority})`
    );
  }

  async authenticate(req: Request): Promise<UnifiedUser | null> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(req)) {
        try {
          const user = await strategy.authenticate(req);
          if (user) {
            logger.info(
              `🔐 Authentication successful using ${strategy.name} strategy for user: ${user.email}`
            );
            return user;
          }
        } catch (error) {
          logger.error(`❌ Authentication failed with ${strategy.name} strategy:`, error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    logger.warn('🔐 No authentication strategy succeeded');
    return null;
  }

  async validateToken(token: string, strategyName?: string): Promise<UnifiedUser | null> {
    if (strategyName) {
      const strategy = this.strategies.find((s) => s.name === strategyName);
      if (strategy) {
        return await strategy.validateToken(token);
      }
    }

    // Try all strategies
    for (const strategy of this.strategies) {
      try {
        const user = await strategy.validateToken(token);
        if (user) {
          return user;
        }
      } catch (error) {
        logger.debug(`Token validation failed with ${strategy.name} strategy:`, error instanceof Error ? error : new Error(String(error)));
      }
    }

    return null;
  }

  async generateToken(user: UnifiedUser, strategyName: string = 'enhanced'): Promise<string> {
    const strategy = this.strategies.find((s) => s.name === strategyName);
    if (!strategy) {
      throw new Error(`Unknown authentication strategy: ${strategyName}`);
    }

    return await strategy.generateToken(user);
  }

  async refreshToken(token: string): Promise<string | null> {
    for (const strategy of this.strategies) {
      if (
        strategy.refreshToken &&
        strategy.canHandle({ headers: { authorization: `Bearer ${token}` } } as Request)
      ) {
        try {
          const newToken = await strategy.refreshToken(token);
          if (newToken) {
            logger.info(`🔄 Token refreshed using ${strategy.name} strategy`);
            return newToken;
          }
        } catch (error) {
          logger.error(`❌ Token refresh failed with ${strategy.name} strategy:`, error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    return null;
  }

  async revokeToken(token: string): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (
        strategy.revokeToken &&
        strategy.canHandle({ headers: { authorization: `Bearer ${token}` } } as Request)
      ) {
        try {
          const revoked = await strategy.revokeToken(token);
          if (revoked) {
            logger.info(`🗑️ Token revoked using ${strategy.name} strategy`);
            return true;
          }
        } catch (error) {
          logger.error(`❌ Token revocation failed with ${strategy.name} strategy:`, error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    return false;
  }

  getStrategies(): AuthenticationStrategy[] {
    return [...this.strategies];
  }

  getStrategyStats(): { [strategy: string]: { priority: number; canHandle: boolean } } {
    const stats: { [strategy: string]: { priority: number; canHandle: boolean } } = {};

    this.strategies.forEach((strategy) => {
      stats[strategy.name] = {
        priority: strategy.priority,
        canHandle: false, // Would need a request to determine
      };
    });

    return stats;
  }
}

// Export singleton and middleware
export const unifiedAuth = UnifiedAuthenticationManager.getInstance();

// Unified authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  unifiedAuth
    .authenticate(req)
    .then((user) => {
      if (user) {
        (req as any).user = user;
        next();
      } else {
        res.status(401).json({
          ok: false,
          error: 'Authentication failed',
          code: 'AUTH_REQUIRED',
          strategies: unifiedAuth.getStrategies().map((s) => s.name),
        });
      }
    })
    .catch((error) => {
      logger.error('Unified authentication error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Authentication error',
        code: 'AUTH_ERROR',
      });
    });
};
