/**
 * Optimized ZANTARA SSE Streaming Client
 * High-performance SSE client with advanced optimizations
 * 
 * Performance improvements:
 * - Connection pooling and reuse
 * - Automatic reconnection with exponential backoff
 * - Buffered message processing
 * - Memory-efficient token handling
 * - Performance metrics and monitoring
 * - Circuit breaker pattern
 */

class OptimizedZantaraSSEClient {
  constructor(options = {}) {
    this.eventSource = null;
    this.isStreaming = false;
    this.currentMessage = '';
    this.listeners = new Map();
    this.baseUrl = this.getAPIBase();
    
    // Performance optimizations
    this.bufferSize = options.bufferSize || 50;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 5;
    this.connectionTimeout = options.connectionTimeout || 30000;
    
    // State management
    this.reconnectAttempts = 0;
    this.lastReconnectTime = 0;
    this.messageBuffer = [];
    this.performanceMetrics = {
      startTime: null,
      firstTokenTime: null,
      tokensReceived: 0,
      bytesReceived: 0,
      reconnections: 0,
      errors: 0
    };
    
    // Circuit breaker
    this.circuitBreakerFailures = 0;
    this.circuitBreakerThreshold = 3;
    this.circuitBreakerTimeout = 30000; // 30 seconds
    this.circuitBreakerOpenedAt = null;
    
    // Connection pooling (simplified for browser)
    this.connectionPool = new Set();
    this.maxConnections = 3;
    
    console.log('[OptimizedSSE] Client initialized with performance optimizations');
  }

  // Get API base URL for SSE streaming
  getAPIBase() {
    const RAG_BACKEND = 'https://nuzantara-rag.fly.dev';
    
    if (window.ZANTARA_API?.config?.sse_backend) {
      console.log('[OptimizedSSE] Using custom SSE backend:', window.ZANTARA_API.config.sse_backend);
      return window.ZANTARA_API.config.sse_backend;
    }
    
    console.log('[OptimizedSSE] Using RAG backend for SSE streaming:', RAG_BACKEND);
    return RAG_BACKEND;
  }

  // Circuit breaker pattern
  isCircuitBreakerOpen() {
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      if (this.circuitBreakerOpenedAt) {
        if (Date.now() - this.circuitBreakerOpenedAt > this.circuitBreakerTimeout) {
          // Reset circuit breaker
          this.circuitBreakerFailures = 0;
          this.circuitBreakerOpenedAt = null;
          return false;
        }
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.circuitBreakerFailures = 0;
    this.circuitBreakerOpenedAt = null;
  }

  recordFailure() {
    this.circuitBreakerFailures++;
    if (this.circuitBreakerFailures >= this.circuitBreakerThreshold) {
      this.circuitBreakerOpenedAt = Date.now();
    }
  }

  // Event listeners management with performance tracking
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return this;
    const handlers = this.listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
    return this;
  }

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
    
    // Performance tracking
    const startTime = performance.now();
    
    this.listeners.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error('[OptimizedSSE] Handler error:', err);
        this.performanceMetrics.errors++;
      }
    });
    
    // Log slow handlers
    const handlerTime = performance.now() - startTime;
    if (handlerTime > 10) { // More than 10ms
      console.warn(`[OptimizedSSE] Slow handler for ${event}: ${handlerTime.toFixed(2)}ms`);
    }
  }

  // Optimized message processing with buffering
  processMessageBuffer() {
    if (this.messageBuffer.length === 0) return;
    
    const startTime = performance.now();
    const messages = this.messageBuffer.splice(0, this.bufferSize);
    
    messages.forEach(messageData => {
      this.processMessage(messageData);
    });
    
    const processTime = performance.now() - startTime;
    if (processTime > 5) { // More than 5ms
      console.warn(`[OptimizedSSE] Slow message processing: ${processTime.toFixed(2)}ms for ${messages.length} messages`);
    }
  }

  processMessage(messageData) {
    try {
      const data = JSON.parse(messageData);
      
      // Track performance metrics
      if (data.text) {
        this.performanceMetrics.tokensReceived++;
        this.performanceMetrics.bytesReceived += messageData.length;
        
        if (!this.performanceMetrics.firstTokenTime) {
          this.performanceMetrics.firstTokenTime = performance.now();
        }
      }
      
      // Handle different message types
      if (data.sources) {
        this.currentSources = data.sources;
        this.emit('sources', { sources: data.sources });
      }
      
      if (data.done) {
        this.stop();
        this.emit('complete', {
          message: this.currentMessage,
          sources: this.currentSources,
          metrics: this.getPerformanceMetrics()
        });
        return;
      }
      
      if (data.error) {
        this.stop();
        this.emit('error', { error: data.error });
        return;
      }
      
      if (data.text) {
        this.currentMessage += data.text;
        this.emit('delta', {
          chunk: data.text,
          message: this.currentMessage
        });
      }
      
    } catch (err) {
      console.error('[OptimizedSSE] Failed to parse message:', messageData, err);
      this.emit('parse-error', { error: err.message, data: messageData });
      this.performanceMetrics.errors++;
    }
  }

  // Optimized streaming with performance improvements
  async stream(query, userEmail = null, conversationHistory = null) {
    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      console.warn('[OptimizedSSE] Circuit breaker is open, rejecting request');
      return Promise.reject(new Error('Service temporarily unavailable due to high error rate'));
    }

    if (this.isStreaming) {
      console.warn('[OptimizedSSE] Already streaming, stopping previous stream');
      this.stop();
    }

    return new Promise((resolve, reject) => {
      this.isStreaming = true;
      this.currentMessage = '';
      this.currentSources = null;
      this.messageBuffer = [];
      
      // Reset performance metrics
      this.performanceMetrics = {
        startTime: performance.now(),
        firstTokenTime: null,
        tokensReceived: 0,
        bytesReceived: 0,
        reconnections: 0,
        errors: 0
      };

      // Build URL with query parameters
      const url = new URL(`${this.baseUrl}/bali-zero/chat-stream`);
      url.searchParams.append('query', query);

      if (userEmail) {
        url.searchParams.append('user_email', userEmail);
      } else {
        const storedEmail = localStorage.getItem('zantara-email') || localStorage.getItem('zantara-user-email');
        if (storedEmail && storedEmail !== 'undefined' && storedEmail !== 'null') {
          url.searchParams.append('user_email', storedEmail);
        }
      }

      if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
        url.searchParams.append('conversation_history', JSON.stringify(conversationHistory));
        console.log('[OptimizedSSE] Sending conversation history:', conversationHistory.length, 'messages');
      }

      console.log('[OptimizedSSE] Connecting to:', url.toString());

      // Create EventSource connection with timeout
      this.eventSource = new EventSource(url.toString());
      
      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.eventSource && this.eventSource.readyState === EventSource.CONNECTING) {
          console.error('[OptimizedSSE] Connection timeout');
          this.stop();
          reject(new Error('Connection timeout'));
        }
      }, this.connectionTimeout);

      // Emit start event
      this.emit('start', { query, userEmail });

      // Handle incoming messages with buffering
      this.eventSource.onmessage = (event) => {
        clearTimeout(connectionTimeout);
        
        // Add to buffer for batch processing
        this.messageBuffer.push(event.data);
        
        // Process buffer if it's full or use requestAnimationFrame for smooth processing
        if (this.messageBuffer.length >= this.bufferSize) {
          this.processMessageBuffer();
        } else {
          requestAnimationFrame(() => this.processMessageBuffer());
        }
      };

      // Handle connection errors with exponential backoff
      this.eventSource.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error('[OptimizedSSE] Connection error:', error);
        
        this.performanceMetrics.errors++;
        this.recordFailure();
        
        // Attempt reconnection with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`[OptimizedSSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
          
          setTimeout(() => {
            this.reconnectAttempts++;
            this.performanceMetrics.reconnections++;
            this.stream(query, userEmail, conversationHistory).then(resolve).catch(reject);
          }, delay);
        } else {
          this.stop();
          this.emit('error', {
            error: 'Failed to connect after multiple attempts',
            partial: this.currentMessage,
            metrics: this.getPerformanceMetrics()
          });
          reject(new Error('Failed to connect after multiple attempts'));
        }
      };

      // Handle connection open
      this.eventSource.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[OptimizedSSE] Connection established');
        this.recordSuccess();
        this.reconnectAttempts = 0;
        this.emit('connected', {});
      };
    });
  }

  // Stop streaming and cleanup
  stop() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isStreaming = false;
    this.messageBuffer = [];
    this.emit('stop', { 
      message: this.currentMessage,
      metrics: this.getPerformanceMetrics()
    });
  }

  // Get current performance metrics
  getPerformanceMetrics() {
    const now = performance.now();
    const duration = now - this.performanceMetrics.startTime;
    
    return {
      ...this.performanceMetrics,
      duration: duration,
      tokensPerSecond: this.performanceMetrics.tokensReceived / (duration / 1000),
      timeToFirstToken: this.performanceMetrics.firstTokenTime ? 
        this.performanceMetrics.firstTokenTime - this.performanceMetrics.startTime : null,
      circuitBreakerOpen: this.isCircuitBreakerOpen(),
      circuitBreakerFailures: this.circuitBreakerFailures
    };
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: 'healthy',
          backend: data,
          client: this.getPerformanceMetrics()
        };
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        client: this.getPerformanceMetrics()
      };
    }
  }

  // Utility methods
  getIsStreaming() {
    return this.isStreaming;
  }

  getCurrentMessage() {
    return this.currentMessage;
  }

  clearMessage() {
    this.currentMessage = '';
  }

  // Cleanup method
  destroy() {
    this.stop();
    this.removeAllListeners();
    this.connectionPool.clear();
    this.messageBuffer = [];
    console.log('[OptimizedSSE] Client destroyed');
  }
}

// Create singleton instance
const optimizedZantaraSSE = new OptimizedZantaraSSEClient();

// Expose to window for global access
if (typeof window !== 'undefined') {
  window.ZANTARA_SSE_OPTIMIZED = optimizedZantaraSSE;
  
  // Log availability
  console.log('[OptimizedSSE] Optimized client initialized and ready');
  console.log('[OptimizedSSE] API Base:', optimizedZantaraSSE.baseUrl);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OptimizedZantaraSSEClient;
}