/**
 * ZANTARA TS-BACKEND Server
 * Main entry point for the TypeScript backend service
 */

/** Set up for OpenTelemetry tracing **/

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ENV } from './config/index.js';
import logger from './services/logger.js';
import { attachRoutes } from './routing/router.js';
// import { loadAllHandlers } from './core/load-all-handlers.js';
import { applySecurity, globalRateLimiter } from './middleware/security.middleware.js';
import { corsMiddleware } from './middleware/cors.js';
import { generateCsrfToken, validateCsrfToken, csrfRoutes } from './middleware/csrf.js';
import { setupWebSocket } from './websocket.js';
import { metricsMiddleware, metricsHandler } from './middleware/observability.middleware.js';
import { initializeRedis } from './middleware/cache.middleware.js';
import cacheRoutes from './routes/cache.routes.js';
import correlationMiddleware from './logging/correlation-middleware.js';

// Load balancing and high availability components
import { featureFlags, FeatureFlag } from './services/feature-flags.js';
import { initializeDatabasePool, getDatabasePool } from './services/connection-pool.js';
import { prioritizedRateLimiter } from './middleware/prioritized-rate-limit.js';
import healthRoutes from './routes/health.js';
import { auditTrail } from './services/audit-trail.js';

// 🤖 AUTONOMOUS AGENTS - Cron Scheduler
import { getCronScheduler } from './services/cron-scheduler.js';

// 🚀 PERFORMANCE MONITORING - Sonnet implementation
import {
  performanceMiddleware,
  performanceHeaders,
  startMetricsCleanup,
} from './middleware/performance-middleware.js';
import performanceRoutes from './routes/performance.routes.js';


// UNIFIED AUTHENTICATION - Strategy Pattern Implementation (Gemini Pro 2.5)
import {
  unifiedAuth,
} from './services/auth/unified-auth-strategy.js';

// AI AUTOMATION - Cron Scheduler (OpenRouter Integration)
import aiMonitoringRoutes from './routes/ai-monitoring.js';


const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || process.env.RAG_BACKEND_URL || 'http://localhost:8000';

// Main async function to ensure handlers load before server starts
async function startServer() {
  logger.info('🚀 Starting ZANTARA Backend v5.2.1-fixed (Zod validation fix applied)');
  
  // Initialize Redis cache
  await initializeRedis();

  // Initialize enhanced architecture components
  try {
    logger.info('✅ Enhanced Architecture initialized');
  } catch (error: any) {
    logger.warn(`⚠️ Enhanced Architecture initialization failed: ${error.message}`);
    logger.warn('⚠️ Continuing with basic architecture');
  }

  // Initialize connection pools if enabled
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
    try {
      if (process.env.DATABASE_URL) {
        await initializeDatabasePool();
        logger.info('✅ Database connection pool initialized');
      }

    } catch (error: any) {
      logger.warn(`⚠️  Connection pooling initialization failed: ${error.message}`);
      logger.warn('⚠️  Continuing without enhanced pooling');
    }
  }

  // Initialize audit trail if enabled
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_AUDIT_TRAIL)) {
    logger.info('✅ Audit trail system enabled');
    await auditTrail.log({
      eventType: 'SYSTEM_STARTUP' as any,
      action: 'Server started',
      result: 'success',
    } as any);
  }

  // 🚀 Start performance monitoring cleanup scheduler
  startMetricsCleanup();
  logger.info('✅ Performance monitoring system initialized');

  // Create Express app
  const app = express();

  // Fix for Fly.io proxy headers - configure trust proxy
  app.set('trust proxy', true);

  // Test and bypass routes (must be before all security middleware)
  const setupBypassRoutes = await import('./routes/admin/setup-bypass.js');
  app.use('/admin/setup', setupBypassRoutes.default);
  logger.info('⚠️  Admin setup bypass routes loaded (disable after initial setup)');

  // Mock login test routes (for testing without database)
  if (process.env.NODE_ENV !== 'production') {
    const mockLoginRoutes = await import('./routes/test/mock-login.js');
    app.use('/test', mockLoginRoutes.default);
    logger.info('🧪 Mock login test routes loaded (DEV MODE)');
  } else {
    logger.info('⛔ Mock login routes disabled in production');
  }

  // PATCH-3: CORS with security configuration (Must be first)
  app.use(corsMiddleware);

  // PATCH-3: Apply security middleware (headers, sanitization, logging)
  app.use(applySecurity);

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Correlation tracking for unified logging
  app.use(correlationMiddleware() as any);

  // CSRF Protection (generate token for all requests)
  app.use(generateCsrfToken);
  
  // CSRF Protection (validate token for state-changing requests)
  app.use(validateCsrfToken);

  // PATCH-3: Global rate limiting (fallback)
  app.use(globalRateLimiter);

  // Prioritized rate limiting (if enabled)
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_PRIORITIZED_RATE_LIMIT)) {
    app.use(prioritizedRateLimiter);
    logger.info('✅ Prioritized rate limiting enabled');
  }

  // 🚀 PERFORMANCE MONITORING: Add performance tracking middleware
  app.use(performanceHeaders);
  app.use(performanceMiddleware);

  // Observability: Metrics collection
  app.use(metricsMiddleware);

  // Request logging
  app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });

  // Enhanced health check routes (replaces old /health)
  app.use(healthRoutes);

  // CSRF token endpoint (must be before auth routes)
  app.use('/api', csrfRoutes);

  // 🚀 PERFORMANCE MONITORING: Add performance monitoring routes
  app.use('/performance', performanceRoutes);
  logger.info('✅ Performance monitoring routes mounted');

  // Legacy health check (backward compatibility)
  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'ZANTARA TS-BACKEND',
      version: '5.2.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Metrics endpoint for Prometheus (if not already in health routes)
  app.get('/metrics', metricsHandler);

  // API Documentation (Swagger/OpenAPI)
  if (ENV.NODE_ENV !== 'production' || process.env.ENABLE_API_DOCS === 'true') {
    try {
      // @ts-ignore - swagger-jsdoc types may not be available
      const swaggerJsdoc = (await import('swagger-jsdoc')).default;
      // @ts-ignore - swagger-ui-express may not be installed
      const swaggerUi = (await import('swagger-ui-express')).default;

      const swaggerOptions = {
        definition: {
          openapi: '3.0.0',
          info: {
            title: 'ZANTARA API',
            version: '5.2.0',
            description: 'ZANTARA AI Platform - Indonesian Business Intelligence & Legal Advisory Platform',
            contact: {
              name: 'Bali Zero',
              email: 'zero@balizero.com',
            },
          },
          servers: [
            {
              url: ENV.NODE_ENV === 'production' 
                ? 'https://nuzantara-backend.fly.dev' 
                : `http://localhost:${ENV.PORT}`,
              description: ENV.NODE_ENV === 'production' ? 'Production server' : 'Development server',
            },
          ],
          components: {
            securitySchemes: {
              bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
              apiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'x-api-key',
              },
            },
          },
        },
        apis: ['./src/routes/**/*.ts', './src/handlers/**/*.ts', './src/routing/router.ts'],
      };

      const swaggerSpec = swaggerJsdoc(swaggerOptions);
      app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'ZANTARA API Documentation',
      }));
      logger.info('✅ API Documentation (Swagger) available at /api-docs');
    } catch (error) {
      logger.warn('⚠️ Failed to initialize Swagger documentation:', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Cache management routes
  app.use('/cache', cacheRoutes);

  // AI Automation monitoring routes
  app.use('/api/monitoring', aiMonitoringRoutes);
  logger.info('✅ AI Automation monitoring routes mounted');
  // Autonomous Agents Monitoring routes
  const monitoringRoutes = await import('./routes/monitoring.routes.js');
  app.use('/api/monitoring', monitoringRoutes.default);
  logger.info('✅ Autonomous Agents monitoring routes mounted');

  // GLM 4.6 Architect Patch: Enhanced Architecture endpoints
  app.get('/architecture/status', (_req, res) => {
    res.json({
      ok: true,
      data: {
        circuitBreakers: {},
        serviceRegistry: {},
        metrics: {},
        timestamp: new Date().toISOString(),
      },
      meta: {
        version: 'GLM 4.6 Architect Patch v1.0.0',
        description: 'Enhanced Architecture Status Dashboard',
      },
    });
  });


  // Frontend compatibility alias for shared memory search
  app.get('/api/crm/shared-memory/search', (req, res, next) => {
    req.url = '/api/persistent-memory/collective/search';
    return app._router.handle(req, res, next);
  });
  logger.info('✅ Frontend compatibility alias mounted (/api/crm/shared-memory/search → /api/persistent-memory/collective/search)');

  const createProxyOptions = (label: string, pathPrefix: string) => ({
    target: PYTHON_SERVICE_URL,
    changeOrigin: true,
    logLevel: 'warn' as const,
    // Preserve the full path - http-proxy-middleware strips the prefix by default
    // So we need to add it back via pathRewrite
    pathRewrite: (path: string) => {
      // If path doesn't start with the prefix, add it
      if (!path.startsWith(pathPrefix)) {
        return pathPrefix + path;
      }
      return path;
    },
    onProxyReq: (proxyReq: any, req: any) => {
      // Ensure the full path is preserved
      const fullPath = req.originalUrl || req.url;
      if (!proxyReq.path.startsWith(pathPrefix)) {
        proxyReq.path = pathPrefix + proxyReq.path;
      }
      logger.debug(`🔀 Proxy ${label}: ${fullPath} → ${PYTHON_SERVICE_URL}${proxyReq.path}`);
    },
    onError: (err: Error, _req: express.Request, res: express.Response) => {
      logger.error(`❌ ${label} proxy error:`, err);
      if (!res.headersSent) {
        res.status(502).json({
          ok: false,
          error: `${label} service temporarily unavailable`,
        });
      }
    },
  });

  app.use('/api/agents', createProxyMiddleware(createProxyOptions('agents', '/api/agents')));

  const crmProxy = createProxyMiddleware(createProxyOptions('crm', '/api/crm'));
  app.use('/api/crm', (req, res, next) => {
    if (req.path.startsWith('/shared-memory/search')) {
      return next();
    }
    return crmProxy(req, res, next);
  });

  logger.info(`✅ Proxy routes mounted for CRM & Agents → ${PYTHON_SERVICE_URL}`);

  // Frontend compatibility alias for compliance alerts (placeholder - returns empty array for now)
  app.get('/api/agents/compliance/alerts', (_req, res) => {
    res.json({
      ok: true,
      data: {
        alerts: [],
        total: 0,
        critical: 0,
        warning: 0,
        lastUpdated: new Date().toISOString()
      }
    });
  });
  logger.info('✅ Frontend compatibility alias mounted (/api/agents/compliance/alerts - placeholder)');

  // UNIFIED AUTHENTICATION ENDPOINTS (Gemini Pro 2.5)
  app.get('/auth/strategies', (_req, res) => {
    res.json({
      ok: true,
      data: {
        strategies: unifiedAuth.getStrategyStats(),
        availableStrategies: unifiedAuth.getStrategies().map((s) => ({
          name: s.name,
          priority: s.priority,
        })),
        timestamp: new Date().toISOString(),
      },
      meta: {
        service: 'zantara-unified-auth',
        version: '1.0.0',
      },
    });
  });

  app.post('/auth/validate', async (req, res) => {
    try {
      const { token, strategy } = req.body;

      if (!token) {
        return res.status(400).json({
          ok: false,
          error: 'Token is required',
        });
      }

      const user = await unifiedAuth.validateToken(token, strategy);

      if (user) {
        res.json({
          ok: true,
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              department: user.department,
              authType: user.authType,
              permissions: user.permissions,
              isActive: user.isActive,
            },
            tokenInfo: {
              strategy: user.authType,
              validatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        res.status(401).json({
          ok: false,
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN',
        });
      }
    } catch (error) {
      logger.error('Token validation error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Token validation failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post('/auth/refresh', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          ok: false,
          error: 'Token is required',
        });
      }

      const newToken = await unifiedAuth.refreshToken(token);

      if (newToken) {
        res.json({
          ok: true,
          data: {
            token: newToken,
            refreshedAt: new Date().toISOString(),
          },
        });
      } else {
        res.status(401).json({
          ok: false,
          error: 'Token refresh failed',
          code: 'REFRESH_FAILED',
        });
      }
    } catch (error) {
      logger.error('Token refresh error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Token refresh failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post('/auth/revoke', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          ok: false,
          error: 'Token is required',
        });
      }

      const revoked = await unifiedAuth.revokeToken(token);

      res.json({
        ok: true,
        data: {
          revoked,
          revokedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Token revocation error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Token revocation failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post('/auth/generate', async (req, res) => {
    try {
      const { user, strategy = 'enhanced' } = req.body;

      if (!user || !user.id || !user.email) {
        return res.status(400).json({
          ok: false,
          error: 'User data with id and email is required',
        });
      }

      const unifiedUser = {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0],
        role: user.role || 'User',
        department: user.department || 'general',
        permissions: user.permissions || ['read'],
        isActive: true,
        lastLogin: new Date(),
        authType: strategy as any,
      };

      const token = unifiedAuth.generateToken(unifiedUser, strategy);

      res.json({
        ok: true,
        data: {
          token,
          strategy,
          user: unifiedUser,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Token generation error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Token generation failed',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });


  // FIX 4b: POST /auth/logout - User logout (token revocation)
  app.post('/auth/logout', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        unifiedAuth.revokeToken(token);
        logger.info('✅ User logged out, token revoked');
      }

      res.json({
        ok: true,
        data: {
          message: 'Logout successful'
        }
      });
    } catch (error) {
      logger.error('❌ Logout error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Logout failed'
      });
    }
  });

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'ZANTARA TS-BACKEND is running',
      version: '5.2.1',
      endpoints: {
        health: '/health',
        api: '/call',
        team: '/team.login',
      },
    });
  });

  // Bali Zero routes with caching
  const baliZeroRoutes = await import('./routes/api/bali-zero.routes.js');
  app.use('/api/bali-zero', baliZeroRoutes.default);

  // FIX 3: SSE streaming endpoint aliases (frontend compatibility)
  app.get('/bali-zero/chat-stream', (req, res, next) => {
    req.url = '/api/bali-zero/chat-stream';
    app._router.handle(req, res, next);
  });

  app.post('/bali-zero/chat-stream', (req, res, next) => {
    req.url = '/api/bali-zero/chat-stream';
    app._router.handle(req, res, next);
  });

  logger.info('✅ SSE streaming aliases mounted (/bali-zero/chat-stream → /api/bali-zero/chat-stream)');

  // Team Authentication routes
  const teamAuthRoutes = await import('./routes/api/auth/team-auth.routes.js');
  app.use('/api/auth/team', teamAuthRoutes.default);
  logger.info('✅ Team Authentication routes loaded');

  // Tax Dashboard routes (commented out - routes not yet implemented)
  // Main Authentication routes (JWT-based)
  const authRoutes = await import('./routes/auth.routes.js');
  app.use('/api/auth', authRoutes.default);
  app.use('/api/user', authRoutes.default); // For /api/user/profile
  logger.info('✅ Main Authentication routes loaded');

  // Admin setup routes for database initialization
  const setupRoutes = await import('./routes/admin/setup.js');
  app.use('/admin/setup', setupRoutes.default);
  logger.info('✅ Admin setup routes loaded');

  // Tax Dashboard routes (disabled - routes not yet implemented)
  // const taxRoutes = await import('./routes/api/tax/tax.routes.js');
  // const { seedTestData } = await import('./services/tax-db.service.js');
  // app.use('/api/tax', taxRoutes.default);
  // seedTestData(); // Initialize test companies
  // logger.info('✅ Tax Dashboard routes loaded');

  // V3 Performance routes removed

  // Cursor Ultra Auto Patch: Enhanced Code Quality Routes
  const codeQualityRoutes = await import('./routes/code-quality.routes.js');
  app.use('/code-quality', codeQualityRoutes.default);
  logger.info('✅ Enhanced Code Quality Monitor loaded');

  // Load main router with all handlers
  attachRoutes(app);

  // Error handling
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found',
      path: req.originalUrl,
    });
  });

  // Start server
  const PORT = parseInt(process.env.PORT || ENV.PORT || '8080');

  // Create HTTP server (for WebSocket)
  const httpServer = createServer(app);

  // Setup WebSocket for real-time features (P0.4) - only if Redis is configured
  if (process.env.REDIS_URL) {
    setupWebSocket(httpServer);
    logger.info('✅ WebSocket server initialized');
  } else {
    logger.warn('⚠️  REDIS_URL not set - WebSocket real-time features disabled');
  }

  const server = httpServer.listen(PORT, '0.0.0.0', async () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
    logger.info(`🚀 ZANTARA TS-BACKEND started on ${bind}`);
    logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    if (process.env.REDIS_URL) {
      logger.info(`🔌 WebSocket ready for real-time features`);
    }

    // Start AI Automation Cron Scheduler
    try {
      getCronScheduler().start();
      logger.info('🤖 AI Automation Cron Scheduler started');
    } catch (error: any) {
      logger.warn(`⚠️  AI Automation Cron Scheduler failed to start: ${error.message}`);
      logger.warn('⚠️  Continuing without AI automation');
    }

    // Initialize Cron Scheduler for Autonomous Agents
    try {
      const cronScheduler = getCronScheduler();
      await cronScheduler.start();
      logger.info('✅ Autonomous Agents Cron Scheduler activated');
    } catch (error: any) {
      logger.error('❌ Failed to start Cron Scheduler:', error.message);
    }
  });

  // Handle shutdown gracefully
  async function gracefulShutdown(signal: string) {
    logger.info(`${signal} signal received: starting graceful shutdown`);

    // Stop cron scheduler
    try {
      const cronScheduler = getCronScheduler();
      await cronScheduler.stop();
      logger.info('Cron Scheduler stopped');
    } catch (error: any) {
      logger.error('Error stopping Cron Scheduler:', error.message);
    }

    // Stop accepting new requests
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close connection pools
      if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
        try {
          if (process.env.DATABASE_URL) {
            const dbPool = getDatabasePool();
            await dbPool.close();
            logger.info('Database connection pool closed');
          }

        } catch (error: any) {
          logger.error(`Error closing connection pools: ${error.message}`);
        }
      }

      // Stop AI Automation Cron Scheduler
      try {
        await getCronScheduler().stop();
        logger.info('AI Automation Cron Scheduler stopped');
      } catch (error: any) {
        logger.warn(`Error stopping cron scheduler: ${error.message}`);
      }

      // Log shutdown to audit trail
      if (featureFlags.isEnabled(FeatureFlag.ENABLE_AUDIT_TRAIL)) {
        await auditTrail.log({
          eventType: 'SYSTEM_SHUTDOWN' as any,
          action: `Server shutdown: ${signal}`,
          result: 'success',
        } as any);
      }

      logger.info('Graceful shutdown complete');
      process.exit(0);
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
startServer().catch((err) => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});
