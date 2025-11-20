/* eslint-disable no-undef, no-console */
/**
 * ZANTARA Production Client v1.0
 *
 * Features:
 * - JWT Authentication
 * - Session tracking with localStorage
 * - SSE Streaming with buffer handling
 * - Markdown rendering
 * - Message history
 * - Proper error UI
 * - Loading states
 * - Retry logic with exponential backoff
 */

import { generateSessionId } from './utils/session-id.js';

class ZantaraClient {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://nuzantara-rag.fly.dev',
      authUrl: config.authUrl || 'https://nuzantara-rag.fly.dev',  // FIXED: Use RAG backend for auth
      authEndpoint: config.authEndpoint || '/api/auth/demo',  // FIXED: Correct demo auth endpoint
      chatEndpoint: config.chatEndpoint || '/bali-zero/chat',  // FIXED: Correct Bali-Zero endpoint
      streamEndpoint: config.streamEndpoint || '/bali-zero/chat-stream',  // SSE streaming endpoint
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      sessionKey: 'zantara-session',
      tokenKey: 'zantara-token',
      historyKey: 'zantara-history',
      ...config,
    };

    this.token = null;
    this.sessionId = null;
    this.messages = [];
    this.isStreaming = false;
    this.retryCount = 0;
    this.eventSource = null; // EventSource for SSE streaming

    // Initialize
    this.loadSession();
    this.loadHistory();
  }

  // ========================================================================
  // AUTHENTICATION
  // ========================================================================

  /**
   * Get or create JWT token
   */
  async authenticate(userId = 'demo') {
    try {
      // Check if token exists and is valid
      const storedToken = localStorage.getItem(this.config.tokenKey);
      if (storedToken) {
        const tokenData = JSON.parse(storedToken);
        if (tokenData.expiresAt > Date.now()) {
          this.token = tokenData.token;
          console.log('✅ Using cached JWT token');
          return this.token;
        }
      }

      // Get new token from auth backend (not RAG backend)
      const authUrl = window.API_CONFIG?.backend?.url || this.config.authUrl;
      console.log(`🔐 Authenticating via ${authUrl}${this.config.authEndpoint}...`);
      const response = await fetch(`${authUrl}${this.config.authEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.token = data.token;

      // Store token with expiry
      localStorage.setItem(
        this.config.tokenKey,
        JSON.stringify({
          token: this.token,
          expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
        })
      );

      console.log('✅ Authentication successful');
      return this.token;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw new Error('Authentication required. Please login again.');
    }
  }

  // ========================================================================
  // SESSION TRACKING
  // ========================================================================

  /**
   * Load or create session
   */
  loadSession() {
    const stored = localStorage.getItem(this.config.sessionKey);
    if (stored) {
      const session = JSON.parse(stored);
      this.sessionId = session.id;
      console.log(`📝 Loaded session: ${this.sessionId}`);
    } else {
      this.sessionId = this.generateSessionId();
      this.saveSession();
      console.log(`✨ Created new session: ${this.sessionId}`);
    }
  }

  saveSession() {
    localStorage.setItem(
      this.config.sessionKey,
      JSON.stringify({
        id: this.sessionId,
        createdAt: Date.now(),
        lastActivity: Date.now(),
      })
    );
  }

  generateSessionId() {
    return generateSessionId(); // Use shared utility
  }

  /**
   * Ensure session exists and return session ID for Redis store
   */
  async ensureSession() {
    let session = localStorage.getItem('zantara-session-id');
    if (!session) {
      session = this.sessionId; // Use existing sessionId from loadSession()
      localStorage.setItem('zantara-session-id', session);
    }
    return session;
  }

  /**
   * Update session history in Memory Service
   * Falls back to localStorage if Memory Service is unavailable
   */
  async updateSession(messages) {
    // Always save to localStorage as fallback
    this.saveHistory();
    console.log(`💾 Session saved to localStorage (${messages.length} messages)`);

    // Try to sync with Memory Service if CONVERSATION_CLIENT is available
    if (typeof window.CONVERSATION_CLIENT !== 'undefined') {
      try {
        const sessionId = await this.ensureSession();

        // Use CONVERSATION_CLIENT to update history
        await window.CONVERSATION_CLIENT.updateHistory(
          messages.slice(-50).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
          }))
        );

        console.log(`✅ Session synced to Memory Service: ${sessionId}`);
      } catch (error) {
        console.warn('⚠️ Failed to sync with Memory Service (using localStorage only):', error.message);
        // Don't throw - localStorage fallback is sufficient
      }
    }
  }

  // ========================================================================
  // MESSAGE HISTORY
  // ========================================================================

  /**
   * Load message history from localStorage
   */
  loadHistory() {
    try {
      const stored = localStorage.getItem(this.config.historyKey);
      if (stored) {
        this.messages = JSON.parse(stored);
        console.log(`📚 Loaded ${this.messages.length} messages from history`);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      this.messages = [];
    }
  }

  /**
   * Save message history to localStorage
   */
  saveHistory() {
    try {
      // Keep only last 50 messages
      const recentMessages = this.messages.slice(-50);
      localStorage.setItem(this.config.historyKey, JSON.stringify(recentMessages));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Add message to history
   */
  addMessage(message) {
    this.messages.push({
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: message.timestamp || new Date(),
    });
    this.saveHistory();
    this.saveSession(); // Update last activity
  }

  /**
   * Clear message history
   */
  clearHistory() {
    this.messages = [];
    localStorage.removeItem(this.config.historyKey);
    console.log('🗑️  History cleared');
  }

  // ========================================================================
  // CHAT API
  // ========================================================================

  /**
   * Send message and get response (non-streaming)
   */
  async sendMessage(query, options = {}) {
    try {
      await this.authenticate();

      const response = await this.fetchWithRetry(
        `${this.config.apiUrl}${this.config.chatEndpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
          },
          body: JSON.stringify({
            query,
            user_id: this.sessionId,
            stream: false,
            ...options,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return {
        content: data.data?.response || data.data?.answer || 'No response',
        sources: data.data?.sources || [],
        tools: data.data?.tools_used || [],  // Capture used tools
        metadata: {
          ...data.metadata,
          model: data.data?.model,
          tokens: data.data?.usage?.total_tokens,
          cost: data.data?.usage?.cost
        } || {},
      };
    } catch (error) {
      console.error('❌ sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Send message with SSE streaming (EventSource)
   */
  async sendMessageStream(query, callbacks = {}) {
    const {
      onStart = () => { },
      onToken = () => { },
      onComplete = () => { },
      onError = () => { },
    } = callbacks;

    try {
      await this.authenticate();
      this.isStreaming = true;
      onStart();

      // Update session with current messages
      await this.updateSession(this.messages);

      // Get session ID for Redis store
      const sessionId = await this.ensureSession();

      // Build URL with query parameters
      const url = new URL(`${this.config.apiUrl}/bali-zero/chat-stream`);
      url.searchParams.append('query', query);
      url.searchParams.append('session_id', sessionId);

      // Get user email from UserContext
      const userEmail = window.UserContext?.user?.email || 'demo@example.com';
      url.searchParams.append('user_email', userEmail);

      console.log(`🔌 Connecting to: ${url.toString()}`);

      // Use EventSource (no credentials - Fly.io blocks cross-domain credentials)
      this.eventSource = new EventSource(url.toString());
      let accumulatedText = '';

      // Log connection open
      this.eventSource.onopen = () => {
        console.log('✅ EventSource connection opened (readyState:', this.eventSource.readyState, ')');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // FIX #2: Check for done signal (server sends {done: true})
          if (data.done === true) {
            console.log('✅ Stream completed:', {
              duration: data.streamDuration,
              sequence: data.sequenceNumber
            });
            this.eventSource.close();
            this.isStreaming = false;
            onComplete(accumulatedText);
            return;
          }

          // FIX #3: Handle sources before done signal
          if (data.sources && Array.isArray(data.sources)) {
            console.log('📚 Sources received:', data.sources.length);
            // Store sources for later use (can be passed to onComplete)
            this._lastSources = data.sources;
            return;
          }

          // Extract token from various possible formats
          // Backend uses 'text' field with sequenceNumber
          const token = data.text || data.content || data.token || '';
          if (token) {
            accumulatedText += token;
            onToken(token, accumulatedText);
          }
        } catch (error) {
          console.warn('Failed to parse SSE data:', event.data, error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('❌ EventSource error:', {
          readyState: this.eventSource.readyState,
          url: this.eventSource.url,
          withCredentials: this.eventSource.withCredentials,
          error: error
        });

        // Check readyState to understand failure
        if (this.eventSource.readyState === EventSource.CONNECTING) {
          console.error('🔴 EventSource: Still connecting, connection refused or CORS blocked');
        } else if (this.eventSource.readyState === EventSource.CLOSED) {
          console.error('🔴 EventSource: Connection closed unexpectedly');
        }

        this.eventSource.close();
        this.isStreaming = false;

        // FIX #5: Pass accumulated text even on error (partial response)
        if (accumulatedText) {
          console.log('⚠️ Returning partial response on error:', accumulatedText.length, 'chars');
          onComplete(accumulatedText);
        } else {
          onError(error);
        }
      };

      // FIX #4: Reduced timeout from 60s to 20s (more reasonable for SSE)
      setTimeout(() => {
        if (this.isStreaming && accumulatedText) {
          console.warn('⚠️ Stream timeout after 20s, forcing completion');
          this.eventSource.close();
          this.isStreaming = false;
          onComplete(accumulatedText);
        }
      }, 20000); // 20 second timeout
    } catch (error) {
      console.error('❌ Streaming error:', error);
      this.isStreaming = false;
      if (this.eventSource) {
        this.eventSource.close();
      }
      onError(error);
      throw error;
    }
  }

  /**
   * Process SSE stream with proper buffer handling
   */
  async processSSEStream(response, onToken, onComplete) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulatedText = '';

    try {
      while (this.isStreaming) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining buffer
          if (buffer.trim()) {
            const token = this.parseSSEData(buffer);
            if (token) {
              accumulatedText += token;
              onToken(token, accumulatedText);
            }
          }
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (ending with double newline)
        const events = buffer.split('\n\n');

        // Keep last incomplete event in buffer
        buffer = events.pop() || '';

        // Process complete events
        for (const event of events) {
          if (!event.trim()) continue;

          const token = this.parseSSEData(event);
          if (token) {
            accumulatedText += token;
            onToken(token, accumulatedText);
          }
        }
      }

      this.isStreaming = false;
      onComplete(accumulatedText);
    } catch (error) {
      this.isStreaming = false;
      throw error;
    }
  }

  /**
   * Parse SSE data line
   */
  parseSSEData(event) {
    try {
      const lines = event.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            return null;
          }
          const data = JSON.parse(jsonStr);
          return data.token || data.content || data.text || '';
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to parse SSE data:', event, error);
      return null;
    }
  }

  /**
   * Stop ongoing stream
   */
  stopStream() {
    this.isStreaming = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    console.log('⏹️  Stream stopped');
  }

  // ========================================================================
  // RETRY LOGIC
  // ========================================================================

  /**
   * Fetch with exponential backoff retry
   */
  async fetchWithRetry(url, options, attempt = 0) {
    try {
      const response = await fetch(url, options);

      // Reset retry count on success
      if (response.ok) {
        this.retryCount = 0;
        return response;
      }

      // Don't retry 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Retry on 5xx errors
      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        console.error(`❌ Max retries (${this.config.maxRetries}) reached`);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = this.config.retryDelay * Math.pow(2, attempt);
      console.log(`🔄 Retry ${attempt + 1}/${this.config.maxRetries} in ${delay}ms...`);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, attempt + 1);
    }
  }

  // ========================================================================
  // MARKDOWN RENDERING
  // ========================================================================

  /**
   * Convert markdown to HTML (simple implementation)
   */
  renderMarkdown(text) {
    if (!text) return '';

    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.startsWith('<')) {
      html = `<p>${html}</p>`;
    }

    return html;
  }

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error) {
    if (!navigator.onLine) {
      return {
        type: 'network',
        title: 'No Internet Connection',
        message: 'Please check your internet connection and try again.',
        canRetry: true,
      };
    }

    const errorStr = error.toString().toLowerCase();

    if (errorStr.includes('timeout')) {
      return {
        type: 'timeout',
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        canRetry: true,
      };
    }

    if (errorStr.includes('401') || errorStr.includes('auth')) {
      return {
        type: 'auth',
        title: 'Authentication Error',
        message: 'Your session has expired. Please refresh the page.',
        canRetry: false,
      };
    }

    if (errorStr.includes('403')) {
      return {
        type: 'forbidden',
        title: 'Access Denied',
        message: "You don't have permission to access this resource.",
        canRetry: false,
      };
    }

    if (errorStr.includes('429')) {
      return {
        type: 'ratelimit',
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        canRetry: true,
      };
    }

    if (errorStr.includes('500') || errorStr.includes('503')) {
      return {
        type: 'server',
        title: 'Server Error',
        message: 'Our servers are experiencing issues. Please try again later.',
        canRetry: true,
      };
    }

    return {
      type: 'unknown',
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred. Please try again.',
      canRetry: true,
    };
  }
}

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.ZantaraClient = ZantaraClient;
}
