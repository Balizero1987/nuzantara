/**
 * Test App
 * Creates Express app instance for testing
 */

import express from 'express';
import { attachRoutes } from '../../routing/router.js';
import { applySecurity } from '../../middleware/security.middleware.js';
import { corsMiddleware } from '../../middleware/cors.js';
import logger from '../../services/logger.js';
import correlationMiddleware from '../../logging/correlation-middleware.js';

export async function createTestApp() {
  const app = express();

  // Trust proxy for rate limiting
  app.set('trust proxy', 1);

  // Minimal middleware for testing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Skip security middleware in tests to avoid complications
  // app.use(applySecurity);
  // app.use(corsMiddleware);

  // Note: Skip correlationMiddleware in tests to avoid potential body parsing issues
  // app.use(correlationMiddleware());

  // Request logging and body debugging
  app.use((req, res, next) => {
    logger.debug(`TEST ${req.method} ${req.path}`, { body: req.body });
    console.log(`[TEST] ${req.method} ${req.path}`, {
      body: req.body,
      contentType: req.get('content-type'),
      bodyKeys: Object.keys(req.body || {})
    });
    next();
  });

  // Attach routes
  attachRoutes(app);

  // Error handler for tests
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Test error:', err);
    res.status(err.status || 500).json({
      ok: false,
      error: err.message || 'Internal server error',
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      ok: false,
      error: 'Endpoint not found',
      path: req.originalUrl,
    });
  });

  return app;
}
