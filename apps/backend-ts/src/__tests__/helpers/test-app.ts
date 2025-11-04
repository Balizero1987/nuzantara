/**
 * Test App
app.use(correlationMiddleware()); Helper
 * Creates Express app instance for testing
 */

import express from 'express';
import { attachRoutes } from '../../routing/router.js';
import { applySecurity } from '../../middleware/security.middleware.js';
import { corsMiddleware } from '../../middleware/cors.js';
import logger from '../../services/logger.js';
import correlationMiddleware from '../logging/correlation-middleware.js';

export async function createTestApp() {
  const app = express();

  // Minimal middleware for testing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Skip security middleware in tests to avoid complications
  // app.use(applySecurity);
  // app.use(corsMiddleware);

  // Request logging (optional in tests)
  app.use((req, res, next) => {
    logger.debug(`TEST ${req.method} ${req.path}`);
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
