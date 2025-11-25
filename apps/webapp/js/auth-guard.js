/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Uses ZANTARA token format (zantara-*)
 * Robust version to prevent crashes on malformed data
 */

(function() {
  // Configuration
  const PROTECTED_PAGES = ['/chat', '/chat.html', '/admin', '/dashboard'];
  const LOGIN_PAGE = '/login.html';
  
  // Safe logging
  const log = (msg, ...args) => console.log(`🛡️ [AuthGuard] ${msg}`, ...args);

  /**
   * Check if user is authenticated
   */
  function checkAuth() {
    const currentPage = window.location.pathname;
    
    // Skip check on non-protected pages
    const isProtected = PROTECTED_PAGES.some(page => 
      currentPage.includes(page) || currentPage.endsWith(page)
    );
    
    if (!isProtected) return true;

    try {
      // 1. Check Token Existence
      const tokenData = localStorage.getItem('zantara-token');
      if (!tokenData) {
        log('No token found. Redirecting...');
        redirectToLogin();
        return false;
      }

      // 2. Parse Token (Handle both JSON object and legacy string)
      let token = null;
      let expiresAt = null;

      try {
        const parsed = JSON.parse(tokenData);
        if (typeof parsed === 'object' && parsed !== null) {
          // Standard object format
          token = parsed.token;
          expiresAt = parsed.expiresAt;
        } else {
          // Legacy/Plain string format (fallback)
          token = parsed; 
        }
      } catch (e) {
        // If not JSON, maybe it's a raw string?
        token = tokenData;
      }

      if (!token) {
        log('Invalid token format. Redirecting...');
        clearAuthData();
        redirectToLogin();
        return false;
      }

      // 3. Check Expiration
      if (expiresAt && Date.now() > expiresAt) {
        log('Token expired. Redirecting...');
        clearAuthData();
        redirectToLogin();
        return false;
      }

      log('✅ Authorized');
      return true;

    } catch (error) {
      console.warn('⚠️ Auth check error:', error);
      // Fail safe: don't redirect if it's just a runtime error, but maybe safe to stay? 
      // Better to redirect if unsure security-wise.
      redirectToLogin();
      return false;
    }
  }

  function clearAuthData() {
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-permissions');
  }

  function redirectToLogin() {
    // Prevent redirect loop
    if (window.location.pathname.includes('login')) return;
    
    window.location.href = LOGIN_PAGE;
  }

  // Expose helpers globally
  window.checkAuth = checkAuth;
  window.clearAuthData = clearAuthData;
  window.getAuthToken = function() {
    try {
      const data = localStorage.getItem('zantara-token');
      if (!data) return null;
      const parsed = JSON.parse(data);
      return parsed.token || null;
    } catch (e) { return null; }
  };

  // Execute immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }

})();
