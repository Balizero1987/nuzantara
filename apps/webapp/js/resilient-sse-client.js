/**
 * Resilient SSE Client with Exponential Backoff and Auto-Reconnection
 * ZANTARA WebApp Production-Ready SSE Handler
 */

class ResilientSSEClient {
  constructor(config = {}) {
    // Configuration with defaults
    this.url = config.url || 'https://nuzantara-rag.fly.dev/bali-zero/chat-stream';
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.initialReconnectDelay = config.initialReconnectDelay || 1000; // 1 second
    this.maxReconnectDelay = config.maxReconnectDelay || 30000; // 30 seconds
    this.backoffMultiplier = config.backoffMultiplier || 1.5;
    this.heartbeatInterval = config.heartbeatInterval || 30000; // 30 seconds
    this.messageTimeout = config.messageTimeout || 60000; // 60 seconds

    // State management
    this.eventSource = null;
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.initialReconnectDelay;
    this.isConnected = false;
    this.lastMessageTime = Date.now();
    this.heartbeatTimer = null;
    this.messageTimeoutTimer = null;
    this.connectionId = null;

    // Event handlers
    this.onMessage = config.onMessage || ((data) => console.log('SSE Message:', data));
    this.onError = config.onError || ((error) => console.error('SSE Error:', error));
    this.onConnect = config.onConnect || (() => console.log('SSE Connected'));
    this.onDisconnect = config.onDisconnect || (() => console.log('SSE Disconnected'));
    this.onReconnecting = config.onReconnecting || ((attempt) => console.log(`Reconnecting... Attempt ${attempt}`));

    // Metrics
    this.metrics = {
      connectCount: 0,
      disconnectCount: 0,
      errorCount: 0,
      messagesReceived: 0,
      reconnectAttempts: 0,
      totalUptime: 0,
      lastConnectTime: null
    };

    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.reconnect = this.reconnect.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
  }

  /**
   * Establish SSE connection
   */
  connect(queryParams = {}) {
    if (this.eventSource) {
      this.disconnect();
    }

    // Generate connection ID for tracking
    this.connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Build URL with query parameters
    const url = new URL(this.url);
    Object.keys(queryParams).forEach(key => {
      url.searchParams.append(key, queryParams[key]);
    });
    url.searchParams.append('connection_id', this.connectionId);

    console.log(`[SSE] Connecting to: ${url.toString()}`);
    console.log(`[SSE] Connection ID: ${this.connectionId}`);

    try {
      this.eventSource = new EventSource(url.toString());

      // Set up event listeners
      this.eventSource.onopen = this.handleOpen;
      this.eventSource.onmessage = this.handleMessage;
      this.eventSource.onerror = this.handleError;

      // Custom event types
      this.eventSource.addEventListener('ping', (event) => {
        console.log('[SSE] Ping received:', event.data);
        this.lastMessageTime = Date.now();
      });

      this.eventSource.addEventListener('metadata', (event) => {
        console.log('[SSE] Metadata received:', event.data);
        this.lastMessageTime = Date.now();
      });

      this.eventSource.addEventListener('complete', (event) => {
        console.log('[SSE] Stream complete:', event.data);
        this.lastMessageTime = Date.now();
      });

      // Start monitoring
      this.startHeartbeatMonitor();
      this.startMessageTimeoutMonitor();

      this.metrics.connectCount++;
      this.metrics.lastConnectTime = Date.now();

    } catch (error) {
      console.error('[SSE] Connection error:', error);
      this.handleError(error);
    }
  }

  /**
   * Handle successful connection
   */
  handleOpen(event) {
    console.log('[SSE] Connection opened');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.initialReconnectDelay;
    this.lastMessageTime = Date.now();
    this.onConnect();
  }

  /**
   * Handle incoming messages
   */
  handleMessage(event) {
    this.lastMessageTime = Date.now();
    this.metrics.messagesReceived++;

    try {
      const data = JSON.parse(event.data);

      // Handle different message types
      if (data.type === 'heartbeat') {
        console.log('[SSE] Heartbeat received');
        return;
      }

      if (data.type === 'error') {
        console.error('[SSE] Server error:', data.message);
        this.onError(new Error(data.message));
        return;
      }

      // Pass to handler
      this.onMessage(data);

    } catch (error) {
      // Handle non-JSON messages
      if (event.data && event.data.trim() !== '') {
        this.onMessage({ text: event.data });
      }
    }
  }

  /**
   * Handle connection errors
   */
  handleError(event) {
    console.error('[SSE] Connection error:', event);
    this.metrics.errorCount++;

    if (this.eventSource) {
      const readyState = this.eventSource.readyState;

      if (readyState === EventSource.CLOSED) {
        console.log('[SSE] Connection closed');
        this.isConnected = false;
        this.metrics.disconnectCount++;
        this.onDisconnect();

        // Clear monitoring timers
        this.stopHeartbeatMonitor();
        this.stopMessageTimeoutMonitor();

        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        } else {
          console.error('[SSE] Max reconnection attempts reached');
          this.onError(new Error('Max reconnection attempts reached'));
        }
      }
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  reconnect() {
    this.reconnectAttempts++;
    this.metrics.reconnectAttempts++;

    console.log(`[SSE] Reconnecting in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.onReconnecting(this.reconnectAttempts);

    setTimeout(() => {
      console.log(`[SSE] Reconnection attempt ${this.reconnectAttempts}`);

      // Save original query params
      const originalParams = this.eventSource ?
        Object.fromEntries(new URL(this.eventSource.url).searchParams) : {};

      // Remove connection_id as we'll get a new one
      delete originalParams.connection_id;

      // Reconnect
      this.connect(originalParams);

      // Update delay for next attempt (exponential backoff)
      this.reconnectDelay = Math.min(
        this.reconnectDelay * this.backoffMultiplier,
        this.maxReconnectDelay
      );
    }, this.reconnectDelay);
  }

  /**
   * Manually disconnect
   */
  disconnect() {
    if (this.eventSource) {
      console.log('[SSE] Disconnecting...');
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      this.metrics.disconnectCount++;

      // Clear timers
      this.stopHeartbeatMonitor();
      this.stopMessageTimeoutMonitor();

      // Update uptime
      if (this.metrics.lastConnectTime) {
        this.metrics.totalUptime += Date.now() - this.metrics.lastConnectTime;
      }

      this.onDisconnect();
    }
  }

  /**
   * Start heartbeat monitoring
   */
  startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();

    this.heartbeatTimer = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;

      if (timeSinceLastMessage > this.heartbeatInterval * 2) {
        console.warn('[SSE] No heartbeat detected, connection may be stale');
        // Force reconnection
        this.handleError(new Event('heartbeat-timeout'));
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeatMonitor() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Start message timeout monitoring
   */
  startMessageTimeoutMonitor() {
    this.stopMessageTimeoutMonitor();

    this.messageTimeoutTimer = setInterval(() => {
      const timeSinceLastMessage = Date.now() - this.lastMessageTime;

      if (timeSinceLastMessage > this.messageTimeout) {
        console.error('[SSE] Message timeout exceeded, forcing reconnection');
        this.handleError(new Event('message-timeout'));
      }
    }, this.messageTimeout / 2);
  }

  /**
   * Stop message timeout monitoring
   */
  stopMessageTimeoutMonitor() {
    if (this.messageTimeoutTimer) {
      clearInterval(this.messageTimeoutTimer);
      this.messageTimeoutTimer = null;
    }
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      currentReconnectAttempts: this.reconnectAttempts,
      connectionId: this.connectionId,
      uptimePercentage: this.calculateUptimePercentage()
    };
  }

  /**
   * Calculate uptime percentage
   */
  calculateUptimePercentage() {
    const totalTime = Date.now() - (this.metrics.lastConnectTime || Date.now());
    if (totalTime === 0) return 0;
    return Math.min(100, (this.metrics.totalUptime / totalTime) * 100).toFixed(2);
  }

  /**
   * Send data through SSE (if bidirectional is supported)
   */
  send(data) {
    if (!this.isConnected) {
      console.error('[SSE] Cannot send data: Not connected');
      return false;
    }

    // SSE is typically unidirectional, but we can send data via fetch
    fetch(this.url.replace('/chat-stream', '/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Connection-Id': this.connectionId
      },
      body: JSON.stringify(data)
    }).catch(error => {
      console.error('[SSE] Error sending data:', error);
    });

    return true;
  }

  /**
   * Reset connection (disconnect and reconnect immediately)
   */
  reset() {
    console.log('[SSE] Resetting connection...');
    this.reconnectAttempts = 0;
    this.reconnectDelay = this.initialReconnectDelay;
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }
}

// Export for use in ZANTARA webapp
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ResilientSSEClient;
} else {
  window.ResilientSSEClient = ResilientSSEClient;
}

// Auto-initialize if in browser with ZANTARA context
if (typeof window !== 'undefined' && window.ZANTARA_CONFIG) {
  window.zantaraSSE = new ResilientSSEClient({
    url: window.ZANTARA_CONFIG.sseUrl || 'https://nuzantara-rag.fly.dev/bali-zero/chat-stream',
    onMessage: (data) => {
      // Dispatch custom event for other components
      window.dispatchEvent(new CustomEvent('zantara-sse-message', { detail: data }));
    },
    onConnect: () => {
      window.dispatchEvent(new CustomEvent('zantara-sse-connected'));
    },
    onDisconnect: () => {
      window.dispatchEvent(new CustomEvent('zantara-sse-disconnected'));
    }
  });

  // Auto-connect on load
  if (document.readyState === 'complete') {
    window.zantaraSSE.connect();
  } else {
    window.addEventListener('load', () => {
      window.zantaraSSE.connect();
    });
  }

  console.log('[ZANTARA] Resilient SSE Client initialized and ready');
}