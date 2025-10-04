import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Bridge from './bridge.js';
import dispatchRouter from './routes/dispatch.js';
import folderAccessRouter from './routes/folder-access.js';
import chatRouter from './routes.js';
import memoryRouter from './memory_routes.js';
import sheetsRouter from './routes/sheets.js';
import customGptRouter from './routes/custom-gpt.js';
import { handleChatBotEvent } from './chatbot.js';
import { handleChatWebhook } from './routes/google-chat.js';
import { cache } from './cache.js';
import ZantaraRateLimiter from './rate-limiter.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// 🚦 RATE LIMITING - Protect against spam and control costs
app.use('/call', ZantaraRateLimiter.getSmartLimiter('/call'));
app.use('/ai', ZantaraRateLimiter.aiRateLimit);
app.use('/openai', ZantaraRateLimiter.aiRateLimit);
app.use('/claude', ZantaraRateLimiter.aiRateLimit);
app.use('/gemini', ZantaraRateLimiter.aiRateLimit);
app.use('/slack', ZantaraRateLimiter.webhookRateLimit);
app.use('/discord', ZantaraRateLimiter.webhookRateLimit);
app.use('/googlechat', ZantaraRateLimiter.webhookRateLimit);
app.use('/calendar', ZantaraRateLimiter.dataRateLimit);
app.use('/drive', ZantaraRateLimiter.dataRateLimit);
app.use('/memory', ZantaraRateLimiter.dataRateLimit);
// General rate limit for all other endpoints
app.use(ZantaraRateLimiter.generalRateLimit);
console.log('🚦 Rate limiting enabled for all endpoints');
// Singleton bridge - will be initialized asynchronously
let bridge = null;
// Initialize everything asynchronously
async function initializeServices() {
    // Initialize OAuth2 handlers first (if available)
    try {
        const oauth2Module = './oauth2-integration.js';
        const { initOAuth2 } = await import(oauth2Module);
        await initOAuth2();
        console.log('✅ OAuth2 Drive/Calendar initialized');
    }
    catch (error) {
        console.log('⚠️ OAuth2 Drive/Calendar not available - using direct handlers');
    }
    // Gmail OAuth2 is handled by the main OAuth2 integration
    // No separate initialization needed
    // Initialize Bridge
    try {
        bridge = new Bridge();
        console.log('✅ Bridge initialized successfully');
    }
    catch (error) {
        console.error('⚠️ Bridge initialization error:', error.message);
        // Bridge should always initialize, even without credentials (OAuth2 mode)
        // If it failed, there's a code issue that needs fixing
        console.error('❌ Critical: Bridge failed to initialize');
        console.error('Stack:', error.stack);
        // Create a minimal bridge instance to prevent 503 errors
        bridge = new Bridge();
    }
}
// Start initialization
initializeServices().catch(console.error);
// Middleware to inject bridge instance into requests
app.use((req, _res, next) => {
    req.bridge = bridge;
    next();
});
// Mount dispatch router
app.use('/', dispatchRouter);
// Mount folder access router
app.use('/api/folder-access', folderAccessRouter);
// Mount Google Chat routes
app.use('/', chatRouter);
// Mount memory routes
app.use('/', memoryRouter);
// Mount Google Sheets routes
app.use('/api/sheets', sheetsRouter);
// Mount Custom GPT routes
app.use('/gpt', customGptRouter);
// Google Chat webhook endpoint
app.post('/chat/webhook', handleChatWebhook);
// Serve ZANTARA logo for Google Chat avatar
app.get('/assets/zantara-logo-512.png', (_req, res) => {
    const logoPath = join(__dirname, '..', 'assets', 'zantara-logo-512.png');
    res.sendFile(logoPath);
});
// Serve transparent ZANTARA logo
app.get('/assets/zantara-logo-transparent-512.png', (_req, res) => {
    const logoPath = join(__dirname, '..', 'assets', 'zantara-logo-transparent-512.png');
    res.sendFile(logoPath);
});
// Serve dashboard on root
app.get('/', (_req, res) => {
    // Return simple HTML response for now
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ZANTARA Bridge</title>
      <style>
        body { font-family: sans-serif; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        h1 { text-align: center; }
        .status { text-align: center; margin: 20px; }
        .endpoint { background: rgba(255,255,255,0.1); padding: 10px; margin: 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>🚀 ZANTARA Bridge v5.2.0</h1>
      <div class="status">
        <h2>✅ Server Running</h2>
        <p>Port: 8080</p>
      </div>
      <div class="endpoint">
        <h3>Available Endpoints:</h3>
        <ul>
          <li>GET /health - System health check</li>
          <li>POST /call - Handler execution</li>
          <li>GET /cache/stats - Cache statistics</li>
          <li>GET /rate-limit/stats - Rate limit stats</li>
        </ul>
      </div>
      <div class="endpoint">
        <p>📚 Documentation: /ENDPOINTS_DOCUMENTATION.md</p>
        <p>🔐 API Key required for /call endpoint</p>
      </div>
    </body>
    </html>
  `);
});
// Production-compatible health endpoint - works even if bridge fails
app.get('/health', (_req, res) => {
    const uptime = bridge?.metrics?.startedAt ? (Date.now() - bridge.metrics.startedAt) / 1000 : 0;
    res.json({
        status: 'HEALTHY',
        message: 'Zantara Enhanced Bridge',
        version: '5.2.0',
        timestamp: new Date().toISOString(),
        uptime,
        bridge: bridge ? 'initialized' : 'failed',
        environment: process.env.NODE_ENV || 'development'
    });
});
// Bridge status endpoint (for light bridge compatibility)
app.get('/bridge/status', (_req, res) => {
    if (!bridge) {
        return res.status(503).json({
            ok: false,
            service: 'zantara-enhanced-bridge',
            error: 'Bridge not initialized',
            timestamp: new Date().toISOString()
        });
    }
    res.json({
        ok: true,
        service: 'zantara-enhanced-bridge',
        startedAt: bridge.metrics.startedAt,
        uptimeMs: Date.now() - bridge.metrics.startedAt,
        calls: bridge.metrics.calls,
        dedupHits: bridge.metrics.dedupHits,
    });
});
// Serve static files (dashboard)
app.use(express.static(__dirname));

// ZANTARA Intelligence v6 - HTML Interface Routes
app.get('/zantara-intelligence-v6.html', (_req, res) => {
    try {
        const htmlContent = readFileSync(join(__dirname, 'zantara-intelligence-v6.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        res.status(404).send('ZANTARA Intelligence v6 interface not found');
    }
});

app.get('/zantara-conversation-demo.html', (_req, res) => {
    try {
        const htmlContent = readFileSync(join(__dirname, 'zantara-conversation-demo.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        res.status(404).send('ZANTARA Conversation Demo not found');
    }
});

app.get('/zantara-production.html', (_req, res) => {
    try {
        const htmlContent = readFileSync(join(__dirname, 'zantara-production.html'), 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        res.status(404).send('ZANTARA Production Landing Page not found');
    }
});
// OpenAPI documentation endpoints
app.get('/openapi.yaml', (_req, res) => {
    try {
        const openApiSpec = readFileSync(join(__dirname, '..', 'openapi-v520-custom-gpt.yaml'), 'utf8');
        res.setHeader('Content-Type', 'text/yaml');
        res.send(openApiSpec);
    }
    catch (error) {
        res.status(404).json({ error: 'OpenAPI spec not found' });
    }
});
app.get('/docs', (_req, res) => {
    const swaggerUI = `
<!DOCTYPE html>
<html>
<head>
  <title>Zantara Light Bridge API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin:0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '/openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(swaggerUI);
});
// Google Chat Bot webhook endpoint
app.post('/chatbot', handleChatBotEvent);
// 📊 MONITORING ENDPOINTS
app.get('/cache/stats', (req, res) => {
    res.json({
        cache: cache.getStats(),
        timestamp: new Date().toISOString(),
        service: 'zantara-cache'
    });
});
app.get('/cache/clear', async (req, res) => {
    await cache.clear();
    res.json({
        success: true,
        message: 'Cache cleared',
        timestamp: new Date().toISOString()
    });
});
app.get('/rate-limit/stats', (req, res) => {
    res.json({
        rateLimits: ZantaraRateLimiter.getStats(),
        security: ZantaraRateLimiter.getSuspiciousActivity(),
        timestamp: new Date().toISOString(),
        service: 'zantara-rate-limiter'
    });
});
// 🔐 AUTHENTICATION MIDDLEWARE
const authenticateAPIKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.API_KEY;
    // Skip auth in development mode if explicitly disabled
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
        return next();
    }
    if (!validApiKey) {
        console.error('⚠️ WARNING: API_KEY not configured in environment');
        return res.status(500).json({
            ok: false,
            error: 'SERVER_MISCONFIGURED',
            message: 'Authentication not properly configured'
        });
    }
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            ok: false,
            error: 'UNAUTHORIZED',
            message: 'Invalid or missing API key'
        });
    }
    next();
};
// ChatGPT Compatibility Endpoint - Supports both wrapped and direct parameters
app.post('/v1/api/handler', authenticateAPIKey, async (req, res) => {
    try {
        if (!bridge) {
            return res.status(503).json({ ok: false, error: 'bridge_not_available', message: 'Bridge service not initialized' });
        }

        // Extract handler key and parameters with flexibility
        const { key, params, ...directParams } = req.body || {};

        if (!key) {
            return res.status(400).json({ ok: false, error: 'key required' });
        }

        // Merge params: prefer explicit params object, fall back to direct params
        const finalParams = params || directParams;

        // Special handling for drive.upload to ensure compatibility
        if (key === 'drive.upload' && !params) {
            // ChatGPT sends fileName, mimeType, media, parents directly
            const { fileName, mimeType, media, parents, supportsAllDrives } = directParams;
            if (fileName || mimeType || media) {
                // Reconstruct in expected format
                const uploadParams = {
                    fileName: fileName,
                    mimeType: mimeType,
                    media: media,
                    parents: parents,
                    supportsAllDrives: supportsAllDrives
                };
                const out = await bridge.call({ key, params: uploadParams }, { retries: 2, timeoutMs: 30000 });
                return res.json(out);
            }
        }

        // Standard call
        const out = await bridge.call({ key, params: finalParams }, { retries: 2, timeoutMs: 30000 });
        res.json(out);
    } catch (e) {
        const status = e?.status || 500;
        res.status(status).json({ ok: false, error: e?.code || 'bridge_error', message: e?.message || 'failed' });
    }
});

app.post('/call', authenticateAPIKey, async (req, res) => {
    try {
        if (!bridge) {
            return res.status(503).json({ ok: false, error: 'bridge_not_available', message: 'Bridge service not initialized' });
        }
        const { key, params } = req.body || {};
        if (!key)
            return res.status(400).json({ ok: false, error: 'key required' });
        // 💾 CHECK CACHE FIRST for AI responses
        if (key.includes('ai.chat') || key.includes('openai.chat') || key.includes('claude.chat')) {
            const prompt = params?.messages?.[0]?.content || params?.prompt || '';
            if (prompt) {
                const cachedResponse = await cache.getAIResponse(prompt, key.split('.')[0]);
                if (cachedResponse) {
                    console.log(`🎯 Cache hit for ${key}: ${prompt.slice(0, 50)}...`);
                    return res.json(cachedResponse);
                }
            }
        }
        // 🔍 CHECK CACHE for memory searches
        if (key === 'memory.search' && params?.query) {
            const cachedResults = await cache.getMemorySearch(params.query);
            if (cachedResults) {
                console.log(`🎯 Memory search cache hit: ${params.query}`);
                return res.json(cachedResults);
            }
        }
        const idem = String(req.header('X-Idempotency-Key') || '');
        const out = await bridge.call({ key, params, idempotencyKey: idem || undefined }, { retries: 2, timeoutMs: 30000 });
        // 💾 CACHE THE RESPONSE
        if (out.ok && key.includes('ai.chat')) {
            const prompt = params?.messages?.[0]?.content || params?.prompt || '';
            if (prompt && out.result) {
                await cache.cacheAIResponse(prompt, out, key.split('.')[0]);
            }
        }
        if (out.ok && key === 'memory.search' && params?.query) {
            await cache.cacheMemorySearch(params.query, out);
        }
        res.json(out);
    }
    catch (e) {
        const status = e?.status || 500;
        res.status(status).json({ ok: false, error: e?.code || 'bridge_error', message: e?.message || 'failed' });
    }
});
const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
    console.log(`Zantara Light Bridge listening on ${port}`);
});
