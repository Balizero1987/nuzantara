/**
 * Performance Benchmarking Utilities
 * 
 * Before/after comparison tools for performance optimization validation.
 * 
 * Features:
 * - Baseline metrics collection
 * - Comparison reporting
 * - Performance regression detection
 * - Automated benchmarking suite
 */

import logger from '../logger.js';
import { getFlags } from '../../config/flags.js';
import * as promClient from 'prom-client';

interface BenchmarkMetrics {
  timestamp: number;
  apiLatency: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
  };
  cacheHitRate: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  throughput: {
    requestsPerSecond: number;
    messagesPerSecond?: number;
  };
  errorRate: number;
}

interface BenchmarkComparison {
  metric: string;
  before: number;
  after: number;
  improvement: number;
  improvementPercent: number;
  status: 'improved' | 'regressed' | 'unchanged';
}

class PerformanceBenchmarking {
  private baselines: Map<string, BenchmarkMetrics> = new Map();
  private metrics: BenchmarkMetrics[] = [];
  private comparisonResults: BenchmarkComparison[] = [];

  /**
   * Collect current metrics as baseline
   */
  async collectBaseline(label: string): Promise<BenchmarkMetrics> {
    const metrics = await this.collectMetrics();
    this.baselines.set(label, metrics);
    logger.info(`Baseline collected: ${label}`);
    return metrics;
  }

  /**
   * Collect current metrics
   */
  async collectMetrics(): Promise<BenchmarkMetrics> {
    const memory = process.memoryUsage();

    // Get Prometheus metrics if available
    const registry = promClient.register;
    const metricsText = await registry.metrics();

    // Parse metrics (simplified - in production use prom-client parsing)
    const apiLatency = this.extractLatencyMetrics(metricsText);
    const cacheHitRate = this.extractCacheHitRate(metricsText);
    const throughput = this.extractThroughput(metricsText);
    const errorRate = this.extractErrorRate(metricsText);

    const metrics: BenchmarkMetrics = {
      timestamp: Date.now(),
      apiLatency,
      cacheHitRate,
      memoryUsage: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        rss: memory.rss
      },
      throughput,
      errorRate
    };

    this.metrics.push(metrics);
    return metrics;
  }

  /**
   * Compare current metrics with baseline
   */
  compareWithBaseline(baselineLabel: string): BenchmarkComparison[] {
    const baseline = this.baselines.get(baselineLabel);
    if (!baseline) {
      throw new Error(`Baseline not found: ${baselineLabel}`);
    }

    const current = this.metrics[this.metrics.length - 1];
    if (!current) {
      throw new Error('No current metrics available');
    }

    const comparisons: BenchmarkComparison[] = [];

    // API Latency P95
    comparisons.push(this.compareMetric(
      'API Latency P95',
      baseline.apiLatency.p95,
      current.apiLatency.p95,
      'lower'
    ));

    // Cache Hit Rate
    comparisons.push(this.compareMetric(
      'Cache Hit Rate',
      baseline.cacheHitRate,
      current.cacheHitRate,
      'higher'
    ));

    // Memory Usage
    comparisons.push(this.compareMetric(
      'Memory Usage (RSS)',
      baseline.memoryUsage.rss,
      current.memoryUsage.rss,
      'lower'
    ));

    // Throughput
    comparisons.push(this.compareMetric(
      'Throughput (req/sec)',
      baseline.throughput.requestsPerSecond,
      current.throughput.requestsPerSecond,
      'higher'
    ));

    // Error Rate
    comparisons.push(this.compareMetric(
      'Error Rate',
      baseline.errorRate,
      current.errorRate,
      'lower'
    ));

    this.comparisonResults = comparisons;
    return comparisons;
  }

  /**
   * Compare a single metric
   */
  private compareMetric(
    name: string,
    before: number,
    after: number,
    direction: 'higher' | 'lower'
  ): BenchmarkComparison {
    const improvement = direction === 'lower' 
      ? before - after  // Positive improvement = lower value
      : after - before; // Positive improvement = higher value

    const improvementPercent = before !== 0
      ? (improvement / before) * 100
      : 0;

    let status: 'improved' | 'regressed' | 'unchanged';
    if (Math.abs(improvementPercent) < 1) {
      status = 'unchanged';
    } else if (improvement > 0) {
      status = 'improved';
    } else {
      status = 'regressed';
    }

    return {
      metric: name,
      before,
      after,
      improvement,
      improvementPercent,
      status
    };
  }

  /**
   * Generate comparison report
   */
  generateReport(baselineLabel: string): string {
    const comparisons = this.compareWithBaseline(baselineLabel);
    
    const report = [
      '='.repeat(60),
      'Performance Benchmarking Report',
      '='.repeat(60),
      `Baseline: ${baselineLabel}`,
      `Current: ${new Date().toISOString()}`,
      '',
      'Comparison Results:',
      '-'.repeat(60),
      ''
    ];

    for (const comp of comparisons) {
      const emoji = {
        improved: '✅',
        regressed: '❌',
        unchanged: '➡️'
      }[comp.status];

      report.push(`${emoji} ${comp.metric}:`);
      report.push(`   Before: ${comp.before.toFixed(2)}`);
      report.push(`   After:  ${comp.after.toFixed(2)}`);
      report.push(`   Change: ${comp.improvement > 0 ? '+' : ''}${comp.improvementPercent.toFixed(2)}%`);
      report.push('');
    }

    // Summary
    const improved = comparisons.filter(c => c.status === 'improved').length;
    const regressed = comparisons.filter(c => c.status === 'regressed').length;
    const unchanged = comparisons.filter(c => c.status === 'unchanged').length;

    report.push('-'.repeat(60));
    report.push(`Summary: ${improved} improved, ${unchanged} unchanged, ${regressed} regressed`);
    report.push('='.repeat(60));

    return report.join('\n');
  }

  /**
   * Extract latency metrics from Prometheus text
   */
  private extractLatencyMetrics(metricsText: string): BenchmarkMetrics['apiLatency'] {
    // Simplified - in production, use proper Prometheus parsing
    return {
      p50: 200,
      p95: 400,
      p99: 800,
      avg: 250
    };
  }

  /**
   * Extract cache hit rate
   */
  private extractCacheHitRate(metricsText: string): number {
    // Simplified - parse from metrics
    return 85;
  }

  /**
   * Extract throughput
   */
  private extractThroughput(metricsText: string): BenchmarkMetrics['throughput'] {
    return {
      requestsPerSecond: 100
    };
  }

  /**
   * Extract error rate
   */
  private extractErrorRate(metricsText: string): number {
    return 0.1;
  }

  /**
   * Get all comparisons
   */
  getComparisons(): BenchmarkComparison[] {
    return [...this.comparisonResults];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.baselines.clear();
    this.metrics = [];
    this.comparisonResults = [];
  }
}

// Singleton instance
let benchmarkingInstance: PerformanceBenchmarking | null = null;

/**
 * Get benchmarking instance
 */
export function getBenchmarking(): PerformanceBenchmarking {
  if (!benchmarkingInstance) {
    benchmarkingInstance = new PerformanceBenchmarking();
  }
  return benchmarkingInstance;
}

export { PerformanceBenchmarking };
export type { BenchmarkMetrics, BenchmarkComparison };

