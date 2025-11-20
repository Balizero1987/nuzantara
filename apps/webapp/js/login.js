/**
 * ZANTARA Login Page - Email + PIN Authentication
 */

// Configuration - Use centralized API_CONFIG
const API_CONFIG = window.API_CONFIG || {
  backend: { url: 'https://nuzantara-rag.fly.dev' },
  memory: { url: 'https://nuzantara-rag.fly.dev' }
};
const API_BASE_URL = API_CONFIG.backend.url;

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
  welcomeMessage.classList.remove('show');
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
  pinToggle.textContent = isPassword ? '🙈' : '👁';
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

    // Call auth API with email + PIN (sent as password)
    const response = await fetch(`${API_BASE_URL}/api/auth/demo`, {
      method: 'POST',
      credentials: 'include', // Include cookies for CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: pin  // PIN sent as password field
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || result.message || 'Login failed');
    }

    // Login successful - handle actual backend response format
    // Backend returns: {token: "demo_xxx", expiresIn: 3600, userId: "demo"}
    const token = result.token || result.access_token;

    // CRITICAL: Verify token exists
    if (!token) {
      throw new Error('Server did not return authentication token. Please contact support.');
    }

    const expiresIn = result.expiresIn || result.expires_in || 3600; // 1 hour default
    const user = result.user || {
      id: result.userId || 'demo',
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
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

/**
 * Clear error message
 */
function clearError() {
  errorMessage.classList.remove('show');
}

/**
 * Show success message
 */
function showSuccess(message) {
  welcomeMessage.textContent = message;
  welcomeMessage.classList.add('show', 'success');
}
