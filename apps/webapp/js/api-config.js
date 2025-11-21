// API Configuration - Centralized
// API Configuration - Centralized
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    teamLogin: '/api/auth/team/login',
    check: '/auth/me',
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
    call: '/api/v3/zantara/handlers/call'
  },

  // Agents
  agents: {
    compliance: '/api/agents/compliance/alerts',
    journey: '/api/agents/journey/next-steps',
    research: '/api/agents/research/start',
    semanticSearch: '/api/agent/semantic_search',
    hybridQuery: '/api/agent/hybrid_query',
    documentIntelligence: '/api/agent/document_intelligence'
  },

  // Notifications
  notifications: {
    list: '/api/notifications',
    markRead: '/api/notifications/read'
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
    gmail: '/api/integrations/gmail/status',
    calendar: '/api/integrations/calendar/status',
    twitter: '/api/integrations/twitter/status'
  },

  // RAG/Knowledge Base
  rag: {
    query: '/api/query',
    collections: '/api/collections'
  }
};

export const API_CONFIG = {
  backend: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-rag.fly.dev'
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

// Helper: Get auth headers
// Helper: Get auth headers
export function getAuthHeaders() {
  try {
    const token = localStorage.getItem('zantara-token');
    if (token) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
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
