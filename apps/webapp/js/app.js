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
  console.log('🚀 ZANTARA Chat Application Starting...');

  const userContext = window.UserContext;
  if (!userContext || !userContext.isAuthenticated()) {
    // console.error('❌ Not authenticated');
    // window.location.href = '/login.html';
    // return;
  }

  displayUserInfo();

  const API_CONFIG = window.API_CONFIG || {
    rag: { url: 'https://nuzantara-rag.fly.dev' },
  };

  if (typeof window.ZantaraClient === 'undefined') {
    console.error('ZantaraClient not loaded!');
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

  // ... (rest of initialization same as original) ...
});

// ========================================================================
// FEATURE 1: UI Element for Agent Thoughts
// ========================================================================

function createThinkingElement() {
  const thinkingEl = document.createElement('div');
  thinkingEl.id = 'agent-thought-process';
  thinkingEl.className = 'agent-thought hidden';
  thinkingEl.innerHTML = `
    <div class="thought-icon">
      <div class="spinner-pulse"></div>
    </div>
    <span class="thought-text">Zantara is thinking...</span>
  `;
  // Insert at the bottom of message space
  const messageSpace = document.getElementById('messageSpace');
  messageSpace.appendChild(thinkingEl);
  return thinkingEl;
}

function updateThinking(text) {
  let el = document.getElementById('agent-thought-process');
  if (!el) el = createThinkingElement();
  
  el.classList.remove('hidden');
  const textSpan = el.querySelector('.thought-text');
  if (textSpan) textSpan.textContent = text;
  
  scrollToBottom();
}

function hideThinking() {
  const el = document.getElementById('agent-thought-process');
  if (el) el.classList.add('hidden');
}

// ========================================================================
// EVENT HANDLERS
// ========================================================================

function setupEventListeners() {
  messageInput.addEventListener('input', handleInputChange);
  messageInput.addEventListener('keydown', handleKeyDown);
  sendButton.addEventListener('click', handleSend);
  // ...
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
// RENDERING - ENHANCED FOR EMOTIONS & FEEDBACK
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
    textEl.innerHTML = zantaraClient.renderMarkdown(msg.content);
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
  if (textEl) textEl.innerHTML = zantaraClient.renderMarkdown(fullText);

  // FEATURE 2: Emotional UI
  if (metadata.emotion) {
    messageEl.classList.remove('emotion-calm', 'emotion-urgent', 'emotion-positive', 'emotion-neutral');
    
    const emotionMap = {
      'calm': 'emotion-calm',
      'analytical': 'emotion-calm',
      'urgent': 'emotion-urgent',
      'warning': 'emotion-urgent',
      'happy': 'emotion-positive',
      'success': 'emotion-positive',
      'neutral': 'emotion-neutral'
    };
    
    const emotionClass = emotionMap[metadata.emotion.toLowerCase()] || 'emotion-neutral';
    messageEl.classList.add(emotionClass);
  }

  // Add Sources
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
          </div>
        `).join('')}
      </div>
    `;
    messageEl.querySelector('.message-content').appendChild(sourcesEl);
  }

  // FEATURE 3: RLHF Feedback Loop
  const messageId = metadata.message_id || Date.now().toString();
  addFeedbackControls(messageEl, messageId);

  // Save to history
  const aiMsg = {
    type: 'ai',
    content: fullText,
    timestamp: new Date(),
    metadata: metadata
  };
  zantaraClient.addMessage(aiMsg);
  console.log('✅ Message saved');
}

function addFeedbackControls(messageEl, messageId) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'feedback-actions';
  actionsDiv.innerHTML = `
    <button class="feedback-btn" data-rating="positive" aria-label="Helpful">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
    </button>
    <button class="feedback-btn" data-rating="negative" aria-label="Not Helpful">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
    </button>
  `;

  const btns = actionsDiv.querySelectorAll('.feedback-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', function() {
      const rating = this.dataset.rating;
      btns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      window.zantaraClient.sendFeedback(messageId, rating);
    });
  });

  const contentEl = messageEl.querySelector('.message-content');
  if (contentEl) contentEl.appendChild(actionsDiv);
}

// ... (Utility functions like loadMessageHistory, showWelcomeMessage, scrollToBottom etc.) ...

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
