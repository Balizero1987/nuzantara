// API Configuration - Centralized
export const API_CONFIG = {
  backend: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-rag.fly.dev'  // FIXED: Use RAG backend for all API calls
  },
  rag: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://nuzantara-rag.fly.dev'
  },
  memory: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8081'  // Different port to avoid conflict with backend-ts
      : 'https://nuzantara-rag.fly.dev'  // FIXED: Memory service is part of RAG backend
  }
};

// API Endpoints - New standardized paths
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
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
  const token = localStorage.getItem('auth_token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

// Expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
  window.API_ENDPOINTS = API_ENDPOINTS;
  window.getEndpointUrl = getEndpointUrl;
  window.getAuthHeaders = getAuthHeaders;
}
