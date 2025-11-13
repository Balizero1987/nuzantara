/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 * Uses ZANTARA token format (zantara-*)
 * Includes circuit breaker to prevent infinite redirect loops
 */

const API_BASE_URL = window.API_CONFIG?.backend?.url || 'https://nuzantara-rag.fly.dev';

// Circuit breaker constants
const REDIRECT_KEY = 'zantara-redirect-attempt';
const MAX_REDIRECTS = 3;
const REDIRECT_TIMEOUT = 10000; // 10 seconds

/**
 * Check if user is authenticated
 */
async function checkAuth() {
  // CIRCUIT BREAKER: Check for redirect loops
  const redirectAttempt = localStorage.getItem(REDIRECT_KEY);
  if (redirectAttempt) {
    try {
      const { count, timestamp } = JSON.parse(redirectAttempt);
      const timeSinceFirst = Date.now() - timestamp;

      if (count >= MAX_REDIRECTS && timeSinceFirst < REDIRECT_TIMEOUT) {
        console.error('🚨 REDIRECT LOOP DETECTED in auth-guard - Clearing auth data');
        clearAuthData();
        localStorage.removeItem(REDIRECT_KEY);
        // Don't redirect, just show the current page
        return false;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Get token from localStorage (ZANTARA format)
  const tokenData = localStorage.getItem('zantara-token');

  if (!tokenData) {
    console.log('⚠️  No auth token found - redirecting to login');
    console.log('📍 Current page:', window.location.pathname);
    redirectToLogin();
    return false;
  }

  console.log('🔐 Token found, validating...');

  let token;
  try {
    const parsed = JSON.parse(tokenData);
    token = parsed.token;

    // Check if token is expired
    if (parsed.expiresAt && Date.now() >= parsed.expiresAt) {
      const expiredAt = new Date(parsed.expiresAt).toLocaleString();
      console.log('⚠️  Token expired at:', expiredAt);
      console.log('⏰ Current time:', new Date().toLocaleString());
      clearAuthData();
      redirectToLogin();
      return false;
    }

    // Log token validity
    if (parsed.expiresAt) {
      const remainingMs = parsed.expiresAt - Date.now();
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      console.log(`✅ Token valid for ${remainingHours} more hours`);
    }
  } catch (error) {
    console.log('⚠️  Invalid token format');
    clearAuthData();
    redirectToLogin();
    return false;
  }

  if (!token) {
    console.log('⚠️  No token in data - invalid token format');
    clearAuthData();
    redirectToLogin();
    return false;
  }

  // Token exists and not expired - user is authenticated
  // Clear redirect counter on successful auth
  localStorage.removeItem(REDIRECT_KEY);
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

  // Increment redirect counter
  let redirectData = { count: 1, timestamp: Date.now() };
  try {
    const existing = localStorage.getItem(REDIRECT_KEY);
    if (existing) {
      const parsed = JSON.parse(existing);
      redirectData.count = parsed.count + 1;
      redirectData.timestamp = parsed.timestamp;
    }
  } catch (e) {
    // Use defaults
  }

  localStorage.setItem(REDIRECT_KEY, JSON.stringify(redirectData));
  console.log(`↩️  Redirecting to login... (attempt ${redirectData.count})`);
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
  const publicPages = ['/', '/login', '/login.html', '/index.html', '/chat.html'];
  const protectedPages = ['/chat/index.html']; // Removed /chat.html to avoid redirect

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
