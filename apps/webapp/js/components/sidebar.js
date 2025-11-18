/**
 * ZANTARA Sidebar Component
 * Complete conversation management with:
 * - New Chat button
 * - Conversation history (max 50)
 * - Real-time search
 * - Delete conversations
 * - Auto title generation
 * - Inline title editing
 */

import { generateSessionId } from '../utils/session-id.js';

class ZantaraSidebar {
  constructor(config = {}) {
    this.maxConversations = config.maxConversations || 50;
    this.conversations = [];
    this.currentConversationId = null;
    this.searchQuery = '';
    this.storageKey = 'zantara-conversations-list';

    // DOM elements
    this.sidebar = null;
    this.content = null;
    this.searchBox = null;
    this.newChatBtn = null;

    this.init();
  }

  /**
   * Initialize sidebar
   */
  init() {
    this.setupDOM();
    this.loadConversations();
    this.setupEventListeners();
    this.render();
  }

  /**
   * Setup DOM elements
   */
  setupDOM() {
    this.sidebar = document.getElementById('conversationSidebar');
    this.content = document.getElementById('conversationSidebarContent');

    // Add search box and new chat button to header
    const header = this.sidebar?.querySelector('.conversation-sidebar-header');
    if (header && !header.querySelector('.sidebar-search')) {
      const searchHTML = `
        <div class="sidebar-search-wrapper" style="width: 100%; margin-top: 1rem;">
          <input
            type="text"
            class="sidebar-search"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            autocomplete="off"
          />
        </div>
        <button class="new-chat-btn" aria-label="Start new conversation">
          <span class="new-chat-icon">➕</span>
          <span class="new-chat-text">New Chat</span>
        </button>
      `;

      // Insert after title
      const title = header.querySelector('.conversation-sidebar-title');
      if (title) {
        title.insertAdjacentHTML('afterend', searchHTML);
      }

      this.searchBox = header.querySelector('.sidebar-search');
      this.newChatBtn = header.querySelector('.new-chat-btn');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    if (this.searchBox) {
      this.searchBox.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.render();
      });

      // Clear search on Escape
      this.searchBox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.searchBox.value = '';
          this.searchQuery = '';
          this.render();
        }
      });
    }

    // New Chat button
    if (this.newChatBtn) {
      this.newChatBtn.addEventListener('click', () => {
        this.createNewChat();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.searchBox?.focus();
      }

      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.createNewChat();
      }
    });
  }

  /**
   * Load conversations from storage
   */
  loadConversations() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.conversations = JSON.parse(stored).slice(0, this.maxConversations);
      }

      // Load current conversation ID
      const sessionInfo = window.CONVERSATION_CLIENT?.getSessionInfo();
      if (sessionInfo) {
        this.currentConversationId = sessionInfo.id;
      }

      console.log(`📂 Loaded ${this.conversations.length} conversations`);
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      this.conversations = [];
    }
  }

  /**
   * Save conversations to storage
   */
  saveConversations() {
    try {
      // Keep only max conversations
      const toSave = this.conversations.slice(0, this.maxConversations);
      localStorage.setItem(this.storageKey, JSON.stringify(toSave));
      console.log(`💾 Saved ${toSave.length} conversations`);
    } catch (error) {
      console.error('❌ Failed to save conversations:', error);
    }
  }

  /**
   * Create new chat
   */
  async createNewChat() {
    console.log('➕ Creating new chat...');

    // Save current conversation if exists
    if (this.currentConversationId && window.CONVERSATION_CLIENT) {
      await this.saveCurrentConversation();
    }

    // Clear current conversation
    if (window.CONVERSATION_CLIENT) {
      await window.CONVERSATION_CLIENT.clearConversation();
    }

    // Clear UI
    const messageSpace = document.getElementById('messageSpace');
    if (messageSpace) {
      messageSpace.innerHTML = `
        <div class="welcome-message">
          <p>Selamat datang di ZANTARA</p>
          <div class="welcome-divider"></div>
          <p class="welcome-blessing">Semoga kehadiran kami membawa cahaya dan kebijaksanaan dalam perjalanan Anda</p>
        </div>
      `;
    }

    // Create new session
    const userContext = window.USER_CONTEXT?.getUser();
    const userId = userContext?.userId || userContext?.id;
    const userEmail = userContext?.email;

    if (window.CONVERSATION_CLIENT && userId) {
      await window.CONVERSATION_CLIENT.createSession(userId, userEmail);
      this.currentConversationId = window.CONVERSATION_CLIENT.sessionId;
    }

    // Render sidebar
    this.render();

    // Smooth scroll to top
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }

    console.log('✅ New chat created');

    // Emit event for other components
    window.dispatchEvent(new CustomEvent('zantara:newchat', {
      detail: { conversationId: this.currentConversationId }
    }));
  }

  /**
   * Save current conversation to history
   */
  async saveCurrentConversation() {
    if (!this.currentConversationId) return;

    try {
      // Get messages from UI
      const messageElements = document.querySelectorAll('.message.user .message-text');
      if (messageElements.length === 0) return;

      // Get first user message for title
      const firstMessage = messageElements[0]?.textContent || '';
      const title = this.generateTitle(firstMessage);

      // Check if conversation already exists
      const existingIndex = this.conversations.findIndex(
        conv => conv.id === this.currentConversationId
      );

      const conversationData = {
        id: this.currentConversationId,
        title: title,
        firstMessage: firstMessage.substring(0, 100),
        lastMessageTime: Date.now(),
        createdAt: existingIndex >= 0
          ? this.conversations[existingIndex].createdAt
          : Date.now(),
        messageCount: messageElements.length
      };

      if (existingIndex >= 0) {
        // Update existing
        this.conversations[existingIndex] = conversationData;
      } else {
        // Add new
        this.conversations.unshift(conversationData);
      }

      // Trim to max
      if (this.conversations.length > this.maxConversations) {
        this.conversations = this.conversations.slice(0, this.maxConversations);
      }

      this.saveConversations();
      console.log(`💾 Saved conversation: ${title}`);
    } catch (error) {
      console.error('❌ Failed to save conversation:', error);
    }
  }

  /**
   * Generate conversation title from first message
   */
  generateTitle(message) {
    if (!message || message.trim() === '') {
      return `Conversation - ${new Date().toLocaleDateString()}`;
    }

    // Clean and truncate to 50 chars
    let title = message.trim().substring(0, 50);

    // Remove line breaks
    title = title.replace(/\n/g, ' ');

    // Add ellipsis if truncated
    if (message.length > 50) {
      title += '...';
    }

    return title;
  }

  /**
   * Load a conversation
   */
  async loadConversation(conversationId) {
    console.log(`📂 Loading conversation: ${conversationId}`);

    // Save current before switching
    if (this.currentConversationId && this.currentConversationId !== conversationId) {
      await this.saveCurrentConversation();
    }

    this.currentConversationId = conversationId;

    // Update localStorage session
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (conversation) {
      localStorage.setItem('zantara-conversation-session', JSON.stringify({
        id: conversationId,
        userId: window.USER_CONTEXT?.getUser()?.userId || window.USER_CONTEXT?.getUser()?.id,
        createdAt: conversation.createdAt,
        messageCount: conversation.messageCount
      }));
    }

    // Load messages from backend
    if (window.CONVERSATION_CLIENT) {
      window.CONVERSATION_CLIENT.sessionId = conversationId;
      const messages = await window.CONVERSATION_CLIENT.getHistory();

      // Render messages in UI
      this.renderMessages(messages);
    }

    // Update UI
    this.render();

    // Emit event
    window.dispatchEvent(new CustomEvent('zantara:conversationloaded', {
      detail: { conversationId }
    }));

    console.log(`✅ Conversation loaded`);
  }

  /**
   * Render messages in the UI
   */
  renderMessages(messages) {
    const messageSpace = document.getElementById('messageSpace');
    if (!messageSpace) return;

    // Clear current messages
    messageSpace.innerHTML = '';

    // Render each message
    messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.role === 'user' ? 'user' : 'ai'}`;

      messageDiv.innerHTML = `
        <div class="message-content">
          <p class="message-text">${this.escapeHtml(msg.content)}</p>
        </div>
      `;

      messageSpace.appendChild(messageDiv);
    });

    // Scroll to bottom
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTo({
          top: messagesContainer.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId, event) {
    if (event) {
      event.stopPropagation();
    }

    // Confirm deletion
    if (!confirm('Delete this conversation? This cannot be undone.')) {
      return;
    }

    console.log(`🗑️ Deleting conversation: ${conversationId}`);

    // Remove from array
    this.conversations = this.conversations.filter(c => c.id !== conversationId);
    this.saveConversations();

    // If it's the current conversation, create new chat
    if (this.currentConversationId === conversationId) {
      await this.createNewChat();
    } else {
      this.render();
    }

    console.log('✅ Conversation deleted');
  }

  /**
   * Edit conversation title
   */
  editTitle(conversationId, event) {
    event.stopPropagation();

    const titleElement = event.target;
    const currentTitle = titleElement.textContent;

    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'conversation-title-edit';
    input.maxLength = 50;

    // Replace title with input
    titleElement.replaceWith(input);
    input.focus();
    input.select();

    // Save on blur or Enter
    const saveTitle = () => {
      const newTitle = input.value.trim() || currentTitle;

      // Update conversation
      const conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.title = newTitle;
        this.saveConversations();
      }

      // Replace input with title
      const newTitleElement = document.createElement('div');
      newTitleElement.className = 'conversation-title';
      newTitleElement.textContent = newTitle;
      newTitleElement.title = 'Click to edit';
      input.replaceWith(newTitleElement);

      // Re-attach edit listener
      newTitleElement.addEventListener('click', (e) => this.editTitle(conversationId, e));
    };

    input.addEventListener('blur', saveTitle);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      } else if (e.key === 'Escape') {
        input.value = currentTitle;
        input.blur();
      }
    });
  }

  /**
   * Filter conversations by search query
   */
  filterConversations() {
    if (!this.searchQuery) {
      return this.conversations;
    }

    return this.conversations.filter(conv => {
      const titleMatch = conv.title.toLowerCase().includes(this.searchQuery);
      const messageMatch = conv.firstMessage?.toLowerCase().includes(this.searchQuery);
      return titleMatch || messageMatch;
    });
  }

  /**
   * Render sidebar content
   */
  render() {
    if (!this.content) return;

    const filtered = this.filterConversations();

    if (filtered.length === 0) {
      const emptyMessage = this.searchQuery
        ? `<div class="sidebar-empty">
             <p>No conversations found</p>
             <p class="sidebar-empty-hint">Try a different search term</p>
           </div>`
        : `<div class="sidebar-empty">
             <p>No conversations yet</p>
             <p class="sidebar-empty-hint">Start a new chat to begin</p>
           </div>`;

      this.content.innerHTML = emptyMessage;
      return;
    }

    // Render conversations
    this.content.innerHTML = filtered.map(conv => {
      const isActive = conv.id === this.currentConversationId;
      const date = new Date(conv.lastMessageTime || conv.createdAt || Date.now());
      const timeStr = this.formatTime(date);

      // Highlight matching text if searching
      let displayTitle = this.escapeHtml(conv.title);
      if (this.searchQuery) {
        const regex = new RegExp(`(${this.escapeRegex(this.searchQuery)})`, 'gi');
        displayTitle = displayTitle.replace(regex, '<mark>$1</mark>');
      }

      return `
        <div class="conversation-item ${isActive ? 'active' : ''}"
             data-conversation-id="${conv.id}"
             role="button"
             tabindex="0"
             aria-label="Load conversation: ${conv.title}">
          <div class="conversation-item-content">
            <div class="conversation-title" title="Click to edit">${displayTitle}</div>
            <div class="conversation-time">${timeStr}</div>
          </div>
          <button class="conversation-delete"
                  aria-label="Delete conversation"
                  title="Delete conversation">
            ✕
          </button>
        </div>
      `;
    }).join('');

    // Attach event listeners
    this.content.querySelectorAll('.conversation-item').forEach(item => {
      const convId = item.dataset.conversationId;

      // Click to load
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('conversation-delete') &&
            !e.target.classList.contains('conversation-title')) {
          this.loadConversation(convId);
        }
      });

      // Enter key to load
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.loadConversation(convId);
        }
      });

      // Delete button
      const deleteBtn = item.querySelector('.conversation-delete');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          this.deleteConversation(convId, e);
        });
      }

      // Edit title
      const titleElement = item.querySelector('.conversation-title');
      if (titleElement) {
        titleElement.addEventListener('click', (e) => {
          this.editTitle(convId, e);
        });
      }
    });
  }

  /**
   * Format timestamp
   */
  formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Escape regex special chars
   */
  escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Public API: Save current conversation
   */
  async save() {
    await this.saveCurrentConversation();
  }

  /**
   * Public API: Refresh conversation list
   */
  refresh() {
    this.loadConversations();
    this.render();
  }
}

// Initialize sidebar when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ZANTARA_SIDEBAR = new ZantaraSidebar();
  });
} else {
  window.ZANTARA_SIDEBAR = new ZantaraSidebar();
}

// Auto-save conversation on page unload
window.addEventListener('beforeunload', () => {
  if (window.ZANTARA_SIDEBAR) {
    window.ZANTARA_SIDEBAR.save();
  }
});

// Auto-save every 30 seconds
setInterval(() => {
  if (window.ZANTARA_SIDEBAR) {
    window.ZANTARA_SIDEBAR.save();
  }
}, 30000);

export default ZantaraSidebar;
