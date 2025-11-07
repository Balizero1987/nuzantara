/**
 * ZANTARA API Client
 * Helper functions for making authenticated API calls
 */

import { API_CONFIG, API_ENDPOINTS, getAuthHeaders } from './api-config.js';

/**
 * Make authenticated API call
 */
export async function apiCall(service, endpoint, options = {}) {
  const baseUrl = API_CONFIG[service]?.url || API_CONFIG.backend.url;
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: getAuthHeaders(),
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();
    
    // Check if token expired
    if (response.status === 401) {
      console.warn('⚠️  Token expired, redirecting to login');
      localStorage.clear();
      window.location.href = '/login.html';
      return null;
    }
    
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API call failed:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Save conversation to memory
 */
export async function saveConversation(userEmail, messages, metadata = {}) {
  return apiCall('rag', API_ENDPOINTS.memory.save, {
    method: 'POST',
    body: JSON.stringify({
      user_email: userEmail,
      messages,
      metadata
    })
  });
}

/**
 * Get conversation history
 */
export async function getConversationHistory(userEmail, limit = 20) {
  const params = new URLSearchParams({ user_email: userEmail, limit });
  return apiCall('rag', `${API_ENDPOINTS.memory.history}?${params}`);
}

/**
 * Get CRM clients
 */
export async function getCrmClients() {
  return apiCall('rag', API_ENDPOINTS.crm.clients);
}

/**
 * Create CRM client
 */
export async function createCrmClient(clientData) {
  return apiCall('rag', API_ENDPOINTS.crm.clients, {
    method: 'POST',
    body: JSON.stringify(clientData)
  });
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  return apiCall('backend', API_ENDPOINTS.auth.profile);
}

/**
 * Logout
 */
export async function logout() {
  const result = await apiCall('backend', API_ENDPOINTS.auth.logout, {
    method: 'POST'
  });
  
  // Clear local data
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_expires');
  
  // Redirect to login
  window.location.href = '/login.html';
  
  return result;
}

/**
 * Query RAG knowledge base
 */
export async function queryKnowledge(collection, query, limit = 5) {
  return apiCall('rag', API_ENDPOINTS.rag.query, {
    method: 'POST',
    body: JSON.stringify({ collection, query, limit })
  });
}

// Expose globally
if (typeof window !== 'undefined') {
  window.apiCall = apiCall;
  window.saveConversation = saveConversation;
  window.getConversationHistory = getConversationHistory;
  window.getCrmClients = getCrmClients;
  window.createCrmClient = createCrmClient;
  window.getUserProfile = getUserProfile;
  window.logout = logout;
  window.queryKnowledge = queryKnowledge;
}
