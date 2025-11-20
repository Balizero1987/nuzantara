/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Uses ZANTARA token format (zantara-*)
 */

const API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev';

/**
 * Check if user is authenticated
 * Uses httpOnly cookies - token is automatically sent by browser
 */
async function checkAuth() {
  // Check for token in localStorage (simple auth check)
  try {
    const tokenData = localStorage.getItem('zantara-token');
    
    if (!tokenData) {
      console.log('⚠️  No token found');
      redirectToLogin();
      return false;
    }

    const parsed = JSON.parse(tokenData);
    
    // Check if token is expired
    if (!parsed.token || !parsed.expiresAt || Date.now() >= parsed.expiresAt) {
      console.log('⚠️  Token expired');
      clearAuthData();
      redirectToLogin();
      return false;
    }

    console.log('✅ Authentication verified (valid token)');
    return true;
  } catch (error) {
    console.warn('⚠️  Auth check failed:', error.message);
    clearAuthData();
    redirectToLogin();
    return false;
  }
}

function clearAuthData() {
  // Clear all auth data from localStorage
  localStorage.removeItem('zantara-token');
  localStorage.removeItem('zantara-user');
  localStorage.removeItem('zantara-session');
  localStorage.removeItem('zantara-permissions');
}

function redirectToLogin() {
  const currentPage = window.location.pathname;
  if (currentPage.includes('login') || currentPage === '/') {
    return;
  }
  console.log('↩️  Redirecting to login...');
  window.location.href = '/login';
}

function getCurrentUser() {
  const userJson = localStorage.getItem('zantara-user');
  return userJson ? JSON.parse(userJson) : null;
}

function getAuthToken() {
  // Get token from localStorage
  try {
    const tokenData = localStorage.getItem('zantara-token');
    if (!tokenData) return null;
    
    const parsed = JSON.parse(tokenData);
    return parsed.token || null;
  } catch (error) {
    return null;
  }
}

// Auto-run auth check on protected pages
if (typeof window !== 'undefined') {
  const currentPage = window.location.pathname;
  const publicPages = ['/', '/login', '/login.html', '/index.html'];
  const protectedPages = ['/chat', '/chat.html'];

  // Only check auth on protected pages (explicit list to avoid loop)
  const isProtectedPage = protectedPages.some(page =>
    currentPage.includes(page) || currentPage.endsWith(page)
  );

  if (isProtectedPage) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
      checkAuth();
    }
  }
  
  window.checkAuth = checkAuth;
  window.getCurrentUser = getCurrentUser;
  window.getAuthToken = getAuthToken;
  window.clearAuthData = clearAuthData;
}
