// API Configuration - Centralized
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    // Use TypeScript backend REST endpoint for team login
    // Frontend will call: https://nuzantara-backend.fly.dev/api/auth/login
    login: '/api/auth/login',
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
    semanticSearch: '/search',
    hybridQuery: '/search',
    // documentIntelligence: '/ai/creative/vision' // TODO: Endpoint not implemented
  },

  // Notifications
  notifications: {
    list: '/api/notifications/status',
    markRead: '/api/notifications/send'
  },

  // Memory/Conversations
  memory: {
    save: '/api/bali-zero/conversations/save',
    history: '/api/bali-zero/conversations/history',
    stats: '/api/bali-zero/conversations/stats',
    clear: '/api/bali-zero/conversations/clear'
  },

  // Integrations
  integrations: {
    gmail: '/google/gmail/list',
    calendar: '/google/calendar/list',
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

export const API_CONFIG = {
  backend: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-backend.fly.dev'  // FIXED: Use TypeScript backend for CRM, agents, etc.
  },
  rag: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://nuzantara-rag.fly.dev'
  },
  memory: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-memory.fly.dev'
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
  return `${baseUrl}${endpoint}`;
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
    const response = await fetch(`${API_CONFIG.backend.url}/api/csrf-token`, {
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
          // It was a valid JSON string but not an object? Or just a string that looked like JSON?
          token = parsed; 
        }
      } catch (e) {
        // Not JSON, assume legacy plain string
        token = tokenData;
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
