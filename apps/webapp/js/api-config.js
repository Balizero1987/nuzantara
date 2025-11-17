// API Configuration - Centralized
export const API_CONFIG = {
  backend: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-rag.fly.dev'  // FIXED: Using RAG backend (backend service doesn't exist)
  },
  rag: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://nuzantara-rag.fly.dev'  // Python RAG backend for chat streaming and vector search
  },
  memory: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'  // Memory service local
      : 'https://nuzantara-memory.fly.dev'  // FIXED: Correct Memory Service URL
  },
  // Request configuration
  timeouts: {
    default: 30000,      // 30 seconds for standard API calls
    auth: 10000,         // 10 seconds for auth endpoints
    streaming: 120000,   // 2 minutes for streaming responses
    upload: 300000       // 5 minutes for file uploads
  },
  retries: {
    maxAttempts: 3,
    backoffMs: 1000     // Initial backoff delay
  }
};

// API Endpoints - New standardized paths
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    teamLogin: '/api/auth/team/login',
    check: '/api/auth/check',
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
  
  // Memory/Conversations
  memory: {
    save: '/api/conversations/save',
    history: '/api/conversations/history'
  },
  
  // Integrations
  integrations: {
    gmail: '/api/integrations/gmail/status',
    calendar: '/api/integrations/calendar/status',
    whatsapp: '/api/integrations/whatsapp/status',
    twitter: '/api/integrations/twitter/status'
  },
  
  // RAG/Knowledge Base
  rag: {
    query: '/api/query',
    collections: '/api/collections'
  }
};

// Helper: Get full URL for endpoint
export function getEndpointUrl(service, endpoint) {
  const baseUrl = API_CONFIG[service]?.url || API_CONFIG.backend.url;
  return `${baseUrl}${endpoint}`;
}

// Helper: Get auth headers
export function getAuthHeaders() {
  const tokenData = localStorage.getItem('zantara-token');
  if (!tokenData) {
    return { 'Content-Type': 'application/json' };
  }

  try {
    const parsed = JSON.parse(tokenData);
    return {
      'Authorization': `Bearer ${parsed.token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.warn('Failed to parse auth token:', error);
    return { 'Content-Type': 'application/json' };
  }
}

// Expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.API_ENDPOINTS = API_ENDPOINTS;
  window.getEndpointUrl = getEndpointUrl;
  window.getAuthHeaders = getAuthHeaders;
}
