/**
 * Bali Zero Stream Client - EventSource API Integration
 * Real-time chat streaming with auto-reconnect, back-pressure handling, and connection management
 * 
 * Performance targets:
 * - <100ms first token latency
 * - <50ms inter-token latency
 * - Automatic reconnection on disconnect
 * - Graceful error handling
 */

class BaliZeroStreamClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api/v2/bali-zero/chat-stream';
    this.eventSource = null;
    this.connectionId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.reconnectDelay = options.reconnectDelay || 1000; // Start with 1s
    this.maxReconnectDelay = options.maxReconnectDelay || 30000; // Max 30s
    this.onTokenCallback = options.onToken || null;
    this.onMetadataCallback = options.onMetadata || null;
    this.onCompleteCallback = options.onComplete || null;
    this.onErrorCallback = options.onError || null;
    this.onConnectCallback = options.onConnect || null;
    this.isConnected = false;
    this.isStreaming = false;
    this.heartbeatTimeout = null;
    this.heartbeatInterval = 35000; // 35 seconds (slightly less than server's 30s to avoid timeout)
    this.lastTokenTime = null;
    this.metrics = {
      firstTokenLatency: null,
      tokensReceived: 0,
      bytesReceived: 0,
      startTime: null,
      reconnectCount: 0
    };
  }

  /**
   * Start streaming chat
   */
  async stream(params) {
    const { query, user_email, user_role, conversation_history } = params;

    if (!query) {
      throw new Error('query is required');
    }

    // Stop existing stream if any
    if (this.isStreaming) {
      this.stop();
    }

    this.isStreaming = true;
    this.metrics.startTime = Date.now();
    this.metrics.tokensReceived = 0;
    this.metrics.bytesReceived = 0;
    this.metrics.firstTokenLatency = null;

    // Build URL with query parameters
    const urlParams = new URLSearchParams({
      query
    });

    if (user_email) urlParams.set('user_email', user_email);
    if (user_role) urlParams.set('user_role', user_role);
    if (conversation_history) {
      urlParams.set('conversation_history', JSON.stringify(conversation_history));
    }

    // Add reconnection headers if reconnecting
    if (this.connectionId && this.reconnectAttempts > 0) {
      urlParams.set('x-continuity-id', this.connectionId);
    }

    const url = `${this.baseUrl}?${urlParams.toString()}`;

    return new Promise((resolve, reject) => {
      try {
        this._connect(url, resolve, reject);
      } catch (error) {
        this.isStreaming = false;
        reject(error);
      }
    });
  }

  /**
   * Connect to SSE stream
   */
  _connect(url, resolve, reject) {
    // Cleanup previous connection
    if (this.eventSource) {
      this._cleanup();
    }

    console.log(`[StreamClient] Connecting to: ${url}`);

    this.eventSource = new EventSource(url);

    // Connection opened
    this.eventSource.onopen = (event) => {
      console.log('[StreamClient] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000; // Reset delay

      // Extract connection ID from headers if available
      // Note: EventSource doesn't expose custom headers, so we'll get it from first message

      if (this.onConnectCallback) {
        this.onConnectCallback({ connectionId: this.connectionId });
      }

      // Setup heartbeat monitoring
      this._setupHeartbeat();
    };

    // Handle messages
    this.eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleMessage(data);
      } catch (error) {
        console.error('[StreamClient] Failed to parse message:', error, event.data);
      }
    });

    // Handle heartbeat events
    this.eventSource.addEventListener('heartbeat', (event) => {
      try {
        const data = JSON.parse(event.data);
        this._handleHeartbeat(data);
      } catch (error) {
        console.error('[StreamClient] Failed to parse heartbeat:', error);
      }
    });

    // Handle errors
    this.eventSource.onerror = (error) => {
      console.error('[StreamClient] Connection error:', error);

      if (this.eventSource.readyState === EventSource.CLOSED) {
        this.isConnected = false;
        this._cleanup();

        // Attempt reconnection if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.isStreaming) {
          this._reconnect(url, resolve, reject);
        } else {
          this.isStreaming = false;
          const errorMsg = this.reconnectAttempts >= this.maxReconnectAttempts
            ? 'Max reconnection attempts exceeded'
            : 'Connection closed';
          
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error(errorMsg));
          }
          reject(new Error(errorMsg));
        }
      }
    };

    // Store resolve/reject for reconnection
    this._resolve = resolve;
    this._reject = reject;
    this._url = url;
  }

  /**
   * Handle incoming message
   */
  _handleMessage(data) {
    const { type, data: messageData, sequence, timestamp } = data;

    switch (type) {
      case 'token':
        // Track first token latency
        if (this.metrics.firstTokenLatency === null && this.metrics.startTime) {
          this.metrics.firstTokenLatency = Date.now() - this.metrics.startTime;
          console.log(`[StreamClient] First token latency: ${this.metrics.firstTokenLatency}ms`);
        }

        this.lastTokenTime = Date.now();
        this.metrics.tokensReceived++;
        this.metrics.bytesReceived += JSON.stringify(messageData).length;

        if (this.onTokenCallback) {
          this.onTokenCallback(messageData, {
            sequence,
            timestamp,
            metrics: { ...this.metrics }
          });
        }
        break;

      case 'metadata':
        // Extract connection ID if present
        if (messageData?.connectionId) {
          this.connectionId = messageData.connectionId;
        }

        if (this.onMetadataCallback) {
          this.onMetadataCallback(messageData, { sequence, timestamp });
        }
        break;

      case 'done':
        console.log('[StreamClient] Stream complete', {
          tokens: this.metrics.tokensReceived,
          firstTokenLatency: this.metrics.firstTokenLatency,
          duration: Date.now() - (this.metrics.startTime || Date.now())
        });

        this.isStreaming = false;
        this._cleanup();

        if (this.onCompleteCallback) {
          this.onCompleteCallback({
            metrics: {
              ...this.metrics,
              duration: Date.now() - (this.metrics.startTime || Date.now())
            },
            finalData: messageData
          });
        }

        if (this._resolve) {
          this._resolve({
            metrics: this.metrics,
            finalData: messageData
          });
        }
        break;

      case 'error':
        console.error('[StreamClient] Stream error:', messageData);
        this.isStreaming = false;
        this._cleanup();

        const error = new Error(messageData?.message || 'Stream error');
        if (this.onErrorCallback) {
          this.onErrorCallback(error, messageData);
        }

        if (this._reject) {
          this._reject(error);
        }
        break;

      default:
        console.warn('[StreamClient] Unknown message type:', type);
    }
  }

  /**
   * Handle heartbeat
   */
  _handleHeartbeat(data) {
    // Reset heartbeat timeout
    this._setupHeartbeat();
  }

  /**
   * Setup heartbeat monitoring
   */
  _setupHeartbeat() {
    // Clear existing timeout
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    // Set timeout to detect stale connections
    this.heartbeatTimeout = setTimeout(() => {
      if (this.isConnected) {
        console.warn('[StreamClient] Heartbeat timeout - connection may be stale');
        // Don't disconnect immediately, wait for EventSource to detect it
      }
    }, this.heartbeatInterval * 2); // Double the interval as threshold
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  _reconnect(url, resolve, reject) {
    this.reconnectAttempts++;
    this.metrics.reconnectCount++;
    
    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    ) + Math.random() * 1000; // Add jitter

    console.log(`[StreamClient] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.isStreaming) {
        this._connect(url, resolve, reject);
      }
    }, delay);
  }

  /**
   * Stop streaming
   */
  stop() {
    console.log('[StreamClient] Stopping stream');
    this.isStreaming = false;
    this._cleanup();

    if (this._reject) {
      this._reject(new Error('Stream stopped by user'));
      this._reject = null;
      this._resolve = null;
    }
  }

  /**
   * Cleanup resources
   */
  _cleanup() {
    this.isConnected = false;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      isStreaming: this.isStreaming,
      reconnectAttempts: this.reconnectAttempts,
      lastTokenTime: this.lastTokenTime
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaliZeroStreamClient;
} else if (typeof window !== 'undefined') {
  window.BaliZeroStreamClient = BaliZeroStreamClient;
}

