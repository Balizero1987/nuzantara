/**
 * Performance Logging Integration
 * Provides performance monitoring with minimal overhead
 */

import { logger, LogContext, LogMetrics } from './unified-logger.js';
import type { CorrelatedRequest } from './correlation-middleware.js';

// Performance measurement interface
export interface PerformanceMeasurement {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  context: LogContext;
  metadata?: Record<string, any>;
}

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,      // < 100ms
  NORMAL: 500,    // < 500ms
  SLOW: 1000,     // < 1s
  VERY_SLOW: 5000 // < 5s
};

// Active measurements tracking
const activeMeasurements = new Map<string, PerformanceMeasurement>();

/**
 * Start performance measurement
 */
export function startPerformanceMeasurement(
  operation: string,
  context: LogContext,
  metadata?: Record<string, any>
): string {
  const measurementId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const measurement: PerformanceMeasurement = {
    operation,
    startTime: Date.now(),
    context,
    metadata
  };

  activeMeasurements.set(measurementId, measurement);

  logger.trace(`Started performance measurement: ${operation}`, {
    ...context,
    type: 'performance_start',
    measurementId,
    operation,
    metadata
  });

  return measurementId;
}

/**
 * End performance measurement and log results
 */
export function endPerformanceMeasurement(measurementId: string, additionalContext?: LogContext): number {
  const measurement = activeMeasurements.get(measurementId);
  if (!measurement) {
    logger.warn(`Performance measurement not found: ${measurementId}`, { type: 'performance_error' });
    return 0;
  }

  measurement.endTime = Date.now();
  measurement.duration = measurement.endTime - measurement.startTime;

  const finalContext = {
    ...measurement.context,
    ...additionalContext
  };

  // Determine performance category
  const category = getPerformanceCategory(measurement.duration);
  const logLevel = getLogLevelForPerformance(category);

  // Log based on performance category
  const logMessage = `Performance: ${measurement.operation} - ${measurement.duration}ms (${category})`;

  if (logLevel === 'error') {
    logger.error(logMessage, undefined, {
      ...finalContext,
      type: 'performance_slow',
      operation: measurement.operation,
      duration: measurement.duration,
      category,
      measurementId,
      metadata: measurement.metadata
    });
  } else if (logLevel === 'warn') {
    logger.warn(logMessage, {
      ...finalContext,
      type: 'performance_warning',
      operation: measurement.operation,
      duration: measurement.duration,
      category,
      measurementId,
      metadata: measurement.metadata
    });
  } else {
    logger.debug(logMessage, {
      ...finalContext,
      type: 'performance_normal',
      operation: measurement.operation,
      duration: measurement.duration,
      category,
      measurementId,
      metadata: measurement.metadata
    });
  }

  // Clean up
  activeMeasurements.delete(measurementId);
  return measurement.duration;
}

/**
 * Get performance category based on duration
 */
function getPerformanceCategory(duration: number): string {
  if (duration < PERFORMANCE_THRESHOLDS.FAST) return 'FAST';
  if (duration < PERFORMANCE_THRESHOLDS.NORMAL) return 'NORMAL';
  if (duration < PERFORMANCE_THRESHOLDS.SLOW) return 'SLOW';
  if (duration < PERFORMANCE_THRESHOLDS.VERY_SLOW) return 'VERY_SLOW';
  return 'CRITICAL';
}

/**
 * Get log level for performance category
 */
function getLogLevelForPerformance(category: string): 'debug' | 'warn' | 'error' {
  switch (category) {
    case 'FAST':
    case 'NORMAL':
      return 'debug';
    case 'SLOW':
      return 'warn';
    case 'VERY_SLOW':
    case 'CRITICAL':
      return 'error';
    default:
      return 'debug';
  }
}

/**
 * Performance measurement wrapper for async functions
 */
export async function withPerformanceTracking<T>(
  operation: string,
  context: LogContext,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const measurementId = startPerformanceMeasurement(operation, context, metadata);

  try {
    const result = await fn();
    endPerformanceMeasurement(measurementId, { success: true });
    return result;
  } catch (error) {
    endPerformanceMeasurement(measurementId, {
      success: false,
      error: (error as Error).message
    });
    throw error;
  }
}

/**
 * HTTP request performance tracking middleware
 */
export function performanceMiddleware() {
  return function (req: CorrelatedRequest, res: any, next: any) {
    const measurementId = startPerformanceMeasurement(
      `http_${req.method}_${req.url.replace(/[^a-zA-Z0-9]/g, '_')}`,
      req.logContext,
      {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent')
      }
    );

    // Store measurement ID for later use
    (req as any).performanceMeasurementId = measurementId;

    // Override res.end to capture final timing
    const originalEnd = res.end;
    res.end = function(this: any, ...args: any[]) {
      endPerformanceMeasurement(measurementId, {
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });
      originalEnd.apply(this, args);
    };

    next();
  };
}

/**
 * Database query performance tracking
 */
export function trackDatabaseQuery(
  query: string,
  context: LogContext,
  duration: number
): void {
  const category = getPerformanceCategory(duration);

  if (category === 'SLOW' || category === 'VERY_SLOW' || category === 'CRITICAL') {
    logger.warn(`Slow database query: ${duration}ms`, {
      ...context,
      type: 'database_slow',
      query: query.substring(0, 200), // Limit query length in logs
      duration,
      category
    });
  } else {
    logger.trace(`Database query: ${duration}ms`, {
      ...context,
      type: 'database_query',
      query: query.substring(0, 200),
      duration,
      category
    });
  }
}

/**
 * External API call performance tracking
 */
export function trackApiCall(
  service: string,
  endpoint: string,
  context: LogContext,
  duration: number,
  success: boolean
): void {
  const category = getPerformanceCategory(duration);

  logger.info('API call: ${service}${endpoint} - ${duration}ms (${success ? \'SUCCESS\' : \'FAILED\'})', {
    ...context,
    type: 'api_call',
    service,
    endpoint,
    duration,
    success,
    category
  });
}

/**
 * Cache performance tracking
 */
export function trackCacheOperation(
  operation: 'get' | 'set' | 'delete' | 'clear',
  key: string,
  context: LogContext,
  duration: number,
  hit?: boolean
): void {
  logger.trace(`Cache ${operation}: ${key} - ${duration}ms`, {
    ...context,
    type: 'cache_operation',
    operation,
    key: key.substring(0, 100), // Limit key length
    duration,
    hit
  });
}

/**
 * Memory usage tracking
 */
export function trackMemoryUsage(context: LogContext): void {
  const memUsage = process.memoryUsage();

  logger.debug('Memory usage', {
    ...context,
    type: 'memory_usage',
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers
    }
  });
}

/**
 * Periodic performance summary
 */
export class PerformanceMonitor {
  private interval: NodeJS.Timeout | null = null;
  private measurements: Array<{ operation: string; duration: number; timestamp: number }> = [];

  constructor(private intervalMs: number = 60000) { // 1 minute default

  }

  start(): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      this.logPerformanceSummary();
    }, this.intervalMs);

    logger.info('Performance monitor started', { intervalMs: this.intervalMs });
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Performance monitor stopped');
    }
  }

  recordMeasurement(operation: string, duration: number): void {
    this.measurements.push({
      operation,
      duration,
      timestamp: Date.now()
    });

    // Keep only last 1000 measurements to prevent memory leaks
    if (this.measurements.length > 1000) {
      this.measurements = this.measurements.slice(-1000);
    }
  }

  private logPerformanceSummary(): void {
    if (this.measurements.length === 0) return;

    const now = Date.now();
    const recentMeasurements = this.measurements.filter(m => now - m.timestamp < this.intervalMs);

    if (recentMeasurements.length === 0) return;

    const avgDuration = recentMeasurements.reduce((sum, m) => sum + m.duration, 0) / recentMeasurements.length;
    const maxDuration = Math.max(...recentMeasurements.map(m => m.duration));
    const slowOperations = recentMeasurements.filter(m => m.duration > PERFORMANCE_THRESHOLDS.SLOW);

    logger.info('Performance summary', {
      type: 'performance_summary',
      interval: this.intervalMs,
      totalOperations: recentMeasurements.length,
      averageDuration: Math.round(avgDuration),
      maxDuration,
      slowOperationsCount: slowOperations.length,
      slowOperations: slowOperations.slice(0, 5) // Top 5 slowest operations
    });

    // Clear old measurements
    this.measurements = this.measurements.filter(m => now - m.timestamp < this.intervalMs * 2);
  }
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor();

export default {
  startPerformanceMeasurement,
  endPerformanceMeasurement,
  withPerformanceTracking,
  performanceMiddleware,
  trackDatabaseQuery,
  trackApiCall,
  trackCacheOperation,
  trackMemoryUsage,
  PerformanceMonitor,
  globalPerformanceMonitor
};