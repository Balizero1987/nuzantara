/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Verifies JWT token with backend
 */

const API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-backend.fly.dev';

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    console.log('⚠️  No auth token found');
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
    localStorage.setItem('user', JSON.stringify(user));
    
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
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  localStorage.removeItem('auth_expires');
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
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

function getAuthToken() {
  return localStorage.getItem('auth_token');
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
