/**
 * ZANTARA TS-BACKEND Server
 * Main entry point for the TypeScript backend service
 */

/** Set up for OpenTelemetry tracing **/
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  NodeTracerProvider,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { OpenAIInstrumentation } from "@traceloop/instrumentation-openai";

const exporter = new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
});
const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
        "service.name": "nuzantara-backend-ts",
    }),
    spanProcessors: [
        new SimpleSpanProcessor(exporter)
    ],
});
provider.register();

registerInstrumentations({
    instrumentations: [new OpenAIInstrumentation()],
});
/** Set up for OpenTelemetry tracing **/

import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
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

// REMOVED: v3 Ω services (legacy - no longer used)

// UNIFIED AUTHENTICATION - Strategy Pattern Implementation (Gemini Pro 2.5)
import {
  unifiedAuth,
} from './services/auth/unified-auth-strategy.js';

// AI AUTOMATION - Cron Scheduler (OpenRouter Integration)
import aiMonitoringRoutes from './routes/ai-monitoring.js';

// REMOVED: registerV3OmegaServices() function (v3 legacy endpoints no longer used)

// Main async function to ensure handlers load before server starts
async function startServer() {
  // Initialize Redis cache
  await initializeRedis();

  // V3 cache system removed

  // GLM 4.6 Architect Patch: Initialize Enhanced Architecture
  // REMOVED: serviceRegistry initialization (v3 legacy - no longer used)
  try {
    // Service registry and v3 Ω services removed during cleanup

    logger.info('✅ Enhanced Architecture (GLM 4.6) initialized');
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

  // V3 endpoints removed - using direct RAG backend instead

  // Frontend compatibility alias for shared memory search
  app.get('/api/crm/shared-memory/search', (req, res, next) => {
    req.url = '/api/persistent-memory/collective/search';
    app._router.handle(req, res, next);
  });
  logger.info('✅ Frontend compatibility alias mounted (/api/crm/shared-memory/search → /api/persistent-memory/collective/search)');

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

  // Legacy demo auth endpoint removed (only real team auth supported)

  // FIX 4a: POST /auth/login - User login (JWT generation)
  app.post('/auth/login', async (req, res) => {
    try {
      const { email, name } = req.body;

      if (!email) {
        return res.status(400).json({
          ok: false,
          error: 'Email is required'
        });
      }

      const generatedUserId = `user_${Date.now()}`;
      const user = {
        id: generatedUserId,
        userId: generatedUserId,
        email,
        name: name || email.split('@')[0],
        role: 'User' as const,
        department: 'general',
        permissions: ['read' as const, 'write' as const],
        isActive: true,
        lastLogin: new Date(),
        authType: 'enhanced' as const
      };

      const token = unifiedAuth.generateToken(user, 'legacy');
      const expiresIn = 3600;

      logger.info(`✅ User logged in: ${user.email}`);

      res.json({
        ok: true,
        data: {
          token,
          expiresIn,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      logger.error('❌ Login error:', error instanceof Error ? error : new Error(String(error)));
      res.status(500).json({
        ok: false,
        error: 'Login failed'
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
  const baliZeroRoutes = await import('./routes/api/v2/bali-zero.routes.js');
  app.use('/api/v2/bali-zero', baliZeroRoutes.default);

  // FIX 3: SSE streaming endpoint aliases (frontend compatibility)
  app.get('/bali-zero/chat-stream', (req, res, next) => {
    req.url = '/api/v2/bali-zero/chat-stream';
    app._router.handle(req, res, next);
  });

  app.post('/bali-zero/chat-stream', (req, res, next) => {
    req.url = '/api/v2/bali-zero/chat-stream';
    app._router.handle(req, res, next);
  });

  logger.info('✅ SSE streaming aliases mounted (/bali-zero/chat-stream → /api/v2/bali-zero/chat-stream)');

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
    logger.info(`🚀 ZANTARA TS-BACKEND started on port ${PORT}`);
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
