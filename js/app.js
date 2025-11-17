/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Chat Application - Production Ready
 * Integrates with ZantaraClient for all backend communication
 */

// Import Skill Detection Layer (dynamic import per performance)
let QueryComplexityAnalyzer, StagingTheater, SSESkillExtension, skillEventBus;

// Import Collective Memory Layer (dynamic import per performance)
let SSECollectiveMemoryExtension, CollectiveMemoryWidget;
let isFeatureEnabled, shouldShowFeature;

// Load skill detection modules if feature enabled
async function loadSkillDetectionModules() {
  try {
    const module = await import('./utils/query-complexity.js');
    QueryComplexityAnalyzer = module.QueryComplexityAnalyzer;

    const theaterModule = await import('./components/staging-theater.js');
    StagingTheater = theaterModule.StagingTheater;

    const extensionModule = await import('./adapters/sse-skill-extension.js');
    SSESkillExtension = extensionModule.SSESkillExtension;

    const eventBusModule = await import('./core/skill-event-bus.js');
    skillEventBus = eventBusModule.skillEventBus;

    const flagsModule = await import('./config/feature-flags.js');
    isFeatureEnabled = flagsModule.isFeatureEnabled;
    shouldShowFeature = flagsModule.shouldShowFeature;

    // Load analytics and services
    const analyticsModule = await import('./services/analytics.js');
    skillAnalytics = analyticsModule.skillAnalytics;

    const abTestingModule = await import('./services/ab-testing.js');
    abTesting = abTestingModule.abTesting;

    const feedbackModule = await import('./services/feedback-collector.js');
    feedbackCollector = feedbackModule.feedbackCollector;

    return true;
  } catch (error) {
    console.warn('Skill Detection Layer not available:', error);
    return false;
  }
}

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

// Global state
let zantaraClient;
let messages = [];
let currentLiveMessage = null;
let stagingTheater = null;

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
    console.log('⚠️ Not authenticated - redirecting to login');
    window.location.href = '/login.html';
    return;
  }

  // Display user info in header
  displayUserInfo();

  // Initialize client with centralized config
  const API_CONFIG = window.API_CONFIG || {
    rag: { url: 'https://nuzantara-rag.fly.dev' },
  };

  zantaraClient = new window.ZantaraClient({
    apiUrl: API_CONFIG.rag.url,
    chatEndpoint: '/bali-zero/chat', // FIXED: Use correct Bali-Zero endpoint
    streamEndpoint: '/bali-zero/chat-stream', // For SSE streaming
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

  // Load Skill Detection Layer modules (async, non-blocking)
  loadSkillDetectionModules().then((loaded) => {
    if (loaded) {
      console.log('✅ Skill Detection Layer modules loaded');
    }
  });

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
      console.warn(
        '⚠️ Failed to load from Memory Service, falling back to localStorage:',
        error.message
      );
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
  // Welcome message removed - using HTML welcome instead
}

/**
 * Handle input change
 */
function handleInputChange() {
  const value = messageInput.value.trim();
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
  const content = messageInput.value.trim();
  if (!content || zantaraClient.isStreaming) return;

  // Trigger send animation
  const sendBtn = document.getElementById('sendButton');
  if (sendBtn) {
    sendBtn.classList.add('sending');
    setTimeout(() => {
      sendBtn.classList.remove('sending');
    }, 600);
  }

  // Send message directly
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
  // Hide welcome message on first message
  const welcomeMsg = document.querySelector('.welcome-message');
  if (welcomeMsg) {
    welcomeMsg.style.display = 'none';
  }

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

  // Skill Detection Layer - Query Complexity Analysis
  if (
    QueryComplexityAnalyzer &&
    isFeatureEnabled &&
    isFeatureEnabled('stagingTheater') &&
    shouldShowFeature()
  ) {
    try {
      const complexityAnalyzer = new QueryComplexityAnalyzer();
      const complexity = complexityAnalyzer.analyze(content);

      // Track query in analytics
      if (skillAnalytics) {
        skillAnalytics.trackQuery(content, complexity.complexity);
      }

      if (complexity.showStaging) {
        stagingTheater = new StagingTheater();
        // Start staging in background (non-blocking)
        stagingTheater.showStaging(complexity, [], complexity.domains).catch((err) => {
          console.warn('Staging theater error:', err);
        });

        // Track staging shown
        if (skillAnalytics) {
          skillAnalytics.trackStagingShown(complexity.complexity);
        }
      }

      // Attach SSE skill extension
      if (SSESkillExtension && skillEventBus) {
        const skillExtension = new SSESkillExtension();
        skillExtension.attach(zantaraClient);

        // Listeners per skill events
        skillEventBus.on('skill_detected', (skills) => {
          if (stagingTheater) {
            stagingTheater.updateSkills(skills);
          }
          // Track in analytics
          if (skillAnalytics) {
            skillAnalytics.trackSkillDetection(skills);
          }
        });

        skillEventBus.on('legal_references', (refs) => {
          if (stagingTheater) {
            stagingTheater.updateLegalReferences(refs);
          }
          // Track in analytics
          if (skillAnalytics) {
            skillAnalytics.trackLegalReferences(refs);
          }
        });

        skillEventBus.on('consultants_activated', (consultants) => {
          // Track in analytics
          if (skillAnalytics) {
            skillAnalytics.trackConsultantsActivated(consultants);
          }
        });
      }
    } catch (error) {
      console.warn('Skill Detection Layer error:', error);
      // Continue normally se skill detection fallisce
    }
  }

  try {
    // Use streaming for better UX
    await zantaraClient.sendMessageStream(content, {
      onStart: () => {
        hideTypingIndicator();
        currentLiveMessage = createLiveMessage();
      },
      onToken: (token, fullText) => {
        // Se staging visibile e stiamo ricevendo token, accelera fade
        if (stagingTheater && fullText.length > 50) {
          stagingTheater.accelerateFade();
        }
        updateLiveMessage(currentLiveMessage, fullText);
      },
      onComplete: async (fullText) => {
        // Assicura che staging sia rimosso
        if (stagingTheater) {
          stagingTheater.forceFade();
          stagingTheater = null;
        }
        finalizeLiveMessage(currentLiveMessage, fullText);
        currentLiveMessage = null;

        // Show feedback widget (optional, non-intrusive)
        if (feedbackCollector && skillEventBus) {
          try {
            // Get detected skills from event bus history
            const skillEvents = skillEventBus.getHistory('skill_detected');
            const lastSkills =
              skillEvents.length > 0 ? skillEvents[skillEvents.length - 1].data : [];

            // Only show feedback for complex queries with skills detected
            if (lastSkills.length > 0) {
              const { FeedbackWidget } = await import('./components/feedback-widget.js');
              const feedbackWidget = new FeedbackWidget();
              feedbackWidget.show(content, lastSkills);
            }
          } catch (error) {
            // Feedback widget is optional
            console.debug('Feedback widget not available:', error);
          }
        }
      },
      onError: (error) => {
        if (stagingTheater) {
          stagingTheater.forceFade();
          stagingTheater = null;
        }
        hideTypingIndicator();
        handleSendError(error);
      },
    });
  } catch (error) {
    if (stagingTheater) {
      stagingTheater.forceFade();
      stagingTheater = null;
    }
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

  // Add golden effect for user messages when sending
  if (msg.type === 'user' && saveToHistory) {
    messageEl.classList.add('sending');
    // Remove golden effect after 2 seconds
    setTimeout(() => {
      messageEl.classList.remove('sending');
    }, 2000);
  }

  // Add golden effect for AI messages when thinking
  if (msg.type === 'ai' && !msg.isComplete) {
    messageEl.classList.add('thinking');
    // Remove golden effect when message is complete
    if (msg.onComplete) {
      const originalOnComplete = msg.onComplete;
      msg.onComplete = () => {
        messageEl.classList.remove('thinking');
        originalOnComplete();
      };
    }
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
    // Filter AI responses when rendering from history
    const filteredContent = filterAIResponse(msg.content);
    textEl.innerHTML = zantaraClient.renderMarkdown(filteredContent);
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

  return messageEl; // FIXED: Return message element for reference
}

/**
 * Create live message element for streaming
 */
function createLiveMessage() {
  const messageEl = document.createElement('div');
  messageEl.className = 'message ai live-message thinking'; // Add thinking class for golden effect
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
 * Filter AI response to remove unwanted content
 */
function filterAIResponse(text) {
  if (!text) return text;
  
  let filtered = text;

  // Remove WhatsApp number and related text at the end
  filtered = filtered.replace(/\n*Need help with this\? Reach out on WhatsApp.*$/i, '');
  filtered = filtered.replace(/\n*Reach out on WhatsApp.*$/i, '');
  filtered = filtered.replace(/\n*WhatsApp.*$/i, '');
  filtered = filtered.replace(/\n*\+62\s*\d{8,}\s*\d{4,}.*$/g, '');
  filtered = filtered.replace(/\n*\+62\s*859\s*0436\s*9574.*$/gi, '');
  
  // Check if this is the first message of the day
  const today = new Date().toDateString();
  const lastGreetingDate = localStorage.getItem('zantara-last-greeting-date');
  const isFirstMessageToday = lastGreetingDate !== today;
  
  // Remove "Ciao Zero" if not first message of the day
  if (!isFirstMessageToday) {
    // Remove "Ciao Zero!" at the beginning (with variations)
    filtered = filtered.replace(/^Ciao\s+Zero[!.,]?\s*/i, '');
    filtered = filtered.replace(/^Ciao\s+Zero[!.,]?\s+/i, '');
    // Also remove if it's on a new line
    filtered = filtered.replace(/\nCiao\s+Zero[!.,]?\s*/i, '\n');
  } else {
    // Mark that we've greeted today
    localStorage.setItem('zantara-last-greeting-date', today);
  }
  
  return filtered.trim();
}

/**
 * Update live message during streaming
 */
function updateLiveMessage(messageEl, text) {
  if (!messageEl) return;

  const textEl = messageEl.querySelector('.message-text');
  if (textEl) {
    // Filter the text before rendering
    const filteredText = filterAIResponse(text);
    // Render markdown in real-time
    textEl.innerHTML = zantaraClient.renderMarkdown(filteredText);
    scrollToBottom();
  }
}

/**
 * Finalize live message after streaming completes
 */
function finalizeLiveMessage(messageEl, fullText) {
  if (!messageEl) return;

  // Filter the text before finalizing
  const filteredText = filterAIResponse(fullText);

  // Update the displayed text with filtered version
  const textEl = messageEl.querySelector('.message-text');
  if (textEl) {
    textEl.innerHTML = zantaraClient.renderMarkdown(filteredText);
  }

  // Remove live-message class and thinking class (golden effect)
  messageEl.classList.remove('live-message', 'thinking');
  messageEl.removeAttribute('id');

  // Re-enable send button when response is complete
  if (sendButton) {
    sendButton.disabled = false;
  }

  // Save to history (use filtered text)
  const aiMsg = {
    type: 'ai',
    content: filteredText, // Save filtered version
    timestamp: new Date(),
  };

  // Save to localStorage
  zantaraClient.addMessage(aiMsg);

  // Save to Memory Service (use filtered text)
  if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
    window.CONVERSATION_CLIENT.addMessage('assistant', filteredText).catch((error) => {
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

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.clearChatHistory = clearChatHistory;
  window.handleSend = handleSend; // Export handleSend for chat.html
  window.sendMessage = sendMessage; // Export sendMessage for chat.html
}
