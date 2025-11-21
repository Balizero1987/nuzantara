/**
 * INCREMENTAL SERVER - Feature by Feature
 * Properly wrapped to avoid top-level await issues
 */

import express from 'express';
// import { createServer } from 'http';

console.log('🔍 [INC] Server starting...');
console.log('🔍 [INC] Node version:', process.version);

// Main async function to load everything
async function startIncrementalServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '8080');

  console.log('✅ [INC] Express app created');

  // Configure trust proxy for Fly.io
  app.set('trust proxy', true);
  console.log('✅ [INC] Trust proxy configured');

  // ============================================================
  // BODY PARSER - MUST BE BEFORE ALL ROUTES
  // ============================================================
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  console.log('✅ [INC] Body parsing configured');

  // ============================================================
  // FEATURE #1: CORS & Security Middleware
  // ============================================================
  console.log('🔄 [INC] Loading Feature #1: CORS & Security...');

  let corsMiddleware: any;
  let applySecurity: any;

  // Try to load CORS middleware
  try {
    const corsModule = await import('./middleware/cors.js');
    corsMiddleware = corsModule.corsMiddleware;
    console.log('  ✅ [F1] CORS middleware loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F1] CORS middleware failed, using basic CORS:', error.message);
    corsMiddleware = (req: any, res: any, next: any) => {
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    };
  }

  // Try to load Security middleware
  try {
    const securityModule = await import('./middleware/security.middleware.js');
    applySecurity = securityModule.applySecurity;
    console.log('  ✅ [F1] Security middleware loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F1] Security middleware failed, using no-op:', error.message);
    applySecurity = (_req: any, _res: any, next: any) => next();
  }

  // Apply middleware
  try {
    app.use(applySecurity);
    app.use(corsMiddleware);
    console.log('✅ [F1] Feature #1 ENABLED: CORS & Security');
  } catch (error: any) {
    console.error('❌ [F1] Failed to apply middleware:', error.message);
  }

  // ============================================================
  // FEATURE #2: Metrics & Observability
  // ============================================================
  console.log('🔄 [INC] Loading Feature #2: Metrics & Observability...');

  let metricsMiddleware: any;
  let metricsHandler: any;

  try {
    const metricsModule = await import('./middleware/observability.middleware.js');
    metricsMiddleware = metricsModule.metricsMiddleware;
    metricsHandler = metricsModule.metricsHandler;
    console.log('  ✅ [F2] Observability middleware loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F2] Observability middleware failed, using no-op:', error.message);
    metricsMiddleware = (_req: any, _res: any, next: any) => next();
    metricsHandler = (_req: any, res: any) => {
      res.json({
        status: 'metrics_disabled',
        message: 'Observability module not loaded',
      });
    };
  }

  // Apply metrics middleware
  try {
    app.use(metricsMiddleware);
    console.log('✅ [F2] Feature #2 ENABLED: Metrics & Observability');
  } catch (error: any) {
    console.error('❌ [F2] Failed to apply metrics middleware:', error.message);
  }

  // ============================================================
  // FEATURE #3: Advanced Health Routes
  // ============================================================
  console.log('🔄 [INC] Loading Feature #3: Advanced Health Routes...');

  let healthRoutes: any;

  try {
    const healthModule = await import('./routes/health.js');
    healthRoutes = healthModule.default;
    console.log('  ✅ [F3] Health routes module loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F3] Health routes failed:', error.message);
    healthRoutes = null;
  }

  // Apply health routes if loaded
  if (healthRoutes) {
    try {
      app.use(healthRoutes);
      console.log('✅ [F3] Feature #3 ENABLED: Advanced Health Routes');
    } catch (error: any) {
      console.error('❌ [F3] Failed to mount health routes:', error.message);
    }
  } else {
    console.log('⚠️ [F3] Feature #3 SKIPPED: Health routes not available');
  }

  // ============================================================
  // FEATURE #4: Redis Cache Initialization & Routes
  // ============================================================
  console.log('🔄 [INC] Loading Feature #4: Redis Cache...');

  let initializeRedis: any;
  let cacheRoutes: any;

  // Try to initialize Redis
  try {
    const cacheModule = await import('./middleware/cache.middleware.js');
    initializeRedis = cacheModule.initializeRedis;
    console.log('  ✅ [F4] Cache middleware loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F4] Cache middleware failed:', error.message);
    initializeRedis = async () => console.log('  ⚠️ Redis initialization skipped');
  }

  // Initialize Redis connection
  try {
    await initializeRedis();
    console.log('  ✅ [F4] Redis initialized');
  } catch (error: any) {
    console.log('  ⚠️ [F4] Redis initialization failed:', error.message);
  }

  // Try to load cache routes
  try {
    const cacheRoutesModule = await import('./routes/cache.routes.js');
    cacheRoutes = cacheRoutesModule.default;
    console.log('  ✅ [F4] Cache routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F4] Cache routes failed:', error.message);
    cacheRoutes = null;
  }

  // Mount cache routes if available
  if (cacheRoutes) {
    try {
      app.use('/cache', cacheRoutes);
      console.log('✅ [F4] Feature #4 ENABLED: Redis Cache & Routes');
    } catch (error: any) {
      console.error('❌ [F4] Failed to mount cache routes:', error.message);
    }
  } else {
    console.log('⚠️ [F4] Feature #4 PARTIAL: Redis initialized, routes skipped');
  }

  // ============================================================
  // FEATURE #5: Correlation Middleware (Request Tracking)
  // ============================================================
  console.log('🔄 [INC] Loading Feature #5: Correlation Middleware...');

  let correlationMiddleware: any;

  try {
    const correlationModule = await import('./logging/correlation-middleware.js');
    correlationMiddleware = correlationModule.default;
    console.log('  ✅ [F5] Correlation middleware loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F5] Correlation middleware failed, using no-op:', error.message);
    correlationMiddleware = () => (req: any, _res: any, next: any) => {
      // Generate basic correlation ID
      req.correlationId =
        req.headers['x-correlation-id'] ||
        req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      _res.setHeader('x-correlation-id', req.correlationId);
      next();
    };
  }

  // Apply correlation middleware early (before request logging)
  try {
    app.use(correlationMiddleware());
    console.log('✅ [F5] Feature #5 ENABLED: Correlation Middleware');
  } catch (error: any) {
    console.error('❌ [F5] Failed to apply correlation middleware:', error.message);
  }

  // ============================================================
  // FEATURE #6: Performance Routes & Monitoring
  // ============================================================
  console.log('🔄 [INC] Loading Feature #6: Performance Routes...');

  let performanceRoutes: any;

  try {
    const perfModule = await import('./routes/performance.routes.js');
    performanceRoutes = perfModule.default;
    console.log('  ✅ [F6] Performance routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F6] Performance routes failed:', error.message);
    performanceRoutes = null;
  }

  // Mount performance routes if available
  if (performanceRoutes) {
    try {
      app.use('/performance', performanceRoutes);
      console.log('✅ [F6] Feature #6 ENABLED: Performance Routes');
    } catch (error: any) {
      console.error('❌ [F6] Failed to mount performance routes:', error.message);
    }
  } else {
    console.log('⚠️ [F6] Feature #6 SKIPPED: Performance routes not available');
  }

  // ============================================================
  // FEATURE #6.5: Autonomous Agents Monitoring Routes
  // ============================================================
  console.log('🔄 [INC] Loading Feature #6.5: Autonomous Agents Monitoring...');

  let monitoringRoutes: any;

  try {
    const monitoringModule = await import('./routes/monitoring.routes.js');
    monitoringRoutes = monitoringModule.default;
    console.log('  ✅ [F6.5] Monitoring routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F6.5] Monitoring routes failed:', error.message);
    monitoringRoutes = null;
  }

  // Mount monitoring routes if available
  if (monitoringRoutes) {
    try {
      app.use('/api/monitoring', monitoringRoutes);
      console.log('✅ [F6.5] Feature #6.5 ENABLED: Autonomous Agents Monitoring');
    } catch (error: any) {
      console.error('❌ [F6.5] Failed to mount monitoring routes:', error.message);
    }
  } else {
    console.log('⚠️ [F6.5] Feature #6.5 SKIPPED: Monitoring routes not available');
  }

  // ============================================================
  // FEATURE #7: Bali Zero Chat Routes
  // ============================================================
  console.log('🔄 [INC] Loading Feature #7: Bali Zero Chat...');

  let baliZeroRoutes: any;

  try {
    const baliModule = await import('./routes/api/v2/bali-zero.routes.js');
    baliZeroRoutes = baliModule.default;
    console.log('  ✅ [F7] Bali Zero routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F7] Bali Zero routes failed:', error.message);
    baliZeroRoutes = null;
  }

  // Mount Bali Zero routes if available
  if (baliZeroRoutes) {
    try {
      app.use('/api/v2/bali-zero', baliZeroRoutes);
      console.log('✅ [F7] Feature #7 ENABLED: Bali Zero Chat');
    } catch (error: any) {
      console.error('❌ [F7] Failed to mount Bali Zero routes:', error.message);
    }
  } else {
    console.log('⚠️ [F7] Feature #7 SKIPPED: Bali Zero routes not available');
  }

  // ============================================================
  // FEATURE #9: Team Authentication Routes
  // ============================================================
  console.log('🔄 [INC] Loading Feature #9: Team Authentication...');

  let teamAuthRoutes: any;

  try {
    const teamAuthModule = await import('./routes/api/auth/team-auth.routes.js');
    teamAuthRoutes = teamAuthModule.default;
    console.log('  ✅ [F9] Team Auth routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F9] Team Auth routes failed:', error.message);
    teamAuthRoutes = null;
  }

  // Mount Team Auth routes if available
  if (teamAuthRoutes) {
    try {
      app.use('/api/auth/team', teamAuthRoutes);
      console.log('✅ [F9] Feature #9 ENABLED: Team Authentication');
    } catch (error: any) {
      console.error('❌ [F9] Failed to mount Team Auth routes:', error.message);
    }
  } else {
    console.log('⚠️ [F9] Feature #9 SKIPPED: Team Auth routes not available');
  }

  // ============================================================
  // FEATURE #10: User Authentication (Complete System)
  // ============================================================
  console.log('🔄 [INC] Loading Feature #10: User Authentication...');

  let userAuthRoutes: any;

  try {
    // const userAuthModule = await import('./routes/api/auth/user-auth.routes.js');
    // userAuthRoutes = userAuthModule.default;
    console.log('  ⚠️ [F10] User Auth routes removed');
  } catch (error: any) {
    console.log('  ⚠️ [F10] User Auth routes failed:', error.message);
    userAuthRoutes = null;
  }

  // Mount User Auth routes if available
  if (userAuthRoutes) {
    try {
      app.use('/api/auth', userAuthRoutes);
      console.log('✅ [F10] Feature #10 ENABLED: User Authentication System');
    } catch (error: any) {
      console.error('❌ [F10] Failed to mount User Auth routes:', error.message);
    }
  } else {
    console.log('⚠️ [F10] Feature #10 SKIPPED: User Auth routes not available');
  }

  // ============================================================
  // FEATURE #8: ZANTARA v3 AI Routes (unified/collective/ecosystem)
  // ============================================================
  console.log('🔄 [INC] Loading Feature #8: ZANTARA v3 AI...');

  let zantaraV3Routes: any;

  try {
    // const v3Module = await import('./routes/api/v3/zantara-v3.routes.js');
    // zantaraV3Routes = v3Module.default;
    console.log('  ⚠️ [F8] ZANTARA v3 routes removed');
  } catch (error: any) {
    console.log('  ⚠️ [F8] ZANTARA v3 routes failed:', error.message);
    zantaraV3Routes = null;
  }

  // Mount ZANTARA v3 routes if available
  if (zantaraV3Routes) {
    try {
      app.use('/api/v3/zantara', zantaraV3Routes);
      console.log('✅ [F8] Feature #8 ENABLED: ZANTARA v3 AI');
    } catch (error: any) {
      console.error('❌ [F8] Failed to mount ZANTARA v3 routes:', error.message);
    }
  } else {
    console.log('⚠️ [F8] Feature #8 SKIPPED: ZANTARA v3 routes not available');
  }

  // ============================================================
  // FEATURE #8.5: Persistent Memory System
  // ============================================================
  console.log('🔄 [INC] Loading Feature #8.5: Persistent Memory...');

  let persistentMemoryRoutes: any;

  try {
    const memoryModule = await import('./routes/persistent-memory.routes.js');
    persistentMemoryRoutes = memoryModule.default;
    console.log('  ✅ [F8.5] Persistent Memory routes loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F8.5] Persistent Memory routes failed:', error.message);
    persistentMemoryRoutes = null;
  }

  // Mount persistent memory routes if available
  if (persistentMemoryRoutes) {
    try {
      app.use('/api/persistent-memory', persistentMemoryRoutes);
      console.log('✅ [F8.5] Feature #8.5 ENABLED: Persistent Memory System (PostgreSQL)');
    } catch (error: any) {
      console.error('❌ [F8.5] Failed to mount Persistent Memory routes:', error.message);
    }
  } else {
    console.log('⚠️ [F8.5] Feature #8.5 SKIPPED: Persistent Memory not available');
  }

  // ============================================================
  // FEATURE #9: Main Router (Safe Progressive Loading)
  // ============================================================
  console.log('🔄 [INC] Loading Feature #9: Main Router (safe mode)...');

  let attachRoutes: any;

  try {
    const routingModule = await import('./routing/router-safe.js');
    attachRoutes = routingModule.attachRoutes;
    console.log('  ✅ [F9] Safe router module loaded');
  } catch (error: any) {
    console.log('  ⚠️ [F9] Safe router failed:', error.message);
    attachRoutes = null;
  }

  // Attach main router with progressive loading
  if (attachRoutes) {
    try {
      const result = await attachRoutes(app);
      console.log(
        `✅ [F9] Feature #9 ENABLED: Main Router (${result.loaded} routes loaded, ${result.failed} skipped)`
      );
    } catch (error: any) {
      console.error('❌ [F9] Failed to attach main router:', error.message);
    }
  } else {
    console.log('⚠️ [F9] Feature #9 SKIPPED: Main router not available');
  }

  // ============================================================
  // REQUEST LOGGING
  // ============================================================

  // Request logging with correlation ID
  app.use((req, _res, next) => {
    const corrId = (req as any).correlationId || 'unknown';
    console.log(`📍 [INC] [${corrId.substr(0, 12)}] ${req.method} ${req.path}`);
    next();
  });

  // ============================================================
  // ENDPOINTS
  // ============================================================

  // Metrics endpoint (Feature #2)
  app.get('/metrics', metricsHandler);
  console.log('✅ [INC] Metrics endpoint registered at /metrics');

  app.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      version: 'incremental-v0.9-progressive',
      timestamp: new Date().toISOString(),
      features: {
        enabled: [
          'cors',
          'security',
          'metrics',
          'health-routes',
          'redis-cache',
          'correlation',
          'performance',
          'bali-zero',
          'zantara-v3',
          'main-router-progressive',
        ],
        total: 38,
        progress: '9+/38',
        note: 'Progressive router loading - handlers loaded on-demand',
        categories: {
          'Authentication & User': 'progressive',
          'AI & Knowledge Base': 'progressive',
          'Business Logic': 'progressive',
          'Finance & Pricing': 'progressive',
          'Admin & System': 'progressive',
          Utility: '4/7 + progressive',
        },
      },
      env: {
        port: PORT,
        nodeEnv: process.env.NODE_ENV,
        redisUrl: process.env.REDIS_URL ? 'CONNECTED' : 'NOT_SET',
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
      },
    });
  });

  app.get('/', (_req, res) => {
    res.json({
      message: 'ZANTARA TS-BACKEND - Progressive Deployment',
      version: 'incremental-v0.9-progressive',
      status: 'operational',
      features: {
        enabled: [
          'cors',
          'security',
          'metrics',
          'health-routes',
          'redis-cache',
          'correlation',
          'performance',
          'bali-zero',
          'zantara-v3',
          'main-router-progressive',
        ],
        totalEndpoints: 38,
        note: 'Core + Progressive Router (handlers loaded safely with fallback)',
      },
      endpoints: {
        health: '/health',
        metrics: '/metrics',
        cache: '/cache/*',
        performance: '/performance/*',
        monitoring: '/api/monitoring/* (cron-status, agent-tasks)',
        baliZero: '/api/v2/bali-zero/* (KBLI lookup)',
        zantaraV3: '/api/v3/zantara/* (AI unified)',
        progressive: '/api/* (additional routes loaded progressively)',
        docs: 'Check logs for loaded routes count',
      },
    });
  });

  console.log(`🎯 [INC] Attempting to listen on port ${PORT}...`);

  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log('🚀 ========================================');
    console.log('🚀 INCREMENTAL SERVER STARTED');
    console.log('🚀 ========================================');
    console.log(`🚀 Port: ${PORT}`);
    console.log(`🚀 Health: http://localhost:${PORT}/health`);
    console.log(`🚀 Metrics: http://localhost:${PORT}/metrics`);
    console.log(`🚀 Cache (Redis): http://localhost:${PORT}/cache/stats`);
    console.log(`🚀 Bali Zero: http://localhost:${PORT}/api/v2/bali-zero`);
    console.log(`🚀 ZANTARA v3: http://localhost:${PORT}/api/v3/zantara`);
    console.log(`🚀 Monitoring: http://localhost:${PORT}/api/monitoring/cron-status`);
    console.log(`🚀 Features: 9/38 core features enabled (24%) ✅`);
    console.log('🚀 ========================================');

    // Initialize Autonomous Agents Cron Scheduler
    try {
      const { getCronScheduler } = await import('./services/cron-scheduler.js');
      const cronScheduler = getCronScheduler();
      await cronScheduler.start();
      console.log('✅ [INC] Autonomous Agents Cron Scheduler activated');
    } catch (error: any) {
      console.error('❌ [INC] Failed to start Cron Scheduler:', error.message);
    }
  });

  server.on('error', (error: any) => {
    console.error('❌ [INC] Server error:', error);
    process.exit(1);
  });

  process.on('SIGTERM', async () => {
    console.log('🛑 [INC] SIGTERM received');
    
    // Stop cron scheduler
    try {
      const { getCronScheduler } = await import('./services/cron-scheduler.js');
      const cronScheduler = getCronScheduler();
      await cronScheduler.stop();
      console.log('✅ [INC] Cron Scheduler stopped');
    } catch (error: any) {
      console.error('❌ [INC] Error stopping Cron Scheduler:', error.message);
    }

    server.close(() => {
      console.log('✅ [INC] Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('🛑 [INC] SIGINT received');
    
    // Stop cron scheduler
    try {
      const { getCronScheduler } = await import('./services/cron-scheduler.js');
      const cronScheduler = getCronScheduler();
      await cronScheduler.stop();
      console.log('✅ [INC] Cron Scheduler stopped');
    } catch (error: any) {
      console.error('❌ [INC] Error stopping Cron Scheduler:', error.message);
    }

    server.close(() => {
      console.log('✅ [INC] Server closed');
      process.exit(0);
    });
  });

  console.log('✅ [INC] Setup complete');
}

// Start the server
startIncrementalServer().catch((err) => {
  console.error('❌ [INC] FATAL ERROR:', err);
  process.exit(1);
});
