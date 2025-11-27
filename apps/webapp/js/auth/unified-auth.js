/**
 * ZANTARA Unified Authentication Service
 *
 * Unifies authentication systems:
 * 1. Team Login (email + PIN) → /api/auth/team/login
 * 2. Auto token refresh
 * 3. Centralized localStorage management
 *
 * Features:
 * - Single source of truth for auth state
 * - Automatic token refresh (stubbed for now)
 * - Compatible with existing localStorage schema
 */

import { API_CONFIG, API_ENDPOINTS } from '../api-config.js';

class UnifiedAuth {
  constructor() {
    this.token = null;
    this.user = null;
    this.session = null;
    this.permissions = [];
    this.strategy = null; // 'team' | 'demo'

    // Auto-load from localStorage
    this.loadFromStorage();

    console.log('🔐 UnifiedAuth initialized');
  }

  // ========================================================================
  // STORAGE MANAGEMENT
  // ========================================================================

  /**
   * Load auth data from localStorage
   */
  loadFromStorage() {
    try {
      // Load token
      const tokenData = localStorage.getItem('zantara-token');
      if (tokenData) {
        this.token = JSON.parse(tokenData);
      }

      // Load user
      const userData = localStorage.getItem('zantara-user');
      if (userData) {
        this.user = JSON.parse(userData);
      }

      // Load session
      const sessionData = localStorage.getItem('zantara-session');
      if (sessionData) {
        this.session = JSON.parse(sessionData);
      }

      // Load permissions
      const permissionsData = localStorage.getItem('zantara-permissions');
      if (permissionsData) {
        this.permissions = JSON.parse(permissionsData);
      }

      // Detect strategy
      if (this.token?.token) {
        this.strategy = this.token.token.startsWith('demo_') ? 'demo' : 'team';
      }

      if (this.isAuthenticated()) {
        console.log(`✅ Auth loaded: ${this.user?.name} (${this.strategy})`);
      } else {
        console.log('ℹ️ No active session found');
      }
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
      this.clearStorage();
    }
  }

  /**
   * Save auth data to localStorage
   */
  saveToStorage() {
    try {
      if (this.token) {
        localStorage.setItem('zantara-token', JSON.stringify(this.token));
      }
      if (this.user) {
        localStorage.setItem('zantara-user', JSON.stringify(this.user));
      }
      if (this.session) {
        localStorage.setItem('zantara-session', JSON.stringify(this.session));
      }
      if (this.permissions.length > 0) {
        localStorage.setItem('zantara-permissions', JSON.stringify(this.permissions));
      }
      console.log('✅ Auth data saved to localStorage');
    } catch (error) {
      console.error('❌ Failed to save auth data:', error);
    }
  }

  /**
   * Clear all auth data
   */
  clearStorage() {
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-permissions');

    this.token = null;
    this.user = null;
    this.session = null;
    this.permissions = [];
    this.strategy = null;

    console.log('✅ Auth data cleared');
  }

  // ========================================================================
  // AUTHENTICATION STATUS
  // ========================================================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!(this.token && this.token.token && !this.isTokenExpired());
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.token?.expiresAt) {
      return false; // No expiry = never expires (e.g. demo)
    }
    return Date.now() > this.token.expiresAt;
  }

  /**
   * Get current authentication strategy
   */
  getStrategy() {
    return this.strategy;
  }

  // ========================================================================
  // TEAM LOGIN (Email + PIN)
  // ========================================================================

  /**
   * Login with team credentials
   * Uses the robust /api/auth/team/login endpoint
   * @param {string} email - Team member email
   * @param {string} pin - 4-8 digit PIN
   * @returns {Promise<Object>} User data
   */
  async loginTeam(email, pin) {
    try {
      console.log('🔐 Team login attempt:', email);
      const baseUrl = API_CONFIG.backend.url || '/api';
      const endpoint = API_ENDPOINTS.auth.teamLogin || '/api/auth/team/login';
      
      // Build URL: if baseUrl is /api and endpoint starts with /api, use endpoint directly
      // This prevents /api + /api/auth/team/login = /api/api/auth/team/login
      let fullUrl;
      if (baseUrl === '/api' && endpoint.startsWith('/api')) {
        // baseUrl is /api, endpoint is /api/auth/team/login -> use endpoint directly
        fullUrl = endpoint;
      } else if (baseUrl.endsWith('/api') && endpoint.startsWith('/api/')) {
        // baseUrl ends with /api, endpoint starts with /api/ -> use endpoint directly
        fullUrl = endpoint;
      } else {
        // Normal concatenation
        fullUrl = `${baseUrl}${endpoint}`;
      }

      let response;
      try {
        response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            pin,
          }),
        });
      } catch (fetchError) {
        // Network error - backend not reachable
        const errorMessage = fetchError.message || 'Unknown network error';
        console.error('❌ Network error during login:', errorMessage);

        // Create a more descriptive error
        const networkError = new Error(
          'Unable to connect to server. Please check your internet connection or try again in a few seconds.'
        );
        networkError.name = 'NetworkError';
        networkError.originalError = fetchError;
        networkError.statusCode = null;
        throw networkError;
      }

      // Check if response is ok before trying to parse JSON
      let result;
      try {
        result = await response.json();
      } catch {
        // Server returned non-JSON response (likely HTML error page)
        console.error('❌ Invalid JSON response:', response.status, response.statusText);
        const serverError = new Error(
          'Server returned an invalid response. Please try again later.'
        );
        serverError.name = 'ServerError';
        serverError.statusCode = response.status;
        throw serverError;
      }

      // Handle HTTP error responses
      if (!response.ok || result.ok === false) {
        const statusCode = response.status;
        const errorMsg = result.error || result.message || 'Login failed';

        console.error(`❌ Login failed with status ${statusCode}:`, errorMsg);

        // Create error with appropriate message based on status code
        let userFriendlyMessage;
        if (statusCode === 401 || statusCode === 403) {
          userFriendlyMessage = 'Invalid email or PIN. Please try again.';
        } else if (statusCode === 500 || statusCode >= 502) {
          userFriendlyMessage = 'Server error. Please try again later.';
        } else if (statusCode === 429) {
          userFriendlyMessage = 'Too many attempts. Please wait a few minutes before trying again.';
        } else {
          userFriendlyMessage = errorMsg || 'Login error. Please try again.';
        }

        const httpError = new Error(userFriendlyMessage);
        httpError.name = 'HttpError';
        httpError.statusCode = statusCode;
        httpError.originalMessage = errorMsg;
        throw httpError;
      }

      // Extract data from standardized response structure: { ok: true, data: { ... } }
      // Fallback to direct properties if 'data' wrapper is missing
      const authData = result.data || result;

      if (!authData.token) {
        const tokenError = new Error('Server did not return a valid token. Please try again.');
        tokenError.name = 'TokenError';
        throw tokenError;
      }

      // Store auth data
      // Note: Backend sets httpOnly cookie, but we also store token for non-browser clients or easy access
      this.token = {
        token: authData.token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days default
      };

      this.user = authData.user || { email, name: email.split('@')[0] };

      this.session = {
        id: authData.sessionId || `session_${Date.now()}`,
        createdAt: authData.loginTime || Date.now(),
        lastActivity: Date.now(),
      };

      this.permissions = authData.permissions || [];
      this.strategy = 'team';

      // Save to localStorage
      this.saveToStorage();

      console.log(`✅ Team login successful: ${this.user.name}`);
      return this.user;
    } catch (error) {
      // If error already has a user-friendly message, just re-throw it
      if (
        error.name === 'NetworkError' ||
        error.name === 'HttpError' ||
        error.name === 'TokenError' ||
        error.name === 'ServerError'
      ) {
        throw error;
      }

      // For any other unexpected errors, provide a generic message
      console.error('❌ Unexpected error during login:', error);
      const unexpectedError = new Error('Unexpected error during login. Please try again.');
      unexpectedError.name = 'UnexpectedError';
      unexpectedError.originalError = error;
      throw unexpectedError;
    }
  }

  // ========================================================================
  // TOKEN & HEADER MANAGEMENT
  // ========================================================================

  /**
   * Get current token string
   */
  getToken() {
    if (this.isAuthenticated()) {
      return this.token.token;
    }
    return null;
  }

  /**
   * Get Authorization header value
   * @returns {string|null} "Bearer <token>" or null
   */
  getAuthHeader() {
    const token = this.getToken();
    return token ? `Bearer ${token}` : null;
  }

  // ========================================================================
  // USER INFO GETTERS
  // ========================================================================

  getUser() {
    return this.user;
  }
  getName() {
    return this.user?.name || 'Guest';
  }
  getEmail() {
    return this.user?.email || '';
  }
  getRole() {
    return this.user?.role || 'User';
  }
}

// Create singleton instance
const unifiedAuth = new UnifiedAuth();

// Export singleton
export { unifiedAuth };
export default unifiedAuth;

// Expose globally for debugging/legacy
if (typeof window !== 'undefined') {
  window.UnifiedAuth = unifiedAuth;
}
