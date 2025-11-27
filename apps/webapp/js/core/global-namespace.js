/**
 * ZANTARA Global Namespace
 * Consolidates global variables into a single namespace
 *
 * Usage:
 * - window.ZANTARA.config - API configuration
 * - window.ZANTARA.auth - Authentication utilities
 * - window.ZANTARA.clients - API clients
 * - window.ZANTARA.utils - Utility functions
 */

// Initialize ZANTARA namespace if it doesn't exist
if (typeof window.ZANTARA === 'undefined') {
  window.ZANTARA = {};
}

// Configuration namespace
window.ZANTARA.config = {
  get API_CONFIG() {
    return window.API_CONFIG;
  },
  get API_ENDPOINTS() {
    return window.API_ENDPOINTS;
  },
  getEndpointUrl: window.getEndpointUrl || function() {},
};

// Authentication namespace
window.ZANTARA.auth = {
  get UserContext() {
    return window.UserContext;
  },
  get UnifiedAuth() {
    return window.UnifiedAuth;
  },
  checkAuth: window.checkAuth || function() {},
  clearAuthData: window.clearAuthData || function() {},
  getAuthToken: window.getAuthToken || function() {},
  getAuthHeaders: window.getAuthHeaders || function() {},
};

// Clients namespace
window.ZANTARA.clients = {
  get ZantaraClient() {
    return window.ZantaraClient;
  },
  get ConversationClient() {
    return window.CONVERSATION_CLIENT;
  },
  get UnifiedAPIClient() {
    return window.UnifiedAPIClient;
  },
  get SystemHandlersClient() {
    return window.SystemHandlersClient;
  },
  get AgentsClient() {
    return window.AgentsClient;
  },
  get CRMClient() {
    return window.CRMClient;
  },
  get CollectiveMemoryClient() {
    return window.CollectiveMemoryClient;
  },
};

// Utilities namespace
window.ZANTARA.utils = {
  initializeCsrfTokens: window.initializeCsrfTokens || function() {},
  fetchCsrfTokens: window.fetchCsrfTokens || function() {},
  secureFetch: window.secureFetch || function() {},
  get Logger() {
    return window.Logger;
  },
  get logger() {
    return window.logger;
  },
};

// PWA namespace
window.ZANTARA.pwa = {
  get installer() {
    return window.ZANTARA_PWA;
  },
};

// State namespace (for runtime state)
window.ZANTARA.state = {
  get availableTools() {
    return window.availableTools || [];
  },
  set availableTools(value) {
    window.availableTools = value;
  },
};

// Export for module systems
export default window.ZANTARA;
