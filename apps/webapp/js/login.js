/**
 * ZANTARA Login Page - Email + PIN Authentication
 * Powered by UnifiedAuth
 */

import { unifiedAuth } from './auth/unified-auth.js';

// DOM Elements
let emailInput, pinInput, pinToggle, loginButton, errorMessage, welcomeMessage, loginForm;

/**
 * Initialize login page
 */
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔐 ZANTARA Login Page Loading...');

  // Get DOM elements
  emailInput = document.getElementById('email');
  pinInput = document.getElementById('pin');
  pinToggle = document.getElementById('pinToggle');
  loginButton = document.getElementById('loginButton');
  errorMessage = document.getElementById('errorMessage');
  welcomeMessage = document.getElementById('welcomeMessage');
  loginForm = document.getElementById('loginForm');

  // If the page doesn't have the login form, bail out gracefully
  if (!emailInput || !pinInput || !loginButton || !loginForm) {
    console.warn('⚠️ Login elements not found on page - skipping login.js');
    return;
  }

  // Check if already authenticated
  if (unifiedAuth.isAuthenticated()) {
    console.log('ℹ️ Already authenticated, redirecting...');
    window.location.href = '/chat';
    return;
  }

  // Setup event listeners
  setupEventListeners();

  console.log('✅ Login page ready');
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Email input
  emailInput.addEventListener('blur', handleEmailBlur);
  emailInput.addEventListener('input', clearError);

  // PIN input
  pinInput.addEventListener('input', handlePinInput);
  pinInput.addEventListener('input', clearError);

  // PIN toggle
  pinToggle.addEventListener('click', togglePinVisibility);

  // Form submit
  loginForm.addEventListener('submit', handleLogin);

  // Enter key navigation
  emailInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      pinInput.focus();
    }
  });
}

/**
 * Handle email blur
 */
function handleEmailBlur() {
  // Clear any messages on blur
  if (welcomeMessage) {
    welcomeMessage.classList.remove('show');
  }
}

/**
 * Handle PIN input - ensure numeric only
 */
function handlePinInput(e) {
  let value = e.target.value;

  // Remove non-numeric characters
  value = value.replace(/[^0-9]/g, '');

  // Update input
  if (value !== e.target.value) {
    e.target.value = value;
  }

  // Validate length
  const isValid = value.length >= 4 && value.length <= 8;

  // Enable/disable login button
  loginButton.disabled = !emailInput.value || !isValid;
}

/**
 * Toggle PIN visibility
 */
function togglePinVisibility() {
  const isPassword = pinInput.type === 'password';
  pinInput.type = isPassword ? 'text' : 'password';
  if (pinToggle) {
    pinToggle.textContent = isPassword ? '🙈' : '👁';
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  const email = emailInput.value.trim();
  const pin = pinInput.value.trim();

  // Validate
  if (!email || !pin) {
    showError('Please enter both email and PIN');
    return;
  }

  if (!/^[0-9]{4,8}$/.test(pin)) {
    showError('PIN must be 4-8 digits');
    return;
  }

  // Show loading state
  loginButton.classList.add('loading');
  loginButton.disabled = true;
  clearError();

  try {
    console.log('🔐 Attempting login via UnifiedAuth...');

    // Delegate to UnifiedAuth
    const user = await unifiedAuth.loginTeam(email, pin);

    console.log('✅ Login successful:', user.name || user.email);

    // Show success message
    showSuccess(`Welcome back, ${user.name || user.email}! 🎉`);

    // Redirect after 1.5 seconds
    setTimeout(() => {
      window.location.href = '/chat';
    }, 1500);

  } catch (error) {
    console.error('❌ Login failed:', error);

    // Show error message
    let errorMsg = error.message || 'Login failed';

    // User-friendly error messages
    if (errorMsg.includes('Invalid PIN') || errorMsg.includes('credentials')) {
      errorMsg = 'Invalid PIN or email. Please try again.';
    } else if (errorMsg.includes('User not found')) {
      errorMsg = 'Email not found. Please check your email.';
    } else if (errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
      errorMsg = 'Connection error. Please check your internet.';
    }

    showError(errorMsg);

    // Reset loading state
    loginButton.classList.remove('loading');
    loginButton.disabled = false;

    // Clear PIN field on error
    pinInput.value = '';
    pinInput.focus();
  }
}

/**
 * Show error message
 */
function showError(message) {
  if (!errorMessage) return;

  const errorText = errorMessage.querySelector ? errorMessage.querySelector('.error-text') : null;
  if (errorText) {
    errorText.textContent = message;
  } else {
    errorMessage.textContent = message;
  }

  errorMessage.style.display = 'block';
  errorMessage.classList.add('show');
}

/**
 * Clear error message
 */
function clearError() {
  if (errorMessage) {
    errorMessage.style.display = 'none';
    errorMessage.classList.remove('show');
  }
}

/**
 * Show success message
 */
function showSuccess(message) {
  if (welcomeMessage) {
    welcomeMessage.textContent = message;
    welcomeMessage.classList.add('show', 'success');
  } else {
    console.log('✅', message);
  }
}
