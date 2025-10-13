import 'dotenv/config';
// import logger from 'from '../services/logger.js'';
import express from "express";
import { attachRoutes } from "./router.js";
import path from 'path';
import { fileURLToPath } from 'url';
// import swaggerUi from 'swagger-ui-express';
// import yaml from 'js-yaml';

import { ensureFirebaseInitialized } from './services/firebase.js';
import { correlationId } from './middleware/correlationId.js';
import { flagGate } from './middleware/flagGate.js';
import { getFlags, computeFlagsETag } from './config/flags.js';
import { buildBootstrapResponse } from './app-gateway/app-bootstrap.js';
import { handleAppEvent } from './app-gateway/app-events.js';

await ensureFirebaseInitialized().catch((error) => {
  logger.info('⚠️ Firebase initialization issue:', error?.message || error);
});

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(correlationId());

// === CORS for GitHub Pages + dev (Cloud Run) ===
// Configure allowed origins via env or use defaults
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://zantara.balizero.com,https://balizero1987.github.io,http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // Vary ensures proper caching per Origin
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-session-id, x-user-id');
  // Fast path for preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  return next();
});
// === end CORS ===

// Production monitoring
import { requestTracker, errorTracker, getHealthMetrics, getAlertStatus } from './middleware/monitoring.js';
import { validateResponse, getValidationReport, clearUnverifiedFacts } from './middleware/validation.js';
import { deepRealityCheck, getRealityMetrics, enforceReality, clearRealityCache } from './middleware/reality-check.js';
// Google Chat webhook (optional bot integration)
// import { handleChatWebhook } from './routes/google-chat.js';
// import { verifyChatOIDC } from './middleware/chat-oidc.js';
// Identity Gate removed - No longer needed for web app usage

app.use(requestTracker);
// app.use(identityGate()); // REMOVED: Identity verification no longer needed
app.use(validateResponse()); // Anti-hallucination validation
app.use(deepRealityCheck()); // Deep reality anchor system

// Enhanced health endpoint with metrics
app.get('/health', async (_req, res) => {
  const healthData = await getHealthMetrics();
  return res.json({
    ...healthData,
    ai_systems: {
      zantara: {
        model: 'llama-3.1-8b',
        status: process.env.RUNPOD_LLAMA_ENDPOINT ? 'active' : 'not-configured',
        endpoint: process.env.RUNPOD_LLAMA_ENDPOINT ? 'runpod' : 'hf-inference'
      },
      devai: {
        model: 'qwen-2.5-coder-7b',
        status: process.env.RUNPOD_QWEN_ENDPOINT ? 'active' : 'not-configured',
        endpoint: process.env.RUNPOD_QWEN_ENDPOINT ? 'runpod' : 'hf-inference',
        handlers: 7
      }
    },
    environment: {
      ragBackendUrl: process.env.RAG_BACKEND_URL || 'not-set',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Flags endpoint with ETag for caching in webapp
app.get('/config/flags', (req, res) => {
  const flags = getFlags();
  const etag = computeFlagsETag(flags);
  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Vary', 'Origin, If-None-Match');
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  return res.json({ ok: true, data: flags });
});

// Metrics endpoint for detailed monitoring
app.get('/metrics', async (_req, res) => {
  const healthData = await getHealthMetrics();
  return res.json({
    ok: true,
    data: healthData.metrics
  });
});

// Alert status endpoint
app.get('/alerts/status', async (_req, res) => {
  const alertStatus = getAlertStatus();
  return res.json({
    ok: true,
    data: alertStatus
  });
});

// Serve OpenAPI specifications
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// v1 - Legacy RPC-style for backwards compatibility (NO CUSTOM GPT - Direct API use only)
app.get('/openapi.yaml', (_req, res) => {
  try {
    const specPath = path.resolve(__dirname, '..', 'openapi-v520-legacy.yaml');
    res.setHeader('Content-Type', 'text/yaml');
    return res.sendFile(specPath);
  } catch (_e) {
    return res.status(404).json({ ok: false, error: 'OPENAPI_NOT_FOUND' });
  }
});

// v2 - Modern RESTful with proper operations (recommended for Actions/clients)
app.get('/openapi-v2.yaml', (_req, res) => {
  try {
    const specPath = path.resolve(__dirname, '..', 'static', 'openapi-v2.yaml');
    res.setHeader('Content-Type', 'text/yaml');
    return res.sendFile(specPath);
  } catch (_e) {
    return res.status(404).json({ ok: false, error: 'OPENAPI_V2_NOT_FOUND' });
  }
});

// Simple documentation placeholder (Swagger UI disabled for now)
app.get('/docs', (_req, res) => {
  return res.json({
    ok: true,
    message: 'API Documentation',
    version: '5.2.0',
    endpoints: {
      health: '/health - Health status',
      metrics: '/metrics - System metrics',
      call: '/call - RPC-style handler execution',
      openapi: '/openapi.yaml - OpenAPI specification'
    },
    note: 'Full Swagger UI documentation coming soon'
  });
});

// Anti-hallucination validation endpoints
app.get('/validation/report', getValidationReport);
app.post('/validation/clear', clearUnverifiedFacts);

// Reality anchor endpoints
app.get('/reality/metrics', getRealityMetrics);
app.post('/reality/enforce', enforceReality);
app.post('/reality/clear', clearRealityCache);

// Session management endpoints - REMOVED (Identity Gate no longer used)
// app.get('/session/status', sessionStatus);
// app.post('/session/clear', clearSession);
// app.get('/session/active', (req, res) => res.json({ ok: true, data: getActiveSessions() }));

// Dashboard UI
app.get('/dashboard', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'dashboard.html'));
});

// ZANTARA Intelligence v6 Interface Routes
app.get('/zantara-intelligence-v6.html', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'zantara-intelligence-v6.html'));
});

app.get('/zantara-conversation-demo.html', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'zantara-conversation-demo.html'));
});

app.get('/zantara-production.html', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'zantara-production.html'));
});

app.get('/devai-interface.html', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'devai-interface.html'));
});

// Default route for ZANTARA Intelligence
app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'zantara-production.html'));
});

// Serve static files
app.use('/static', express.static(path.resolve(__dirname, '..', 'static')));

// 🚀 AI Model Proxy Endpoints for Cloud Run
// These endpoints proxy requests to different AI models with proper authentication

// ZANTARA AI Proxy (Unified)
app.post('/proxy/zantara', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.ZANTARA_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'ZANTARA API key not configured'
      });
    }

    // Forward to ZANTARA AI handler (simplified - only one AI system)
    const { aiChat } = await import('./handlers/ai-services/ai.js');
    const result = await aiChat({
      prompt: message,
      model: 'zantara-llama'
    });

    return res.json({ ok: true, data: result });
  } catch (error: any) {
    logger.error('ZANTARA AI proxy error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'ZANTARA AI proxy failed'
    });
  }
});

// ZANTARA AI Proxy (Unified)
app.post('/proxy/zantara', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.ZANTARA_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'ZANTARA API key not configured'
      });
    }

    // Forward to ZANTARA AI handler (simplified - only one AI system)
    const { aiChat } = await import('./handlers/ai-services/ai.js');
    const result = await aiChat({
      prompt: message,
      model: 'zantara-llama'
    });

    return res.json({ ok: true, data: result });
  } catch (error: any) {
    logger.error('ZANTARA AI proxy error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'ZANTARA AI proxy failed'
    });
  }
});

// ZANTARA AI Proxy (Unified)
app.post('/proxy/zantara', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.ZANTARA_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'ZANTARA API key not configured'
      });
    }

    // Forward to ZANTARA AI handler (simplified - only one AI system)
    const { aiChat } = await import('./handlers/ai-services/ai.js');
    const result = await aiChat({
      prompt: message,
      model: 'zantara-llama'
    });

    return res.json({ ok: true, data: result });
  } catch (error: any) {
    logger.error('ZANTARA AI proxy error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'ZANTARA AI proxy failed'
    });
  }
});

// Google Chat webhook endpoint (bot integration)
// app.post('/chat/webhook', verifyChatOIDC, handleChatWebhook);

// 🔧 Load all handlers using auto-registration system (TEMPORARILY DISABLED)
// import { loadAllHandlers } from './core/load-all-handlers.js';
// loadAllHandlers().then(stats => {
//   logger.info('✅ Handler registry initialized:', stats);
// }).catch(err => {
//   logger.error('❌ Handler loading failed:', err);
// });

attachRoutes(app);

// Error tracking middleware (must be after routes)
app.use(errorTracker);

// Unify on port 8080 by default
const port = Number(process.env.PORT || 8080);
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  logger.info(`🚀 ZANTARA v5.2.0 listening on :${port}`);
});

// Initialize WebSocket Server
import { initializeWebSocketServer } from './services/websocket-server.js';
const wsServer = initializeWebSocketServer(server);
logger.info('✅ WebSocket server initialized on /ws');

// === App-Gateway (feature gated) ===
app.use('/app', flagGate('ENABLE_APP_GATEWAY'));

app.post('/app/bootstrap', async (req, res) => {
  try {
    const origin = req.headers.origin as string | undefined;
    const user = (req.headers['x-user-id'] as string) || undefined;
    const result = await buildBootstrapResponse({ user, origin });
    return res.json(result);
  } catch (e: any) {
    return res.status(500).json({ ok: false, code: 'bootstrap_failed', message: e?.message || 'unknown_error' });
  }
});

app.post('/app/event', async (req, res) => {
  try {
    const result = await handleAppEvent(req);
    const status = result?.ok ? 200 : 400;
    return res.status(status).json(result);
  } catch (e: any) {
    return res.status(500).json({ ok: false, code: 'event_failed', message: e?.message || 'unknown_error' });
  }
});

// Global auto-load of handlers (enabled after WS/AI/Communication standardization)
try {
  const { loadAllHandlers } = await import('./core/load-all-handlers.js');
  await loadAllHandlers();
  logger.info('🔄 All handler modules loaded via registry');
} catch (e: any) {
  logger.warn('⚠️ Handler auto-load failed:', e?.message || e);
}

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  logger.info(`\n🛑 Received ${signal}. Gracefully shutting down...`);

  // Close HTTP server
  server.close((err) => {
    if (err) {
      logger.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    logger.info('✅ HTTP server closed');
  });

  // Clean up OAuth2 client
  try {
    const { cleanupOAuth2Client } = await import('./services/oauth2-client.js');
    cleanupOAuth2Client();
    logger.info('✅ OAuth2 client cleaned up');
  } catch (error: any) {
    logger.warn('⚠️ OAuth2 cleanup failed:', error.message);
  }

  // Shutdown WebSocket server
  if (wsServer) {
    wsServer.shutdown();
    logger.info('✅ WebSocket server closed');
  }

  // Give the server time to close existing connections
  setTimeout(() => {
    logger.info('✅ Graceful shutdown complete');
    process.exit(0);
  }, 1000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
