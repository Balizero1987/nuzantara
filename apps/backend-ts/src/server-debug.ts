/**
 * ZANTARA TS-BACKEND Server - DEBUG VERSION
 * Enhanced with comprehensive error logging and graceful degradation
 */

// Wrap everything in an async IIFE to avoid top-level await issues
(async () => {
  console.log('🔍 [DEBUG] Starting server.ts execution...');
  console.log('🔍 [DEBUG] Node version:', process.version);
  console.log('🔍 [DEBUG] Working directory:', process.cwd());

  import express from 'express';
  import { createServer } from 'http';

  console.log('✅ [DEBUG] Core imports successful (express, http)');

  // Import config with error handling
  let ENV: any;
  try {
    const configModule = await import('./config/index.js');
    ENV = configModule.ENV;
    console.log('✅ [DEBUG] Config loaded:', {
      port: ENV.PORT,
      nodeEnv: ENV.NODE_ENV,
      ownerEmail: ENV.OWNER_EMAIL,
    });
  } catch (error: any) {
    console.error('❌ [DEBUG] Config import failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }

  // Import logger with error handling
  let logger: any;
  try {
    const loggerModule = await import('./services/logger.js');
    logger = loggerModule.default;
    console.log('✅ [DEBUG] Logger loaded');
  } catch (error: any) {
    console.error('❌ [DEBUG] Logger import failed:', error.message);
    // Fallback to console
    logger = {
      info: console.log,
      warn: console.warn,
      error: console.error,
    };
    console.log('⚠️ [DEBUG] Using fallback console logger');
  }

  logger.info('🚀 [DEBUG] Starting ZANTARA TS-BACKEND with enhanced debugging');

  // Import routing with error handling
  let attachRoutes: any;
  try {
    const routingModule = await import('./routing/router.js');
    attachRoutes = routingModule.attachRoutes;
    logger.info('✅ [DEBUG] Routing module loaded');
  } catch (error: any) {
    logger.error('❌ [DEBUG] Routing import failed:', error.message);
    logger.error('Stack:', error.stack);
    attachRoutes = null;
  }

  // Import middleware with graceful degradation
  let corsMiddleware: any;
  let applySecurity: any;
  let globalRateLimiter: any;

  try {
    const corsModule = await import('./middleware/cors.js');
    corsMiddleware = corsModule.corsMiddleware;
    logger.info('✅ [DEBUG] CORS middleware loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] CORS middleware failed, using basic CORS:', error.message);
    corsMiddleware = (_req: any, res: any, next: any) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    };
  }

  try {
    const securityModule = await import('./middleware/security.middleware.js');
    applySecurity = securityModule.applySecurity;
    globalRateLimiter = securityModule.globalRateLimiter;
    logger.info('✅ [DEBUG] Security middleware loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] Security middleware failed, using no-op:', error.message);
    applySecurity = (_req: any, _res: any, next: any) => next();
    globalRateLimiter = (_req: any, _res: any, next: any) => next();
  }

  // Import WebSocket with error handling
  let setupWebSocket: any;
  try {
    const wsModule = await import('./websocket.js');
    setupWebSocket = wsModule.setupWebSocket;
    logger.info('✅ [DEBUG] WebSocket module loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] WebSocket module failed, will skip:', error.message);
    setupWebSocket = null;
  }

  // Import metrics with error handling
  let metricsMiddleware: any;
  let metricsHandler: any;
  try {
    const metricsModule = await import('./middleware/observability.middleware.js');
    metricsMiddleware = metricsModule.metricsMiddleware;
    metricsHandler = metricsModule.metricsHandler;
    logger.info('✅ [DEBUG] Metrics middleware loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] Metrics middleware failed, using no-op:', error.message);
    metricsMiddleware = (_req: any, _res: any, next: any) => next();
    metricsHandler = (_req: any, res: any) => res.json({ status: 'metrics disabled' });
  }

  // Import Redis cache with error handling
  let initializeRedis: any;
  let _cacheMiddleware: any;
  try {
    const cacheModule = await import('./middleware/cache.middleware.js');
    initializeRedis = cacheModule.initializeRedis;
    _cacheMiddleware = cacheModule.cacheMiddleware;
    logger.info('✅ [DEBUG] Cache middleware loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] Cache middleware failed, using no-op:', error.message);
    initializeRedis = async () => logger.warn('⚠️ Redis initialization skipped');
    _cacheMiddleware = (_req: any, _res: any, next: any) => next();
  }

  // Import correlation middleware
  let correlationMiddleware: any;
  try {
    const corrModule = await import('./logging/correlation-middleware.js');
    correlationMiddleware = corrModule.default;
    logger.info('✅ [DEBUG] Correlation middleware loaded');
  } catch (error: any) {
    logger.warn('⚠️ [DEBUG] Correlation middleware failed, using no-op:', error.message);
    correlationMiddleware = () => (_req: any, _res: any, next: any) => next();
  }

  logger.info('✅ [DEBUG] All critical imports completed successfully');

  // Main server startup function
  async function startServer() {
    logger.info('🚀 [DEBUG] Starting server initialization...');

    // Initialize Redis with error handling
    logger.info('🔌 [DEBUG] Attempting Redis initialization...');
    try {
      await initializeRedis();
      logger.info('✅ [DEBUG] Redis initialized successfully');
    } catch (error: any) {
      logger.warn(
        '⚠️ [DEBUG] Redis initialization failed, continuing without cache:',
        error.message
      );
    }

    // Create Express app
    logger.info('📦 [DEBUG] Creating Express application...');
    const app = express();

    // Configure trust proxy for Fly.io
    app.set('trust proxy', true);
    logger.info('✅ [DEBUG] Trust proxy configured');

    // Apply middleware
    logger.info('🔧 [DEBUG] Applying middleware...');

    try {
      app.use(applySecurity);
      logger.info('  ✅ Security middleware applied');
    } catch (error: any) {
      logger.error('  ❌ Security middleware failed:', error.message);
    }

    try {
      app.use(corsMiddleware);
      logger.info('  ✅ CORS middleware applied');
    } catch (error: any) {
      logger.error('  ❌ CORS middleware failed:', error.message);
    }

    try {
      app.use(express.json({ limit: '10mb' }));
      app.use(express.urlencoded({ extended: true, limit: '10mb' }));
      logger.info('  ✅ Body parsing middleware applied');
    } catch (error: any) {
      logger.error('  ❌ Body parsing failed:', error.message);
    }

    try {
      app.use(correlationMiddleware());
      logger.info('  ✅ Correlation middleware applied');
    } catch (error: any) {
      logger.error('  ❌ Correlation middleware failed:', error.message);
    }

    try {
      app.use(globalRateLimiter);
      logger.info('  ✅ Rate limiter applied');
    } catch (error: any) {
      logger.error('  ❌ Rate limiter failed:', error.message);
    }

    try {
      app.use(metricsMiddleware);
      logger.info('  ✅ Metrics middleware applied');
    } catch (error: any) {
      logger.error('  ❌ Metrics middleware failed:', error.message);
    }

    // Request logging
    app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    logger.info('✅ [DEBUG] All middleware applied successfully');

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        service: 'ZANTARA TS-BACKEND',
        version: '5.2.1-debug',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        debug: {
          nodeVersion: process.version,
          platform: process.platform,
          memory: process.memoryUsage(),
          env: {
            nodeEnv: ENV.NODE_ENV,
            port: ENV.PORT,
            redisConfigured: !!process.env.REDIS_URL,
            databaseConfigured: !!process.env.DATABASE_URL,
          },
        },
      });
    });
    logger.info('✅ [DEBUG] Health check endpoint registered');

    // Metrics endpoint
    app.get('/metrics', metricsHandler);
    logger.info('✅ [DEBUG] Metrics endpoint registered');

    // Root endpoint
    app.get('/', (_req, res) => {
      res.json({
        message: 'ZANTARA TS-BACKEND is running (DEBUG MODE)',
        version: '5.2.1-debug',
        status: 'operational',
        endpoints: {
          health: '/health',
          metrics: '/metrics',
        },
      });
    });
    logger.info('✅ [DEBUG] Root endpoint registered');

    // Load optional routes with error handling
    logger.info('🔄 [DEBUG] Loading optional route modules...');

    // Health routes
    try {
      const healthModule = await import('./routes/health.js');
      app.use(healthModule.default);
      logger.info('  ✅ Health routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Health routes failed:', error.message);
    }

    // Cache routes
    try {
      const cacheRoutesModule = await import('./routes/cache.routes.js');
      app.use('/cache', cacheRoutesModule.default);
      logger.info('  ✅ Cache routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Cache routes failed:', error.message);
    }

    // Performance routes
    try {
      const perfModule = await import('./routes/performance.routes.js');
      app.use('/performance', perfModule.default);
      logger.info('  ✅ Performance routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Performance routes failed:', error.message);
    }

    // Bali Zero routes
    try {
      const baliZeroModule = await import('./routes/api/v2/bali-zero.routes.js');
      app.use('/api/v2/bali-zero', baliZeroModule.default);
      logger.info('  ✅ Bali Zero routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Bali Zero routes failed:', error.message);
    }

    // Advanced Analytics routes
    try {
      const analyticsModule = await import('./routes/analytics/advanced-analytics.routes.js');
      app.use('/analytics', analyticsModule.default);
      logger.info('  ✅ Analytics routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Analytics routes failed:', error.message);
    }

    // ZANTARA v3 routes
    try {
      const v3Module = await import('./routes/api/v3/zantara-v3.routes.js');
      app.use('/api/v3/zantara', v3Module.default);
      logger.info('  ✅ ZANTARA v3 routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ ZANTARA v3 routes failed:', error.message);
    }

    // V3 Performance routes
    try {
      const v3PerfModule = await import('./routes/v3-performance.routes.js');
      app.use('/api/v3/performance', v3PerfModule.default);
      logger.info('  ✅ V3 Performance routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ V3 Performance routes failed:', error.message);
    }

    // Code Quality routes
    try {
      const codeQualityModule = await import('./routes/code-quality.routes.js');
      app.use('/code-quality', codeQualityModule.default);
      logger.info('  ✅ Code Quality routes loaded');
    } catch (error: any) {
      logger.warn('  ⚠️ Code Quality routes failed:', error.message);
    }

    // Main router (if available)
    if (attachRoutes) {
      try {
        attachRoutes(app);
        logger.info('  ✅ Main router attached');
      } catch (error: any) {
        logger.warn('  ⚠️ Main router failed:', error.message);
      }
    } else {
      logger.warn('  ⚠️ Main router not available, skipping');
    }

    logger.info('✅ [DEBUG] All routes loaded (with graceful degradation)');

    // Error handling
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: ENV.NODE_ENV === 'development' ? err.message : 'Something went wrong',
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

    logger.info('✅ [DEBUG] Error handlers configured');

    // Create HTTP server
    const httpServer = createServer(app);
    logger.info('✅ [DEBUG] HTTP server created');

    // Setup WebSocket (if available and Redis configured)
    if (setupWebSocket && process.env.REDIS_URL) {
      try {
        setupWebSocket(httpServer);
        logger.info('✅ [DEBUG] WebSocket initialized');
      } catch (error: any) {
        logger.warn('⚠️ [DEBUG] WebSocket setup failed:', error.message);
      }
    } else {
      logger.warn('⚠️ [DEBUG] WebSocket not initialized (missing module or Redis)');
    }

    // Start listening
    const PORT = parseInt(process.env.PORT || ENV.PORT || '8080');
    logger.info(`🎯 [DEBUG] Attempting to listen on port ${PORT}...`);

    const server = httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 ========================================`);
      logger.info(`🚀 ZANTARA TS-BACKEND STARTED SUCCESSFULLY`);
      logger.info(`🚀 ========================================`);
      logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🔗 Port: ${PORT}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔗 Root: http://localhost:${PORT}/`);
      logger.info(`⏰ Uptime: ${process.uptime()}s`);
      logger.info(`💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
      if (process.env.REDIS_URL) {
        logger.info(`🔌 Redis: CONFIGURED`);
      }
      if (process.env.DATABASE_URL) {
        logger.info(`🗄️ Database: CONFIGURED`);
      }
      logger.info(`🚀 ========================================`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      logger.error('❌ [DEBUG] Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

    // Graceful shutdown
    async function gracefulShutdown(signal: string) {
      logger.info(`${signal} signal received: starting graceful shutdown`);

      server.close(async () => {
        logger.info('HTTP server closed');
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

    logger.info('✅ [DEBUG] Server initialization complete');
  }

  // Start the server with comprehensive error catching
  logger.info('🎬 [DEBUG] Calling startServer()...');
  startServer().catch((err) => {
    console.error('❌ ========================================');
    console.error('❌ FATAL ERROR: Failed to start server');
    console.error('❌ ========================================');
    console.error('Error:', err);
    console.error('Stack:', err.stack);
    console.error('❌ ========================================');
    process.exit(1);
  });

  console.log('✅ [DEBUG] server.ts main execution completed');
})(); // Close async IIFE
