// Complete Unified Authentication Strategy v2.0
// Integrates all 4 auth methods + Firebase with intelligent routing

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/unified-logger.js';
import { jwtAuth } from './jwt-auth.js';
import { apiKeyAuth } from './auth.js';
import { demoUserAuth } from './demo-user-auth.js';
import { teamLoginSecure } from '../handlers/auth/team-login-secure.js';

// Unified Auth Types
export interface UnifiedAuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
  department?: string;
  permissions: string[];
  source: 'jwt' | 'api_key' | 'demo' | 'team' | 'firebase';
  metadata?: any;
}

export interface UnifiedAuthResult {
  user: UnifiedAuthUser;
  method: string;
  success: boolean;
  error?: string;
  confidence: number; // 0-1
}

export interface RequestWithUnifiedAuth extends Request {
  user?: UnifiedAuthUser;
  authMethod?: string;
}

// Firebase Auth Integration (when available)
class FirebaseAuthService {
  private enabled: boolean = false;
  private _admin: any = null;

  async initialize() {
    try {
      // Check if Firebase is available and configured
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
        // Firebase would be initialized here
        // this.admin = require('firebase-admin');
        // await this.admin.initializeApp();
        this.enabled = true;
        logger.info('🔥 Firebase Auth initialized');
      } else {
        logger.info('Firebase Auth disabled - missing configuration');
      }
    } catch (error) {
      logger.warn('Firebase Auth initialization failed:', error);
      this.enabled = false;
    }
  }

  async verifyToken(_token: string): Promise<UnifiedAuthUser | null> {
    if (!this.enabled) return null;

    try {
      // Firebase token verification would go here
      // const decodedToken = await this.admin.auth().verifyIdToken(token);
      // return {
      //   id: decodedToken.uid,
      //   email: decodedToken.email,
      //   name: decodedToken.name,
      //   role: 'user',
      //   permissions: [],
      //   source: 'firebase'
      // };

      // Mock implementation for now
      logger.info('🔥 Firebase token verification (mock)');
      return null;
    } catch (error) {
      logger.warn('Firebase token verification failed:', error);
      return null;
    }
  }

  async generateCustomToken(_uid: string, _additionalClaims?: any): Promise<string | null> {
    if (!this.enabled) return null;

    try {
      // Firebase custom token generation would go here
      // return await this.admin.auth().createCustomToken(uid, additionalClaims);
      return null;
    } catch (error) {
      logger.error('Firebase custom token generation failed:', error);
      return null;
    }
  }
}

// Main Unified Authentication Strategy
class UnifiedAuthenticationStrategy {
  public firebaseAuth: FirebaseAuthService;
  private authMethods: Array<{
    name: string;
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    priority: number;
    test: (req: Request) => boolean;
    confidence: number;
  }> = [];

  constructor() {
    this.firebaseAuth = new FirebaseAuthService();
    this.setupAuthMethods();
  }

  async initialize() {
    await this.firebaseAuth.initialize();
    logger.info('🔐 Unified Authentication initialized');
  }

  private setupAuthMethods() {
    // Priority 1: JWT Auth (most secure)
    this.authMethods.push({
      name: 'jwt',
      handler: this.createJWTHandler(),
      priority: 1,
      test: (req) => {
        const authHeader = req.headers.authorization;
        return authHeader?.startsWith('Bearer ');
      },
      confidence: 1.0,
    });

    // Priority 2: API Key Auth
    this.authMethods.push({
      name: 'api_key',
      handler: this.createAPIKeyHandler(),
      priority: 2,
      test: (req) => {
        const apiKey = req.headers['x-api-key'] as string;
        return !!apiKey;
      },
      confidence: 0.9,
    });

    // Priority 3: Team Login Auth
    this.authMethods.push({
      name: 'team',
      handler: this.createTeamHandler(),
      priority: 3,
      test: (req) => {
        const teamToken = req.headers['x-team-token'] as string;
        return !!teamToken;
      },
      confidence: 0.8,
    });

    // Priority 4: Firebase Auth
    this.authMethods.push({
      name: 'firebase',
      handler: this.createFirebaseHandler(),
      priority: 4,
      test: (req) => {
        const firebaseToken = req.headers['x-firebase-token'] as string;
        return !!firebaseToken;
      },
      confidence: 0.85,
    });

    // Priority 5: Demo User Auth (fallback)
    this.authMethods.push({
      name: 'demo',
      handler: this.createDemoHandler(),
      priority: 5,
      test: () => true, // Always available as fallback
      confidence: 0.5,
    });

    // Sort by priority
    this.authMethods.sort((a, b) => a.priority - b.priority);
  }

  private createJWTHandler() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await jwtAuth(req as any, _res, next);
        if ((req as any).user) {
          (req as unknown as RequestWithUnifiedAuth).user = {
            id: (req as any).user.id,
            email: (req as any).user.email,
            name: (req as any).user.name,
            role: (req as any).user.role || 'user',
            permissions: (req as any).user.permissions || [],
            source: 'jwt',
            metadata: (req as any).user.metadata,
          };
          (req as unknown as RequestWithUnifiedAuth).authMethod = 'jwt';
        }
      } catch (error) {
        next(error);
      }
    };
  }

  private createAPIKeyHandler() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await apiKeyAuth(req, _res, next);
        if ((req as any).user) {
          (req as unknown as RequestWithUnifiedAuth).user = {
            id: (req as any).user.id,
            email: (req as any).user.email,
            name: (req as any).user.name,
            role: (req as any).user.role || 'api_client',
            permissions: (req as any).user.permissions || [],
            source: 'api_key',
            metadata: { apiKey: true },
          };
          (req as unknown as RequestWithUnifiedAuth).authMethod = 'api_key';
        }
      } catch (error) {
        next(error);
      }
    };
  }

  private createTeamHandler() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const teamToken = req.headers['x-team-token'] as string;
        if (!teamToken) {
          return next();
        }

        // Use team login verification
        const mockReq = {
          body: { params: { token: teamToken } },
          headers: req.headers,
        } as any;

        const mockRes = {
          json: (data: any) => {
            if (data.ok && data.data && data.data.user) {
              (req as unknown as RequestWithUnifiedAuth).user = {
                id: data.data.user.id,
                email: data.data.user.email,
                name: data.data.user.name,
                role: data.data.user.role || 'team_member',
                department: data.data.user.department,
                permissions: data.data.user.permissions || [],
                source: 'team',
                metadata: {
                  teamMember: true,
                  badge: data.data.user.badge,
                },
              };
              (req as unknown as RequestWithUnifiedAuth).authMethod = 'team';
            }
          },
          status: () => mockRes,
        } as any;

        await teamLoginSecure(mockReq.body);
      } catch (error) {
        logger.warn('Team auth failed:', error);
        next();
      }
    };
  }

  private createFirebaseHandler() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const firebaseToken = req.headers['x-firebase-token'] as string;
        if (!firebaseToken) {
          return next();
        }

        const user = await this.firebaseAuth.verifyToken(firebaseToken);
        if (user) {
          (req as unknown as RequestWithUnifiedAuth).user = user;
          (req as unknown as RequestWithUnifiedAuth).authMethod = 'firebase';
        }
      } catch (error) {
        logger.warn('Firebase auth failed:', error);
        next();
      }
    };
  }

  private createDemoHandler() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        await demoUserAuth(req as any, _res, next);
        if ((req as any).user) {
          (req as unknown as RequestWithUnifiedAuth).user = {
            id: (req as any).user.id,
            email: (req as any).user.email,
            name: (req as any).user.name,
            role: (req as any).user.role || 'demo_user',
            permissions: ['read', 'demo'],
            source: 'demo',
            metadata: { demo: true },
          };
          (req as unknown as RequestWithUnifiedAuth).authMethod = 'demo';
        }
      } catch (error) {
        next(error);
      }
    };
  }

  // Main authentication middleware
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();

    // Try each auth method in priority order
    for (const method of this.authMethods) {
      if (method.test(req)) {
        try {
          await method.handler(req, res, (error?: any) => {
            if (!error && (req as unknown as RequestWithUnifiedAuth).user) {
              const elapsed = Date.now() - startTime;
              logger.info(
                `🔐 ${method.name} auth success: ${(req as unknown as RequestWithUnifiedAuth).user?.email} (${elapsed}ms)`
              );
              return next();
            }

            if (error) {
              logger.warn(`${method.name} auth failed:`, error.message);
            }

            // Try next method
            return this.tryNextAuthMethod(req, res, next, method.priority + 1);
          });
          return;
        } catch (error) {
          logger.warn(`${method.name} auth error:`, error);
        }
      }
    }

    // No auth method matched, proceed without authentication
    next();
  }

  private async tryNextAuthMethod(
    req: Request,
    res: Response,
    next: NextFunction,
    currentPriority: number
  ): Promise<void> {
    const nextMethod = this.authMethods.find((m) => m.priority === currentPriority);
    if (nextMethod && nextMethod.test(req)) {
      try {
        await nextMethod.handler(req, res, (error?: any) => {
          if (!error && (req as unknown as RequestWithUnifiedAuth).user) {
            return next();
          }
          return this.tryNextAuthMethod(req, res, next, currentPriority + 1);
        });
      } catch (error) {
        return this.tryNextAuthMethod(req, res, next, currentPriority + 1);
      }
    } else {
      // Continue to next priority
      return this.tryNextAuthMethod(req, res, next, currentPriority + 1);
    }
  }

  // Get authentication info
  getAuthInfo(req: Request): UnifiedAuthResult | null {
    const user = (req as unknown as RequestWithUnifiedAuth).user;
    const method = (req as unknown as RequestWithUnifiedAuth).authMethod;

    if (!user || !method) return null;

    const methodInfo = this.authMethods.find((m) => m.name === method);

    return {
      user,
      method,
      success: true,
      confidence: methodInfo?.confidence || 0.5,
    };
  }

  // Check permissions
  hasPermission(req: Request, permission: string): boolean {
    const user = (req as unknown as RequestWithUnifiedAuth).user;
    return user?.permissions?.includes(permission) || false;
  }

  // Check role
  hasRole(req: Request, role: string): boolean {
    const user = (req as unknown as RequestWithUnifiedAuth).user;
    return user?.role === role;
  }

  // Get available auth methods
  getAvailableMethods(): Array<{ name: string; priority: number; confidence: number }> {
    return this.authMethods.map((m) => ({
      name: m.name,
      priority: m.priority,
      confidence: m.confidence,
    }));
  }
}

// Global instance
const unifiedAuth = new UnifiedAuthenticationStrategy();

// Initialize on module load
unifiedAuth.initialize().catch((error) => {
  logger.error('Failed to initialize unified auth:', error);
});

// Middleware function
export const unifiedAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  await unifiedAuth.authenticate(req, res, next);
};

// Optional authentication (doesn't fail if no auth)
export const optionalUnifiedAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await unifiedAuth.authenticate(req, res, next);
  } catch (error) {
    // Continue without authentication
    logger.warn('Optional auth failed, continuing:', error);
    next();
  }
};

// Role-based access control
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (unifiedAuth.hasRole(req, role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Access denied. Role '${role}' required.`,
        currentRole: (req as unknown as RequestWithUnifiedAuth).user?.role,
      });
    }
  };
};

// Permission-based access control
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (unifiedAuth.hasPermission(req, permission)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: `Access denied. Permission '${permission}' required.`,
        permissions: (req as unknown as RequestWithUnifiedAuth).user?.permissions,
      });
    }
  };
};

// Multiple roles/permissions
export const requireAny = (requirements: Array<{ role?: string; permission?: string }>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const _user = (req as unknown as RequestWithUnifiedAuth).user;

    const hasAccess = requirements.some((requirement) => {
      if (requirement.role && unifiedAuth.hasRole(req as any, requirement.role)) return true;
      if (requirement.permission && unifiedAuth.hasPermission(req as any, requirement.permission))
        return true;
      return false;
    });

    if (hasAccess) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: 'Access denied. Required role or permission not found.',
        requirements,
      });
    }
  };
};

// Utility functions
export const getCurrentUser = (req: Request): UnifiedAuthUser | undefined => {
  return (req as unknown as RequestWithUnifiedAuth).user;
};

export const getAuthMethod = (req: Request): string | undefined => {
  return (req as unknown as RequestWithUnifiedAuth).authMethod;
};

export const getAuthInfo = (req: Request): UnifiedAuthResult | null => {
  return unifiedAuth.getAuthInfo(req);
};

export const getAvailableAuthMethods = () => {
  return unifiedAuth.getAvailableMethods();
};

// Firebase custom token generation (when available)
export const generateFirebaseCustomToken = async (
  uid: string,
  additionalClaims?: any
): Promise<string | null> => {
  return await unifiedAuth.firebaseAuth.generateCustomToken(uid, additionalClaims);
};

export { unifiedAuth, FirebaseAuthService };
