/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Uses ZANTARA token format (zantara-*)
 */

const API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-backend.fly.dev';

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

  // Token exists and not expired - user is authenticated
  // For MVP: No backend verification (mock auth accepts any token)
  console.log('✅ Authentication verified (client-side)');
  return true;
}

function clearAuthData() {
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
  const publicPages = ['/', '/login', '/login.html', '/index.html'];

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
