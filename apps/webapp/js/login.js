/**
 * ZANTARA Login Page - Email + PIN Authentication
 */

// Configuration - Use centralized API_CONFIG with fallback and demo mode
const API_CONFIG = window.API_CONFIG || {
  backend: { url: 'https://nuzantara-rag.fly.dev' }, // Changed to working backend
  memory: { url: 'https://nuzantara-rag.fly.dev' }
};
const API_BASE_URL = API_CONFIG.backend.url;

// Demo mode flag - enable if backend is not reachable
const DEMO_MODE = true; // Enable demo mode for immediate access

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
    console.log('🔐 Attempting login...');
    console.log('📍 API URL:', `${API_BASE_URL}/api/auth/team/login`);
    console.log('📧 Email:', email);

    // DEMO MODE: If backend is not reachable or DEMO_MODE is enabled
    if (DEMO_MODE) {
      console.log('🎭 DEMO MODE ENABLED - Creating demo session...');

      // Create demo user session
      const demoUser = {
        id: 'demo_' + Date.now(),
        email: email,
        name: email.split('@')[0],
        role: 'User',
        department: 'Demo',
        permissions: ['read', 'write']
      };

      const demoToken = 'demo_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Store demo auth data in ZANTARA format
      localStorage.setItem('zantara-token', JSON.stringify({
        token: demoToken,
        expiresAt: Date.now() + (24 * 3600 * 1000), // 24 hours
        demo: true
      }));
      localStorage.setItem('zantara-user', JSON.stringify(demoUser));
      localStorage.setItem('zantara-session', JSON.stringify({
        id: demoUser.id,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        demo: true
      }));

      console.log('✅ Demo login successful:', demoUser.name);

      // Show success message
      showSuccess(`Demo Mode: Welcome ${demoUser.name}! 🎉`);

      // Redirect after 1 second
      setTimeout(() => {
        window.location.href = '/chat.html';
      }, 1000);

      return;
    }

    // PRODUCTION MODE: Call auth API with email + PIN
    const response = await fetch(`${API_BASE_URL}/api/auth/team/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        pin: pin
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Login failed');
    }

    // Login successful - handle backend response format
    const token = result.data?.token || result.token || result.access_token;

    // CRITICAL: Verify token exists
    if (!token) {
      throw new Error('Server did not return authentication token. Please contact support.');
    }

    const expiresIn = result.data?.expiresIn || result.expiresIn || result.expires_in || 3600; // default 1h
    const user = result.data?.user || result.user || {
      id: result.data?.userId || result.userId || 'demo',
      email: email,
      name: email.split('@')[0]
    };

    console.log('✅ Login successful:', user.name || user.email);

    // Store auth data in ZANTARA format (zantara-*)
    localStorage.setItem('zantara-token', JSON.stringify({
      token: token,
      expiresAt: Date.now() + (expiresIn * 1000), // Convert seconds to milliseconds
    }));
    localStorage.setItem('zantara-user', JSON.stringify(user));
    localStorage.setItem('zantara-session', JSON.stringify({
      id: user.id || `session_${Date.now()}`,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }));

    console.log('✅ Auth data saved to localStorage (zantara-* format)');

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
    if (errorMsg.includes('Invalid PIN')) {
      errorMsg = 'Invalid PIN. Please try again.';
    } else if (errorMsg.includes('User not found')) {
      errorMsg = 'Email not found. Please check your email.';
    } else if (errorMsg.includes('fetch')) {
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
