/**
 * Performance Monitoring Service
 *
 * Comprehensive metrics collection for endpoints
 * Tracks performance improvements and system health
 */

import logger from '../logger.js';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  cached: boolean;
  cacheHitTime?: number;
  queryTime?: number;
  domainTimes?: { [domain: string]: number };
  timestamp: number;
  requestId: string;
  userAgent?: string;
  ip?: string;
}

export interface AggregatedMetrics {
  endpoint: string;
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  requestsPerMinute: number;
  lastUpdated: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k metrics
  private alertThresholds = {
    responseTime: 5000, // 5 seconds
    errorRate: 0.05, // 5%
    cacheHitRate: 0.5, // 50% minimum
  };

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Record performance metrics for a request
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    // Add timestamp if not provided
    if (!metrics.timestamp) {
      metrics.timestamp = Date.now();
    }

    // Add to metrics array
    this.metrics.push(metrics);

    // Cleanup old metrics to prevent memory leaks
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Check for alerts
    this.checkAlerts(metrics);

    // Log slow requests
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      logger.warn(`🐌 Slow request detected: ${metrics.endpoint} - ${metrics.responseTime}ms`, {
        requestId: metrics.requestId,
        cached: metrics.cached,
        domainTimes: metrics.domainTimes,
      });
    }

    // Log cache performance
    if (metrics.cached && metrics.cacheHitTime) {
      logger.debug(`🎯 Cache hit: ${metrics.endpoint} - ${metrics.cacheHitTime}ms`, {
        requestId: metrics.requestId,
        cacheRatio: metrics.cacheHitTime / metrics.responseTime,
      });
    }
  }

  /**
   * Get aggregated metrics for an endpoint
   */
  getAggregatedMetrics(endpoint: string, timeWindowMinutes: number = 60): AggregatedMetrics {
    const now = Date.now();
    const timeWindow = timeWindowMinutes * 60 * 1000;

    const recentMetrics = this.metrics.filter(
      (m) => m.endpoint === endpoint && now - m.timestamp <= timeWindow
    );

    if (recentMetrics.length === 0) {
      return {
        endpoint,
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        requestsPerMinute: 0,
        lastUpdated: now,
      };
    }

    const responseTimes = recentMetrics.map((m) => m.responseTime).sort((a, b) => a - b);
    const cacheHits = recentMetrics.filter((m) => m.cached).length;
    const errors = recentMetrics.filter((m) => m.statusCode >= 400).length;

    return {
      endpoint,
      totalRequests: recentMetrics.length,
      averageResponseTime:
        responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
      cacheHitRate: cacheHits / recentMetrics.length,
      errorRate: errors / recentMetrics.length,
      requestsPerMinute: recentMetrics.length / timeWindowMinutes,
      lastUpdated: now,
    };
  }

  /**
   * Build metrics snapshot for all observed endpoints
   */
  private getEndpointMetricsSnapshot(
    timeWindowMinutes: number = 60
  ): { [endpoint: string]: AggregatedMetrics } {
    const now = Date.now();
    const windowMs = timeWindowMinutes * 60 * 1000;

    const recentEndpoints = new Set(
      this.metrics.filter((m) => now - m.timestamp <= windowMs).map((m) => m.endpoint)
    );

    const results: { [endpoint: string]: AggregatedMetrics } = {};
    recentEndpoints.forEach((endpoint) => {
      results[endpoint] = this.getAggregatedMetrics(endpoint, timeWindowMinutes);
    });

    return results;
  }

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary(timeWindowMinutes: number = 60): any {
    const endpointMetrics = this.getEndpointMetricsSnapshot(timeWindowMinutes);
    const endpoints = Object.keys(endpointMetrics);

    if (endpoints.length === 0) {
      return {
        summary: {
          totalRequests: 0,
          averageResponseTime: 0,
          cacheHitRate: 0,
          errorRate: 0,
          requestsPerMinute: 0,
        },
        endpoints: {},
        domainPerformance: [],
        alerts: [],
        health: 100,
        timestamp: Date.now(),
      };
    }

    const metricsList = Object.values(endpointMetrics);

    const totalRequests = metricsList.reduce((sum, m) => sum + m.totalRequests, 0);
    const avgResponseTime =
      metricsList.reduce((sum, m) => sum + m.averageResponseTime, 0) / metricsList.length;
    const avgCacheHitRate =
      metricsList.reduce((sum, m) => sum + m.cacheHitRate, 0) / metricsList.length;
    const totalErrors = metricsList.reduce(
      (sum, m) => sum + m.errorRate * m.totalRequests,
      0
    );

    // Get domain-specific performance
    const domainPerformance = this.getDomainPerformance(timeWindowMinutes);

    return {
      summary: {
        totalRequests,
        averageResponseTime: Math.round(avgResponseTime),
        cacheHitRate: Math.round(avgCacheHitRate * 100) / 100,
        errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) / 100 : 0,
        requestsPerMinute: Math.round(
          metricsList.reduce((sum, m) => sum + m.requestsPerMinute, 0)
        ),
      },
      endpoints: endpointMetrics,
      domainPerformance,
      alerts: this.getActiveAlerts(),
      health: this.calculateHealthScore(endpointMetrics),
      timestamp: Date.now(),
    };
  }

  /**
   * Get domain-specific performance metrics
   */
  private getDomainPerformance(timeWindowMinutes: number): any {
    const now = Date.now();
    const timeWindow = timeWindowMinutes * 60 * 1000;

    const recentMetrics = this.metrics.filter(
      (m) => now - m.timestamp <= timeWindow && m.domainTimes
    );

    const domainTimes: { [domain: string]: number[] } = {};

    recentMetrics.forEach((metric) => {
      if (metric.domainTimes) {
        Object.entries(metric.domainTimes).forEach(([domain, time]) => {
          if (!domainTimes[domain]) {
            domainTimes[domain] = [];
          }
          domainTimes[domain].push(time);
        });
      }
    });

    const performance: any = {};
    Object.entries(domainTimes).forEach(([domain, times]) => {
      times.sort((a, b) => a - b);
      performance[domain] = {
        count: times.length,
        average: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
        p95: times[Math.floor(times.length * 0.95)] || 0,
        p99: times[Math.floor(times.length * 0.99)] || 0,
      };
    });

    return performance;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): any[] {
    const alerts: any[] = [];
    const v3Metrics = this.getEndpointMetricsSnapshot(5); // Last 5 minutes

    Object.entries(v3Metrics).forEach(([endpoint, metrics]) => {
      if (metrics.totalRequests > 0) {
        // Response time alert
        if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
          alerts.push({
            type: 'response_time',
            severity: metrics.averageResponseTime > 10000 ? 'critical' : 'warning',
            endpoint,
            value: metrics.averageResponseTime,
            threshold: this.alertThresholds.responseTime,
            message: `High response time: ${Math.round(metrics.averageResponseTime)}ms`,
          });
        }

        // Error rate alert
        if (metrics.errorRate > this.alertThresholds.errorRate) {
          alerts.push({
            type: 'error_rate',
            severity: metrics.errorRate > 0.1 ? 'critical' : 'warning',
            endpoint,
            value: Math.round(metrics.errorRate * 100),
            threshold: Math.round(this.alertThresholds.errorRate * 100),
            message: `High error rate: ${Math.round(metrics.errorRate * 100)}%`,
          });
        }

        // Cache hit rate alert
        if (
          metrics.cacheHitRate < this.alertThresholds.cacheHitRate &&
          metrics.totalRequests > 10
        ) {
          alerts.push({
            type: 'cache_hit_rate',
            severity: 'warning',
            endpoint,
            value: Math.round(metrics.cacheHitRate * 100),
            threshold: Math.round(this.alertThresholds.cacheHitRate * 100),
            message: `Low cache hit rate: ${Math.round(metrics.cacheHitRate * 100)}%`,
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(v3Metrics: { [endpoint: string]: AggregatedMetrics }): number {
    const metrics = Object.values(v3Metrics);
    if (metrics.length === 0) return 100;

    let score = 100;

    // Response time impact (40% weight)
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length;
    if (avgResponseTime > 1000) score -= 40;
    else if (avgResponseTime > 500) score -= 20;
    else if (avgResponseTime > 200) score -= 10;

    // Error rate impact (30% weight)
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    if (avgErrorRate > 0.1) score -= 30;
    else if (avgErrorRate > 0.05) score -= 15;
    else if (avgErrorRate > 0.01) score -= 5;

    // Cache hit rate impact (20% weight)
    const avgCacheHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length;
    if (avgCacheHitRate < 0.3) score -= 20;
    else if (avgCacheHitRate < 0.5) score -= 10;
    else if (avgCacheHitRate < 0.7) score -= 5;

    // Request rate impact (10% weight)
    const totalRequests = metrics.reduce((sum, m) => sum + m.totalRequests, 0);
    if (totalRequests < 1) score -= 10;

    return Math.max(0, Math.round(score));
  }

  /**
   * Check for immediate alerts
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    // Immediate critical alerts
    if (metrics.responseTime > 30000) {
      logger.error(
        '🚨 CRITICAL: Extremely slow request: ${metrics.endpoint} - ${metrics.responseTime}ms',
        undefined,
        {
          requestId: metrics.requestId,
          cached: metrics.cached,
        }
      );
    }

    if (metrics.statusCode >= 500) {
      logger.error(
        '🚨 CRITICAL: Server error: ${metrics.endpoint} - ${metrics.statusCode}',
        undefined,
        {
          requestId: metrics.requestId,
        }
      );
    }
  }

  /**
   * Clear old metrics
   */
  clearMetrics(olderThanMinutes: number = 1440): void {
    // Default 24 hours
    const cutoff = Date.now() - olderThanMinutes * 60 * 1000;
    const beforeCount = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.timestamp > cutoff);
    const cleared = beforeCount - this.metrics.length;

    if (cleared > 0) {
      logger.info(`🧹 Cleared ${cleared} old metrics (older than ${olderThanMinutes} minutes)`);
    }
  }

  /**
   * Get metrics for Prometheus
   */
  getPrometheusMetrics(): string {
    const v3Metrics = this.getEndpointMetricsSnapshot(5); // Last 5 minutes

    let prometheusText = '';

    Object.entries(v3Metrics).forEach(([endpoint, metrics]) => {
      const metricsTyped = metrics as any;
      // Response time metrics
      prometheusText += `# HELP zantara_response_time_seconds Response time in seconds\n`;
      prometheusText += `# TYPE zantara_response_time_seconds gauge\n`;
      prometheusText += `zantara_response_time_seconds{endpoint="${endpoint}"} ${metricsTyped.averageResponseTime / 1000}\n`;

      // Request count metrics
      prometheusText += `# HELP zantara_requests_total Total number of requests\n`;
      prometheusText += `# TYPE zantara_requests_total counter\n`;
      prometheusText += `zantara_requests_total{endpoint="${endpoint}"} ${metricsTyped.totalRequests}\n`;

      // Cache hit rate metrics
      prometheusText += `# HELP zantara_cache_hit_rate Cache hit rate ratio\n`;
      prometheusText += `# TYPE zantara_cache_hit_rate gauge\n`;
      prometheusText += `zantara_cache_hit_rate{endpoint="${endpoint}"} ${metricsTyped.cacheHitRate}\n`;

      // Error rate metrics
      prometheusText += `# HELP zantara_error_rate Error rate ratio\n`;
      prometheusText += `# TYPE zantara_error_rate gauge\n`;
      prometheusText += `zantara_error_rate{endpoint="${endpoint}"} ${metricsTyped.errorRate}\n`;
    });

    return prometheusText;
  }
}

// Export singleton
export const performanceMonitor = PerformanceMonitor.getInstance();
