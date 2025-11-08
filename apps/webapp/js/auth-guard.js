/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Uses ZANTARA token format (zantara-*)
 */

const API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev';

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  // Get token from localStorage (ZANTARA format)
  const tokenData = localStorage.getItem('zantara-token');

  if (!tokenData) {
    console.log('⚠️  No auth token found');
    redirectToLogin();
    return false;
  }

  let token;
  try {
    const parsed = JSON.parse(tokenData);
    token = parsed.token;

    // Check if token is expired
    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      console.log('⚠️  Token expired');
      clearAuthData();
      redirectToLogin();
      return false;
    }
  } catch (error) {
    console.log('⚠️  Invalid token format');
    clearAuthData();
    redirectToLogin();
    return false;
  }

  if (!token) {
    console.log('⚠️  No token in data');
    redirectToLogin();
    return false;
  }

  try {
    console.log('🔐 Verifying auth token...');
    
    // Verify token with backend
    const response = await fetch(`${API_BASE_URL}/api/auth/check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (!response.ok || !result.ok || !result.data?.authenticated) {
      console.log('❌ Token invalid or expired');
      clearAuthData();
      redirectToLogin();
      return false;
    }

    // Token valid - update user data
    const user = result.data.user;
    localStorage.setItem('zantara-user', JSON.stringify(user));

    console.log('✅ Authentication verified:', user.email);
    return true;

  } catch (error) {
    console.error('❌ Auth check failed:', error);
    clearAuthData();
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
  const currentPage = window.location.pathname;
  if (currentPage.includes('login.html') || currentPage === '/') {
    return;
  }
  console.log('↩️  Redirecting to login...');
  window.location.href = '/login.html';
}

function getCurrentUser() {
  const userJson = localStorage.getItem('zantara-user');
  return userJson ? JSON.parse(userJson) : null;
}

function getAuthToken() {
  const tokenData = localStorage.getItem('zantara-token');
  if (!tokenData) return null;
  try {
    const parsed = JSON.parse(tokenData);
    return parsed.token;
  } catch (error) {
    return null;
  }
}

// Auto-run auth check on protected pages
if (typeof window !== 'undefined') {
  const currentPage = window.location.pathname;
  const publicPages = ['/', '/login.html', '/index.html'];
  
  if (!publicPages.includes(currentPage)) {
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
