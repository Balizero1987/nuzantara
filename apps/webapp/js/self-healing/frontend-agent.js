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
      try {
        const response = await originalFetch.apply(this, args);

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

          // Handle authentication errors immediately
          if (response.status === 401 || response.status === 403) {
            console.warn('🔒 [Frontend Agent] Authentication error detected, redirecting to login...');
            await self.handleAuthenticationError(errorData);
            return response; // Return original response after redirect initiated
          }

          // Attempt auto-fix (retry, fallback) for other errors
          if (self.autoFixEnabled) {
            return await self.attemptNetworkFix(args, errorData);
          }
        }

        return response;
      } catch (error) {
        const errorData = {
          timestamp: Date.now(),
          url: args[0],
          error: error.message,
          type: 'network_error'
        };

        self.networkErrors.push(errorData);
        self.metrics.errorsDetected++;

        // Attempt auto-fix
        if (self.autoFixEnabled) {
          return await self.attemptNetworkFix(args, errorData);
        }

        throw error;
      }
    };
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
        window.location.href = '/login.html';
      }, 500); // Brief delay to allow logging
    }

    this.metrics.errorsFixed++;
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
