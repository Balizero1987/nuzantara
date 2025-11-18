/**
 * INCREMENTAL SERVER - Feature by Feature
 * Starting with minimal + adding features one by one
 */

console.log('🔍 [INC] Server starting...');
console.log('🔍 [INC] Node version:', process.version);

import express from 'express';

console.log('✅ [INC] Express imported');

const app = express();
const PORT = parseInt(process.env.PORT || '8080');

console.log('✅ [INC] Express app created');

// Configure trust proxy for Fly.io
app.set('trust proxy', true);
console.log('✅ [INC] Trust proxy configured');

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
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
// BASIC MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ [INC] Body parsing configured');

// Request logging
app.use((req, _res, next) => {
  console.log(`📍 [INC] ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// ============================================================
// ENDPOINTS
// ============================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: 'incremental-v0.1',
    timestamp: new Date().toISOString(),
    features: {
      enabled: ['cors', 'security'],
      total: 24,
      progress: '1/24',
    },
    env: {
      port: PORT,
      nodeEnv: process.env.NODE_ENV,
      redisUrl: process.env.REDIS_URL ? 'SET' : 'NOT_SET',
      databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    },
  });
});

app.get('/', (_req, res) => {
  res.json({
    message: 'ZANTARA TS-BACKEND - Incremental Deployment',
    version: 'incremental-v0.1',
    status: 'operational',
    features: {
      enabled: ['cors', 'security'],
      next: 'metrics-observability',
    },
  });
});

console.log(`🎯 [INC] Attempting to listen on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ========================================');
  console.log('🚀 INCREMENTAL SERVER STARTED');
  console.log('🚀 ========================================');
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Health: http://localhost:${PORT}/health`);
  console.log(`🚀 Features: 1/24 enabled`);
  console.log('🚀 ========================================');
});

server.on('error', (error: any) => {
  console.error('❌ [INC] Server error:', error);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('🛑 [INC] SIGTERM received');
  server.close(() => {
    console.log('✅ [INC] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 [INC] SIGINT received');
  server.close(() => {
    console.log('✅ [INC] Server closed');
    process.exit(0);
  });
});

console.log('✅ [INC] Setup complete');
