// ZANTARA Resilient Streaming Client with Advanced Reconnection
// Handles network interruptions, context preservation, and telemetry
// Enhanced version with SSE resilience and monitoring capabilities

class StreamingClient {
  constructor() {
    this.abortController = null;
    this.isStreaming = false;
    this.currentBuffer = '';
    this.listeners = new Map();

    // Reconnection state
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // 1 second
    this.maxReconnectDelay = 30000; // 30 seconds
    this.reconnectBackoffFactor = 1.5;

    // Context preservation
    this.sessionContext = {
      sessionId: null,
      messages: [],
      lastChunkTimestamp: null,
      streamContinuityId: null
    };

    // Telemetry
    this.telemetry = {
      connections: 0,
      disconnections: 0,
      reconnections: 0,
      totalReconnectTime: 0,
      lastDisconnectReason: null,
      averageReconnectTime: 0,
      uptimeStart: Date.now()
    };

    // Health monitoring
    this.heartbeatInterval = null;
    this.lastHeartbeat = null;
    this.heartbeatTimeout = 45000; // 45 seconds (server sends every 30s)

    // Stream integrity
    this.expectedSequenceNumber = 0;
    this.receivedChunks = new Map();

    // Feature flag for resilient mode
    this.useResilientMode = window.ZANTARA_CONFIG?.resilientStreaming ?? true;
  }

  // Event listeners management
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const handlers = this.listeners.get(event);
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (err) {
        console.error('[StreamingClient] Handler error:', err);
      }
    });
  }

  // Get API base URL from config
  getAPIBase() {
    // Use the getStreamingUrl helper if available
    if (window.ZANTARA_API?.getStreamingUrl) {
      return window.ZANTARA_API.getStreamingUrl();
    }

    // Fallback to config
    const config = window.ZANTARA_API?.config;
    if (!config) {
      console.warn('[StreamingClient] No ZANTARA_API config found');
      return 'https://zantara-v520-production-1064094238013.europe-west1.run.app/api/chat';
    }

    const isProxy = config.mode === 'proxy';
    if (isProxy && config.proxy?.production?.base) {
      return `${config.proxy.production.base}/chat`;
    }
    return `${config.production?.base || 'https://zantara-v520-production-1064094238013.europe-west1.run.app'}/api/chat`;
  }

  // Calculate exponential backoff delay
  calculateReconnectDelay() {
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(this.reconnectBackoffFactor, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    // Add jitter to prevent thundering herd
    const jitter = delay * 0.1 * Math.random();
    return Math.floor(delay + jitter);
  }

  // Generate continuity ID for stream verification
  generateContinuityId() {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Verify stream continuity
  verifyStreamContinuity(chunk) {
    if (chunk.sequenceNumber !== undefined) {
      if (chunk.sequenceNumber < this.expectedSequenceNumber) {
        console.warn('[StreamingClient] Duplicate chunk received:', chunk.sequenceNumber);
        return false;
      }
      this.expectedSequenceNumber = chunk.sequenceNumber + 1;
    }

    // Update heartbeat
    this.lastHeartbeat = Date.now();
    this.sessionContext.lastChunkTimestamp = this.lastHeartbeat;

    return true;
  }

  // Start heartbeat monitoring
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - (this.lastHeartbeat || now);

      if (timeSinceLastHeartbeat > this.heartbeatTimeout) {
        console.warn('[StreamingClient] Heartbeat timeout, initiating reconnection');
        this.handleDisconnection('heartbeat_timeout');
      }
    }, 10000); // Check every 10 seconds
  }

  // Stop heartbeat monitoring
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Handle disconnection gracefully
  handleDisconnection(reason = 'unknown') {
    if (this.isStreaming && this.useResilientMode) {
      console.log(`[StreamingClient] Disconnection detected: ${reason}`);
      this.telemetry.disconnections++;
      this.telemetry.lastDisconnectReason = reason;

      // Stop current stream
      this.isStreaming = false;
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }

      // Notify listeners
      this.emit('disconnection', { reason, context: this.sessionContext });

      // Attempt reconnection if within limits
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      } else {
        console.error('[StreamingClient] Max reconnection attempts reached');
        this.emit('reconnection_failed', {
          attempts: this.reconnectAttempts,
          lastError: reason
        });
      }
    }
  }

  // Attempt reconnection with exponential backoff
  async attemptReconnection() {
    this.reconnectAttempts++;
    const delay = this.calculateReconnectDelay();

    console.log(`[StreamingClient] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.emit('reconnection_attempt', {
      attempt: this.reconnectAttempts,
      delay,
      maxAttempts: this.maxReconnectAttempts
    });

    // Wait before reconnection
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      // Record reconnection start time for telemetry
      const reconnectStartTime = Date.now();

      // Attempt to reconnect with preserved context
      await this.streamChat(
        this.sessionContext.messages,
        this.sessionContext.sessionId,
        true // isReconnection flag
      );

      // Record successful reconnection
      const reconnectDuration = Date.now() - reconnectStartTime;
      this.telemetry.reconnections++;
      this.telemetry.totalReconnectTime += reconnectDuration;
      this.telemetry.averageReconnectTime = this.telemetry.totalReconnectTime / this.telemetry.reconnections;

      // Reset reconnection state on success
      this.reconnectAttempts = 0;

      console.log(`[StreamingClient] Reconnection successful in ${reconnectDuration}ms`);
      this.emit('reconnection_success', {
        duration: reconnectDuration,
        attempt: this.reconnectAttempts
      });

    } catch (error) {
      console.error(`[StreamingClient] Reconnection attempt ${this.reconnectAttempts} failed:`, error);

      // Continue trying or give up
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnection();
      } else {
        this.emit('reconnection_failed', {
          attempts: this.reconnectAttempts,
          lastError: error.message
        });
      }
    }
  }

  // Enhanced main streaming function with reconnection support
  async streamChat(messages, sessionId = null, isReconnection = false) {
    // Handle concurrent streaming
    if (this.isStreaming && !isReconnection) {
      console.warn('[StreamingClient] Already streaming, aborting previous');
      this.stop();
    }

    // Update session context
    if (!isReconnection) {
      this.sessionContext = {
        sessionId: sessionId || `sess_${Date.now()}`,
        messages: messages,
        lastChunkTimestamp: null,
        streamContinuityId: this.generateContinuityId()
      };
      this.expectedSequenceNumber = 0;
      this.reconnectAttempts = 0;
    }

    this.isStreaming = true;
    this.currentBuffer = '';
    this.abortController = new AbortController();

    const url = this.getAPIBase(); // Now returns the full URL including /chat
    this.telemetry.connections++;

    try {
      // Emit appropriate event
      if (isReconnection) {
        this.emit('reconnection_start', { sessionId, messages });
      } else {
        this.emit('start', { sessionId, messages });
      }

      // Get user ID
      const userId = window.ZANTARA_ID?.get?.() || localStorage.getItem('zantara-user-id') || '';

      // Enhanced headers for reconnection support
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/x-ndjson',
        'x-user-id': userId
      };

      // Add reconnection-specific headers if resilient mode is enabled
      if (this.useResilientMode) {
        headers['x-session-id'] = this.sessionContext.sessionId;
        headers['x-continuity-id'] = this.sessionContext.streamContinuityId;

        if (isReconnection) {
          headers['x-reconnection'] = 'true';
          headers['x-last-chunk-timestamp'] = this.sessionContext.lastChunkTimestamp || '';
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          sessionId: this.sessionContext.sessionId,
          messages: this.sessionContext.messages,
          continuityId: this.sessionContext.streamContinuityId,
          isReconnection: isReconnection,
          lastChunkTimestamp: this.sessionContext.lastChunkTimestamp
        }),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body available');
      }

      // Start heartbeat monitoring if resilient mode is enabled
      if (this.useResilientMode) {
        this.startHeartbeat();
        this.lastHeartbeat = Date.now();
      }

      // Process streaming response with enhanced error handling
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        try {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          let lineEnd;
          while ((lineEnd = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (!line) continue;

            try {
              const chunk = JSON.parse(line);

              // Verify stream continuity if resilient mode is enabled
              if (this.useResilientMode && !this.verifyStreamContinuity(chunk)) {
                continue; // Skip duplicate/invalid chunks
              }

              this.handleChunk(chunk);

            } catch (err) {
              console.error('[StreamingClient] Failed to parse chunk:', line, err);
              this.emit('chunk_error', { line, error: err.message });
            }
          }
        } catch (readError) {
          console.error('[StreamingClient] Stream read error:', readError);
          if (this.useResilientMode) {
            this.handleDisconnection('read_error');
          }
          return;
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer.trim());
          if (this.useResilientMode && !this.verifyStreamContinuity(chunk)) {
            // Skip final verification if needed
          } else {
            this.handleChunk(chunk);
          }
        } catch (err) {
          console.error('[StreamingClient] Failed to parse final chunk:', buffer, err);
        }
      }

      // Successful completion
      if (this.useResilientMode) {
        this.stopHeartbeat();
      }
      this.emit('complete', {});

    } catch (err) {
      if (this.useResilientMode) {
        this.stopHeartbeat();
      }

      if (err.name === 'AbortError') {
        this.emit('abort', {});
      } else {
        console.error('[StreamingClient] Stream error:', err);
        if (this.useResilientMode) {
          this.handleDisconnection(err.name || 'network_error');
        } else {
          this.emit('error', { error: err.message });
        }
      }
    } finally {
      if (!isReconnection) {
        this.isStreaming = false;
        this.abortController = null;
      }
    }
  }

  // Enhanced chunk handling with sequence number support
  handleChunk(chunk) {
    // Handle heartbeat chunks
    if (chunk.type === 'heartbeat') {
      this.lastHeartbeat = Date.now();
      this.emit('heartbeat', { timestamp: this.lastHeartbeat });
      return;
    }

    // Handle continuity verification
    if (chunk.type === 'continuity_check') {
      this.emit('continuity_verified', {
        streamId: chunk.streamId,
        sequenceNumber: chunk.sequenceNumber
      });
      return;
    }

    // Original chunk handling logic
    if (chunk.type === 'delta') {
      this.currentBuffer += chunk.content || '';
      this.emit('delta', {
        content: chunk.content,
        buffer: this.currentBuffer,
        sequenceNumber: chunk.sequenceNumber
      });

    } else if (chunk.type === 'tool') {
      if (chunk.status === 'start') {
        this.emit('tool-start', {
          name: chunk.name,
          args: chunk.args
        });
      } else if (chunk.status === 'result') {
        this.emit('tool-result', {
          name: chunk.name,
          data: chunk.data
        });
      }

    } else if (chunk.type === 'final') {
      this.currentBuffer = chunk.content || '';
      this.emit('final', {
        content: chunk.content,
        sequenceNumber: chunk.sequenceNumber
      });

    } else if (chunk.event === 'done') {
      this.emit('done', {});
    }
  }

  // Enhanced stop method
  stop() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.stopHeartbeat();
    this.isStreaming = false;
    this.reconnectAttempts = 0; // Reset reconnection state

    this.emit('stop', {});
  }

  // Get telemetry data for Prometheus
  getTelemetry() {
    const uptime = Date.now() - this.telemetry.uptimeStart;

    return {
      ...this.telemetry,
      uptime,
      currentReconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isStreaming: this.isStreaming,
      lastHeartbeatAge: this.lastHeartbeat ? Date.now() - this.lastHeartbeat : null,
      connectionSuccessRate: this.telemetry.connections > 0 ?
        ((this.telemetry.connections - this.telemetry.disconnections) / this.telemetry.connections * 100).toFixed(2) + '%' : '0%'
    };
  }

  // Export metrics in Prometheus format
  getPrometheusMetrics() {
    const telemetry = this.getTelemetry();
    const timestamp = Date.now();

    return `
# HELP zantara_sse_connections_total Total number of SSE connections initiated
# TYPE zantara_sse_connections_total counter
zantara_sse_connections_total ${telemetry.connections} ${timestamp}

# HELP zantara_sse_disconnections_total Total number of SSE disconnections
# TYPE zantara_sse_disconnections_total counter
zantara_sse_disconnections_total ${telemetry.disconnections} ${timestamp}

# HELP zantara_sse_reconnections_total Total number of successful reconnections
# TYPE zantara_sse_reconnections_total counter
zantara_sse_reconnections_total ${telemetry.reconnections} ${timestamp}

# HELP zantara_sse_reconnect_duration_seconds Average reconnection duration
# TYPE zantara_sse_reconnect_duration_seconds gauge
zantara_sse_reconnect_duration_seconds ${(telemetry.averageReconnectTime / 1000).toFixed(2)} ${timestamp}

# HELP zantara_sse_uptime_seconds Total uptime in seconds
# TYPE zantara_sse_uptime_seconds counter
zantara_sse_uptime_seconds ${(telemetry.uptime / 1000).toFixed(0)} ${timestamp}

# HELP zantara_sse_currently_streaming Whether streaming is currently active
# TYPE zantara_sse_currently_streaming gauge
zantara_sse_currently_streaming ${telemetry.isStreaming ? 1 : 0} ${timestamp}

# HELP zantara_sse_heartbeat_age_seconds Time since last heartbeat
# TYPE zantara_sse_heartbeat_age_seconds gauge
zantara_sse_heartbeat_age_seconds ${telemetry.lastHeartbeatAge ? (telemetry.lastHeartbeatAge / 1000).toFixed(1) : 'NaN'} ${timestamp}
    `.trim();
  }

  // Legacy methods for compatibility
  getIsStreaming() {
    return this.isStreaming;
  }

  getCurrentBuffer() {
    return this.currentBuffer;
  }

  // Reset all state (useful for testing or manual recovery)
  reset() {
    this.stop();
    this.currentBuffer = '';
    this.sessionContext = {
      sessionId: null,
      messages: [],
      lastChunkTimestamp: null,
      streamContinuityId: null
    };
    this.expectedSequenceNumber = 0;
    console.log('[StreamingClient] State reset');
  }
}

// Create singleton instance
const streamingClient = new StreamingClient();

// Expose to window for global access with resilient features
if (typeof window !== 'undefined') {
  window.ZANTARA_STREAMING_CLIENT = streamingClient;
  window.ZANTARA_RESILIENT_STREAMING = streamingClient;
  // Keep legacy name for backward compatibility
  window.ZANTARA_STREAMING = streamingClient;

  // Expose metrics endpoint if not already present
  if (!window.ZANTARA_METRICS) {
    window.ZANTARA_METRICS = {
      getSSEMetrics: () => streamingClient.getPrometheusMetrics(),
      getSSETelemetry: () => streamingClient.getTelemetry()
    };
  }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StreamingClient;
}