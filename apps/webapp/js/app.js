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
import { logger } from './core/logger.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/+esm';
import { loadClient } from './utils/lazy-loader.js';

// Initialize Error Handler
const errorHandler = new ErrorHandler();

// ... (Collective Memory imports omitted for brevity, same as original) ...

// Global client reference (state managed by StateManager)
let zantaraClient;
let availableTools = []; 
let currentStreamingMessage = null;

// DOM elements
let messageSpace, messageInput, sendButton, quickActions, messagesContainer;

/**
 * Initialize application
 */
document.addEventListener('DOMContentLoaded', async function () {
  logger.log('🚀 ZANTARA Chat Application Starting...');

  const userContext = window.UserContext;
  if (!userContext || !userContext.isAuthenticated()) {
    // console.error('❌ Not authenticated');
    // window.location.href = '/login.html';
    // return;
  }

  displayUserInfo();

  const API_CONFIG = window.API_CONFIG || {
    backend: { url: 'https://nuzantara-backend.fly.dev' },
    rag: { url: 'https://nuzantara-rag.fly.dev' },
    memory: { url: 'https://nuzantara-memory.fly.dev' },
  };

  if (typeof window.ZantaraClient === 'undefined') {
    logger.error('ZantaraClient not loaded!');
    return;
  }

  zantaraClient = new window.ZantaraClient({
    apiUrl: API_CONFIG.rag.url,
    chatEndpoint: '/bali-zero/chat',
    streamEndpoint: '/bali-zero/chat-stream',
    maxRetries: 3,
  });

  messageSpace = document.getElementById('messageSpace');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  quickActions = document.querySelectorAll('.quick-action');
  messagesContainer = document.querySelector('.messages-container');

  await loadMessageHistory();
  setupEventListeners();

  // Lazy load non-critical clients when needed
  setupLazyLoading();

  // ... (rest of initialization same as original) ...
});

/**
 * Setup lazy loading for non-critical clients
 */
async function setupLazyLoading() {
  // Load clients only when their functionality is accessed
  // This improves initial page load performance
  
  // Example: Load CRM client when CRM features are accessed
  // Example: Load Agents client when agent features are accessed
  // Example: Load System Handlers when tools are needed
  // Example: Load Collective Memory when memory features are accessed
  // Example: Load Timesheet when timesheet widget is needed
  
  // For now, we keep the clients available but they can be loaded on-demand
  // when specific features are triggered
}

// FEATURE 1: UI Element for Agent Thoughts
function createThinkingElement() {
  const thinkingEl = document.createElement('div');
  thinkingEl.id = 'agent-thought-process';
  thinkingEl.className = 'agent-thought hidden';
  thinkingEl.innerHTML = DOMPurify.sanitize(`
    <div class="thought-icon">
      <div class="spinner-pulse"></div>
    </div>
    <span class="thought-text">Zantara is thinking...</span>
  `);
  // Insert at the bottom of message space
  const messageSpace = document.getElementById('messageSpace');
  messageSpace.appendChild(thinkingEl);
  return thinkingEl;
}

// updateThinking function moved below to avoid duplication - see line 377

/* function hideThinking() removed to avoid duplication */

// ========================================================================
// EVENT HANDLERS
// ========================================================================

function setupEventListeners() {
  // Store handlers for cleanup
  eventListeners.input = handleInputChange;
  eventListeners.keydown = handleKeyDown;
  eventListeners.click = handleSend;
  
  messageInput.addEventListener('input', eventListeners.input);
  messageInput.addEventListener('keydown', eventListeners.keydown);
  sendButton.addEventListener('click', eventListeners.click);
  // ...
}

/**
 * Cleanup event listeners to prevent memory leaks
 */
function cleanupEventListeners() {
  if (messageInput && eventListeners.input) {
    messageInput.removeEventListener('input', eventListeners.input);
  }
  if (messageInput && eventListeners.keydown) {
    messageInput.removeEventListener('keydown', eventListeners.keydown);
  }
  if (sendButton && eventListeners.click) {
    sendButton.removeEventListener('click', eventListeners.click);
  }
  
  // Clear references
  eventListeners.input = null;
  eventListeners.keydown = null;
  eventListeners.click = null;
}

function handleInputChange() {
  sendButton.disabled = false;
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

function handleSend() {
  const content = messageInput.value.trim();
  if (!content) return;
  if (zantaraClient && zantaraClient.isStreaming) return;

  sendMessage(content);
}

// ========================================================================
// MESSAGING LOGIC - ENHANCED
// ========================================================================

async function sendMessage(content) {
  // Add user message
  const userMsg = { type: 'user', content: content, timestamp: new Date() };
  renderMessage(userMsg, true);

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';
  sendButton.disabled = false;

  // Show typing indicator (fallback)
  // showTypingIndicator(); // Replaced by updateThinking logic

  try {
    await zantaraClient.sendMessageStream(content, {
      onStart: () => {
        // FEATURE 1: Show thoughts
        updateThinking("Initializing agents...");
        currentStreamingMessage = createLiveMessage();
        stateManager.state.isStreaming = true;
      },
      onStatus: (statusText) => {
        // FEATURE 1: Update thoughts
        updateThinking(statusText);
      },
      onToken: (token, fullText) => {
        updateLiveMessage(currentStreamingMessage, fullText);
      },
      onComplete: async (fullText, metadata) => {
        // FEATURE 1: Hide thoughts
        hideThinking();
        finalizeLiveMessage(currentStreamingMessage, fullText, metadata);
        currentStreamingMessage = null;
        stateManager.state.isStreaming = false;
      },
      onError: (error) => {
        hideThinking();
        handleSendError(error);
      },
    });
  } catch (error) {
    hideThinking();
    handleSendError(error);
  }
}

function handleSendError(error) {
  const errorInfo = zantaraClient.getErrorMessage(error);
  const errorMsg = {
    type: 'error',
    content: errorInfo.message,
    title: errorInfo.title,
    canRetry: errorInfo.canRetry,
    timestamp: new Date(),
  };
  renderMessage(errorMsg, false);
}

// ========================================================================
// RENDERING - ENHANCED FOR EMOTIONS
// ========================================================================

function renderMessage(msg, saveToHistory = true) {
  // ... (Standard rendering logic, same as before) ...
  const messageEl = document.createElement('div');
  messageEl.className = `message ${msg.type}`;
  
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  
  if (msg.type === 'ai') {
    // Sanitize markdown output to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(zantaraClient.renderMarkdown(msg.content));
    textEl.innerHTML = sanitizedContent;
  } else {
    textEl.textContent = msg.content;
  }
  
  contentEl.appendChild(textEl);
  messageEl.appendChild(contentEl);
  messageSpace.appendChild(messageEl);
  scrollToBottom();

  if (saveToHistory) {
    zantaraClient.addMessage(msg);
  }
  return messageEl;
}

function createLiveMessage() {
  const messageEl = document.createElement('div');
  messageEl.className = 'message ai live-message';
  messageEl.id = 'liveMessage';
  
  const contentEl = document.createElement('div');
  contentEl.className = 'message-content';
  
  const textEl = document.createElement('div');
  textEl.className = 'message-text';
  
  contentEl.appendChild(textEl);
  messageEl.appendChild(contentEl);
  messageSpace.appendChild(messageEl);
  scrollToBottom();
  
  return messageEl;
}

function updateLiveMessage(messageEl, text) {
  if (!messageEl) messageEl = document.getElementById('liveMessage');
  if (!messageEl) return;
  
  const textEl = messageEl.querySelector('.message-text');
  if (textEl) textEl.textContent = text; // Raw text during stream
  scrollToBottom();
}

function finalizeLiveMessage(messageEl, fullText, metadata = {}) {
  if (!messageEl) messageEl = document.getElementById('liveMessage');
  if (!messageEl) return;

  messageEl.classList.remove('live-message');
  messageEl.removeAttribute('id');

  // Render Markdown
  const textEl = messageEl.querySelector('.message-text');
  if (textEl) {
    // Sanitize markdown output to prevent XSS
    const sanitizedContent = DOMPurify.sanitize(zantaraClient.renderMarkdown(fullText));
    textEl.innerHTML = sanitizedContent;
  }

  // FEATURE 2: Emotional UI
  if (metadata.emotion) {
    applyEmotionalStyling(messageEl, metadata.emotion);
  }

  // Add Sources
  if (metadata.sources && metadata.sources.length > 0) {
    const sourcesEl = document.createElement('div');
    sourcesEl.className = 'message-sources';
    sourcesEl.innerHTML = DOMPurify.sanitize(`
      <div class="sources-header">📚 Sources (${metadata.sources.length})</div>
      <div class="sources-list">
        ${metadata.sources.map((source, idx) => `
          <div class="source-item">
            <span class="source-number">${idx + 1}</span>
            <span class="source-snippet">${source.snippet || source.source}</span>
          </div>
        `).join('')}
      </div>
    `;
    messageEl.querySelector('.message-content').appendChild(sourcesEl);
  }


  // Save to history
  const aiMsg = {
    type: 'ai',
    content: fullText,
    timestamp: new Date(),
    metadata: metadata
  };
  zantaraClient.addMessage(aiMsg);
  logger.log('✅ Message saved');
}


// ... (Utility functions like loadMessageHistory, showWelcomeMessage, scrollToBottom etc.) ...

// FEATURE 2: Emotional UI - Dynamic Styling
function applyEmotionalStyling(messageEl, emotion) {
  if (!messageEl || !emotion) return;

  // Remove existing emotion classes
  messageEl.classList.remove('emotion-calm', 'emotion-urgent', 'emotion-positive', 'emotion-neutral');

  // Map emotion words to CSS classes
  const emotionMap = {
    'calm': 'emotion-calm',
    'analytical': 'emotion-calm',
    'information': 'emotion-calm',
    'neutral': 'emotion-neutral',
    'urgent': 'emotion-urgent',
    'warning': 'emotion-urgent',
    'critical': 'emotion-urgent',
    'positive': 'emotion-positive',
    'happy': 'emotion-positive',
    'success': 'emotion-positive',
    'good': 'emotion-positive'
  };

  // Apply the new emotion class
  const emotionClass = emotionMap[emotion.toLowerCase()] || 'emotion-neutral';
  messageEl.classList.add(emotionClass);

  logger.debug(`🎭 Applied emotional styling: ${emotion} -> ${emotionClass}`);
}

// FEATURE 1: Agent Thoughts - UI Update
function updateThinking(text) {
  let el = document.getElementById('agent-thought-process');
  if (!el) {
    el = document.createElement('div');
    el.id = 'agent-thought-process';
    el.className = 'agent-thought';
    el.innerHTML = DOMPurify.sanitize(`
      <div class="spinner-pulse"></div>
      <span class="thought-text">Thinking...</span>
    `;
    messageSpace.appendChild(el);
  }

  el.classList.remove('hidden');
  const textSpan = el.querySelector('.thought-text');
  if (textSpan) {
    const displayText = text.length > 80 ? text.substring(0, 77) + '...' : text;
    textSpan.textContent = displayText;
  }
  scrollToBottom();
}

function hideThinking() {
  const el = document.getElementById('agent-thought-process');
  if (el) {
    el.classList.add('hidden');
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

function loadMessageHistory() {
  // Basic implementation
  const msgs = zantaraClient.messages;
  if (msgs.length) {
    messageSpace.innerHTML = '';
    msgs.forEach(m => renderMessage(m, false));
  } else {
    showWelcomeMessage();
  }
}

function showWelcomeMessage() {
  renderMessage({ type: 'ai', content: 'Selamat datang di ZANTARA. How can I help you today?', timestamp: new Date() }, false);
}

function displayUserInfo() {
  // Basic implementation
}
