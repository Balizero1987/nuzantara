/**
 * ZANTARA User Context
 * Manages authenticated user state
 */

class UserContext {
  constructor() {
    this.user = null;
    this.token = null;
    this.session = null;
    this.permissions = [];

    this.loadFromStorage();
  }

  /**
   * Load user data from localStorage
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

      console.log('✅ User context loaded:', this.user?.name);
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  }

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
      return false;
    }
    return this.token.expiresAt < Date.now();
  }

  /**
   * Get user name
   */
  getName() {
    return this.user?.name || 'Guest';
  }

  /**
   * Get user role
   */
  getRole() {
    return this.user?.role || 'User';
  }

  /**
   * Get user language
   */
  getLanguage() {
    return this.user?.language || 'English';
  }

  /**
   * Get user email
   */
  getEmail() {
    return this.user?.email || '';
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.permissions.includes('all');
  }

  /**
   * Get JWT token for API calls
   */
  getToken() {
    return this.token?.token || null;
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.session?.id || null;
  }

  /**
   * Update last activity
   */
  updateActivity() {
    if (this.session) {
      this.session.lastActivity = Date.now();
      localStorage.setItem('zantara-session', JSON.stringify(this.session));
    }
  }

  /**
   * Logout - clear all data
   */
  logout() {
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-permissions');

    this.user = null;
    this.token = null;
    this.session = null;
    this.permissions = [];

    console.log('✅ User logged out');
  }
}

// Create global instance
window.UserContext = new UserContext();
