/**
 * Prometheus Metrics Export
 * 
 * Implements Prometheus-compatible metrics endpoint for Grafana integration
 * Part of Q1 2025 Priority Actions from ANALISI_STRATEGICA_ARCHITETTURA.md
 * 
 * @module services/prometheus-metrics
 */

import type { Request, Response } from 'express';
import { getHealthMetrics } from '../middleware/monitoring.js';

// Prometheus metric format: name{label="value"} metric_value timestamp
class PrometheusCollector {
  private metrics: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  // Increment counter
  incrementCounter(name: string, labels?: Record<string, string>, value: number = 1) {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  // Set gauge
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    this.metrics.set(key, value);
  }

  // Record histogram value
  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    // Keep last 1000 values
    if (values.length > 1000) {
      values.shift();
    }
    this.histograms.set(key, values);
  }

  // Build metric key with labels
  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  // Export metrics in Prometheus format
  export(): string {
    const lines: string[] = [];
    
    // Export counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`# TYPE ${this.getName(key)} counter`);
      lines.push(`${key} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.metrics.entries()) {
      lines.push(`# TYPE ${this.getName(key)} gauge`);
      lines.push(`${key} ${value}`);
    }

    // Export histograms
    for (const [key, values] of this.histograms.entries()) {
      const name = this.getName(key);
      lines.push(`# TYPE ${name} histogram`);
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;
        const positives = sorted.filter(v => v > 0);
        
        // Histogram buckets (0.1s, 0.5s, 1s, 2s, 5s, 10s, 30s, 60s)
        const buckets = [0.1, 0.5, 1, 2, 5, 10, 30, 60].map(b => {
          const bucketCount = positives.filter(v => v <= b * 1000).length;
          return `${name}_bucket{le="${b}"} ${bucketCount}`;
        });
        lines.push(...buckets);
        lines.push(`${name}_bucket{le="+Inf"} ${count}`);
        lines.push(`${name}_sum ${sum}`);
        lines.push(`${name}_count ${count}`);
      }
    }

    return lines.join('\n') + '\n';
  }

  private getName(key: string): string {
    const match = key.match(/^([^{]+)/);
    return match ? match[1] : key;
  }
}

// Singleton instance
const collector = new PrometheusCollector();

/**
 * Update metrics from health metrics
 */
export async function updateMetricsFromHealth() {
  try {
    const health = await getHealthMetrics();
    
    // Request metrics
    collector.setGauge('http_requests_total', health.metrics.requests.total);
    collector.setGauge('http_requests_active', health.metrics.requests.active);
    collector.setGauge('http_requests_errors', health.metrics.requests.errors);
    collector.setGauge('http_error_rate_percent', health.metrics.requests.errorRate);
    collector.setGauge('http_response_time_avg_ms', health.metrics.requests.avgResponseTimeMs);

    // System metrics
    collector.setGauge('system_memory_used_mb', health.metrics.system.memoryUsageMB);
    collector.setGauge('system_memory_total_mb', health.metrics.system.memoryTotalMB);
    collector.setGauge('system_uptime_seconds', health.uptime);

    // Service status
    collector.setGauge('service_healthy', health.status === 'healthy' ? 1 : 0);
    collector.setGauge('firebase_available', health.metrics.serviceAccount.available ? 1 : 0);
  } catch (error) {
    console.error('Failed to update metrics from health:', error);
  }
}

/**
 * Prometheus metrics endpoint handler
 */
export async function prometheusMetricsHandler(_req: Request, res: Response) {
  // Update metrics from current health status
  await updateMetricsFromHealth();

  // Set Prometheus content type
  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  
  // Export metrics
  const metrics = collector.export();
  res.send(metrics);
}

/**
 * Record request duration
 */
export function recordRequestDuration(durationMs: number, path: string, method: string, statusCode: number) {
  collector.recordHistogram('http_request_duration_seconds', durationMs / 1000, {
    path,
    method,
    status: statusCode.toString(),
  });
}

/**
 * Record error
 */
export function recordError(errorType: string, path: string) {
  collector.incrementCounter('http_errors_total', {
    type: errorType,
    path,
  });
}

// Export collector for external use
export { collector };
