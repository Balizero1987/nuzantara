/**
 * ZANTARA TS-BACKEND Server
 * Main entry point for the TypeScript backend service
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { ENV } from './config/index.js';
import logger from './services/logger.js';
import { attachRoutes } from './routing/router.js';
import { loadAllHandlers } from './core/load-all-handlers.js';
import { 
  applySecurity, 
  globalRateLimiter, 
  corsConfig 
} from './middleware/security.middleware.js';
import { setupWebSocket } from './websocket.js';

// Main async function to ensure handlers load before server starts
async function startServer() {
  // Create Express app
  const app = express();

  // PATCH-3: Apply security middleware (headers, sanitization, logging)
  app.use(applySecurity);

  // PATCH-3: CORS with security configuration
  app.use(cors(corsConfig));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // PATCH-3: Global rate limiting
  app.use(globalRateLimiter);
  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'ZANTARA TS-BACKEND',
      version: '5.2.1',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

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
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
    });
  });
}

// Start the server
startServer().catch(err => {
  logger.error('❌ Failed to start server:', err);
  process.exit(1);
});
