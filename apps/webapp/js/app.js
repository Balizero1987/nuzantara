/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Chat Application - Production Ready
 * Integrates with ZantaraClient for all backend communication
 */

// Global state
let zantaraClient;
let messages = [];
let currentLiveMessage = null;

// DOM elements
let messageSpace, messageInput, sendButton, quickActions, messagesContainer;

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async function () {
  console.log('🚀 ZANTARA Chat Application Starting...');

  // Check authentication
  const userContext = window.UserContext;
  if (!userContext.isAuthenticated()) {
    console.error('❌ Not authenticated - redirecting to login');
    window.location.href = '/login.html';
    return;
  }

  // Display user info in header
  displayUserInfo();

  // Initialize client with centralized config
  const API_CONFIG = window.API_CONFIG || {
    rag: { url: 'https://nuzantara-rag.fly.dev' }
  };

  zantaraClient = new window.ZantaraClient({
    apiUrl: API_CONFIG.rag.url,
    chatEndpoint: '/bali-zero/chat',  // FIXED: Use correct Bali-Zero endpoint
    streamEndpoint: '/bali-zero/chat-stream',  // For SSE streaming
    maxRetries: 3,
  });

  // Get DOM elements
  messageSpace = document.getElementById('messageSpace');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  quickActions = document.querySelectorAll('.quick-action');
  messagesContainer = document.querySelector('.messages-container');

  // Load message history (async)
  await loadMessageHistory();

  // Setup event listeners
  setupEventListeners();

  // Authenticate
  try {
    await zantaraClient.authenticate();
    console.log('✅ Client initialized and authenticated');
  } catch (error) {
    console.error('Failed to authenticate:', error);
    showErrorNotification('Authentication failed. Some features may not work.');
  }
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Input events
  messageInput.addEventListener('input', handleInputChange);
  messageInput.addEventListener('keydown', handleKeyDown);

  // Send button
  sendButton.addEventListener('click', handleSend);

  // Quick actions
  quickActions.forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.textContent.trim();
      handleQuickAction(action);
    });
  });

  // Online/offline detection
  window.addEventListener('online', () => {
    showNotification('Connection restored', 'success');
  });

  window.addEventListener('offline', () => {
    showNotification('No internet connection', 'error');
  });
}

/**
 * Load message history from Memory Service + localStorage
 */
async function loadMessageHistory() {
  // Try to load from Memory Service first
  if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
    try {
      console.log('📚 Loading conversation history from Memory Service...');
      const history = await window.CONVERSATION_CLIENT.getHistory();

      if (history && history.length > 0) {
        console.log(`✅ Loaded ${history.length} messages from Memory Service`);

        // Clear existing messages
        messageSpace.innerHTML = '';
        messages = [];

        // Convert Memory Service format to app format and render
        history.forEach((msg) => {
          const appMsg = {
            type: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          };
          messages.push(appMsg);
          renderMessage(appMsg, false); // false = don't save to history again
        });

        scrollToBottom();
        return;
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from Memory Service, falling back to localStorage:', error.message);
    }
  }

  // Fallback to localStorage
  messages = zantaraClient.messages;

  if (messages.length > 0) {
    console.log(`📚 Loading ${messages.length} messages from localStorage`);

    // Clear existing messages
    messageSpace.innerHTML = '';

    // Render all messages
    messages.forEach((msg) => {
      renderMessage(msg, false); // false = don't save to history again
    });

    scrollToBottom();
  } else {
    // Show welcome message
    showWelcomeMessage();
  }
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
  const welcomeMsg = {
    type: 'ai',
    content:
      'I am the Jiwa of Bali Zero. How can I assist you today with Indonesian business law, visas, or company formation?',
    timestamp: new Date(),
  };
  renderMessage(welcomeMsg, false);
}

/**
 * Handle input change
 */
function handleInputChange() {
  const value = messageInput.value.trim();
  sendButton.disabled = !value;

  // Auto-resize textarea
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

/**
 * Handle key down
 */
function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

/**
 * Handle send button click
 */
function handleSend() {
  const content = messageInput.value.trim();
  if (!content || zantaraClient.isStreaming) return;

  sendMessage(content);
}

/**
 * Handle quick action click
 */
function handleQuickAction(action) {
  sendMessage(action);
}

/**
 * Send message to ZANTARA
 */
async function sendMessage(content) {
  // Add user message
  const userMsg = {
    type: 'user',
    content: content,
    timestamp: new Date(),
  };
  renderMessage(userMsg, true);

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendButton.disabled = true;

  // Show typing indicator
  showTypingIndicator();

  try {
    // Use streaming for better UX
    await zantaraClient.sendMessageStream(content, {
      onStart: () => {
        hideTypingIndicator();
        currentLiveMessage = createLiveMessage();
      },
      onToken: (token, fullText) => {
        updateLiveMessage(currentLiveMessage, fullText);
      },
      onComplete: (fullText) => {
        finalizeLiveMessage(currentLiveMessage, fullText);
        currentLiveMessage = null;
      },
      onError: (error) => {
        hideTypingIndicator();
        handleSendError(error);
      },
    });
  } catch (error) {
    hideTypingIndicator();
    handleSendError(error);
  }
}

/**
 * Handle send error
 */
function handleSendError(error) {
  const errorInfo = zantaraClient.getErrorMessage(error);

  // Show error message
  const errorMsg = {
    type: 'error',
    content: errorInfo.message,
    title: errorInfo.title,
    canRetry: errorInfo.canRetry,
    timestamp: new Date(),
  };

  renderMessage(errorMsg, false);

  // Show notification
  showNotification(errorInfo.title, 'error');
}

/**
 * Render message to DOM
 */
function renderMessage(msg, saveToHistory = true) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${msg.type}`;

  if (msg.type === 'error') {
    messageEl.classList.add('error');
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  // Add title for error messages
  if (msg.title) {
    const titleEl = document.createElement('div');
    titleEl.className = 'message-title';
    titleEl.textContent = msg.title;
    contentEl.appendChild(titleEl);
  }

  const textEl = document.createElement('div');
  textEl.className = 'message-text';

  // Render markdown for AI messages
  if (msg.type === 'ai') {
    textEl.innerHTML = zantaraClient.renderMarkdown(msg.content);
  } else {
    textEl.textContent = msg.content;
  }

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTime(msg.timestamp);

  contentEl.appendChild(textEl);
  messageEl.appendChild(contentEl);
  messageEl.appendChild(timeEl);

  // Add retry button for retryable errors
  if (msg.canRetry) {
    const retryBtn = document.createElement('button');
    retryBtn.className = 'retry-button';
    retryBtn.textContent = '🔄 Retry';
    retryBtn.onclick = () => {
      // Get last user message
      const lastUserMsg = messages.filter((m) => m.type === 'user').pop();
      if (lastUserMsg) {
        sendMessage(lastUserMsg.content);
      }
    };
    messageEl.appendChild(retryBtn);
  }

  messageSpace.appendChild(messageEl);
  scrollToBottom();

  // Save to history
  if (saveToHistory) {
    // Save to localStorage (via ZantaraClient)
    zantaraClient.addMessage(msg);

    // Save to Memory Service
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      const role = msg.type === 'user' ? 'user' : 'assistant';
      window.CONVERSATION_CLIENT.addMessage(role, msg.content).catch((error) => {
        console.warn('⚠️ Failed to save message to Memory Service:', error.message);
      });
    }
  }
}

/**
 * Create live message element for streaming
 */
function createLiveMessage() {
  const messageEl = document.createElement('div');
  messageEl.className = 'message ai live-message';
  messageEl.id = 'liveMessage';

  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';

  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  textEl.textContent = '';

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = formatTime(new Date());

  contentEl.appendChild(textEl);
  messageEl.appendChild(contentEl);
  messageEl.appendChild(timeEl);

  messageSpace.appendChild(messageEl);
  scrollToBottom();

  return messageEl;
}

/**
 * Update live message during streaming
 */
function updateLiveMessage(messageEl, text) {
  if (!messageEl) return;

  const textEl = messageEl.querySelector('.message-text');
  if (textEl) {
    // Render markdown in real-time
    textEl.innerHTML = zantaraClient.renderMarkdown(text);
    scrollToBottom();
  }
}

/**
 * Finalize live message after streaming completes
 */
function finalizeLiveMessage(messageEl, fullText) {
  if (!messageEl) return;

  // Remove live-message class and id
  messageEl.classList.remove('live-message');
  messageEl.removeAttribute('id');

  // Save to history
  const aiMsg = {
    type: 'ai',
    content: fullText,
    timestamp: new Date(),
  };

  // Save to localStorage
  zantaraClient.addMessage(aiMsg);

  // Save to Memory Service
  if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
    window.CONVERSATION_CLIENT.addMessage('assistant', fullText).catch((error) => {
      console.warn('⚠️ Failed to save AI message to Memory Service:', error.message);
    });
  }

  console.log('✅ Message streaming completed and saved to Memory Service');
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const existing = document.getElementById('typingIndicator');
  if (existing) return;

  const indicator = document.createElement('div');
  indicator.id = 'typingIndicator';
  indicator.className = 'message ai typing';
  indicator.innerHTML = `
    <div class="message-content">
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;

  messageSpace.appendChild(indicator);
  scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add to body
  document.body.appendChild(notification);

  // Show with animation
  setTimeout(() => notification.classList.add('show'), 10);

  // Hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
  showNotification(message, 'error');
}

/**
 * Scroll to bottom of messages
 */
function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, 100);
}

/**
 * Format timestamp
 */
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Clear chat history
 */
async function clearChatHistory() {
  if (confirm('Are you sure you want to clear all chat history?')) {
    // Clear localStorage
    zantaraClient.clearHistory();

    // Clear Memory Service
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      try {
        await window.CONVERSATION_CLIENT.clearConversation();
        console.log('✅ Conversation cleared from Memory Service');
      } catch (error) {
        console.warn('⚠️ Failed to clear Memory Service conversation:', error.message);
      }
    }

    // Clear UI
    messageSpace.innerHTML = '';
    messages = [];
    showWelcomeMessage();
    showNotification('Chat history cleared', 'success');
  }
}

/**
 * Display user info in header
 */
function displayUserInfo() {
  const userContext = window.UserContext;
  const userEmail = document.getElementById('userEmail');
  const userRole = document.getElementById('userRole');
  const userAvatar = document.getElementById('userAvatar');
  const logoutBtn = document.getElementById('logoutBtn');

  if (userEmail && userContext.user) {
    userEmail.textContent = userContext.user.email || 'guest@zantara.com';
  }

  if (userRole && userContext.user) {
    userRole.textContent = userContext.getRole();
  }

  if (userAvatar && userContext.user) {
    const initial = userContext.getName().charAt(0).toUpperCase();
    userAvatar.textContent = initial;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  console.log(`✅ User info displayed: ${userContext.getName()} (${userContext.getRole()})`);
}

/**
 * Handle logout
 */
async function handleLogout() {
  const confirmed = confirm('Are you sure you want to logout?');
  if (!confirmed) return;

  try {
    const userContext = window.UserContext;
    const sessionId = userContext.getSessionId();

    // Call logout API with centralized config
    if (sessionId) {
      const API_CONFIG = window.API_CONFIG || {
        backend: { url: 'https://nuzantara-backend.fly.dev' }
      };

      await fetch(`${API_CONFIG.backend.url}/api/team/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    }

    // Clear conversation session from Memory Service
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      try {
        await window.CONVERSATION_CLIENT.clearConversation();
        console.log('✅ Conversation session cleared on logout');
      } catch (error) {
        console.warn('⚠️ Failed to clear conversation on logout:', error.message);
      }
    }
  } catch (error) {
    console.warn('Logout API call failed:', error);
  }

  // Clear local storage
  window.UserContext.logout();

  // Redirect to login
  window.location.href = '/login.html';
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.clearChatHistory = clearChatHistory;
}
