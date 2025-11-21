// Performance Metrics Dashboard v1.0
// Real-time monitoring and analytics for ZANTARA system performance

import logger from '../logger.js';
// import { getV3Cache } from '../v3-performance-cache.js';

// Performance metrics collection
interface PerformanceMetrics {
  // Response time metrics
  responseTime: {
    average: number;
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
  };

  // Request metrics
  requests: {
    total: number;
    success: number;
    error: number;
    rate: number; // requests per second
  };

  // Cache metrics
  cache: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
    l1HitRate: number;
    l2HitRate: number;
  };

  // Memory metrics
  memory: {
    totalMemories: number;
    averageSize: number;
    vectorSearches: number;
    semanticAccuracy: number;
  };

  // Authentication metrics
  auth: {
    methods: Record<
      string,
      {
        count: number;
        successRate: number;
        averageTime: number;
      }
    >;
    totalAttempts: number;
    successRate: number;
  };

  // Knowledge base metrics
  knowledgeBase: {
    kbliQueries: number;
    kblHitRate: number;
    averageResults: number;
    domainBreakdown: Record<string, number>;
  };

  // System health metrics
  system: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    activeConnections: number;
    errorRate: number;
  };

  // Business metrics
  business: {
    dailyActiveUsers: number;
    sessionDuration: number;
    conversionRate: number;
    popularQueries: Array<{ query: string; count: number }>;
  };
}

// Metrics collector class
class MetricsCollector {
  private metrics: PerformanceMetrics;
  private responseTimes: number[] = [];
  private startTime: number;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
    this.setupCollectionIntervals();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      responseTime: {
        average: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        min: Infinity,
        max: 0,
      },
      requests: {
        total: 0,
        success: 0,
        error: 0,
        rate: 0,
      },
      cache: {
        hitRate: 0,
        totalHits: 0,
        totalMisses: 0,
        l1HitRate: 0,
        l2HitRate: 0,
      },
      memory: {
        totalMemories: 0,
        averageSize: 0,
        vectorSearches: 0,
        semanticAccuracy: 0,
      },
      auth: {
        methods: {},
        totalAttempts: 0,
        successRate: 0,
      },
      knowledgeBase: {
        kbliQueries: 0,
        kblHitRate: 0,
        averageResults: 0,
        domainBreakdown: {},
      },
      system: {
        uptime: 0,
        memoryUsage: process.memoryUsage(),
        cpuUsage: 0,
        activeConnections: 0,
        errorRate: 0,
      },
      business: {
        dailyActiveUsers: 0,
        sessionDuration: 0,
        conversionRate: 0,
        popularQueries: [],
      },
    };
  }

  private setupCollectionIntervals() {
    // Update system metrics every 30 seconds
    this.intervals.push(setInterval(() => this.updateSystemMetrics(), 30000));

    // Calculate percentiles every 10 seconds
    this.intervals.push(setInterval(() => this.calculatePercentiles(), 10000));

    // Calculate rates every 5 seconds
    this.intervals.push(setInterval(() => this.calculateRates(), 5000));

    // Cleanup old response times every minute
    this.intervals.push(setInterval(() => this.cleanupOldResponseTimes(), 60000));
  }

  // Record request start
  recordRequestStart(_reqId: string, req?: any): { startTime: number; endpoint: string } {
    return {
      startTime: Date.now(),
      endpoint: (req && req.url) || 'unknown',
    };
  }

  // Record request completion
  recordRequestEnd(
    _reqId: string,
    startTime: number,
    endpoint: string,
    success: boolean,
    error?: Error
  ) {
    const responseTime = Date.now() - startTime;

    this.responseTimes.push(responseTime);
    this.metrics.requests.total++;

    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.error++;
      logger.error(`Request failed: ${endpoint}`, error instanceof Error ? error : new Error(String(error)));
    }

    // Update endpoint-specific metrics
    this.updateEndpointMetrics(endpoint, responseTime, success);
  }

  // Record cache hit
  recordCacheHit(cacheType: 'l1' | 'l2', _key: string) {
    this.metrics.cache.totalHits++;

    if (cacheType === 'l1') {
      // L1 hits are implicitly tracked in totalHits
    } else {
      // L2 hits can be tracked separately if needed
    }
  }

  // Record cache miss
  recordCacheMiss() {
    this.metrics.cache.totalMisses++;
  }

  // Record authentication attempt
  recordAuthAttempt(method: string, success: boolean, responseTime: number) {
    if (!this.metrics.auth.methods[method]) {
      this.metrics.auth.methods[method] = {
        count: 0,
        successRate: 0,
        averageTime: 0,
      };
    }

    const methodMetrics = this.metrics.auth.methods[method];
    methodMetrics.count++;

    // Update success rate (exponential moving average)
    const alpha = 0.1;
    methodMetrics.successRate = methodMetrics.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;

    // Update average response time (exponential moving average)
    methodMetrics.averageTime = methodMetrics.averageTime * (1 - alpha) + responseTime * alpha;

    this.metrics.auth.totalAttempts++;
    this.metrics.auth.successRate =
      this.metrics.auth.successRate * (1 - alpha) + (success ? 1 : 0) * alpha;
  }

  // Record knowledge base query
  recordKBLIQuery(domain: string, resultsCount: number, _searchMethod: string) {
    this.metrics.knowledgeBase.kbliQueries++;

    if (!this.metrics.knowledgeBase.domainBreakdown[domain]) {
      this.metrics.knowledgeBase.domainBreakdown[domain] = 0;
    }
    this.metrics.knowledgeBase.domainBreakdown[domain]++;

    // Update average results
    const alpha = 0.1;
    this.metrics.knowledgeBase.averageResults =
      this.metrics.knowledgeBase.averageResults * (1 - alpha) + resultsCount * alpha;

    // Update hit rate if we got results
    if (resultsCount > 0) {
      this.metrics.knowledgeBase.kblHitRate =
        this.metrics.knowledgeBase.kblHitRate * (1 - alpha) + 1 * alpha;
    }
  }

  // Record memory operation
  recordMemoryOperation(
    operation: 'save' | 'search' | 'get',
    success: boolean,
    _responseTime?: number
  ) {
    if (operation === 'search') {
      this.metrics.memory.vectorSearches++;
    }

    // Update semantic accuracy based on success rates
    if (operation === 'search') {
      const alpha = 0.05;
      this.metrics.memory.semanticAccuracy =
        this.metrics.memory.semanticAccuracy * (1 - alpha) + (success ? 1 : 0) * alpha;
    }
  }

  private updateSystemMetrics() {
    this.metrics.system.uptime = Date.now() - this.startTime;
    this.metrics.system.memoryUsage = process.memoryUsage();

    // Calculate error rate
    if (this.metrics.requests.total > 0) {
      this.metrics.system.errorRate = this.metrics.requests.error / this.metrics.requests.total;
    }
  }

  private calculatePercentiles() {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    this.metrics.responseTime.min = Math.min(...sorted);
    this.metrics.responseTime.max = Math.max(...sorted);
    this.metrics.responseTime.average = sorted.reduce((sum, time) => sum + time, 0) / len;

    // Calculate percentiles
    this.metrics.responseTime.p50 = sorted[Math.floor(len * 0.5)];
    this.metrics.responseTime.p90 = sorted[Math.floor(len * 0.9)];
    this.metrics.responseTime.p95 = sorted[Math.floor(len * 0.95)];
    this.metrics.responseTime.p99 = sorted[Math.floor(len * 0.99)];
  }

  private calculateRates() {
    // Calculate cache hit rate
    const totalCacheOps = this.metrics.cache.totalHits + this.metrics.cache.totalMisses;
    if (totalCacheOps > 0) {
      this.metrics.cache.hitRate = this.metrics.cache.totalHits / totalCacheOps;
    }

    // Calculate request rate (per second over last minute)
    this.metrics.requests.rate =
      this.responseTimes.filter((time) => Date.now() - time < 60000).length / 60;
  }

  private cleanupOldResponseTimes() {
    const cutoff = Date.now() - 300000; // Keep last 5 minutes
    this.responseTimes = this.responseTimes.filter((time) => time > cutoff);
  }

  private updateEndpointMetrics(_endpoint: string, _responseTime: number, _success: boolean) {
    // This could be extended to track specific endpoint performance
    // For now, we're tracking overall metrics
  }

  // Get current metrics
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get metrics summary for dashboard
  getMetricsSummary() {
    const uptime = this.metrics.system.uptime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

    return {
      systemHealth: {
        status: this.metrics.system.errorRate < 0.05 ? 'healthy' : 'degraded',
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        errorRate: `${(this.metrics.system.errorRate * 100).toFixed(2)}%`,
      },
      performance: {
        averageResponseTime: `${this.metrics.responseTime.average.toFixed(0)}ms`,
        p95ResponseTime: `${this.metrics.responseTime.p95.toFixed(0)}ms`,
        requestRate: `${this.metrics.requests.rate.toFixed(1)}/s`,
        cacheHitRate: `${(this.metrics.cache.hitRate * 100).toFixed(1)}%`,
      },
      usage: {
        totalRequests: this.metrics.requests.total,
        cacheHits: this.metrics.cache.totalHits,
        authAttempts: this.metrics.auth.totalAttempts,
        kbliQueries: this.metrics.knowledgeBase.kbliQueries,
      },
      business: {
        memoryOps: this.metrics.memory.vectorSearches,
        popularAuthMethod: this.getMostPopularAuthMethod(),
        topKBLIDomain: this.getTopKBLIDomain(),
      },
    };
  }

  private getMostPopularAuthMethod(): string {
    const methods = Object.entries(this.metrics.auth.methods);
    if (methods.length === 0) return 'none';

    return methods.reduce((a, b) => (b[1].count > a[1].count ? b : a))[0];
  }

  private getTopKBLIDomain(): string {
    const domains = Object.entries(this.metrics.knowledgeBase.domainBreakdown);
    if (domains.length === 0) return 'none';

    return domains.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }

  // Get detailed endpoint breakdown
  getEndpointBreakdown() {
    // This would require more detailed tracking per endpoint
    // For now, return a placeholder
    return {
      'kbli.lookup.complete': {
        requests: 0,
        averageTime: 0,
        successRate: 1.0,
      },
      'memory.search.enhanced': {
        requests: 0,
        averageTime: 0,
        successRate: 1.0,
      },
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = this.initializeMetrics();
    this.responseTimes = [];
    this.startTime = Date.now();
  }

  // Generate performance report
  generateReport() {
    const metrics = this.getMetrics();
    const summary = this.getMetricsSummary();

    return {
      timestamp: new Date().toISOString(),
      summary,
      detailed: metrics,
      recommendations: this.generateRecommendations(metrics),
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Response time recommendations
    if (metrics.responseTime.p95 > 2000) {
      recommendations.push('Consider optimizing slow endpoints (P95 > 2s)');
    }

    // Cache recommendations
    if (metrics.cache.hitRate < 0.7) {
      recommendations.push('Cache hit rate is low - consider optimizing cache strategy');
    }

    // Error rate recommendations
    if (metrics.system.errorRate > 0.05) {
      recommendations.push('Error rate is high - investigate failing endpoints');
    }

    // Memory recommendations
    if (metrics.memory.semanticAccuracy < 0.8) {
      recommendations.push('Semantic search accuracy could be improved');
    }

    // Authentication recommendations
    const authMethods = Object.keys(metrics.auth.methods);
    if (authMethods.length > 3) {
      recommendations.push('Consider consolidating authentication methods');
    }

    return recommendations;
  }

  // Cleanup
  destroy() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
  }
}

// Global metrics collector instance
let metricsCollector: MetricsCollector | null = null;

// Initialize metrics collection
export function initializeMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector();
    logger.info('📊 Performance metrics collector initialized');
  }
  return metricsCollector;
}

// Get metrics collector instance
export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    initializeMetricsCollector();
  }
  if (!metricsCollector) {
    throw new Error('Failed to initialize metrics collector');
  }
  return metricsCollector;
}

// Middleware for automatic metrics collection
export function metricsMiddleware(req: any, res: any, next: any) {
  const collector = getMetricsCollector();
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Record request start
  const { startTime, endpoint } = collector.recordRequestStart(reqId, req);

  // Store request info for later
  (req as any).__metricsId = reqId;
  (req as any).__metricsStartTime = startTime;
  (req as any).__metricsEndpoint = endpoint;

  // Override res.end to capture completion
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any) {
    const success = res.statusCode < 400;

    // Record request completion
    collector.recordRequestEnd(reqId, startTime, endpoint, success);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// Metrics API endpoint handlers
export function getMetricsDashboard(_req: any, res?: any) {
  try {
    const collector = getMetricsCollector();
    const summary = collector.getMetricsSummary();
    const detailed = collector.getMetrics();
    const endpointBreakdown = collector.getEndpointBreakdown();
    const report = collector.generateReport();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      detailed,
      endpointBreakdown,
      report,
      lastUpdated: new Date().toISOString(),
    };

    // Handle both Express response and direct return patterns
    if (res && typeof res.json === 'function') {
      res.json(response);
      return;
    }

    return response;
  } catch (error: any) {
    logger.error('Failed to get metrics dashboard:', error instanceof Error ? error : new Error(String(error)));
    const errorResponse = {
      success: false,
      error: 'Failed to retrieve metrics',
    };

    if (res && typeof res.status === 'function') {
      res.status(500).json(errorResponse);
      return;
    }

    return errorResponse;
  }
}

export function resetMetrics(_req: any, res?: any) {
  try {
    const collector = getMetricsCollector();
    collector.resetMetrics();

    const response = {
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.json === 'function') {
      res.json(response);
      return;
    }

    return response;
  } catch (error: any) {
    logger.error('Failed to reset metrics:', error instanceof Error ? error : new Error(String(error)));
    const errorResponse = {
      success: false,
      error: 'Failed to reset metrics',
    };

    if (res && typeof res.status === 'function') {
      res.status(500).json(errorResponse);
      return;
    }

    return errorResponse;
  }
}

// Export types
export type { PerformanceMetrics, MetricsCollector };
