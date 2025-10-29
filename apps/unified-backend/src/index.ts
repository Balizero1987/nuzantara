import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeModules } from './modules';
import { cacheMiddleware } from './middleware/cache';
import { securityMiddleware } from './middleware/security';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';
import { redis } from './utils/redis';
import { db } from './utils/database';
import { collectMetrics } from './utils/metrics';

const app = express();
const server = createServer(app);

async function bootstrap() {
  // Global middleware
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware
  app.use(securityMiddleware);
  app.use(cacheMiddleware);

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
      ip: req.ip
    });
    next();
  });

  // Initialize all modules dynamically
  const modules = await initializeModules();

  // Register module routes
  Object.entries(modules).forEach(([name, module]) => {
    app.use(`/api/${name}`, module.router);
    logger.info(`Registered module: ${name}`);
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      modules: Object.keys(modules),
      checks: {} as Record<string, string>
    };

    // Check Redis
    try {
      await redis.ping();
      health.checks.redis = 'healthy';
    } catch (error) {
      health.checks.redis = 'unhealthy';
    }

    // Check Database
    try {
      await db.$queryRaw`SELECT 1`;
      health.checks.database = 'healthy';
    } catch (error) {
      health.checks.database = 'unhealthy';
    }

    const allHealthy = Object.values(health.checks).every(s => s === 'healthy');
    res.status(allHealthy ? 200 : 503).json(health);
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    const metrics = await collectMetrics();
    res.json(metrics);
  });

  // Error handling
  app.use(errorHandler);

  // Start server
  const port = process.env.PORT || 8080;
  server.listen(port, () => {
    logger.info(`Unified backend running on port ${port}`);
    logger.info(`Modules loaded: ${Object.keys(modules).join(', ')}`);
  });
}

bootstrap().catch(error => {
  logger.error('Bootstrap failed:', error);
  process.exit(1);
});
