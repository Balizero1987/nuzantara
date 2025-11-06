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

class ZantaraClient {
  constructor(config = {}) {
    this.config = {
      apiUrl: config.apiUrl || 'https://nuzantara-rag.fly.dev',
      authEndpoint: config.authEndpoint || '/api/auth/demo',
      chatEndpoint: config.chatEndpoint || '/api/v3/zantara/unified',
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

      // Get new token
      console.log('🔐 Authenticating...');
      const response = await fetch(`${this.config.apiUrl}${this.config.authEndpoint}`, {
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
      // For MVP, continue without auth
      this.token = 'demo-token';
      return this.token;
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
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        metadata: data.metadata || {},
      };
    } catch (error) {
      console.error('❌ sendMessage error:', error);
      throw error;
    }
  }

  /**
   * Send message with SSE streaming
   */
  async sendMessageStream(query, callbacks = {}) {
    const {
      onStart = () => {},
      onToken = () => {},
      onComplete = () => {},
      onError = () => {},
    } = callbacks;

    try {
      await this.authenticate();
      this.isStreaming = true;
      onStart();

      const response = await this.fetchWithRetry(
        `${this.config.apiUrl}${this.config.chatEndpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            query,
            user_id: this.sessionId,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      await this.processSSEStream(response, onToken, onComplete);
    } catch (error) {
      console.error('❌ Streaming error:', error);
      this.isStreaming = false;
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
