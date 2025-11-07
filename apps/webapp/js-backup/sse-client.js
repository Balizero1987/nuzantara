/**
 * ZANTARA SSE Streaming Client
 * Handles Server-Sent Events (SSE) streaming from /bali-zero/chat-stream
 *
 * Real-time word-by-word streaming like ChatGPT/Claude
 */

class ZantaraSSEClient {
  constructor() {
    this.eventSource = null;
    this.isStreaming = false;
    this.currentMessage = '';
    this.listeners = new Map();
    this.baseUrl = this.getAPIBase();
    this.currentSources = null;
    this.retryTimeout = null;
    this.lastStreamUrl = null;
    this.sessionId = null; // NEW: Session ID for Redis-based history (50+ messages)
    this.maxHistorySize = 50; // NEW: Support 50+ messages (was 20 with compression)
  }

  // Get API base URL for SSE streaming
  getAPIBase() {
    // ⚠️ IMPORTANT: SSE streaming is ONLY available on RAG Backend!
    // The TypeScript backend doesn't have /bali-zero/chat-stream endpoint.
    // Always use RAG backend for SSE, regardless of api-config.js settings.

    const RAG_BACKEND = 'https://nuzantara-rag.fly.dev';

    // Check if config explicitly overrides SSE endpoint
    if (window.ZANTARA_API?.config?.sse_backend) {
      console.log('[ZantaraSSE] Using custom SSE backend:', window.ZANTARA_API.config.sse_backend);
      return window.ZANTARA_API.config.sse_backend;
    }

    // Default: Always use RAG backend for SSE
    console.log('[ZantaraSSE] Using RAG backend for SSE streaming:', RAG_BACKEND);
    return RAG_BACKEND;
  }

  // Event listeners management
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this; // Allow chaining
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return this;
    const handlers = this.listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
    return this;
  }

  // Clear all listeners for a specific event
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error('[ZantaraSSE] Handler error:', err);
      }
    });
  }

  /**
   * Start SSE streaming
   *
   * @param {string} query - User message/question
   * @param {string} userEmail - Optional user email for personalization
   * @param {Array} conversationHistory - Optional conversation history for context
   * @param {Object} handlersContext - Optional handlers context for ZANTARA
   * @returns {Promise<string>} - Resolves with complete message when done
   */
  async stream(query, userEmail = null, conversationHistory = null, handlersContext = null) {
    if (this.isStreaming) {
      console.warn('[ZantaraSSE] Already streaming, stopping previous stream');
      this.stop();
    }

    return new Promise(async (resolve, reject) => {
      // Declare streamUrl outside try-catch so it's accessible in connect()
      let streamUrl;

      try {
        this.isStreaming = true;
        this.currentMessage = '';
        this.currentSources = null; // ← CITATIONS: Collect sources from SSE
        this.lastStreamUrl = null;

        // Get user email if not provided
        let email = userEmail;
        if (!email) {
          email =
            localStorage.getItem('zantara-email') || localStorage.getItem('zantara-user-email');
          if (!email || email === 'undefined' || email === 'null') {
            email = null;
          }
        }

        // ════════════════════════════════════════════════════════════════
        // NEW SESSION STORE ARCHITECTURE (50+ message support)
        // ════════════════════════════════════════════════════════════════
        // Update session with latest conversation history BEFORE streaming
        // This eliminates URL size constraints by storing history in Redis
        await this.updateSession(conversationHistory);

        // Get session ID (create if needed)
        const sessionId = await this.ensureSession();

        // BUILD STREAM URL WITH SESSION ID
        const url = new URL(`${this.baseUrl}/bali-zero/chat-stream`);
        url.searchParams.append('query', query);

        if (email) {
          url.searchParams.append('user_email', email);
        }

        // NEW: Send session_id instead of full conversation_history!
        if (sessionId) {
          url.searchParams.append('session_id', sessionId);
          console.log(`[ZantaraSSE] Using session store: ${sessionId} (50+ message support)`);
        } else {
          // FALLBACK: If session creation failed, use old compressed method
          console.warn('[ZantaraSSE] Session unavailable, falling back to querystring (15 msg limit)');
          const trimmed = conversationHistory && Array.isArray(conversationHistory)
            ? conversationHistory.slice(-15)
            : [];

          if (trimmed.length > 0) {
            const compressed = trimmed.map((msg) => ({
              r: msg.role.charAt(0),
              c: msg.content.substring(0, 250)
            }));
            url.searchParams.append('conversation_history', JSON.stringify(compressed));
          }
        }

        // 🚀 Add handlers context for ZANTARA
        if (handlersContext) {
          url.searchParams.append('handlers_context', JSON.stringify(handlersContext));
          console.log(
            '[ZantaraSSE] Sending handlers context:',
            handlersContext.available_tools,
            'tools available'
          );
        } else {
          // Try to get handlers context from localStorage
          const handlersFromCache = this.getHandlersContext();
          if (handlersFromCache) {
            url.searchParams.append('handlers_context', JSON.stringify(handlersFromCache));
            console.log(
              '[ZantaraSSE] Sending cached handlers context:',
              handlersFromCache.available_tools,
              'tools available'
            );
          }
        }

        streamUrl = url.toString();
        this.lastStreamUrl = streamUrl;

        // URL is now tiny! (~100 bytes instead of 4-5 KB)
        console.log(`[ZantaraSSE] Stream URL: ${streamUrl.length} chars (session-based ✨)`);
        this.lastStreamUrl = streamUrl;
      } catch (error) {
        console.error('[ZantaraSSE] Failed to prepare stream:', error);
        this.isStreaming = false;
        reject(error);
        return;
      }

      const clearRetry = () => {
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
          this.retryTimeout = null;
        }
      };

      const connect = () => {
        console.log('[ZantaraSSE] Connecting to:', streamUrl);
        this.eventSource = new EventSource(streamUrl, { withCredentials: false });

        // Emit start event on first connection
        this.emit('start', { query, userEmail });

        this.eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // ← CITATIONS: Capture sources before done signal
            if (data.sources) {
              this.currentSources = data.sources;
              this.emit('sources', { sources: data.sources });
            }

            // Check if stream is done
            if (data.done) {
              this.stop();
              this.emit('complete', {
                message: this.currentMessage,
                sources: this.currentSources,
              });
              resolve(this.currentMessage);
              return;
            }

            // Check for errors
            if (data.error) {
              this.stop();
              this.emit('error', { error: data.error });
              reject(new Error(data.error));
              return;
            }

            // Process text chunk
            if (data.text) {
              this.currentMessage += data.text;

              // Emit delta event for UI updates
              this.emit('delta', {
                chunk: data.text,
                message: this.currentMessage,
              });
            }
          } catch (err) {
            console.error('[ZantaraSSE] Failed to parse event data:', event.data, err);
            this.emit('parse-error', { error: err.message, data: event.data });
          }
        };

        this.eventSource.onerror = (error) => {
          console.warn('[ZantaraSSE] Connection error:', error);
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }

          this.emit('connection-error', { error });

          if (this.isStreaming) {
            clearRetry();
            this.retryTimeout = setTimeout(() => {
              console.warn('[ZantaraSSE] Attempting SSE reconnection…');
              connect();
            }, 2000);
          }
        };

        this.eventSource.onopen = () => {
          console.log('[ZantaraSSE] Connection established');
          clearRetry();
          this.emit('connected', {});
        };
      };

      connect();
    });
  }

  /**
   * Stop streaming and close connection
   */
  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.lastStreamUrl = null;
    this.isStreaming = false;
    this.emit('stop', { message: this.currentMessage });
  }

  /**
   * Check if currently streaming
   */
  getIsStreaming() {
    return this.isStreaming;
  }

  /**
   * Get current accumulated message
   */
  getCurrentMessage() {
    return this.currentMessage;
  }

  /**
   * Clear current message buffer
   */
  clearMessage() {
    this.currentMessage = '';
  }

  /**
   * Get handlers context from localStorage cache
   */
  getHandlersContext() {
    try {
      const cached = localStorage.getItem('zantara_handlers_registry');
      if (cached) {
        const parsed = JSON.parse(cached);

        // Check TTL (1 hour)
        if (Date.now() - parsed.timestamp < parsed.ttl) {
          return {
            available_tools: parsed.data.total,
            tools_summary: parsed.data.handlers,
            categories: parsed.data.categories,
            statistics: parsed.data.statistics,
            timestamp: parsed.timestamp,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('[ZantaraSSE] Error reading handlers cache:', error);
      return null;
    }
  }

  /**
   * Set handlers context in localStorage cache
   */
  setHandlersContext(handlersData) {
    try {
      const cacheData = {
        data: handlersData,
        timestamp: Date.now(),
        ttl: 3600000, // 1 hour
      };
      localStorage.setItem('zantara_handlers_registry', JSON.stringify(cacheData));
      console.log('[ZantaraSSE] Handlers context cached:', handlersData.total, 'handlers');
    } catch (error) {
      console.error('[ZantaraSSE] Error caching handlers context:', error);
    }
  }

  /**
   * Ensure we have a valid session ID (create one if needed)
   * Supports 50+ message conversations via Redis session store
   *
   * @returns {Promise<string|null>} Session ID or null if creation failed
   */
  async ensureSession() {
    // Check if we already have a session ID in memory
    if (this.sessionId) {
      console.log('[ZantaraSSE] Using existing session:', this.sessionId);
      return this.sessionId;
    }

    // Try to get cached session ID from localStorage
    const cached = localStorage.getItem('zantara-session-id');
    if (cached) {
      this.sessionId = cached;
      console.log('[ZantaraSSE] Using cached session:', cached);
      return cached;
    }

    // Create new session via backend
    try {
      console.log('[ZantaraSSE] Creating new session...');
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      localStorage.setItem('zantara-session-id', this.sessionId);

      console.log('[ZantaraSSE] Created new session:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      console.error('[ZantaraSSE] Failed to create session:', error);
      return null;
    }
  }

  /**
   * Update session with latest conversation history
   *
   * @param {Array} conversationHistory - Conversation history array
   * @returns {Promise<boolean>} True if update succeeded
   */
  async updateSession(conversationHistory) {
    const sessionId = await this.ensureSession();
    if (!sessionId) {
      console.warn('[ZantaraSSE] No session ID, skipping update');
      return false;
    }

    try {
      // Trim to max size (50 messages - much better than 20!)
      let trimmed = conversationHistory;
      if (trimmed && trimmed.length > this.maxHistorySize) {
        trimmed = trimmed.slice(-this.maxHistorySize);
        console.log(`[ZantaraSSE] Trimmed history from ${conversationHistory.length} to ${this.maxHistorySize}`);
      }

      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({history: trimmed || []})
      });

      if (!response.ok) {
        throw new Error(`Failed to update session: ${response.status}`);
      }

      console.log(`[ZantaraSSE] Updated session with ${trimmed?.length || 0} messages`);
      return true;
    } catch (error) {
      console.error('[ZantaraSSE] Failed to update session:', error);
      return false;
    }
  }

  /**
   * Clear current session (useful for "new conversation")
   */
  clearSession() {
    this.sessionId = null;
    localStorage.removeItem('zantara-session-id');
    console.log('[ZantaraSSE] Session cleared');
  }
}

// Create singleton instance
const zantaraSSE = new ZantaraSSEClient();

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.ZANTARA_SSE = zantaraSSE;

  // Log availability
  console.log('[ZantaraSSE] Client initialized and ready');
  console.log('[ZantaraSSE] API Base:', zantaraSSE.baseUrl);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZantaraSSEClient;
}
