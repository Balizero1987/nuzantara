/**
 * ZANTARA Conversation Client
 * Manages conversation history persistence via Memory Service
 *
 * NOTE: This client connects DIRECTLY to the Memory Service microservice,
 * not through the backend-ts. This is intentional because:
 *
 * 1. Memory Service is a standalone microservice (nuzantara-memory.fly.dev)
 * 2. It manages persistent storage (PostgreSQL + Redis)
 * 3. It has its own API and architecture
 * 4. Direct connection reduces latency and complexity
 *
 * Other clients (CRM, Agents) go through backend-ts because they use
 * proxy services to Python backend. This is different.
 *
 * Features:
 * - Create new conversation sessions
 * - Load conversation history
 * - Update messages in real-time
 * - Automatic session management
 */

import { API_CONFIG } from './api-config.js';
import { generateSessionId } from './utils/session-id.js';

class ZantaraConversationClient {
  constructor(config = {}) {
    // Use centralized API_CONFIG for memory service URL
    this.memoryServiceUrl = config.memoryServiceUrl || API_CONFIG.memory.url;
    this.sessionId = null;
    this.userId = null;
    this.userEmail = null;
    this.maxHistorySize = config.maxHistorySize || 50;
  }

  /**
   * Initialize or restore conversation session
   */
  async initializeSession(userId, userEmail) {
    console.log(`💬 [ConversationClient] Initializing session for user: ${userId}`);

    this.userId = userId;
    this.userEmail = userEmail || null;

    // Check if we have an existing session in localStorage
    const storedSession = localStorage.getItem('zantara-conversation-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        this.sessionId = session.id;
        console.log(`✅ [ConversationClient] Restored session: ${this.sessionId}`);

        // Verify session exists on server
        const history = await this.getHistory();
        if (history) {
          console.log(`✅ [ConversationClient] Session verified, ${history.length} messages loaded`);
          return this.sessionId;
        }
      } catch (error) {
        console.warn('⚠️ [ConversationClient] Failed to restore session:', error.message);
      }
    }

    // Create new session
    return await this.createSession(userId, userEmail);
  }

  /**
   * Create new conversation session
   */
  async createSession(userId, userEmail) {
    try {
      this.sessionId = generateSessionId(userId); // Use shared utility

      const response = await fetch(`${this.memoryServiceUrl}/api/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: userId,
          member_name: userEmail,
          metadata: {
            user_email: userEmail,
            platform: 'ZANTARA_Web',
            created_at: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const result = await response.json();

      // Store session in localStorage
      localStorage.setItem('zantara-conversation-session', JSON.stringify({
        id: this.sessionId,
        userId: userId,
        createdAt: Date.now(),
        messageCount: 0
      }));

      console.log(`✅ [ConversationClient] New session created: ${this.sessionId}`);
      return this.sessionId;

    } catch (error) {
      console.error('❌ [ConversationClient] Failed to create session:', error);
      // Use session ID anyway for local storage
      return this.sessionId;
    }
  }

  /**
   * Get conversation history
   */
  async getHistory(limit = null) {
    if (!this.sessionId) {
      console.warn('⚠️ [ConversationClient] No active session');
      return [];
    }

    try {
      const url = limit
        ? `${this.memoryServiceUrl}/api/conversation/${this.sessionId}?limit=${limit}`
        : `${this.memoryServiceUrl}/api/conversation/${this.sessionId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('ℹ️ [ConversationClient] No history found (new session)');
          return [];
        }
        throw new Error(`Failed to get history: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.messages) {
        console.log(`✅ [ConversationClient] Loaded ${result.messages.length} messages`);
        return result.messages;
      }

      return [];

    } catch (error) {
      console.error('❌ [ConversationClient] Failed to get history:', error);
      // Notify user about Memory Service unavailability
      this._notifyUser('Could not load conversation history from server. Using local storage.', 'warning');
      return [];
    }
  }

  /**
   * Add message to conversation
   */
  async addMessage(role, content) {
    if (!this.sessionId) {
      console.warn('⚠️ [ConversationClient] No active session, message not persisted');
      return false;
    }

    try {
      // Get current history
      const history = await this.getHistory();

      // Add new message
      const newMessage = {
        role: role, // 'user' or 'assistant'
        content: content,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [...history, newMessage];

      // Trim if exceeds max size
      if (updatedHistory.length > this.maxHistorySize) {
        updatedHistory.splice(0, updatedHistory.length - this.maxHistorySize);
      }

      // Update session
      await this.updateHistory(updatedHistory);

      return true;

    } catch (error) {
      console.error('❌ [ConversationClient] Failed to add message:', error);
      // Notify user about persistence failure
      this._notifyUser('Message saved locally only. Server sync unavailable.', 'warning');
      return false;
    }
  }

  /**
   * Update conversation history
   */
  async updateHistory(messages) {
    if (!this.sessionId) {
      console.warn('⚠️ [ConversationClient] No active session');
      return false;
    }

    try {
      const newMessages = this._getUnsyncedMessages(messages);

      if (newMessages.length === 0) {
        this._updateSessionMetadata(messages.length);
        return true;
      }

      for (const message of newMessages) {
        await this._storeMessage(message);
      }

      this._updateSessionMetadata(messages.length);
      console.log(`✅ [ConversationClient] History synced (${messages.length} messages)`);
      return true;

    } catch (error) {
      console.error('❌ [ConversationClient] Failed to update history:', error);
      // Notify user about sync failure
      this._notifyUser('Conversation sync failed. Changes saved locally only.', 'warning');
      return false;
    }
  }

  /**
   * Clear conversation (start fresh)
   */
  async clearConversation() {
    if (this.sessionId) {
      await this.updateHistory([]);
    }
    localStorage.removeItem('zantara-conversation-session');
    this.sessionId = null;
    console.log('✅ [ConversationClient] Conversation cleared');
  }

  /**
   * Get session info
   */
  getSessionInfo() {
    const storedSession = localStorage.getItem('zantara-conversation-session');
    if (storedSession) {
      return JSON.parse(storedSession);
    }
    return null;
  }

  /**
   * Determine which messages still need to be synced with the server
   */
  _getUnsyncedMessages(messages) {
    try {
      const storedSession = this.getSessionInfo();
      const syncedCount = storedSession?.syncedCount ?? storedSession?.messageCount ?? 0;

      if (syncedCount >= messages.length) {
        return [];
      }

      return messages.slice(syncedCount);
    } catch {
      return messages;
    }
  }

  async _storeMessage(message) {
    const payload = {
      session_id: this.sessionId,
      user_id: this.userId || 'anonymous',
      message_type: this._normalizeRole(message),
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
      metadata: {
        platform: 'ZANTARA_Web',
        timestamp: message.timestamp || new Date().toISOString(),
        user_email: this.userEmail || undefined,
        ...message.metadata,
      }
    };

    const response = await fetch(`${this.memoryServiceUrl}/api/conversation/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to store message: ${response.status}`);
    }
  }

  _normalizeRole(message) {
    const role = message?.role || message?.type || 'system';
    if (role === 'assistant' || role === 'user' || role === 'system') {
      return role;
    }
    return role === 'ai' ? 'assistant' : 'user';
  }

  _updateSessionMetadata(messageCount) {
    const storedSession = this.getSessionInfo() || {
      id: this.sessionId,
      userId: this.userId,
      createdAt: Date.now(),
    };
    storedSession.messageCount = messageCount;
    storedSession.syncedCount = messageCount;
    storedSession.lastActivity = Date.now();
    localStorage.setItem('zantara-conversation-session', JSON.stringify(storedSession));
  }

  /**
   * Notify user about Memory Service issues
   * Uses window.showNotification if available, otherwise console.warn
   */
  _notifyUser(message, type = 'warning') {
    // Only show notification once per session to avoid spam
    const notificationKey = `memory-service-notification-${type}`;
    const lastNotification = sessionStorage.getItem(notificationKey);
    const now = Date.now();

    // Show notification max once every 5 minutes
    if (lastNotification && (now - parseInt(lastNotification)) < 300000) {
      return;
    }

    sessionStorage.setItem(notificationKey, now.toString());

    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.warn(`[ConversationClient] ${message}`);
    }
  }
}

// Create global instance
window.CONVERSATION_CLIENT = new ZantaraConversationClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraConversationClient;
}
