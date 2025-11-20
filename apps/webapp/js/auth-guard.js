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
  // Verify authentication with backend (cookie sent automatically)
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('⚠️  Authentication check failed');
      clearAuthData();
      redirectToLogin();
      return false;
    }

    const result = await response.json();
    
    if (result.ok && result.data?.authenticated) {
      console.log('✅ Authentication verified (httpOnly cookie)');
      // Store user info in localStorage for quick access (not sensitive)
      if (result.data.user) {
        localStorage.setItem('zantara-user', JSON.stringify(result.data.user));
      }
      return true;
    } else {
      console.log('⚠️  Not authenticated');
      clearAuthData();
      redirectToLogin();
      return false;
    }
  } catch (error) {
    console.warn('⚠️  Backend verification failed:', error.message);
    clearAuthData();
    redirectToLogin();
    return false;
  }
}

function clearAuthData() {
  // Clear localStorage (user info only, token is in httpOnly cookie)
  localStorage.removeItem('zantara-user');
  localStorage.removeItem('zantara-session');
  localStorage.removeItem('zantara-permissions');
  // Note: zantara-token cookie is cleared by backend on logout
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
  // Token is in httpOnly cookie, not accessible from JavaScript
  // Return null - token is automatically sent with requests via credentials: 'include'
  return null;
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
