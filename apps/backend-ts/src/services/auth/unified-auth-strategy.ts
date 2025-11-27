/**
 * Unified Authentication Strategy Pattern
 *
 * Consolidates 2 different JWT systems into 1 unified architecture:
 * 1. Enhanced JWT Auth (GLM 4.6)
 * 2. Team Login JWT (team-login.ts)
 *
 * @author Gemini Pro 2.5 Recommendations
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../../services/logger.js';
import { getEnhancedJWTAuth, EnhancedUser } from '../../middleware/enhanced-jwt-auth.js';

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
  authType: 'enhanced' | 'team';
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
        const middleware = getEnhancedJWTAuth().authenticate();
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

    return getEnhancedJWTAuth().createEnhancedToken(enhancedUser);
  }

  async validateToken(token: string): Promise<UnifiedUser | null> {
    try {
      // Use enhanced JWT validation
      const auth = getEnhancedJWTAuth();
      const payload = auth['verifyToken'](token);

      const userStatus = await auth['checkUserStatus'](payload.userId);

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
      await getEnhancedJWTAuth().blacklistToken(token);
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
  private _jwtSecret: string | null = null;

  /**
   * Get JWT secret with lazy validation (only when actually used)
   */
  private getJwtSecret(): string {
    if (!this._jwtSecret) {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable is required for Team Login authentication');
      }
      if (secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long');
      }
      this._jwtSecret = secret;
    }
    return this._jwtSecret;
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

      const decoded = (await jwt).verify(token, this.getJwtSecret()) as any;

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
      this.getJwtSecret(),
      { expiresIn: '7d' }
    );
  }

  async validateToken(token: string): Promise<UnifiedUser | null> {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = (await jwt).verify(token, this.getJwtSecret()) as any;

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

// Lazy initialization - don't instantiate at module load
let _unifiedAuth: UnifiedAuthenticationManager | null = null;

/**
 * Get or create UnifiedAuthenticationManager instance (lazy initialization)
 * This prevents JWT_SECRET validation at module load time
 */
export function getUnifiedAuth(): UnifiedAuthenticationManager {
  if (!_unifiedAuth) {
    _unifiedAuth = UnifiedAuthenticationManager.getInstance();
  }
  return _unifiedAuth;
}

// Backward compatibility - proxy object for existing code
export const unifiedAuth = {
  get instance() {
    return getUnifiedAuth();
  },
  authenticate: (req: Request) => getUnifiedAuth().authenticate(req),
  generateToken: (user: UnifiedUser, strategyName?: string) => getUnifiedAuth().generateToken(user, strategyName),
  validateToken: (token: string, strategyName?: string) => {
    // Find strategy and validate token
    const manager = getUnifiedAuth();
    const strategies = manager.getStrategies();
    const strategy = strategyName
      ? strategies.find(s => s.name === strategyName)
      : strategies[0]; // Use first strategy by default

    if (!strategy || !strategy.validateToken) {
      return Promise.resolve(null);
    }

    return strategy.validateToken(token).then(user => {
      if (!user) return null;
      return {
        ...user,
        authType: strategy.name,
      } as UnifiedUser;
    });
  },
  refreshToken: (token: string) => getUnifiedAuth().refreshToken(token),
  revokeToken: (token: string) => getUnifiedAuth().revokeToken(token),
  getStrategies: () => getUnifiedAuth().getStrategies(),
  getStrategyStats: () => getUnifiedAuth().getStrategyStats(),
};

// Unified authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  getUnifiedAuth()
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
          strategies: getUnifiedAuth().getStrategies().map((s) => s.name),
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
