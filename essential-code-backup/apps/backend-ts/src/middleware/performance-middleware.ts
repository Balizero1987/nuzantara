/**
 * Performance Monitoring Middleware
 *
 * Tracks request/response performance for v3 Ω endpoints
 * Integrates with performance monitor for metrics collection
 */

import { Request, Response, NextFunction } from 'express';
import {
  performanceMonitor,
  PerformanceMetrics,
} from '../services/monitoring/performance-monitor.js';
import { logger } from '../logging/unified-logger.js';

interface ExtendedRequest extends Request {
  startTime?: number;
  requestId?: string;
}

/**
 * Performance tracking middleware
 */
export function performanceMiddleware(
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip monitoring for health endpoints and static assets
  if (shouldSkipMonitoring(req.path)) {
    return next();
  }

  // Generate unique request ID
  const requestId = generateRequestId();

  // Record start time
  const startTime = Date.now();
  req.startTime = startTime;
  req.requestId = requestId;

  // Store original end method
  const originalEnd = res.end;
  const originalJson = res.json;

  // Override res.json to capture response data
  res.json = function (data: any) {
    // Store response data for analysis
    (res as any).responseData = data;
    return originalJson.call(this, data);
  };

  // Override res.end to capture metrics
  res.end = function (chunk?: any, encoding?: any, _cb?: any) {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Extract performance data from response if available
    const responseData = (res as any).responseData;
    const isCached = responseData?.performance?.cached || false;
    const cacheHitTime = responseData?.performance?.cached
      ? responseData?.performance?.queryTime
      : undefined;
    const domainTimes = responseData?.performance?.domainTimes;

    // Create metrics object
    const metrics: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      cached: isCached,
      cacheHitTime,
      queryTime: responseData?.performance?.queryTime,
      domainTimes,
      timestamp: startTime,
      requestId,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Record metrics
    performanceMonitor.recordMetrics(metrics);

    // Log performance for slow requests
    if (responseTime > 5000) {
      logger.warn(`🐌 Slow request: ${req.method} ${req.path} - ${responseTime}ms`, {
        requestId,
        statusCode: res.statusCode,
        cached: isCached,
      });
    }

    // Log successful cache hits
    if (isCached && cacheHitTime && cacheHitTime < 100) {
      logger.debug(`🎯 Fast cache hit: ${req.path} - ${cacheHitTime}ms`, {
        requestId,
        cacheRatio: cacheHitTime / responseTime,
      });
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Performance metrics endpoint
 */
export function performanceMetricsRoute(_req: Request, res: Response): void {
  try {
    const { timeWindow = 60, endpoint } = _req.query;
    const timeWindowMinutes = parseInt(timeWindow as string) || 60;

    if (endpoint) {
      // Get metrics for specific endpoint
      const metrics = performanceMonitor.getAggregatedMetrics(
        endpoint as string,
        timeWindowMinutes
      );
      res.json({
        ok: true,
        data: metrics,
        meta: {
          endpoint,
          timeWindowMinutes,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Get comprehensive performance summary
      const summary = performanceMonitor.getPerformanceSummary(timeWindowMinutes);
      res.json({
        ok: true,
        data: summary,
        meta: {
          timeWindowMinutes,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    logger.error('Performance metrics error:', error as Error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get performance metrics',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Prometheus metrics endpoint
 */
export function prometheusMetricsRoute(_req: Request, res: Response): void {
  try {
    const metrics = performanceMonitor.getPrometheusMetrics();

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  } catch (error) {
    logger.error('Prometheus metrics error:', error as Error);
    res.status(500).send('# Error generating metrics\n');
  }
}

/**
 * Health check with performance status
 */
export function performanceHealthRoute(_req: Request, res: Response): void {
  try {
    const summary = performanceMonitor.getPerformanceSummary(5); // Last 5 minutes
    const alerts = performanceMonitor.getActiveAlerts();

    const health = {
      status: 'healthy',
      score: summary.health,
      checks: {
        response_time: summary.summary.averageResponseTime < 5000 ? 'pass' : 'fail',
        error_rate: summary.summary.errorRate < 0.05 ? 'pass' : 'fail',
        cache_hit_rate: summary.summary.cacheHitRate > 0.5 ? 'pass' : 'warn',
        request_rate: summary.summary.requestsPerMinute > 0 ? 'pass' : 'warn',
      },
      alerts: alerts.slice(0, 10), // Limit to 10 most recent alerts
      metrics: summary.summary,
      timestamp: new Date().toISOString(),
    };

    // Determine overall health status
    if (
      health.score < 70 ||
      health.checks.response_time === 'fail' ||
      health.checks.error_rate === 'fail'
    ) {
      health.status = 'unhealthy';
      res.status(503);
    } else if (health.score < 85 || health.checks.cache_hit_rate === 'warn') {
      health.status = 'degraded';
      res.status(200);
    }

    res.json({
      ok: true,
      data: health,
      meta: {
        service: 'zantara-performance-monitor',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Performance health check error:', error as Error);
    res.status(500).json({
      ok: false,
      error: 'Performance health check failed',
      status: 'error',
    });
  }
}

/**
 * Check if monitoring should be skipped for this path
 */
function shouldSkipMonitoring(path: string): boolean {
  const skipPatterns = [
    '/health',
    '/favicon.ico',
    '/robots.txt',
    '/static/',
    '/css/',
    '/js/',
    '/images/',
    '/metrics',
    '/api-docs',
    '/swagger',
  ];

  return skipPatterns.some((pattern) => path.startsWith(pattern));
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware to add performance headers
 */
export function performanceHeaders(req: Request, res: Response, next: NextFunction): void {
  // Add server timing header
  res.setHeader('Server-Timing', 'zantara-monitor;desc="Performance Monitoring"');

  // Add cache control headers for API responses
  if (req.path.startsWith('/api/v3/zantara') || req.path.startsWith('/zantara.')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * Clean up old metrics periodically
 */
export function startMetricsCleanup(): void {
  // Clean up metrics older than 24 hours every hour
  setInterval(
    () => {
      performanceMonitor.clearMetrics(1440); // 24 hours
      logger.info('🧹 Scheduled metrics cleanup completed');
    },
    60 * 60 * 1000
  ); // 1 hour

  logger.info('📊 Performance metrics cleanup scheduler started');
}
