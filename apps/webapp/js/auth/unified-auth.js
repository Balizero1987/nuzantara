/**
 * ZANTARA Unified Authentication Service
 *
 * Unifies authentication systems:
 * 1. Team Login (email + PIN) → /auth/login
 * 2. Auto token refresh
 *
 * Features:
 * - Centralized token management
 * - Automatic token refresh
 * - Compatible with existing localStorage schema
 * - Uses API_CONFIG for proper URL resolution
 */

import { API_CONFIG } from '../api-config.js';

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

      // Detect strategy from token
      if (this.token?.token) {
        this.strategy = this.token.token.startsWith('demo_') ? 'demo' : 'team';
      }

      if (this.user) {
        console.log(`✅ Auth loaded: ${this.user.name} (${this.strategy} strategy)`);
      }
    } catch (error) {
      console.error('❌ Failed to load auth data:', error);
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
    return this.token && this.user && !this.isTokenExpired();
  }

  /**
   * Check if token is expired
   */
  isTokenExpired() {
    if (!this.token?.expiresAt) {
      return false; // No expiry = never expires
    }
    return this.token.expiresAt < Date.now();
  }

  /**
   * Get current authentication strategy
   */
  getStrategy() {
    return this.strategy;
  }

  // ========================================================================
  // TOKEN MANAGEMENT
  // ========================================================================

  /**
   * Get current token (auto-refresh if needed)
   */
  async getToken() {
    // Check if we have a token
    if (!this.token) {
      console.warn('⚠️ No token available');
      return null;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      console.log('🔄 Token expired, attempting refresh...');

      try {
        await this.refreshToken();
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        return null;
      }
    }

    return this.token.token;
  }

  /**
   * Refresh token (strategy-specific)
   */
  async refreshToken() {
    if (!this.strategy) {
      throw new Error('No authentication strategy available');
    }

    if (this.strategy === 'demo') {
      // Demo tokens don't need refresh (or re-login with same userId)
      console.log('ℹ️ Demo token refresh not needed');
      return this.token.token;
    }

    if (this.strategy === 'team') {
      // Team tokens: need to re-authenticate
      // For now, just extend expiry (in production, implement proper refresh endpoint)
      console.warn('⚠️ Team token refresh not fully implemented - extending expiry');
      this.token.expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // +7 days
      this.saveToStorage();
      return this.token.token;
    }
  }

  // ========================================================================
  // TEAM LOGIN (Email + PIN)
  // ========================================================================

  /**
   * Login with team credentials
   * @param {string} email - Team member email
   * @param {string} pin - 4-8 digit PIN
   * @returns {Promise<Object>} User data
   */
  async loginTeam(email, pin) {
    try {
      console.log('🔐 Team login attempt:', email);

      const response = await fetch(`${API_CONFIG.backend.url}/api/auth/team/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: email.split('@')[0],
          email,
          pin
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Extract data
      const { data } = result;

      // Store auth data
      this.token = {
        token: data.token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      };
      this.user = data.user;
      this.session = {
        id: data.sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      this.permissions = data.permissions || [];
      this.strategy = 'team';

      // Save to localStorage
      this.saveToStorage();

      console.log(`✅ Team login successful: ${this.user.name}`);
      return data;

    } catch (error) {
      console.error('❌ Team login failed:', error);
      throw error;
    }
  }

  // ========================================================================
  // DEMO LOGIN (UserID)
  // ========================================================================

  /**
   * Login with user credentials
   * @param {string} userId - User ID (default: 'demo')
   * @returns {Promise<Object>} User data
   */
  async loginDemo(userId = 'demo') {
    try {
      console.log('🔐 Login attempt:', userId);

      const response = await fetch(`${API_CONFIG.rag.url}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userId, password: 'default' }),
      });

      if (!response.ok) {
        throw new Error(`Demo auth failed: ${response.status}`);
      }

      const data = await response.json();

      // Store auth data
      this.token = {
        token: data.token,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
      };
      this.user = {
        id: data.userId,
        name: `Demo User (${userId})`,
        email: `${userId}@demo.zantara.io`,
        role: 'Demo',
      };
      this.session = {
        id: `session_${Date.now()}_${userId}`,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      this.permissions = ['read'];
      this.strategy = 'demo';

      // Save to localStorage
      this.saveToStorage();

      console.log(`✅ Demo login successful: ${userId}`);
      return { user: this.user, token: this.token.token };

    } catch (error) {
      console.error('❌ Demo login failed:', error);

      // Fallback to local demo token
      console.log('⚠️ Using fallback demo token');
      this.token = { token: 'demo-token', expiresAt: null };
      this.user = {
        id: userId,
        name: `Demo User (${userId})`,
        email: `${userId}@demo.zantara.io`,
        role: 'Demo',
      };
      this.session = {
        id: `session_${Date.now()}_${userId}`,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };
      this.permissions = ['read'];
      this.strategy = 'demo';

      this.saveToStorage();
      return { user: this.user, token: this.token.token };
    }
  }

  // ========================================================================
  // LOGOUT
  // ========================================================================

  /**
   * Logout - clear all auth data
   */
  async logout() {
    try {
      // If team strategy, notify backend
      if (this.strategy === 'team' && this.session?.id) {
        await fetch(`${API_CONFIG.backend.url}/api/team/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token?.token}`,
          },
          body: JSON.stringify({
            sessionId: this.session.id,
          }),
        }).catch(err => console.warn('Logout notification failed:', err));
      }

      // Clear all data
      this.clearStorage();

      console.log('✅ Logout successful');

    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local data even if backend call fails
      this.clearStorage();
    }
  }

  // ========================================================================
  // USER INFO GETTERS (Compatible with UserContext)
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

  getSessionId() {
    return this.session?.id || null;
  }

  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('all');
  }

  /**
   * Update last activity timestamp
   */
  updateActivity() {
    if (this.session) {
      this.session.lastActivity = Date.now();
      localStorage.setItem('zantara-session', JSON.stringify(this.session));
    }
  }

  // ========================================================================
  // AUTHORIZATION HEADER (for API calls)
  // ========================================================================

  /**
   * Get Authorization header value
   * @returns {Promise<string|null>} "Bearer <token>" or null
   */
  async getAuthHeader() {
    const token = await this.getToken();
    return token ? `Bearer ${token}` : null;
  }
}

// Create singleton instance
const unifiedAuth = new UnifiedAuth();

// Export singleton
export { unifiedAuth };
export default unifiedAuth;

// Expose globally for backward compatibility
if (typeof window !== 'undefined') {
  window.UnifiedAuth = unifiedAuth;
}
