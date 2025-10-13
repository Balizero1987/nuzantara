// Performance monitoring utility for ZANTARA WebApp
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.observers = {};
    this.isEnabled = true;
    this.init();
  }

  init() {
    if (!this.isEnabled) return;

    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor resource loading
    this.monitorResources();
    
    // Monitor user interactions
    this.monitorInteractions();
    
    // Monitor memory usage
    this.monitorMemory();
    
    // Monitor network conditions
    this.monitorNetwork();
    
    // Set up periodic reporting
    this.setupReporting();
  }

  // Monitor page load metrics
  monitorPageLoad() {
    if (!('performance' in window)) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        this.metrics.pageLoad = {
          // Core Web Vitals
          FCP: this.getFCP(paint),
          LCP: this.getLCP(),
          CLS: this.getCLS(),
          FID: this.getFID(),
          
          // Navigation timing
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          
          // Network timing
          dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
          tcpConnect: navigation.connectEnd - navigation.connectStart,
          serverResponse: navigation.responseEnd - navigation.requestStart,
          
          // Resource timing
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
          
          timestamp: Date.now()
        };
        
        this.reportMetric('pageLoad', this.metrics.pageLoad);
      }, 0);
    });
  }

  // Get First Contentful Paint
  getFCP(paintEntries) {
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcpEntry ? fcpEntry.startTime : null;
  }

  // Get Largest Contentful Paint
  getLCP() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(null);
        return;
      }

      let lcp = null;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        lcp = lastEntry.startTime;
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Stop observing after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          observer.disconnect();
          resolve(lcp);
        }, 0);
      });
    });
  }

  // Get Cumulative Layout Shift
  getCLS() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(null);
        return;
      }

      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value;
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Stop observing after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(cls);
      }, 5000);
    });
  }

  // Get First Input Delay
  getFID() {
    return new Promise((resolve) => {
      if (!('PerformanceObserver' in window)) {
        resolve(null);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          resolve(entry.processingStart - entry.startTime);
          observer.disconnect();
          return;
        }
      });

      observer.observe({ entryTypes: ['first-input'] });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, 10000);
    });
  }

  // Monitor resource loading
  monitorResources() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resourceType = this.getResourceType(entry.name);
        
        if (!this.metrics.resources) {
          this.metrics.resources = {};
        }
        
        if (!this.metrics.resources[resourceType]) {
          this.metrics.resources[resourceType] = [];
        }
        
        this.metrics.resources[resourceType].push({
          name: entry.name,
          size: entry.transferSize || entry.encodedBodySize,
          loadTime: entry.responseEnd - entry.startTime,
          cached: entry.transferSize === 0 && entry.encodedBodySize > 0
        });
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.resources = observer;
  }

  // Get resource type from URL
  getResourceType(url) {
    if (url.match(/\\.(css)$/i)) return 'css';
    if (url.match(/\\.(js)$/i)) return 'javascript';
    if (url.match(/\\.(png|jpg|jpeg|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  // Monitor user interactions
  monitorInteractions() {
    const interactions = ['click', 'scroll', 'keypress'];
    
    interactions.forEach(eventType => {
      document.addEventListener(eventType, (event) => {
        const startTime = performance.now();
        
        // Use requestIdleCallback to measure after interaction
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            const duration = performance.now() - startTime;
            this.recordInteraction(eventType, duration, event.target);
          });
        }
      }, { passive: true });
    });
  }

  // Record interaction metrics
  recordInteraction(type, duration, target) {
    if (!this.metrics.interactions) {
      this.metrics.interactions = {};
    }
    
    if (!this.metrics.interactions[type]) {
      this.metrics.interactions[type] = [];
    }
    
    this.metrics.interactions[type].push({
      duration,
      target: target.tagName + (target.className ? '.' + target.className : ''),
      timestamp: Date.now()
    });
    
    // Keep only last 50 interactions per type
    if (this.metrics.interactions[type].length > 50) {
      this.metrics.interactions[type] = this.metrics.interactions[type].slice(-50);
    }
  }

  // Monitor memory usage
  monitorMemory() {
    if (!('memory' in performance)) return;

    const checkMemory = () => {
      const memory = performance.memory;
      this.metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        timestamp: Date.now()
      };
    };

    // Check memory every 30 seconds
    checkMemory();
    setInterval(checkMemory, 30000);
  }

  // Monitor network conditions
  monitorNetwork() {
    if (!('connection' in navigator)) return;

    const updateNetworkInfo = () => {
      const connection = navigator.connection;
      this.metrics.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: Date.now()
      };
    };

    updateNetworkInfo();
    navigator.connection.addEventListener('change', updateNetworkInfo);
  }

  // Setup periodic reporting
  setupReporting() {
    // Report metrics every 5 minutes
    setInterval(() => {
      this.reportAllMetrics();
    }, 5 * 60 * 1000);
    
    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportAllMetrics();
    });
  }

  // Report individual metric
  reportMetric(type, data) {
    if (window.DEBUG) {
      console.log(`[Performance] ${type}:`, data);
    }
    
    // Send to analytics service (implement based on your needs)
    this.sendToAnalytics(type, data);
  }

  // Report all metrics
  reportAllMetrics() {
    const report = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      metrics: this.metrics
    };
    
    if (window.DEBUG) {
      console.log('[Performance] Full Report:', report);
    }
    
    this.sendToAnalytics('fullReport', report);
  }

  // Send metrics to analytics service
  sendToAnalytics(type, data) {
    // Implement based on your analytics service
    // This could be Google Analytics, custom endpoint, etc.
    
    try {
      // Example: Send to custom endpoint
      if ('sendBeacon' in navigator) {
        const payload = JSON.stringify({ type, data });
        navigator.sendBeacon('/analytics/performance', payload);
      } else {
        // Fallback for older browsers
        fetch('/analytics/performance', {
          method: 'POST',
          body: JSON.stringify({ type, data }),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {
          // Ignore errors in analytics
        });
      }
    } catch (error) {
      // Ignore analytics errors
    }
  }

  // Get current metrics
  getMetrics() {
    return this.metrics;
  }

  // Get performance score
  getPerformanceScore() {
    const { pageLoad } = this.metrics;
    if (!pageLoad) return null;
    
    let score = 100;
    
    // Deduct points for slow metrics
    if (pageLoad.FCP > 2500) score -= 20;
    if (pageLoad.LCP > 4000) score -= 20;
    if (pageLoad.CLS > 0.25) score -= 20;
    if (pageLoad.FID > 300) score -= 20;
    if (pageLoad.totalLoadTime > 5000) score -= 20;
    
    return Math.max(0, score);
  }

  // Cleanup observers
  cleanup() {
    Object.values(this.observers).forEach(observer => {
      if (observer && observer.disconnect) {
        observer.disconnect();
      }
    });
  }
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor();