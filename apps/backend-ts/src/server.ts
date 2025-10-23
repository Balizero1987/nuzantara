/**
 * ZANTARA TS-BACKEND Server
 * Main entry point for the TypeScript backend service
 */

import express from 'express';
import cors from 'cors';
import { ENV } from './config/index.js';
import logger from './services/logger.js';
import { createRouter } from './routing/router.js';
import { attachModularRoutes } from './routes/index.js';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'https://zantara.balizero.com'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    version: '5.2.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ZANTARA TS-BACKEND is running',
    version: '5.2.0',
    endpoints: {
      health: '/health',
      api: '/call',
      team: '/team.login'
    }
  });
});

// Load modular routes
attachModularRoutes(app);

// Load main router with all handlers
const mainRouter = createRouter();
app.use('/', mainRouter);

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

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 ZANTARA TS-BACKEND started on port ${PORT}`);
  logger.info(`🌐 Environment: ${ENV.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});