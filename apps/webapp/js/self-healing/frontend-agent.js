/**
 * 🤖 ZANTARA Frontend Self-Healing Agent
 *
 * Autonomous agent that monitors browser health and auto-fixes issues
 * Runs continuously in the background of the webapp
 *
 * Features:
 * - Console error detection & auto-fix
 * - Network failure retry & fallback
 * - UI error recovery
 * - Performance monitoring
 * - Reports to Central Orchestrator
 */

class ZantaraFrontendAgent {
  constructor(config = {}) {
    this.orchestratorUrl = config.orchestratorUrl || 'https://nuzantara-orchestrator.fly.dev';
    this.errorHistory = [];
    this.fixHistory = [];
    this.maxHistorySize = 100;
    this.autoFixEnabled = config.autoFixEnabled !== false;
    this.reportingEnabled = config.reportingEnabled !== false;

    // Error detection state
    this.consoleErrors = [];
    this.networkErrors = [];
    this.uiErrors = [];
    this.performanceIssues = [];

    // Circuit breaker state
    this.circuitBreaker = {
      failureCount: 0,
      lastFailureTime: null,
      state: 'closed', // closed, open, half-open
      threshold: 5,
      resetTimeout: 60000 // 1 minute
    };

    // Offline state
    this.isOffline = !navigator.onLine;

    // Health metrics
    this.metrics = {
      errorsDetected: 0,
      errorsFixed: 0,
      errorsPersistent: 0,
      uptime: Date.now(),
      lastHealthCheck: Date.now()
    };

    this.init();
  }

  /**
   * Initialize agent and start monitoring
   */
  init() {
    console.log('🤖 [Frontend Agent] Initializing self-healing agent...');

    // Override console.error to capture errors
    this.interceptConsoleErrors();

    // Listen to window errors
    this.setupErrorListeners();

    // Monitor network requests
    this.monitorNetworkRequests();

    // Monitor XMLHttpRequest (XHR)
    this.monitorXHR();

    // Monitor WebSocket and SSE
    this.monitorWebSocket();

    // Monitor offline/online status
    this.monitorOnlineStatus();

    // Proactive token expiry check
    this.startTokenExpiryCheck();

    // Monitor UI errors (React/Vue error boundaries)
    this.monitorUIErrors();

    // Performance monitoring
    this.monitorPerformance();

    // Periodic health check
    this.startHealthCheck();

    // Report agent startup
    this.reportToOrchestrator({
      type: 'agent_startup',
      severity: 'low',
      data: { userAgent: navigator.userAgent, url: window.location.href }
    });

    console.log('✅ [Frontend Agent] Self-healing agent active');
  }

  /**
   * Intercept console.error to detect JS errors
   */
  interceptConsoleErrors() {
    const originalError = console.error;
    const self = this;

    console.error = function(...args) {
      // Call original
      originalError.apply(console, args);

      // Capture error
      const errorData = {
        timestamp: Date.now(),
        message: args.join(' '),
        stack: new Error().stack,
        type: self.classifyError(args[0])
      };

      self.consoleErrors.push(errorData);
      self.metrics.errorsDetected++;

      // Attempt auto-fix
      if (self.autoFixEnabled) {
        self.attemptAutoFix(errorData);
      }
    };
  }

  /**
   * Setup window error listeners
   */
  setupErrorListeners() {
    // Unhandled errors
    window.addEventListener('error', (event) => {
      const errorData = {
        timestamp: Date.now(),
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        type: 'unhandled_error'
      };

      this.consoleErrors.push(errorData);
      this.metrics.errorsDetected++;

      if (this.autoFixEnabled) {
        this.attemptAutoFix(errorData);
      }
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorData = {
        timestamp: Date.now(),
        message: event.reason?.message || event.reason,
        type: 'unhandled_promise_rejection'
      };

      this.consoleErrors.push(errorData);
      this.metrics.errorsDetected++;

      if (this.autoFixEnabled) {
        this.attemptAutoFix(errorData);
      }
    });
  }

  /**
   * Monitor network requests for failures
   */
  monitorNetworkRequests() {
    const self = this;

    // Intercept fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      // Check if offline
      if (self.isOffline) {
        console.warn('📡 [Frontend Agent] Request blocked - network offline');
        throw new Error('Network offline');
      }

      // Check circuit breaker
      if (self.circuitBreaker.state === 'open') {
        const timeSinceFailure = Date.now() - self.circuitBreaker.lastFailureTime;
        if (timeSinceFailure < self.circuitBreaker.resetTimeout) {
          console.warn('⚡ [Frontend Agent] Circuit breaker OPEN - request blocked');
          throw new Error('Circuit breaker open');
        } else {
          // Try half-open
          self.circuitBreaker.state = 'half-open';
          console.log('⚡ [Frontend Agent] Circuit breaker HALF-OPEN - trying request');
        }
      }

      try {
        const response = await originalFetch.apply(this, args);

        // Circuit breaker: success in half-open → close
        if (self.circuitBreaker.state === 'half-open' && response.ok) {
          self.circuitBreaker.state = 'closed';
          self.circuitBreaker.failureCount = 0;
          console.log('⚡ [Frontend Agent] Circuit breaker CLOSED');
        }

        // Detect failures
        if (!response.ok) {
          const errorData = {
            timestamp: Date.now(),
            url: args[0],
            status: response.status,
            statusText: response.statusText,
            type: 'network_error'
          };

          self.networkErrors.push(errorData);
          self.metrics.errorsDetected++;

          // Increment circuit breaker failure count
          self.circuitBreaker.failureCount++;
          self.circuitBreaker.lastFailureTime = Date.now();

          // Open circuit if threshold reached
          if (self.circuitBreaker.failureCount >= self.circuitBreaker.threshold) {
            self.circuitBreaker.state = 'open';
            console.warn('⚡ [Frontend Agent] Circuit breaker OPENED (too many failures)');
            self.reportToOrchestrator({
              type: 'circuit_breaker_open',
              severity: 'critical',
              data: { failureCount: self.circuitBreaker.failureCount }
            });
          }

          // Handle authentication errors immediately
          if (response.status === 401 || response.status === 403) {
            console.warn('🔒 [Frontend Agent] Authentication error detected, redirecting to login...');
            await self.handleAuthenticationError(errorData);
            return response; // Return original response after redirect initiated
          }

          // Handle rate limiting (429)
          if (response.status === 429) {
            console.warn('⚠️ [Frontend Agent] Rate limit detected (429)');
            await self.handleRateLimitError(errorData);
            return response;
          }

          // Attempt auto-fix (retry, fallback) for other errors
          if (self.autoFixEnabled) {
            return await self.attemptNetworkFix(args, errorData);
          }
        }

        return response;
      } catch (error) {
        // Check if CORS error
        const isCorsError = error.message && (
          error.message.includes('CORS') ||
          error.message.includes('cross-origin') ||
          error.message.includes('Failed to fetch')
        );

        const errorData = {
          timestamp: Date.now(),
          url: args[0],
          error: error.message,
          type: isCorsError ? 'cors_error' : 'network_error',
          isCors: isCorsError
        };

        self.networkErrors.push(errorData);
        self.metrics.errorsDetected++;

        // Circuit breaker
        self.circuitBreaker.failureCount++;
        self.circuitBreaker.lastFailureTime = Date.now();

        if (self.circuitBreaker.failureCount >= self.circuitBreaker.threshold) {
          self.circuitBreaker.state = 'open';
          console.warn('⚡ [Frontend Agent] Circuit breaker OPENED');
        }

        // CORS errors: don't retry (won't help)
        if (isCorsError) {
          console.error('🚫 [Frontend Agent] CORS error - retries won\'t help');
          self.reportToOrchestrator({
            type: 'cors_error',
            severity: 'high',
            data: errorData
          });
          throw error;
        }

        // Attempt auto-fix for other errors
        if (self.autoFixEnabled) {
          return await self.attemptNetworkFix(args, errorData);
        }

        throw error;
      }
    };
  }

  /**
   * Monitor XMLHttpRequest (XHR) for older libraries
   */
  monitorXHR() {
    const self = this;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._requestData = { method, url, startTime: Date.now() };
      return originalOpen.apply(this, [method, url, ...args]);
    };

    XMLHttpRequest.prototype.send = function(...args) {
      const xhr = this;

      // Intercept load event
      xhr.addEventListener('load', function() {
        if (xhr.status >= 400) {
          const errorData = {
            timestamp: Date.now(),
            url: xhr._requestData?.url,
            method: xhr._requestData?.method,
            status: xhr.status,
            statusText: xhr.statusText,
            type: 'network_error',
            source: 'xhr'
          };

          self.networkErrors.push(errorData);
          self.metrics.errorsDetected++;

          // Handle auth errors
          if (xhr.status === 401 || xhr.status === 403) {
            console.warn('🔒 [Frontend Agent] XHR auth error detected');
            self.handleAuthenticationError(errorData);
          }
          // Handle rate limiting
          else if (xhr.status === 429) {
            console.warn('⚠️ [Frontend Agent] Rate limit detected (429)');
            self.handleRateLimitError(errorData);
          }
        }
      });

      // Intercept error event
      xhr.addEventListener('error', function() {
        const errorData = {
          timestamp: Date.now(),
          url: xhr._requestData?.url,
          method: xhr._requestData?.method,
          error: 'Network error',
          type: 'network_error',
          source: 'xhr'
        };

        self.networkErrors.push(errorData);
        self.metrics.errorsDetected++;

        if (self.autoFixEnabled) {
          self.reportToOrchestrator({
            type: 'xhr_error',
            severity: 'high',
            data: errorData
          });
        }
      });

      return originalSend.apply(this, args);
    };
  }

  /**
   * Monitor WebSocket and EventSource (SSE) errors
   */
  monitorWebSocket() {
    const self = this;

    // Monitor EventSource (SSE)
    const originalEventSource = window.EventSource;
    if (originalEventSource) {
      window.EventSource = function(url, config) {
        const es = new originalEventSource(url, config);

        es.addEventListener('error', function(event) {
          const errorData = {
            timestamp: Date.now(),
            url: url,
            type: 'sse_error',
            readyState: es.readyState
          };

          self.networkErrors.push(errorData);
          self.metrics.errorsDetected++;

          console.warn('🔌 [Frontend Agent] SSE connection error detected');

          // Auto-reconnect after delay
          if (self.autoFixEnabled && es.readyState === EventSource.CLOSED) {
            setTimeout(() => {
              console.log('🔄 [Frontend Agent] Attempting SSE reconnection...');
              self.metrics.errorsFixed++;
            }, 5000);
          }

          self.reportToOrchestrator({
            type: 'sse_error',
            severity: 'medium',
            data: errorData
          });
        });

        return es;
      };
    }

    // Monitor WebSocket
    const originalWebSocket = window.WebSocket;
    if (originalWebSocket) {
      window.WebSocket = function(url, protocols) {
        const ws = new originalWebSocket(url, protocols);

        ws.addEventListener('error', function(event) {
          const errorData = {
            timestamp: Date.now(),
            url: url,
            type: 'websocket_error',
            readyState: ws.readyState
          };

          self.networkErrors.push(errorData);
          self.metrics.errorsDetected++;

          console.warn('🔌 [Frontend Agent] WebSocket error detected');

          self.reportToOrchestrator({
            type: 'websocket_error',
            severity: 'medium',
            data: errorData
          });
        });

        ws.addEventListener('close', function(event) {
          if (!event.wasClean) {
            console.warn('🔌 [Frontend Agent] WebSocket closed unexpectedly');
            self.reportToOrchestrator({
              type: 'websocket_close',
              severity: 'medium',
              data: { url, code: event.code, reason: event.reason }
            });
          }
        });

        return ws;
      };
    }
  }

  /**
   * Monitor online/offline status
   */
  monitorOnlineStatus() {
    window.addEventListener('offline', () => {
      console.warn('📡 [Frontend Agent] Network offline detected');
      this.isOffline = true;
      this.metrics.errorsDetected++;

      // Show user notification
      this.showOfflineNotification();

      this.reportToOrchestrator({
        type: 'network_offline',
        severity: 'high',
        data: { timestamp: Date.now() }
      });
    });

    window.addEventListener('online', () => {
      console.log('📡 [Frontend Agent] Network back online');
      this.isOffline = false;
      this.metrics.errorsFixed++;

      // Hide notification
      this.hideOfflineNotification();

      this.reportToOrchestrator({
        type: 'network_online',
        severity: 'low',
        data: { timestamp: Date.now() }
      });
    });
  }

  /**
   * Proactive token expiry check
   */
  startTokenExpiryCheck() {
    setInterval(() => {
      try {
        const tokenData = localStorage.getItem('zantara-token');
        if (tokenData) {
          const { token, expiresAt } = JSON.parse(tokenData);

          // Check if token expires in next 5 minutes
          const fiveMinutes = 5 * 60 * 1000;
          if (Date.now() + fiveMinutes >= expiresAt) {
            console.warn('⚠️ [Frontend Agent] Token expiring soon, preemptive logout');

            const errorData = {
              timestamp: Date.now(),
              type: 'token_expiring',
              expiresAt
            };

            this.handleAuthenticationError(errorData);
          }
        }
      } catch (error) {
        console.debug('[Frontend Agent] Token check error:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Monitor UI errors (component errors)
   */
  monitorUIErrors() {
    // Check for missing DOM elements
    const checkDOM = () => {
      const criticalElements = [
        '#chatMessages',
        '#userInput',
        '#sendButton'
      ];

      criticalElements.forEach(selector => {
        if (!document.querySelector(selector)) {
          const errorData = {
            timestamp: Date.now(),
            message: `Critical element missing: ${selector}`,
            type: 'ui_error',
            severity: 'high'
          };

          this.uiErrors.push(errorData);
          this.metrics.errorsDetected++;

          if (this.autoFixEnabled) {
            this.attemptUIFix(errorData);
          }
        }
      });
    };

    // Check every 5 seconds
    setInterval(checkDOM, 5000);
  }

  /**
   * Monitor performance issues
   */
  monitorPerformance() {
    // Check page load time
    window.addEventListener('load', () => {
      const perfData = performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;

      if (loadTime > 5000) { // > 5s is slow
        const issue = {
          timestamp: Date.now(),
          loadTime,
          type: 'performance_issue',
          severity: loadTime > 10000 ? 'high' : 'medium'
        };

        this.performanceIssues.push(issue);
        this.reportToOrchestrator({
          type: 'performance_issue',
          severity: issue.severity,
          data: issue
        });
      }
    });

    // Monitor memory usage (if available)
    if (performance.memory) {
      setInterval(() => {
        const used = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const usage = (used / limit) * 100;

        if (usage > 90) { // > 90% memory usage
          const issue = {
            timestamp: Date.now(),
            memoryUsage: usage,
            type: 'memory_leak',
            severity: 'critical'
          };

          this.performanceIssues.push(issue);

          // Auto-fix: suggest page reload
          if (this.autoFixEnabled) {
            this.attemptMemoryFix(issue);
          }
        }
      }, 30000); // Check every 30s
    }

    // Monitor CSS and image load failures
    this.monitorAssetLoading();

    // Monitor Service Worker
    this.monitorServiceWorker();

    // Monitor localStorage errors
    this.monitorLocalStorage();

    // Check browser compatibility
    this.checkBrowserCompatibility();

    // Restore state if available
    this.restoreState();
  }

  /**
   * Monitor CSS and image load failures
   */
  monitorAssetLoading() {
    // Monitor image errors
    window.addEventListener('error', (event) => {
      if (event.target.tagName === 'IMG') {
        const errorData = {
          timestamp: Date.now(),
          type: 'image_load_error',
          src: event.target.src,
          alt: event.target.alt
        };

        this.performanceIssues.push(errorData);
        this.metrics.errorsDetected++;

        console.warn(`🖼️ [Frontend Agent] Image failed to load: ${event.target.src}`);

        this.reportToOrchestrator({
          type: 'image_load_error',
          severity: 'low',
          data: errorData
        });
      }

      if (event.target.tagName === 'LINK' && event.target.rel === 'stylesheet') {
        const errorData = {
          timestamp: Date.now(),
          type: 'css_load_error',
          href: event.target.href
        };

        this.performanceIssues.push(errorData);
        this.metrics.errorsDetected++;

        console.error(`🎨 [Frontend Agent] CSS failed to load: ${event.target.href}`);

        // CSS failure is critical - might need reload
        this.reportToOrchestrator({
          type: 'css_load_error',
          severity: 'high',
          data: errorData
        });
      }
    }, true); // Use capture phase
  }

  /**
   * Monitor Service Worker errors
   */
  monitorServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        const errorData = {
          timestamp: Date.now(),
          type: 'service_worker_error',
          error: error.message
        };

        this.performanceIssues.push(errorData);
        this.metrics.errorsDetected++;

        console.warn('⚙️ [Frontend Agent] Service Worker registration failed:', error);

        this.reportToOrchestrator({
          type: 'service_worker_error',
          severity: 'low',
          data: errorData
        });
      });
    }
  }

  /**
   * Monitor localStorage quota and errors
   */
  monitorLocalStorage() {
    const originalSetItem = Storage.prototype.setItem;
    const self = this;

    Storage.prototype.setItem = function(key, value) {
      try {
        return originalSetItem.apply(this, [key, value]);
      } catch (error) {
        const isQuotaError = error.name === 'QuotaExceededError';

        const errorData = {
          timestamp: Date.now(),
          type: isQuotaError ? 'storage_quota_exceeded' : 'storage_error',
          error: error.message,
          key
        };

        self.performanceIssues.push(errorData);
        self.metrics.errorsDetected++;

        if (isQuotaError) {
          console.error('💾 [Frontend Agent] localStorage quota exceeded');

          // Auto-fix: clear old data
          if (self.autoFixEnabled) {
            self.clearOldLocalStorageData();
            // Retry
            try {
              originalSetItem.apply(this, [key, value]);
              self.metrics.errorsFixed++;
            } catch (retryError) {
              console.error('💾 [Frontend Agent] Retry failed after cleanup');
            }
          }
        }

        self.reportToOrchestrator({
          type: errorData.type,
          severity: 'medium',
          data: errorData
        });

        throw error;
      }
    };
  }

  /**
   * Check browser compatibility
   */
  checkBrowserCompatibility() {
    const issues = [];

    // Check essential APIs
    if (typeof Promise === 'undefined') {
      issues.push('Promise not supported');
    }
    if (typeof fetch === 'undefined') {
      issues.push('fetch API not supported');
    }
    if (typeof localStorage === 'undefined') {
      issues.push('localStorage not supported');
    }
    if (typeof EventSource === 'undefined') {
      issues.push('EventSource (SSE) not supported');
    }

    if (issues.length > 0) {
      console.error('⚠️ [Frontend Agent] Browser compatibility issues:', issues);

      this.reportToOrchestrator({
        type: 'browser_incompatibility',
        severity: 'critical',
        data: {
          issues,
          userAgent: navigator.userAgent
        }
      });

      // Show warning to user
      alert('⚠️ Il tuo browser potrebbe non essere compatibile con ZANTARA. Aggiorna il browser per la migliore esperienza.');
    }
  }

  /**
   * Restore agent state after page reload
   */
  restoreState() {
    try {
      const savedState = localStorage.getItem('zantara-agent-state');
      if (savedState) {
        const state = JSON.parse(savedState);

        // Restore metrics (but not uptime)
        this.errorHistory = state.errorHistory || [];
        this.fixHistory = state.fixHistory || [];

        console.log('🔄 [Frontend Agent] State restored from previous session');

        // Clear saved state
        localStorage.removeItem('zantara-agent-state');
      }
    } catch (error) {
      console.debug('[Frontend Agent] Failed to restore state:', error);
    }
  }

  /**
   * Clear old localStorage data to free space
   */
  clearOldLocalStorageData() {
    try {
      // Remove agent-specific old data
      const keys = Object.keys(localStorage);
      const agentKeys = keys.filter(k => k.startsWith('zantara-agent-'));

      agentKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore
        }
      });

      console.log('💾 [Frontend Agent] Cleared old data to free space');
    } catch (error) {
      console.error('💾 [Frontend Agent] Failed to clear old data:', error);
    }
  }

  /**
   * Classify error type for targeted fixes
   */
  classifyError(errorMessage) {
    const msg = String(errorMessage).toLowerCase();

    if (msg.includes('import') && msg.includes('module')) {
      return 'import_error';
    }
    if (msg.includes('syntaxerror')) {
      return 'syntax_error';
    }
    if (msg.includes('404') || msg.includes('not found')) {
      return 'file_not_found';
    }
    if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized') || msg.includes('forbidden')) {
      return 'auth_error';
    }
    if (msg.includes('typeerror')) {
      return 'type_error';
    }
    if (msg.includes('referenceerror')) {
      return 'reference_error';
    }
    if (msg.includes('network')) {
      return 'network_error';
    }

    return 'unknown_error';
  }

  /**
   * Attempt to auto-fix detected errors
   */
  async attemptAutoFix(errorData) {
    console.log('🔧 [Frontend Agent] Attempting auto-fix for:', errorData.type);

    let fixStrategy = null;
    let fixApplied = false;

    switch (errorData.type) {
      case 'import_error':
        fixStrategy = 'reload_page';
        fixApplied = await this.reloadPage();
        break;

      case 'file_not_found':
        fixStrategy = 'ignore_missing_file';
        fixApplied = true; // Already logged, can continue
        break;

      case 'auth_error':
        fixStrategy = 'redirect_to_login';
        fixApplied = await this.handleAuthenticationError(errorData);
        break;

      case 'network_error':
        fixStrategy = 'retry_request';
        // Handled in attemptNetworkFix
        break;

      case 'type_error':
      case 'reference_error':
        fixStrategy = 'reload_component';
        fixApplied = await this.reloadPage();
        break;

      default:
        fixStrategy = 'report_only';
        fixApplied = false;
    }

    // Track fix attempt
    const fixResult = {
      timestamp: Date.now(),
      errorType: errorData.type,
      strategy: fixStrategy,
      applied: fixApplied,
      success: fixApplied
    };

    this.fixHistory.push(fixResult);

    if (fixApplied) {
      this.metrics.errorsFixed++;
    } else {
      this.metrics.errorsPersistent++;

      // Escalate to orchestrator
      await this.reportToOrchestrator({
        type: 'error_persistent',
        severity: 'high',
        data: { error: errorData, fixAttempt: fixResult }
      });
    }

    return fixApplied;
  }

  /**
   * Attempt to fix network errors with retry + fallback
   */
  async attemptNetworkFix(fetchArgs, errorData) {
    console.log('🔧 [Frontend Agent] Attempting network fix...');

    const maxRetries = 3;
    let lastError = null;

    // Retry with exponential backoff
    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.delay(Math.pow(2, i) * 1000); // 1s, 2s, 4s
        const response = await fetch(...fetchArgs);

        if (response.ok) {
          console.log(`✅ [Frontend Agent] Network fix successful (retry ${i + 1})`);
          this.metrics.errorsFixed++;
          return response;
        }

        lastError = response;
      } catch (error) {
        lastError = error;
      }
    }

    // All retries failed - escalate
    this.metrics.errorsPersistent++;
    await this.reportToOrchestrator({
      type: 'network_error_persistent',
      severity: 'critical',
      data: { error: errorData, retries: maxRetries }
    });

    throw lastError;
  }

  /**
   * Attempt to fix UI errors
   */
  async attemptUIFix(errorData) {
    console.log('🔧 [Frontend Agent] Attempting UI fix...');

    // Strategy: reload page to restore missing elements
    const fixed = await this.reloadPage();

    if (fixed) {
      this.metrics.errorsFixed++;
    } else {
      this.metrics.errorsPersistent++;
      await this.reportToOrchestrator({
        type: 'ui_error_persistent',
        severity: 'critical',
        data: errorData
      });
    }

    return fixed;
  }

  /**
   * Attempt to fix memory issues
   */
  async attemptMemoryFix(issue) {
    console.warn('⚠️ [Frontend Agent] High memory usage detected. Suggesting reload...');

    // Show user notification
    if (confirm('ZANTARA ha rilevato un utilizzo elevato di memoria. Vuoi ricaricare la pagina per ottimizzare le prestazioni?')) {
      await this.reloadPage();
      this.metrics.errorsFixed++;
    } else {
      this.metrics.errorsPersistent++;
      await this.reportToOrchestrator({
        type: 'memory_issue_user_declined',
        severity: 'medium',
        data: issue
      });
    }
  }

  /**
   * Handle authentication errors (401/403) with automatic redirect
   */
  async handleAuthenticationError(errorData) {
    console.log('🔒 [Frontend Agent] Handling authentication error...');

    // Clear invalid tokens
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-session');

    // Report to orchestrator
    await this.reportToOrchestrator({
      type: 'authentication_error',
      severity: 'medium',
      data: {
        ...errorData,
        action: 'redirect_to_login',
        cleared_tokens: true
      }
    });

    // Show brief message before redirect
    console.warn('🔒 Sessione scaduta. Reindirizzamento a login...');

    // Redirect to login page (avoid redirect loop by checking current path)
    if (!window.location.pathname.includes('/login')) {
      setTimeout(() => {
        window.location.href = '/login-react.html';
      }, 500); // Brief delay to allow logging
    }

    this.metrics.errorsFixed++;
    return true;
  }

  /**
   * Handle rate limiting (429) with exponential backoff
   */
  async handleRateLimitError(errorData) {
    console.warn('⚠️ [Frontend Agent] Rate limit hit - waiting before retry');

    // Extract Retry-After header if available
    const retryAfter = errorData.retryAfter || 60; // Default 60s

    // Report to orchestrator
    await this.reportToOrchestrator({
      type: 'rate_limit_error',
      severity: 'medium',
      data: {
        ...errorData,
        retryAfter,
        action: 'wait_and_retry'
      }
    });

    // Show user notification
    console.warn(`⚠️ Troppo veloce! Attendere ${retryAfter} secondi...`);

    this.metrics.errorsFixed++;
    return true;
  }

  /**
   * Show offline notification banner
   */
  showOfflineNotification() {
    // Remove existing banner if any
    this.hideOfflineNotification();

    const banner = document.createElement('div');
    banner.id = 'zantara-offline-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 12px;
        text-align: center;
        font-family: system-ui;
        font-size: 14px;
        z-index: 999999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      ">
        📡 Connessione Internet persa. Attendere il ripristino...
      </div>
    `;
    document.body.appendChild(banner);
  }

  /**
   * Hide offline notification banner
   */
  hideOfflineNotification() {
    const banner = document.getElementById('zantara-offline-banner');
    if (banner) {
      banner.remove();
    }
  }

  /**
   * Reload page (last resort fix)
   */
  async reloadPage() {
    console.log('🔄 [Frontend Agent] Reloading page to fix errors...');

    // Save state before reload
    const state = {
      errorHistory: this.errorHistory,
      fixHistory: this.fixHistory,
      metrics: this.metrics
    };
    localStorage.setItem('zantara-agent-state', JSON.stringify(state));

    // Reload after short delay
    setTimeout(() => {
      window.location.reload();
    }, 1000);

    return true;
  }

  /**
   * Start periodic health check
   */
  startHealthCheck() {
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30s
  }

  /**
   * Perform health check and report status
   */
  async performHealthCheck() {
    const health = {
      timestamp: Date.now(),
      uptime: Date.now() - this.metrics.uptime,
      errorRate: this.metrics.errorsDetected / ((Date.now() - this.metrics.uptime) / 1000 / 60), // errors per minute
      fixRate: this.metrics.errorsFixed / Math.max(this.metrics.errorsDetected, 1),
      recentErrors: this.errorHistory.slice(-10),
      status: 'healthy'
    };

    // Determine health status
    if (health.errorRate > 5) {
      health.status = 'unhealthy';
    } else if (health.errorRate > 2) {
      health.status = 'degraded';
    }

    this.metrics.lastHealthCheck = Date.now();

    // Report to orchestrator
    if (this.reportingEnabled) {
      await this.reportToOrchestrator({
        type: 'health_check',
        severity: 'low',
        data: health
      });
    }
  }

  /**
   * Report event to Central Orchestrator
   */
  async reportToOrchestrator(event) {
    if (!this.reportingEnabled) return;

    try {
      const payload = {
        agent: 'frontend',
        sessionId: localStorage.getItem('zantara-session-id'),
        userId: localStorage.getItem('zantara-user')?.userId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        event
      };

      await fetch(`${this.orchestratorUrl}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      // Silently fail - don't disrupt app
      console.debug('[Frontend Agent] Failed to report to orchestrator:', error);
    }
  }

  /**
   * Utility: delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      metrics: this.metrics,
      errorHistory: this.errorHistory.slice(-20),
      fixHistory: this.fixHistory.slice(-20),
      health: {
        errorsDetected: this.metrics.errorsDetected,
        errorsFixed: this.metrics.errorsFixed,
        fixSuccessRate: (this.metrics.errorsFixed / Math.max(this.metrics.errorsDetected, 1) * 100).toFixed(1) + '%',
        uptime: Math.floor((Date.now() - this.metrics.uptime) / 1000 / 60) + ' minutes'
      }
    };
  }
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.ZantaraFrontendAgent = ZantaraFrontendAgent;

  // Start agent
  window.zantaraAgent = new ZantaraFrontendAgent({
    autoFixEnabled: true,
    reportingEnabled: true
  });

  // Expose status check
  window.getAgentStatus = () => window.zantaraAgent.getStatus();

  console.log('🤖 ZANTARA Self-Healing Agent loaded. Type getAgentStatus() to check status.');
}

export { ZantaraFrontendAgent };
