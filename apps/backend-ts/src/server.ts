/**
 * ZANTARA TS-BACKEND Server
 * Main entry point for the TypeScript backend service
 */

import express from 'express';
import { createServer } from 'http';
import { ENV } from './config/index.js';
import logger from './services/logger.js';
import { attachRoutes } from './routing/router.js';
import { loadAllHandlers } from './core/load-all-handlers.js';
import {
  applySecurity,
  globalRateLimiter
} from './middleware/security.middleware.js';
import { corsMiddleware } from './middleware/cors.js';
import { setupWebSocket } from './websocket.js';
import { metricsMiddleware, metricsHandler } from './middleware/observability.middleware.js';
import { initializeRedis, cacheMiddleware } from './middleware/cache.middleware.js';
import cacheRoutes from './routes/cache.routes.js';

// Load balancing and high availability components
import { featureFlags, FeatureFlag } from './services/feature-flags.js';
import { initializeDatabasePool, getDatabasePool } from './services/connection-pool.js';
import { initializeChromaDBPool, getChromaDBPool } from './services/chromadb-pool.js';
import { prioritizedRateLimiter } from './middleware/prioritized-rate-limit.js';
import healthRoutes from './routes/health.js';
import { auditTrail } from './services/audit-trail.js';

// Main async function to ensure handlers load before server starts
async function startServer() {
  // Initialize Redis cache
  await initializeRedis();

  // Initialize connection pools if enabled
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
    try {
      if (process.env.DATABASE_URL) {
        await initializeDatabasePool();
        logger.info('✅ Database connection pool initialized');
      }
      
      if (process.env.CHROMADB_URL) {
        await initializeChromaDBPool();
        logger.info('✅ ChromaDB connection pool initialized');
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

  // Create Express app
  const app = express();

  // PATCH-3: Apply security middleware (headers, sanitization, logging)
  app.use(applySecurity);

  // PATCH-3: CORS with security configuration
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // PATCH-3: Global rate limiting (fallback)
  app.use(globalRateLimiter);

  // Prioritized rate limiting (if enabled)
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_PRIORITIZED_RATE_LIMIT)) {
    app.use(prioritizedRateLimiter);
    logger.info('✅ Prioritized rate limiting enabled');
  }

  // Observability: Metrics collection
  app.use(metricsMiddleware);

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });

  // Enhanced health check routes (replaces old /health)
  app.use(healthRoutes);

  // Legacy health check (backward compatibility)
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'ZANTARA TS-BACKEND',
      version: '5.2.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Metrics endpoint for Prometheus (if not already in health routes)
  app.get('/metrics', metricsHandler);

  // Cache management routes
  app.use('/cache', cacheRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      message: 'ZANTARA TS-BACKEND is running',
      version: '5.2.1',
      endpoints: {
        health: '/health',
        api: '/call',
        team: '/team.login'
      }
    });
  });

  // Bali Zero routes with caching
  const baliZeroRoutes = await import('./routes/api/v2/bali-zero.routes.js');
  app.use('/api/v2/bali-zero', baliZeroRoutes.default);

  // PATCH-3: Advanced Analytics Routes (Claude Sonnet 4.5)
  const advancedAnalyticsRoutes = await import('./routes/analytics/advanced-analytics.routes.js');
  app.use('/analytics', advancedAnalyticsRoutes.default);
  logger.info('✅ Advanced Analytics Engine loaded');

  // Load main router with all handlers
  attachRoutes(app);

  // Error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found',
      path: req.originalUrl
    });
  });

  // Start server
  const PORT = parseInt(process.env.PORT || ENV.PORT || '8080');

  // Create HTTP server (for WebSocket)
  const httpServer = createServer(app);

  // Setup WebSocket for real-time features (P0.4) - only if Redis is configured
  if (process.env.REDIS_URL) {
    const io = setupWebSocket(httpServer);
    logger.info('✅ WebSocket server initialized');
  } else {
    logger.warn('⚠️  REDIS_URL not set - WebSocket real-time features disabled');
  }

  const server = httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 ZANTARA TS-BACKEND started on port ${PORT}`);
    logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
    logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
    if (process.env.REDIS_URL) {
      logger.info(`🔌 WebSocket ready for real-time features`);
    }
  });

  // Handle shutdown gracefully
  async function gracefulShutdown(signal: string) {
    logger.info(`${signal} signal received: starting graceful shutdown`);
    
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
          
          if (process.env.CHROMADB_URL) {
            const chromaPool = getChromaDBPool();
            await chromaPool.close();
            logger.info('ChromaDB connection pool closed');
          }
        } catch (error: any) {
          logger.error(`Error closing connection pools: ${error.message}`);
        }
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
startServer().catch(err => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});
