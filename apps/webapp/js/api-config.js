// API Configuration - Centralized
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    // Primary login endpoint - consolidated from multiple redundant routes
    // Frontend will call: /api/auth/team/login (proxied by nginx to backend)
    teamLogin: '/api/auth/team/login',
    check: '/api/user/profile',
    logout: '/api/auth/logout',
    profile: '/api/user/profile'
  },

  // CRM System
  crm: {
    clients: '/api/crm/clients',
    clientsCreate: '/api/crm/clients',
    interactions: '/api/crm/interactions',
    practices: '/api/crm/practices',
    analytics: '/api/crm/analytics',
    sharedMemory: '/api/crm/shared-memory'
  },

  // System Handlers
  system: {
    call: '/call'  // RPC-style endpoint (not v3)
  },

  // Agents
  agents: {
    compliance: '/api/agents/compliance/alerts',
    journey: '/api/agents/journey/{journey_id}/next-steps',
    research: '/api/autonomous-agents/conversation-trainer/run',
    semanticSearch: '/api/search',
    hybridQuery: '/api/search',
  },

  // Team Analytics - REMOVED: Endpoints not implemented in backend
  // team: { ... }

  // Notifications - REMOVED: Endpoints not implemented (use WebSocket instead)
  // notifications: { ... }

  // Memory/Conversations - REMOVED: Use /api/persistent-memory/* or memory-service directly
  // memory: { ... }

  // Integrations
  integrations: {
    gmail: '/api/gmail/list',
    calendar: '/api/calendar/list',
    twitter: '/api/translate/text'
  },

  // RAG/Knowledge Base
  rag: {
    query: '/api/oracle/query',
    collections: '/api/oracle/collections',
    files: '/api/handlers/list',
    upload: '/api/oracle/ingest'
  }
};

// Get API URL from environment config (injected by Docker) or fallback to defaults
const getApiBaseUrl = () => {
  // Priority 1: Use window.ENV.API_URL if set (from config.js injected by Docker)
  // If API_URL is a relative path like "/api", use it as-is (will be relative to current origin)
  // If API_URL is empty string, treat as "not set" and use fallback
  if (typeof window !== 'undefined' && window.ENV && window.ENV.API_URL) {
    const apiUrl = window.ENV.API_URL.trim();
    // Empty string should be treated as "not set" - skip to fallback
    if (apiUrl === '') {
      // Skip to fallback below
    } else if (apiUrl.startsWith('/')) {
      // Relative path - use as-is (browser will resolve relative to origin)
      return apiUrl; // Relative URL like "/api" - browser will make it relative to origin
    } else if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
      // Full URL - use directly
      return apiUrl;
    } else if (apiUrl === '/') {
      // Just "/" - use origin (though this is unusual)
      return window.location.origin;
    } else {
      // Default: treat as relative path
      return apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`;
    }
  }
  
  // Priority 2: Localhost detection for development
  if (window.location.hostname === 'localhost') {
    return window.location.origin; // Use same origin (localhost:port)
  }
  
  // Priority 3: Default production (fallback) - use relative /api
  return '/api'; // Relative URL, proxied by nginx
};

const apiBaseUrl = getApiBaseUrl();

export const API_CONFIG = {
  backend: {
    url: apiBaseUrl
  },
  rag: {
    url: apiBaseUrl
  },
  memory: {
    url: apiBaseUrl
  },
  // Request configuration
  timeouts: {
    default: 30000,
    auth: 10000,
    streaming: 120000,
    upload: 300000
  },
  retries: {
    maxAttempts: 3,
    backoffMs: 1000
  },
  endpoints: API_ENDPOINTS // Included directly for module usage
};

// API Endpoints are defined above and included in API_CONFIG

// Helper: Get full URL for endpoint
export function getEndpointUrl(service, endpoint) {
  const baseUrl = API_CONFIG[service]?.url || API_CONFIG.backend.url;
  
  // If endpoint already starts with "/", it's an absolute path
  // For relative baseUrls (starting with "/"), if endpoint is absolute, use it directly
  if (endpoint.startsWith('/')) {
    // If baseUrl is also a relative path (like "/api"), check if endpoint already includes it
    if (baseUrl.startsWith('/')) {
      // If endpoint starts with baseUrl, use endpoint as-is (already correct)
      // Otherwise, endpoint is absolute from root, use it directly
      return endpoint;
    }
    // baseUrl is a full URL, append endpoint
    return `${baseUrl}${endpoint}`;
  }
  
  // Endpoint is relative, append to baseUrl
  if (baseUrl.startsWith('/')) {
    return `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${endpoint}`;
  }
  
  // Full URL baseUrl with relative endpoint
  return `${baseUrl}/${endpoint}`;
}

// CSRF Token Management
let csrfToken = null;
let sessionId = null;

// Initialize CSRF token from storage or fetch new one
export function initializeCsrfTokens() {
  try {
    csrfToken = localStorage.getItem('zantara-csrf-token');
    sessionId = localStorage.getItem('zantara-session-id');

    // If no tokens exist, fetch new ones
    if (!csrfToken || !sessionId) {
      fetchCsrfTokens();
    }
  } catch (error) {
    console.warn('Failed to initialize CSRF tokens:', error);
    fetchCsrfTokens();
  }
}

// Fetch new CSRF tokens from backend
export async function fetchCsrfTokens() {
  try {
    // Build URL: if baseUrl already ends with /api, don't add it again
    const baseUrl = API_CONFIG.backend.url || '/api';
    const endpoint = baseUrl.endsWith('/api') ? '/csrf-token' : '/api/csrf-token';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      csrfToken = data.csrfToken || response.headers.get('X-CSRF-Token');
      sessionId = data.sessionId || response.headers.get('X-Session-Id');

      if (csrfToken && sessionId) {
        localStorage.setItem('zantara-csrf-token', csrfToken);
        localStorage.setItem('zantara-session-id', sessionId);
        console.log('✅ CSRF tokens initialized');
      }
    }
  } catch (error) {
    console.warn('Failed to fetch CSRF tokens:', error);
  }
}

// Helper: Get auth headers with CSRF
export function getAuthHeaders() {
  try {
    const tokenData = localStorage.getItem('zantara-token');
    let token = null;

    if (tokenData) {
      try {
        // Try parsing as JSON (new format)
        const parsed = JSON.parse(tokenData);
        if (typeof parsed === 'object' && parsed !== null) {
          token = parsed.token;
        } else {
          // Invalid format - not an object (legacy string support removed for security)
          console.warn('Invalid token format in localStorage (not an object), clearing...');
          localStorage.removeItem('zantara-token');
          token = null;
        }
      } catch {
        // Invalid token format - clear and return empty headers
        console.warn('Invalid token format in localStorage (not valid JSON), clearing...');
        localStorage.removeItem('zantara-token');
        token = null;
      }
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization if token exists
    if (token && typeof token === 'string') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    if (sessionId) {
      headers['X-Session-Id'] = sessionId;
    }

    return headers;
  } catch (error) {
    console.warn('Failed to parse auth token:', error);
    return { 'Content-Type': 'application/json' };
  }
}

// Enhanced fetch with CSRF handling
export async function secureFetch(url, options = {}) {
  // Ensure we have CSRF tokens
  if (!csrfToken || !sessionId) {
    await fetchCsrfTokens();
  }

  const secureOptions = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, secureOptions);

    // Extract new CSRF tokens from response
    const newCsrfToken = response.headers.get('X-CSRF-Token');
    const newSessionId = response.headers.get('X-Session-Id');

    if (newCsrfToken) {
      csrfToken = newCsrfToken;
      localStorage.setItem('zantara-csrf-token', csrfToken);
    }

    if (newSessionId) {
      sessionId = newSessionId;
      localStorage.setItem('zantara-session-id', sessionId);
    }

    return response;
  } catch (error) {
    console.error('Secure fetch failed:', error);
    throw error;
  }
}

// Expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.API_ENDPOINTS = API_ENDPOINTS;
  window.getEndpointUrl = getEndpointUrl;
  window.getAuthHeaders = getAuthHeaders;
  window.initializeCsrfTokens = initializeCsrfTokens;
  window.fetchCsrfTokens = fetchCsrfTokens;
  window.secureFetch = secureFetch;

  // Auto-initialize CSRF tokens when loaded
  initializeCsrfTokens();
}
