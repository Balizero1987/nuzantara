import 'dotenv/config';
import express from "express";
import { attachRoutes } from "./router.js";
import path from 'path';
import { fileURLToPath } from 'url';
// import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
// import yaml from 'js-yaml';

// Firebase Admin initialization
import { initializeApp, getApps, cert } from "firebase-admin/app";

// Function to get service account from Secret Manager
async function getServiceAccountFromSecret() {
  try {
    const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
    // Use ADC (Application Default Credentials) in Cloud Run
    const client = new SecretManagerServiceClient({
      projectId: process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0'
    });

    const projectId = process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0';
    const secretName = `projects/${projectId}/secrets/zantara-service-account-2025/versions/latest`;

    console.log('🔑 Accessing secret:', secretName);
    const [version] = await client.accessSecretVersion({ name: secretName });
    const secretPayload = version.payload?.data?.toString();

    if (secretPayload) {
      console.log('✅ Service account loaded from Secret Manager');
      return JSON.parse(secretPayload);
    }
    return null;
  } catch (error: any) {
    console.log('⚠️ Failed to get service account from Secret Manager:', error?.message || error);
    return null;
  }
}

// Initialize Firebase Admin
async function initializeFirebase() {
  try {
    if (getApps().length === 0) {
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT;
      const projectId = process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0';

      let serviceAccount = null;

      // Try to get from Secret Manager first
      serviceAccount = await getServiceAccountFromSecret();

      if (serviceAccount) {
        console.log('🔥 Using service account from Secret Manager');
      } else if (serviceAccountJson) {
        // Parse service account key from environment variable
        serviceAccount = JSON.parse(serviceAccountJson);
        console.log('🔥 Using service account from environment variable');
      } else if (credentials) {
        // Read service account key file
        serviceAccount = JSON.parse(readFileSync(credentials, 'utf8'));
        console.log('🔥 Using service account from file');
      }

      if (serviceAccount) {
        // Initialize with service account
        initializeApp({
          credential: cert(serviceAccount),
          projectId: projectId
        });
        console.log('🔥 Firebase Admin initialized with service account');
      } else {
        // Fallback initialization
        initializeApp({ projectId });
        console.log('🔥 Firebase Admin initialized with default settings');
      }
    }
  } catch (error: any) {
    console.log('⚠️ Firebase init error (continuing with mock):', error?.message || error);
    // Continue without Firebase for now
  }
}

// Initialize Firebase asynchronously
initializeFirebase().then(() => {
  console.log('🔥 Firebase initialization completed');
}).catch((error) => {
  console.log('⚠️ Firebase async init error:', error?.message || error);
});

// Rest of the code can continue synchronously

const app = express();
app.use(express.json({ limit: "10mb" }));

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
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
// === end CORS ===

// Production monitoring
import { requestTracker, errorTracker, getHealthMetrics } from './middleware/monitoring.js';
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
app.get('/health', async (req, res) => {
  const healthData = await getHealthMetrics();
  res.json({
    ...healthData,
    environment: {
      ragBackendUrl: process.env.RAG_BACKEND_URL || 'not-set',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

// Metrics endpoint for detailed monitoring
app.get('/metrics', async (req, res) => {
  const healthData = await getHealthMetrics();
  res.json({
    ok: true,
    data: healthData.metrics
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
  res.json({
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

// Default route for ZANTARA Intelligence
app.get('/', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '..', 'static', 'zantara-production.html'));
});

// Serve static files
app.use('/static', express.static(path.resolve(__dirname, '..', 'static')));

// 🚀 AI Model Proxy Endpoints for Cloud Run
// These endpoints proxy requests to different AI models with proper authentication

// Claude Proxy
app.post('/proxy/claude', async (req, res) => {
  try {
    const { message, temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!process.env.CLAUDE_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Claude API key not configured'
      });
    }

    // Forward to Claude handler
    const { claudeChat } = await import('./handlers/ai-services/ai.js');
    const result = await claudeChat({
      message,
      temperature,
      max_tokens
    });

    res.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('Claude proxy error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Claude proxy failed'
    });
  }
});

// Gemini Proxy
app.post('/proxy/gemini', async (req, res) => {
  try {
    const { message, temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Gemini API key not configured'
      });
    }

    // Forward to Gemini handler
    const { geminiChat } = await import('./handlers/ai-services/ai.js');
    const result = await geminiChat({
      message,
      temperature,
      max_tokens
    });

    res.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('Gemini proxy error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Gemini proxy failed'
    });
  }
});

// Cohere Proxy
app.post('/proxy/cohere', async (req, res) => {
  try {
    const { message, temperature = 0.7, max_tokens = 2000 } = req.body;

    if (!process.env.COHERE_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'Cohere API key not configured'
      });
    }

    // Forward to Cohere handler
    const { cohereChat } = await import('./handlers/ai-services/ai.js');
    const result = await cohereChat({
      message,
      temperature,
      max_tokens
    });

    res.json({ ok: true, data: result });
  } catch (error: any) {
    console.error('Cohere proxy error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Cohere proxy failed'
    });
  }
});

// Google Chat webhook endpoint (bot integration)
// app.post('/chat/webhook', verifyChatOIDC, handleChatWebhook);

// 🔧 Load all handlers using auto-registration system (TEMPORARILY DISABLED)
// import { loadAllHandlers } from './core/load-all-handlers.js';
// loadAllHandlers().then(stats => {
//   console.log('✅ Handler registry initialized:', stats);
// }).catch(err => {
//   console.error('❌ Handler loading failed:', err);
// });

attachRoutes(app);

// Error tracking middleware (must be after routes)
app.use(errorTracker);

// Unify on port 8080 by default
const port = Number(process.env.PORT || 8080);
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`🚀 ZANTARA v5.2.0 listening on :${port}`);
});

// Initialize WebSocket Server
import { initializeWebSocketServer } from './services/websocket-server.js';
const wsServer = initializeWebSocketServer(server);
console.log('✅ WebSocket server initialized on /ws');

// Global auto-load of handlers (enabled after WS/AI/Communication standardization)
try {
  const { loadAllHandlers } = await import('./core/load-all-handlers.js');
  await loadAllHandlers();
  console.log('🔄 All handler modules loaded via registry');
} catch (e: any) {
  console.warn('⚠️ Handler auto-load failed:', e?.message || e);
}

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);

  // Close HTTP server
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    console.log('✅ HTTP server closed');
  });

  // Clean up OAuth2 client
  try {
    const { cleanupOAuth2Client } = await import('./services/oauth2-client.js');
    cleanupOAuth2Client();
    console.log('✅ OAuth2 client cleaned up');
  } catch (error: any) {
    console.warn('⚠️ OAuth2 cleanup failed:', error.message);
  }

  // Shutdown WebSocket server
  if (wsServer) {
    wsServer.shutdown();
    console.log('✅ WebSocket server closed');
  }

  // Give the server time to close existing connections
  setTimeout(() => {
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  }, 1000);
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
