// ZANTARA API Configuration
// ES6 Module export for use with import statements
// Also maintains window.API_CONFIG for backward compatibility

const API_CONFIG = {
  // Backend API (RAG service)
  backend: {
    url: (typeof window !== 'undefined' && (window.API_CONFIG?.backend?.url || localStorage.getItem('zantara-backend-url'))) || 'https://nuzantara-rag.fly.dev'
  },
  
  // RAG service (same as backend for now)
  rag: {
    url: (typeof window !== 'undefined' && (window.API_CONFIG?.rag?.url || localStorage.getItem('zantara-rag-url'))) || 'https://nuzantara-rag.fly.dev'
  },
  
  // Memory service
  memory: {
    url: (typeof window !== 'undefined' && (window.API_CONFIG?.memory?.url || localStorage.getItem('zantara-memory-url'))) || 'https://nuzantara-rag.fly.dev'
  },
  
  // Mode: 'proxy' in production (recommended), 'direct' only for local/dev
  mode: 'proxy', // prod default: proxy-first (LIVE)
  
  // Proxy/BFF endpoints (server-side adds x-api-key, client sends x-user-id)
  proxy: {
    production: {
      // Default to the provided Cloud Run proxy; still overridable via window/localStorage
      base: (typeof window !== 'undefined' && (window.ZANTARA_PROXY_BASE || localStorage.getItem('zantara-proxy-base'))) || 'https://nuzantara-backend.fly.dev/api/zantara',
      call: '/call',
      ai: '/ai.chat',
      aiStream: '/ai.chat.stream',
      pricingOfficial: '/pricing.official',
      priceLookup: '/price.lookup',
      health: '/health'
    }
  },
  
  // Direct endpoints (Cloud Run) — used only when explicitly forced in dev
  production: {
    base: 'https://nuzantara-backend.fly.dev',
    call: '/call',
    health: '/health'
  },
  
  // Streaming configuration
  streaming: {
    path: '/chat' // NDJSON endpoint (proxied as /api/zantara/chat)
  },
  
  // Default headers (client)
  headers: { 'Content-Type': 'application/json' }
};

// ES6 Module Export - REQUIRED for import statements
export { API_CONFIG };

// Also expose on window for backward compatibility with non-module scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  
  // Allow base override via global or localStorage for flexibility
  try {
    const overrideBase = window.ZANTARA_API_BASE || localStorage.getItem('zantara-api-base');
    if (overrideBase && typeof overrideBase === 'string') {
      API_CONFIG.production.base = overrideBase;
    }
  } catch (_) {}
}

