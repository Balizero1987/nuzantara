/**
 * ZANTARA Conversation Client
 * Manages conversation history persistence via Memory Service
 *
 * Features:
 * - Create new conversation sessions
 * - Load conversation history
 * - Update messages in real-time
 * - Automatic session management
 */

import { API_CONFIG } from './api-config.js';

class ZantaraConversationClient {
  constructor(config = {}) {
    // Use centralized API_CONFIG for memory service URL
    this.memoryServiceUrl = config.memoryServiceUrl || API_CONFIG.memory.url;
    this.sessionId = null;
    this.userId = null;
    this.maxHistorySize = config.maxHistorySize || 50;
  }

  /**
   * Initialize or restore conversation session
   */
  async initializeSession(userId, userEmail) {
    console.log(`💬 [ConversationClient] Initializing session for user: ${userId}`);

    this.userId = userId;

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
      this.sessionId = `session_${Date.now()}_${userId}`;

      const response = await fetch(`${this.memoryServiceUrl}/api/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          user_id: userId,
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
      const response = await fetch(`${this.memoryServiceUrl}/api/conversation/${this.sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history: messages
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update history: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update localStorage message count
        const storedSession = localStorage.getItem('zantara-conversation-session');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          session.messageCount = messages.length;
          session.lastActivity = Date.now();
          localStorage.setItem('zantara-conversation-session', JSON.stringify(session));
        }

        console.log(`✅ [ConversationClient] History updated (${messages.length} messages)`);
        return true;
      }

      return false;

    } catch (error) {
      console.error('❌ [ConversationClient] Failed to update history:', error);
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
}

// Create global instance
window.CONVERSATION_CLIENT = new ZantaraConversationClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraConversationClient;
}
