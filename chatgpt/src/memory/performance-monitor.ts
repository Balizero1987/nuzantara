import { IPerformanceMonitor, MemoryMetrics } from './types.js';

/**
 * Performance monitoring for memory operations
 */
export class PerformanceMonitor implements IPerformanceMonitor {
  private metrics: MemoryMetrics[] = [];
  private readonly maxMetrics: number;

  constructor(maxMetrics = 1000) {
    this.maxMetrics = maxMetrics;
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: MemoryMetrics): void {
    this.metrics.push(metric);

    // Trim metrics if exceeding max
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics, optionally filtered by operation
   */
  getMetrics(operation?: string): MemoryMetrics[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation);
    }
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;

    const total = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / operationMetrics.length;
  }

  /**
   * Get success rate for an operation
   */
  getSuccessRate(operation: string): number {
    const operationMetrics = this.getMetrics(operation);
    if (operationMetrics.length === 0) return 0;

    const successCount = operationMetrics.filter((m) => m.success).length;
    return successCount / operationMetrics.length;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const metricsWithCache = this.metrics.filter((m) => m.cacheHit !== undefined);
    if (metricsWithCache.length === 0) return 0;

    const hits = metricsWithCache.filter((m) => m.cacheHit).length;
    return hits / metricsWithCache.length;
  }

  /**
   * Get statistics summary
   */
  getStatistics(): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    cacheHitRate: number;
    operationBreakdown: Record<string, { count: number; avgDuration: number }>;
  } {
    const operations = new Map<string, number[]>();

    for (const m of this.metrics) {
      if (!operations.has(m.operation)) {
        operations.set(m.operation, []);
      }
      operations.get(m.operation)?.push(m.duration);
    }

    const operationBreakdown: Record<string, { count: number; avgDuration: number }> = {};
    for (const [operation, durations] of operations) {
      const sum = durations.reduce((a, b) => a + b, 0);
      operationBreakdown[operation] = {
        count: durations.length,
        avgDuration: sum / durations.length,
      };
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = this.metrics.filter((m) => m.success).length;

    return {
      totalOperations: this.metrics.length,
      averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
      successRate: this.metrics.length > 0 ? successCount / this.metrics.length : 0,
      cacheHitRate: this.getCacheHitRate(),
      operationBreakdown,
    };
  }
}
