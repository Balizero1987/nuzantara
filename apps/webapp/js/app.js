/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Chat Application - Clean Architecture
 * Integrates with ZantaraClient for all backend communication
 * Uses StateManager for centralized state and ErrorHandler for error tracking
 */

// Import Core Modules
import { stateManager } from './core/state-manager.js';
import { ErrorHandler } from './core/error-handler.js';
import { notificationManager } from './components/notification.js';

// Initialize Error Handler
const errorHandler = new ErrorHandler();

// Import Collective Memory Layer (dynamic import per performance)
let SSECollectiveMemoryExtension, CollectiveMemoryWidget;

/**
 * Load Collective Memory modules if feature enabled
 */
async function loadCollectiveMemoryModules() {
  try {
    // Import event bus
    const eventBusModule = await import('./core/collective-memory-event-bus.js');
    window.collectiveMemoryBus = eventBusModule.collectiveMemoryBus;

    // Import SSE extension
    const extensionModule = await import('./adapters/sse-collective-memory-extension.js');
    SSECollectiveMemoryExtension = extensionModule.SSECollectiveMemoryExtension;

    // Import widget
    const widgetModule = await import('./components/collective-memory-widget.js');
    CollectiveMemoryWidget = widgetModule.CollectiveMemoryWidget;

    // Inizializza widget
    const memoryWidget = new CollectiveMemoryWidget();
    window.collectiveMemoryWidget = memoryWidget;

    // Attach extension al client (dopo che zantaraClient è inizializzato)
    setTimeout(() => {
      if (SSECollectiveMemoryExtension && window.zantaraClient) {
        const memoryExtension = new SSECollectiveMemoryExtension();
        memoryExtension.attach(window.zantaraClient);
      }
    }, 1000);

    return true;
  } catch (error) {
    console.warn('Collective Memory modules not available:', error);
    return false;
  }
}

// Global client reference (state managed by StateManager)
let zantaraClient;

// DOM elements
let messageSpace, messageInput, sendButton, quickActions, messagesContainer;

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async function () {
  console.log('🚀 ZANTARA Chat Application Starting...');

  // Check authentication
  const userContext = window.UserContext;
  if (!userContext || !userContext.isAuthenticated()) {
    console.error('❌ Not authenticated - redirecting to login');
    window.location.href = '/login.html';
    return;
  }

  // Display user info in header
  displayUserInfo();

  // Initialize client with centralized config
  const API_CONFIG = window.API_CONFIG || {
    rag: { url: 'https://nuzantara-rag.fly.dev' },
  };

  // Check if ZantaraClient is available
  if (typeof window.ZantaraClient === 'undefined') {
    console.error('ZantaraClient not loaded! Check if zantara-client.min.js is loaded correctly.');
    return;
  }

  zantaraClient = new window.ZantaraClient({
    apiUrl: API_CONFIG.rag.url,
    chatEndpoint: '/bali-zero/chat', // FIXED: Use correct Bali-Zero endpoint
    streamEndpoint: '/bali-zero/chat-stream', // For SSE streaming
    maxRetries: 3,
  });

  console.log('✅ ZantaraClient initialized successfully');

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
    errorHandler.handle({
      type: 'auth_error',
      error,
      message: 'Authentication failed'
    });
    showErrorNotification('Authentication failed. Some features may not work.');
  }

  // Initialize StateManager
  stateManager.restore();
  stateManager.setUser(userContext.user);

  // Initialize Collective Memory Client
  if (typeof window.CollectiveMemoryClient !== 'undefined') {
    const collectiveMemoryClient = new window.CollectiveMemoryClient();
    window.collectiveMemoryClient = collectiveMemoryClient;
    console.log('✅ Collective Memory Client initialized');
  }

  // Initialize Team Analytics Client
  if (typeof window.TeamAnalyticsClient !== 'undefined') {
    const teamAnalyticsClient = new window.TeamAnalyticsClient();
    window.teamAnalyticsClient = teamAnalyticsClient;
    console.log('✅ Team Analytics Client initialized');
  }

  // Initialize System Handlers Client and load tools
  if (typeof window.SystemHandlersClient !== 'undefined') {
    const systemHandlersClient = new window.SystemHandlersClient();
    window.systemHandlersClient = systemHandlersClient;

    // Load tools in background
    systemHandlersClient.getTools().then(tools => {
      console.log(`✅ System Handlers initialized: ${tools.length} tools available`);
    }).catch(error => {
      console.warn('⚠️ Failed to load system handlers:', error.message);
    });
  }

  // Load compliance alerts
  if (typeof window.AgentsClient !== 'undefined') {
    const agentsClient = new window.AgentsClient();
    agentsClient.getComplianceAlerts().then(alerts => {
      if (alerts && alerts.length > 0) {
        showComplianceAlertsBanner(alerts);
      }
    }).catch(error => {
      console.warn('⚠️ Failed to load compliance alerts:', error.message);
    });

    // Load client journey if client detected
    const currentClient = sessionStorage.getItem('current-client-id');
    if (currentClient) {
      agentsClient.getNextSteps(currentClient).then(journey => {
        if (journey) {
          showClientJourneyWidget(journey);
        }
      }).catch(error => {
        console.warn('⚠️ Failed to load client journey:', error.message);
      });
    }
  }

  // Load Collective Memory modules (async, non-blocking)
  loadCollectiveMemoryModules().then((loaded) => {
    if (loaded) {
      console.log('✅ Collective Memory modules loaded');
    }
  });
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

  // Enable send button immediately after setup
  if (sendButton) {
    sendButton.disabled = false;
  }
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
        stateManager.clearMessages();

        // Convert Memory Service format to app format and render
        history.forEach((msg) => {
          const appMsg = {
            type: msg.role === 'user' ? 'user' : 'ai',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          };
          stateManager.addMessage(appMsg);
          renderMessage(appMsg, false); // false = don't save to history again
        });

        scrollToBottom();
        return;
      }
    } catch (error) {
      errorHandler.handle({
        type: 'memory_service_error',
        error,
        message: 'Failed to load from Memory Service'
      });
      console.warn(
        '⚠️ Failed to load from Memory Service, falling back to localStorage:',
        error.message
      );
      showNotification('Could not load conversation history from server', 'warning');
    }
  }

  // Fallback to localStorage
  const localMessages = zantaraClient.messages;

  if (localMessages.length > 0) {
    console.log(`📚 Loading ${localMessages.length} messages from localStorage`);

    // Clear existing messages
    messageSpace.innerHTML = '';

    // Render all messages and sync to StateManager
    localMessages.forEach((msg) => {
      stateManager.addMessage(msg);
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
  // Send button sempre abilitato
  sendButton.disabled = false;

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
  console.log('🚀 handleSend called');

  const content = messageInput.value.trim();
  console.log('📝 Message content:', content);

  if (!content) {
    console.log('❌ No content, returning');
    return;
  }

  if (zantaraClient && zantaraClient.isStreaming) {
    console.log('⚠️ Already streaming, returning');
    return;
  }

  console.log('✅ Proceeding with send');

  // Trigger send animation
  const sendBtn = document.getElementById('sendButton');
  if (sendBtn) {
    sendBtn.classList.add('sending');
    setTimeout(() => {
      sendBtn.classList.remove('sending');
    }, 600);
  }

  // Check if it's an image generation request
  if (content.toLowerCase().startsWith('generate image')) {
    handleImageGeneration(content);
  } else {
    sendMessage(content);
  }
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
  sendButton.disabled = false;

  // Show typing indicator
  showTypingIndicator();

  try {
    // Use streaming for better UX
    await zantaraClient.sendMessageStream(content, {
      onStart: () => {
        hideTypingIndicator();
        stateManager.state.streamingMessage = createLiveMessage();
      },
      onToken: (token, fullText) => {
        updateLiveMessage(stateManager.state.streamingMessage, fullText);
      },
      onComplete: async (fullText, metadata) => {
        finalizeLiveMessage(stateManager.state.streamingMessage, fullText, metadata);
        stateManager.state.streamingMessage = null;

        // Auto-save to CRM if CRMClient is available
        if (typeof window.CRMClient !== 'undefined') {
          try {
            const crmClient = new window.CRMClient();
            const userContext = window.UserContext;
            await crmClient.saveInteractionFromChat({
              user_email: userContext?.user?.email || 'unknown',
              messages: zantaraClient.messages.slice(-2),
              interaction_type: 'chat'
            });
            console.log('✅ Interaction auto-saved to CRM');
          } catch (error) {
            console.warn('⚠️ Failed to auto-save to CRM:', error.message);
          }
        }

        // Auto-store to Collective Memory if important
        if (typeof window.collectiveMemoryClient !== 'undefined') {
          try {
            const userContext = window.UserContext;
            const lastUserMsg = stateManager.state.messages.filter(m => m.type === 'user').pop();
            if (lastUserMsg) {
              await window.collectiveMemoryClient.autoStoreFromChat(
                lastUserMsg.content,
                fullText,
                { user_email: userContext?.user?.email }
              );
            }
          } catch (error) {
            console.warn('⚠️ Failed to auto-store to collective memory:', error.message);
          }
        }
      },
      onError: (error) => {
        hideTypingIndicator();
        handleSendError(error);
      },
    });
  } catch (error) {
    errorHandler.handle({
      type: 'send_message_error',
      error,
      message: 'Failed to send message'
    });
    hideTypingIndicator();
    handleSendError(error);
  }
}

/**
 * Handle send error
 */
function handleSendError(error) {
  const errorInfo = zantaraClient.getErrorMessage(error);

  // Re-enable send button on error
  if (sendButton) {
    sendButton.disabled = false;
  }

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
      // Get last user message from StateManager
      const lastUserMsg = stateManager.state.messages.filter((m) => m.type === 'user').pop();
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

  return messageEl; // FIXED: Return message element for reference
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
function finalizeLiveMessage(messageEl, fullText, metadata = {}) {
  if (!messageEl) return;

  // Remove live-message class and id
  messageEl.classList.remove('live-message');
  messageEl.removeAttribute('id');

  // Add sources if available
  if (metadata.sources && metadata.sources.length > 0) {
    const sourcesEl = document.createElement('div');
    sourcesEl.className = 'message-sources';
    sourcesEl.innerHTML = `
      <div class="sources-header">📚 Sources (${metadata.sources.length})</div>
      <div class="sources-list">
        ${metadata.sources.map((source, idx) => `
          <div class="source-item">
            <span class="source-number">${idx + 1}</span>
            <span class="source-snippet">${source.snippet || source.source}</span>
            ${source.similarity ? `<span class="source-score">${(source.similarity * 100).toFixed(0)}%</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
    messageEl.querySelector('.message-content').appendChild(sourcesEl);
  }

  // Add collection stats if available
  if (metadata.collection_used || metadata.intent) {
    const collectionsEl = document.createElement('div');
    collectionsEl.className = 'collections-used';
    const collectionName = metadata.collection_used || 'knowledge_base';
    const intent = metadata.intent || 'general';
    collectionsEl.innerHTML = `
      <span class="collections-label">📚 Collection:</span>
      <span class="collection-badge">${collectionName}</span>
      <span class="intent-badge">🎯 ${intent}</span>
    `;
    messageEl.appendChild(collectionsEl);
  }

  // Add metadata footer if available
  if (metadata.model || metadata.tokens || metadata.cost) {
    const metadataEl = document.createElement('div');
    metadataEl.className = 'message-metadata';
    const parts = [];
    if (metadata.model) parts.push(`🤖 ${metadata.model}`);
    if (metadata.tokens) parts.push(`📊 ${metadata.tokens} tokens`);
    if (metadata.cost) parts.push(`💰 $${metadata.cost.toFixed(4)}`);
    metadataEl.innerHTML = parts.join(' • ');
    messageEl.appendChild(metadataEl);
  }

  // Re-enable send button when response is complete
  if (sendButton) {
    sendButton.disabled = false;
  }

  // Save to history
  const aiMsg = {
    type: 'ai',
    content: fullText,
    timestamp: new Date(),
    metadata: metadata
  };

  // Save to localStorage
  zantaraClient.addMessage(aiMsg);

  // Save to Memory Service
  if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
    window.CONVERSATION_CLIENT.addMessage('assistant', fullText).catch((error) => {
      console.warn('⚠️ Failed to save AI message to Memory Service:', error.message);
    });
  }

  // Load collective insights in sidebar (if available)
  if (typeof window.collectiveMemoryClient !== 'undefined') {
    window.collectiveMemoryClient.queryCollective('recent insights', { limit: 5 })
      .then(insights => {
        if (insights && insights.length > 0) {
          displayCollectiveInsightsSidebar(insights);
        }
      })
      .catch(error => {
        console.warn('⚠️ Failed to load collective insights:', error.message);
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
 * Handle image generation
 * ⚠️ SECURITY FIX: API key moved to backend
 * TODO: Implement backend endpoint for image generation
 */
async function handleImageGeneration(content) {
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
  sendButton.disabled = false;

  // Show error message - feature temporarily disabled for security
  const errorMsg = {
    type: 'ai',
    content: '⚠️ Image generation is temporarily disabled. This feature requires backend implementation for security reasons.',
    timestamp: new Date(),
  };
  renderMessage(errorMsg, true);

  scrollToBottom();
}

/**
 * Show notification (using unified notification system)
 */
function showNotification(message, type = 'info') {
  return notificationManager.show(message, type);
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
  return notificationManager.show(message, 'error');
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
        errorHandler.handle({
          type: 'memory_service_error',
          error,
          message: 'Failed to clear Memory Service conversation'
        });
        console.warn('⚠️ Failed to clear Memory Service conversation:', error.message);
      }
    }

    // Clear UI and StateManager
    messageSpace.innerHTML = '';
    stateManager.clearMessages();
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

  // Handle case when UserContext is not available (testing mode)
  if (!userContext) {
    console.warn('⚠️ UserContext not available - running in testing mode');
    return;
  }

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
 * Handle logout (Client-side only - no backend call needed for demo auth)
 */
async function handleLogout() {
  const confirmed = confirm('Are you sure you want to logout?');
  if (!confirmed) return;

  try {
    // Clear conversation session from Memory Service
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      try {
        await window.CONVERSATION_CLIENT.clearConversation();
        console.log('✅ Conversation session cleared on logout');
      } catch (error) {
        console.warn('⚠️ Failed to clear conversation on logout:', error.message);
      }
    }

    // Clear chat history from ZantaraClient
    if (zantaraClient) {
      zantaraClient.clearHistory();
    }
  } catch (error) {
    console.warn('Logout cleanup failed:', error);
  }

  // Clear all auth data from localStorage
  if (window.UserContext) {
    window.UserContext.logout();
  }

  // Clear additional session data
  localStorage.removeItem('zantara-session-id');
  localStorage.removeItem('zantara-history');
  localStorage.removeItem('zantara-session');

  console.log('✅ User logged out successfully');

  // Redirect to login
  window.location.href = '/login.html';
}

/**
 * Show compliance alerts banner
 */
function showComplianceAlertsBanner(alerts) {
  // Remove existing banner if any
  const existing = document.getElementById('compliance-alerts-banner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'compliance-alerts-banner';
  banner.className = 'compliance-alerts-banner';
  banner.innerHTML = `
    <div class="alert-icon">\u26a0\ufe0f</div>
    <div class="alert-content">
      <strong>${alerts.length} Compliance Alert${alerts.length > 1 ? 's' : ''}</strong>
      <span>${alerts[0].message || alerts[0].description}</span>
    </div>
    <button class="alert-close" onclick="this.parentElement.remove()">\u00d7</button>
  `;
  document.body.prepend(banner);

  console.log(`\u26a0\ufe0f Showing ${alerts.length} compliance alerts`);
}

/**
 * Display collective insights in sidebar
 */
function displayCollectiveInsightsSidebar(insights) {
  // Find or create sidebar container
  let sidebar = document.getElementById('collective-insights-sidebar');

  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'collective-insights-sidebar';
    sidebar.className = 'collective-insights-sidebar';
    document.body.appendChild(sidebar);
  }

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h3>\ud83d\udca1 Collective Insights</h3>
      <button class="sidebar-close" onclick="this.parentElement.parentElement.remove()">\u00d7</button>
    </div>
    <div class="insights-container">
      ${insights.map(insight => `
        <div class="insight-card">
          <div class="insight-icon">${getCategoryIcon(insight.category || 'fact')}</div>
          <div class="insight-content">
            <div class="insight-text">${insight.content || insight.snippet || 'No content'}</div>
            <div class="insight-meta">
              <span class="insight-category">${insight.category || 'general'}</span>
              ${insight.timestamp ? `<span class="insight-time">${new Date(insight.timestamp).toLocaleDateString()}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  console.log(`\ud83d\udca1 Displaying ${insights.length} collective insights in sidebar`);
}

function getCategoryIcon(category) {
  const icons = {
    'fact': '\ud83d\udcda',
    'preference': '\u2b50',
    'milestone': '\ud83c\udfaf',
    'relationship': '\ud83e\udd1d'
  };
  return icons[category] || '\ud83d\udca1';
}

/**
 * Show client journey widget
 */
function showClientJourneyWidget(journey) {
  // Remove existing widget if any
  const existing = document.getElementById('client-journey-widget');
  if (existing) existing.remove();

  const widget = document.createElement('div');
  widget.id = 'client-journey-widget';
  widget.className = 'client-journey-widget';

  const completion = journey.completion || 0;
  const stage = journey.stage || 'Unknown';
  const nextSteps = journey.next_steps || [];

  widget.innerHTML = `
    <div class="widget-header">
      <h3>\ud83d\udee4\ufe0f Client Journey: ${stage}</h3>
      <button class="widget-close" onclick="this.parentElement.parentElement.remove()">\u00d7</button>
    </div>
    <div class="progress-section">
      <div class="progress-label">Progress: ${completion}%</div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width: ${completion}%"></div>
      </div>
    </div>
    <div class="next-steps-section">
      <h4>Next Steps:</h4>
      <ul class="steps-list">
        ${nextSteps.map((step, idx) => `
          <li class="step-item">
            <span class="step-number">${idx + 1}</span>
            <span class="step-text">${step}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  // Insert in sidebar or main area
  const sidebar = document.querySelector('.sidebar') || document.body;
  sidebar.appendChild(widget);

  console.log(`\ud83d\udee4\ufe0f Client Journey widget displayed: ${stage} (${completion}%)`);
}

// Export for use in HTML and other modules
if (typeof window !== 'undefined') {
  window.clearChatHistory = clearChatHistory;
  window.showNotification = showNotification;
  window.showComplianceAlertsBanner = showComplianceAlertsBanner;
  window.displayCollectiveInsightsSidebar = displayCollectiveInsightsSidebar;
  window.showClientJourneyWidget = showClientJourneyWidget;
}
