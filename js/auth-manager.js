/**
 * ZANTARA Auth Manager
 * Gestione completa dell'autenticazione con supporto per mock e produzione
 */

class AuthManager {
  constructor() {
    this.API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev';
    this.IS_DEVELOPMENT = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.MOCK_MODE = this.IS_DEVELOPMENT; // Use mock auth in development
  }

  /**
   * Initialize authentication on page load
   */
  async init() {
    const currentPath = window.location.pathname;
    const isProtectedPage = this.isProtectedPage(currentPath);
    
    if (isProtectedPage) {
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        // Store intended destination
        sessionStorage.setItem('zantara-redirect-after-login', currentPath);
        this.redirectToLogin();
      }
    }
  }

  /**
   * Check if a page requires authentication
   */
  isProtectedPage(path) {
    const publicPages = [
      '/',
      '/index.html',
      '/login',
      '/login.html',
      '/register',
      '/register.html',
      '/forgot-password',
      '/forgot-password.html'
    ];
    
    // In development mode, allow chat.html without auth for testing
    if (this.IS_DEVELOPMENT) {
      publicPages.push('/chat.html');
    }
    
    return !publicPages.some(page => path === page || path.endsWith(page));
  }

  /**
   * Check if user is authenticated
   */
  async checkAuthentication() {
    // In mock mode, check for any token
    if (this.MOCK_MODE) {
      const token = this.getToken();
      if (token) {
        console.log('✅ Mock authentication: Token present');
        return true;
      }
      console.log('⚠️ Mock authentication: No token found');
      return false;
    }

    // Production mode: Verify token with backend
    try {
      const token = this.getToken();
      if (!token) {
        console.log('⚠️ No authentication token found');
        return false;
      }

      // Check token expiration
      const tokenData = this.getTokenData();
      if (tokenData?.expiresAt && Date.now() >= tokenData.expiresAt) {
        console.log('⚠️ Token expired');
        this.clearAuth();
        return false;
      }

      // Verify with backend (optional for MVP)
      // const response = await fetch(`${this.API_BASE_URL}/auth/verify`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // return response.ok;

      console.log('✅ Authentication verified');
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  /**
   * Login user
   */
  async login(email, password) {
    if (this.MOCK_MODE) {
      // Mock login for development
      console.log('🔐 Mock login for:', email);
      const mockUser = {
        id: 'mock-user-001',
        email: email,
        name: email.split('@')[0],
        role: 'user'
      };
      
      const mockToken = btoa(JSON.stringify({ 
        user: mockUser, 
        timestamp: Date.now() 
      }));
      
      this.setAuth(mockToken, mockUser);
      return { success: true, user: mockUser };
    }

    // Production login
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.setAuth(data.token, data.user);
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout user
   */
  logout() {
    this.clearAuth();
    this.redirectToLogin();
  }

  /**
   * Set authentication data
   */
  setAuth(token, user) {
    const tokenData = {
      token: token,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    localStorage.setItem('zantara-token', JSON.stringify(tokenData));
    localStorage.setItem('zantara-user', JSON.stringify(user));
    localStorage.setItem('zantara-session', JSON.stringify({
      startedAt: Date.now(),
      lastActivity: Date.now()
    }));
  }

  /**
   * Clear authentication data
   */
  clearAuth() {
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-permissions');
    sessionStorage.removeItem('zantara-redirect-after-login');
  }

  /**
   * Get token
   */
  getToken() {
    const tokenData = this.getTokenData();
    return tokenData?.token || null;
  }

  /**
   * Get token data
   */
  getTokenData() {
    try {
      const data = localStorage.getItem('zantara-token');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    try {
      const data = localStorage.getItem('zantara-user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Redirect to login page
   */
  redirectToLogin() {
    const currentPath = window.location.pathname;
    if (!currentPath.includes('login')) {
      window.location.href = '/login.html';
    }
  }

  /**
   * Redirect after successful login
   */
  redirectAfterLogin() {
    const redirectPath = sessionStorage.getItem('zantara-redirect-after-login');
    if (redirectPath) {
      sessionStorage.removeItem('zantara-redirect-after-login');
      window.location.href = redirectPath;
    } else {
      window.location.href = '/chat.html';
    }
  }
}

// Create global instance
window.authManager = new AuthManager();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.authManager.init());
} else {
  window.authManager.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
}
