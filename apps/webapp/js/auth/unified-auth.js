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
      const baseUrl = API_CONFIG.backend.url;
      const endpoint = API_ENDPOINTS.auth.teamLogin || '/api/auth/team/login';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          pin
        }),
      });

      const result = await response.json();

      if (!response.ok || (result.ok === false)) {
        throw new Error(result.error || result.message || 'Login failed');
      }

      // Extract data from standardized response structure: { ok: true, data: { ... } }
      // Fallback to direct properties if 'data' wrapper is missing
      const authData = result.data || result;

      if (!authData.token) {
        throw new Error('Server returned success but no token found.');
      }

      // Store auth data
      // Note: Backend sets httpOnly cookie, but we also store token for non-browser clients or easy access
      this.token = {
        token: authData.token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days default
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
      console.error('❌ Team login failed:', error);
      throw error;
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

  getUser() { return this.user; }
  getName() { return this.user?.name || 'Guest'; }
  getEmail() { return this.user?.email || ''; }
  getRole() { return this.user?.role || 'User'; }
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
