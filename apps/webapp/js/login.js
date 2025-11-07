/**
 * ZANTARA Login Page - Email + PIN Authentication
 */

// Configuration - Use centralized API_CONFIG
const API_CONFIG = window.API_CONFIG || {
  backend: { url: 'https://nuzantara-backend.fly.dev' },
  memory: { url: 'https://nuzantara-memory.fly.dev' }
};
const API_BASE_URL = API_CONFIG.backend.url;
const MEMORY_SERVICE_URL = API_CONFIG.memory.url;

// DOM Elements
let emailInput, pinInput, pinToggle, loginButton, errorMessage, welcomeMessage, loginForm;

// State
let teamMembers = [];

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

  // Load team members for auto-complete
  await loadTeamMembers();

  // Setup event listeners
  setupEventListeners();

  console.log('✅ Login page ready');
});

/**
 * Load team members from backend
 */
async function loadTeamMembers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/team/members`);
    const result = await response.json();

    if (result.ok && result.data) {
      teamMembers = result.data.members;

      // Populate email datalist
      const datalist = document.getElementById('team-emails');
      teamMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.email;
        datalist.appendChild(option);
      });

      console.log(`✅ Loaded ${teamMembers.length} team members`);
    }
  } catch (error) {
    console.warn('Could not load team members:', error);
  }
}

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
 * Handle email blur - recognize team member
 */
function handleEmailBlur() {
  const email = emailInput.value.trim().toLowerCase();

  if (!email) {
    welcomeMessage.classList.remove('show');
    return;
  }

  // Find team member
  const member = teamMembers.find(m => m.email.toLowerCase() === email);

  if (member) {
    welcomeMessage.textContent = `Welcome back, ${member.name}! Enter your PIN to continue.`;
    welcomeMessage.classList.remove('success');
    welcomeMessage.classList.add('show');
    console.log(`✅ Recognized: ${member.name} (${member.role})`);
  } else {
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

    // Call login API
    const response = await fetch(`${API_BASE_URL}/api/auth/team/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: email.split('@')[0], email, pin }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Login failed');
    }

    // Login successful
    const { data } = result;
    console.log('✅ Login successful:', data.user.name);

    // Store auth data
    storeAuthData(data);

    // Show personalized response
    if (data.personalizedResponse) {
      showSuccess(data.personalizedResponse);

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/chat.html';
      }, 2000);
    } else {
      window.location.href = '/chat.html';
    }

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
 * Store authentication data in localStorage
 */
function storeAuthData(data) {
  // Store token
  localStorage.setItem('zantara-token', JSON.stringify({
    token: data.token,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  }));

  // Store user
  localStorage.setItem('zantara-user', JSON.stringify(data.user));

  // Store session
  localStorage.setItem('zantara-session', JSON.stringify({
    id: data.sessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  }));

  // Store permissions
  if (data.permissions) {
    localStorage.setItem('zantara-permissions', JSON.stringify(data.permissions));
  }

  console.log('✅ Auth data stored in localStorage');

  // Initialize Memory Service session
  initializeMemorySession(data.user.id, data.user.email);
}

/**
 * Initialize or restore conversation session in Memory Service
 */
async function initializeMemorySession(userId, userEmail) {
  try {
    // Use global CONVERSATION_CLIENT from conversation-client.js
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      const sessionId = await window.CONVERSATION_CLIENT.initializeSession(userId, userEmail);
      console.log(`✅ Memory Service session initialized: ${sessionId}`);
      return sessionId;
    } else {
      console.warn('⚠️ CONVERSATION_CLIENT not loaded');
      return null;
    }
  } catch (error) {
    console.warn('⚠️ Memory Service initialization failed:', error.message);
    // Continue without memory service - not critical for login
    return null;
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
