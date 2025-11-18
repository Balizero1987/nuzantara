/**
 * ZANTARA Auth Guard
 * Protects pages that require authentication
 */

(function() {
  'use strict';

  console.log('🛡️ Auth Guard: Checking authentication...');

  // Check if token exists
  const tokenData = localStorage.getItem('zantara-token');

  if (!tokenData) {
    console.warn('⚠️ No token found - redirecting to login');
    redirectToLogin('No authentication token');
    return;
  }

  // Parse token
  let token;
  try {
    token = JSON.parse(tokenData);
  } catch (error) {
    console.error('❌ Invalid token format - redirecting to login');
    localStorage.removeItem('zantara-token');
    redirectToLogin('Invalid token');
    return;
  }

  // Check if token expired
  if (token.expiresAt && token.expiresAt < Date.now()) {
    console.warn('⚠️ Token expired - redirecting to login');
    clearAuth();
    redirectToLogin('Session expired');
    return;
  }

  // Check if user data exists
  const userData = localStorage.getItem('zantara-user');
  if (!userData) {
    console.warn('⚠️ No user data - redirecting to login');
    clearAuth();
    redirectToLogin('No user data');
    return;
  }

  console.log('✅ Auth Guard: Authentication valid');

  /**
   * Redirect to login page
   */
  function redirectToLogin(reason) {
    const params = new URLSearchParams({ reason });
    window.location.href = `/login.html?${params.toString()}`;
  }

  /**
   * Clear all auth data
   */
  function clearAuth() {
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-permissions');
  }
})();
