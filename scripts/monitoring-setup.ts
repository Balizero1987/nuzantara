/**
 * ZANTARA Production Monitoring System
 * Comprehensive ChromaDB performance monitoring, metrics tracking, and alerting
 * 
 * Features:
 * - ChromaDB performance metrics (latency, throughput, connection health)
 * - Query success rate tracking (success/failure counts and percentages)
 * - Response time monitoring (P50, P95, P99 percentiles)
 * - Error alerting system (console, webhook, email, Slack)
 * 
 * Usage:
 *   import { ChromaDBMonitor, setupMonitoring } from './scripts/monitoring-setup';
 *   const monitor = setupMonitoring({ chromaUrl: process.env.CHROMA_URL });
 *   monitor.trackQuery('search', async () => { /* query */ });
 */

import * as promClient from 'prom-client';
import { Client } from 'chromadb';
import logger from '../apps/backend-ts/src/services/logger.js';

// Note: chromadb package needs to be installed: npm install chromadb
// If using ESM, ensure proper module resolution

// ============================================================================
// Prometheus Metrics Registration
// ============================================================================

const chromaMetricsRegister = new promClient.Registry();

// ChromaDB Performance Metrics
const chromaQueryDuration = new promClient.Histogram({
  name: 'chromadb_query_duration_seconds',
  help: 'Duration of ChromaDB queries in seconds',
  labelNames: ['operation', 'collection', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [chromaMetricsRegister]
});

const chromaQueryTotal = new promClient.Counter({
  name: 'chromadb_queries_total',
  help: 'Total number of ChromaDB queries',
  labelNames: ['operation', 'collection', 'status'],
  registers: [chromaMetricsRegister]
});

const chromaQuerySuccessRate = new promClient.Gauge({
  name: 'chromadb_query_success_rate',
  help: 'Success rate of ChromaDB queries (0-1)',
  labelNames: ['operation', 'collection'],
  registers: [chromaMetricsRegister]
});

const chromaConnectionHealth = new promClient.Gauge({
  name: 'chromadb_connection_health',
  help: 'ChromaDB connection health status (1=healthy, 0=unhealthy)',
  registers: [chromaMetricsRegister]
});

const chromaActiveConnections = new promClient.Gauge({
  name: 'chromadb_active_connections',
  help: 'Number of active ChromaDB connections',
  registers: [chromaMetricsRegister]
});

const chromaQueryThroughput = new promClient.Gauge({
  name: 'chromadb_queries_per_second',
  help: 'ChromaDB queries per second',
  labelNames: ['operation'],
  registers: [chromaMetricsRegister]
});

const chromaErrorTotal = new promClient.Counter({
  name: 'chromadb_errors_total',
  help: 'Total number of ChromaDB errors',
  labelNames: ['operation', 'collection', 'error_type'],
  registers: [chromaMetricsRegister]
});

const chromaCollectionSize = new promClient.Gauge({
  name: 'chromadb_collection_size',
  help: 'Number of documents in ChromaDB collection',
  labelNames: ['collection'],
  registers: [chromaMetricsRegister]
});

const chromaEmbeddingDimensions = new promClient.Gauge({
  name: 'chromadb_embedding_dimensions',
  help: 'Number of dimensions in ChromaDB embeddings',
  labelNames: ['collection'],
  registers: [chromaMetricsRegister]
});

// Alert Metrics
const alertFired = new promClient.Counter({
  name: 'chromadb_alerts_fired_total',
  help: 'Total number of alerts fired',
  labelNames: ['alert_type', 'severity'],
  registers: [chromaMetricsRegister]
});

const alertActive = new promClient.Gauge({
  name: 'chromadb_alerts_active',
  help: 'Number of currently active alerts',
  labelNames: ['alert_type', 'severity'],
  registers: [chromaMetricsRegister]
});

// Register default metrics
promClient.collectDefaultMetrics({
  register: chromaMetricsRegister,
  prefix: 'chromadb_monitor_'
});

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MonitoringConfig {
  chromaUrl?: string;
  enableAlerts?: boolean;
  alertThresholds?: AlertThresholds;
  alertChannels?: AlertChannels;
  metricsPort?: number;
  healthCheckInterval?: number;
  collectionNames?: string[];
}

export interface AlertThresholds {
  errorRate?: number;          // Percentage (0-100)
  responseTimeP95?: number;    // Milliseconds
  connectionFailures?: number; // Count in time window
  queryFailures?: number;      // Count in time window
}

export interface AlertChannels {
  console?: boolean;
  webhook?: string | null;
  email?: string | null;
  slack?: string | null;
}

export interface QueryMetrics {
  operation: string;
  collection: string;
  duration: number;
  success: boolean;
  error?: string;
  resultCount?: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Alert Manager
// ============================================================================

class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private alertCooldown: Map<string, number> = new Map();
  private readonly cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  constructor(private config: AlertChannels) {}

  /**
   * Fire an alert if conditions are met
   */
  async fireAlert(
    type: string,
    severity: 'critical' | 'warning' | 'info',
    message: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alertId = `${type}_${severity}`;
    const now = Date.now();
    
    // Check cooldown
    const lastAlert = this.alertCooldown.get(alertId);
    if (lastAlert && (now - lastAlert) < this.cooldownPeriod) {
      logger.debug(`Alert ${alertId} in cooldown, skipping`);
      return;
    }

    const alert: Alert = {
      id: alertId,
      type,
      severity,
      message,
      timestamp: new Date(),
      metadata
    };

    this.alerts.set(alertId, alert);
    this.alertCooldown.set(alertId, now);

    // Update metrics
    alertFired.labels(type, severity).inc();
    alertActive.labels(type, severity).inc();

    // Send to configured channels
    await this.sendAlert(alert);

    logger.warn(`🚨 Alert fired: [${severity.toUpperCase()}] ${type} - ${message}`, metadata);
  }

  /**
   * Send alert to all configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Console alert
    if (this.config.console !== false) {
      promises.push(this.sendConsoleAlert(alert));
    }

    // Webhook alert
    if (this.config.webhook) {
      promises.push(this.sendWebhookAlert(alert));
    }

    // Email alert (implement if email service is available)
    if (this.config.email) {
      promises.push(this.sendEmailAlert(alert));
    }

    // Slack alert
    if (this.config.slack) {
      promises.push(this.sendSlackAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  private async sendConsoleAlert(alert: Alert): Promise<void> {
    const emoji = {
      critical: '🔴',
      warning: '🟡',
      info: '🔵'
    }[alert.severity];

    console.error(
      `\n${emoji} [${alert.severity.toUpperCase()}] ChromaDB Alert: ${alert.type}\n` +
      `Message: ${alert.message}\n` +
      `Time: ${alert.timestamp.toISOString()}\n` +
      `Metadata: ${JSON.stringify(alert.metadata || {}, null, 2)}\n`
    );
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.webhook) return;

    try {
      const axios = (await import('axios')).default;
      await axios.post(this.config.webhook, {
        alert: {
          ...alert,
          service: 'zantara-chromadb-monitor',
          environment: process.env.NODE_ENV || 'production'
        }
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      logger.error('Failed to send webhook alert', { error: error.message, webhook: this.config.webhook });
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Email alerting would require email service integration
    // For now, log that email alerting is requested
    logger.info('Email alerting requested but not implemented', {
      email: this.config.email,
      alert: alert.type
    });
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!this.config.slack) return;

    try {
      const axios = (await import('axios')).default;
      const color = {
        critical: '#ff0000',
        warning: '#ffaa00',
        info: '#0066cc'
      }[alert.severity];

      await axios.post(this.config.slack, {
        text: `🚨 ChromaDB Alert: ${alert.type}`,
        attachments: [{
          color,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true },
            ...(alert.metadata ? [{
              title: 'Metadata',
              value: `\`\`\`${JSON.stringify(alert.metadata, null, 2)}\`\`\``,
              short: false
            }] : [])
          ]
        }]
      }, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      logger.error('Failed to send Slack alert', { error: error.message });
    }
  }

  /**
   * Clear a resolved alert
   */
  clearAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alertActive.labels(alert.type, alert.severity).dec();
      this.alerts.delete(alertId);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }
}

// ============================================================================
// Query Metrics Tracker
// ============================================================================

class QueryMetricsTracker {
  private queryCounts: Map<string, { success: number; failure: number }> = new Map();
  private throughputWindow: { timestamp: number; operation: string }[] = [];
  private readonly windowSize = 60; // 60 seconds

  /**
   * Record a query metric
   */
  recordQuery(metrics: QueryMetrics): void {
    const key = `${metrics.operation}_${metrics.collection}`;
    
    // Update counters
    if (!this.queryCounts.has(key)) {
      this.queryCounts.set(key, { success: 0, failure: 0 });
    }
    
    const counts = this.queryCounts.get(key)!;
    if (metrics.success) {
      counts.success++;
    } else {
      counts.failure++;
    }

    // Update Prometheus metrics
    chromaQueryTotal
      .labels(metrics.operation, metrics.collection, metrics.success ? 'success' : 'failure')
      .inc();

    chromaQueryDuration
      .labels(metrics.operation, metrics.collection, metrics.success ? 'success' : 'failure')
      .observe(metrics.duration);

    // Update success rate
    const total = counts.success + counts.failure;
    const successRate = total > 0 ? counts.success / total : 1;
    chromaQuerySuccessRate
      .labels(metrics.operation, metrics.collection)
      .set(successRate);

    // Track throughput
    const now = Date.now();
    this.throughputWindow.push({ timestamp: now, operation: metrics.operation });
    
    // Clean old entries
    this.throughputWindow = this.throughputWindow.filter(
      entry => (now - entry.timestamp) < this.windowSize * 1000
    );

    // Calculate queries per second per operation
    const operations = new Set(this.throughputWindow.map(e => e.operation));
    operations.forEach(op => {
      const count = this.throughputWindow.filter(e => e.operation === op).length;
      chromaQueryThroughput.labels(op).set(count / this.windowSize);
    });

    // Track errors
    if (!metrics.success && metrics.error) {
      const errorType = this.categorizeError(metrics.error);
      chromaErrorTotal
        .labels(metrics.operation, metrics.collection, errorType)
        .inc();
    }
  }

  /**
   * Get success rate for an operation/collection
   */
  getSuccessRate(operation: string, collection: string): number {
    const key = `${operation}_${collection}`;
    const counts = this.queryCounts.get(key);
    if (!counts) return 1;
    const total = counts.success + counts.failure;
    return total > 0 ? counts.success / total : 1;
  }

  /**
   * Reset counters (useful for testing)
   */
  reset(): void {
    this.queryCounts.clear();
    this.throughputWindow = [];
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout') || error.includes('ECONNRESET')) return 'timeout';
    if (error.includes('connection') || error.includes('ECONNREFUSED')) return 'connection';
    if (error.includes('not found') || error.includes('404')) return 'not_found';
    if (error.includes('permission') || error.includes('403')) return 'permission';
    return 'unknown';
  }
}

// ============================================================================
// ChromaDB Monitor
// ============================================================================

export class ChromaDBMonitor {
  private client: Client;
  private alertManager: AlertManager;
  private metricsTracker: QueryMetricsTracker;
  private healthCheckInterval?: NodeJS.Timeout;
  private collections: Set<string> = new Set();

  constructor(private config: MonitoringConfig) {
    // Initialize ChromaDB client
    this.client = new Client({
      path: config.chromaUrl || process.env.CHROMA_URL || 'http://localhost:8000'
    });

    // Initialize alert manager
    this.alertManager = new AlertManager(
      config.alertChannels || { console: true }
    );

    // Initialize metrics tracker
    this.metricsTracker = new QueryMetricsTracker();

    // Track configured collections
    if (config.collectionNames) {
      config.collectionNames.forEach(name => this.collections.add(name));
    }

    logger.info('ChromaDB Monitor initialized', {
      chromaUrl: config.chromaUrl || process.env.CHROMA_URL,
      alertsEnabled: config.enableAlerts !== false
    });
  }

  /**
   * Track a ChromaDB query operation with automatic metrics collection
   */
  async trackQuery<T>(
    operation: string,
    collection: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let result: T;

    try {
      result = await queryFn();
      success = true;
      
      // Track collection if not already tracked
      this.collections.add(collection);

      // Update metrics
      this.metricsTracker.recordQuery({
        operation,
        collection,
        duration: (Date.now() - startTime) / 1000,
        success: true,
        resultCount: Array.isArray(result) ? result.length : undefined
      });

      return result;
    } catch (err: any) {
      success = false;
      error = err.message || String(err);
      
      // Update metrics
      this.metricsTracker.recordQuery({
        operation,
        collection,
        duration: (Date.now() - startTime) / 1000,
        success: false,
        error
      });

      // Check for alert conditions
      if (this.config.enableAlerts !== false) {
        await this.checkAlertConditions(operation, collection, error);
      }

      throw err;
    }
  }

  /**
   * Check if alert conditions are met and fire alerts if needed
   */
  private async checkAlertConditions(
    operation: string,
    collection: string,
    error: string
  ): Promise<void> {
    const thresholds = this.config.alertThresholds || {};
    const successRate = this.metricsTracker.getSuccessRate(operation, collection);

    // Check error rate threshold
    if (thresholds.errorRate !== undefined) {
      const errorRate = (1 - successRate) * 100;
      if (errorRate > thresholds.errorRate) {
        await this.alertManager.fireAlert(
          'high_error_rate',
          errorRate > thresholds.errorRate * 1.5 ? 'critical' : 'warning',
          `High error rate for ${operation}/${collection}: ${errorRate.toFixed(2)}%`,
          {
            operation,
            collection,
            errorRate,
            threshold: thresholds.errorRate,
            successRate
          }
        );
      }
    }

    // Check for connection errors
    if (error.includes('connection') || error.includes('ECONNREFUSED')) {
      await this.alertManager.fireAlert(
        'connection_error',
        'critical',
        `ChromaDB connection error: ${error}`,
        { operation, collection, error }
      );
    }

    // Check for timeout errors
    if (error.includes('timeout')) {
      await this.alertManager.fireAlert(
        'timeout_error',
        'warning',
        `ChromaDB query timeout: ${error}`,
        { operation, collection, error }
      );
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMs);

    // Perform initial health check
    this.performHealthCheck();

    logger.info(`Health checks started with interval ${intervalMs}ms`);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const startTime = Date.now();
      await this.client.heartbeat();
      const duration = Date.now() - startTime;

      chromaConnectionHealth.set(1);
      chromaActiveConnections.set(1);

      // Check response time threshold
      const thresholds = this.config.alertThresholds || {};
      if (thresholds.responseTimeP95 && duration > thresholds.responseTimeP95) {
        await this.alertManager.fireAlert(
          'slow_health_check',
          'warning',
          `ChromaDB health check is slow: ${duration}ms`,
          { duration, threshold: thresholds.responseTimeP95 }
        );
      }

      // Update collection metrics
      await this.updateCollectionMetrics();

    } catch (error: any) {
      chromaConnectionHealth.set(0);
      chromaActiveConnections.set(0);

      if (this.config.enableAlerts !== false) {
        await this.alertManager.fireAlert(
          'health_check_failed',
          'critical',
          `ChromaDB health check failed: ${error.message}`,
          { error: error.message }
        );
      }

      logger.error('ChromaDB health check failed', { error: error.message });
    }
  }

  /**
   * Update collection metrics (size, dimensions, etc.)
   */
  private async updateCollectionMetrics(): Promise<void> {
    for (const collectionName of this.collections) {
      try {
        const collection = await this.client.getCollection({ name: collectionName });
        
        // Get collection count
        const count = await collection.count();
        chromaCollectionSize.labels(collectionName).set(count);

        // Get embedding dimensions if available
        try {
          const peek = await collection.peek({ limit: 1 });
          if (peek.embeddings && peek.embeddings.length > 0 && peek.embeddings[0].length > 0) {
            chromaEmbeddingDimensions.labels(collectionName).set(peek.embeddings[0].length);
          }
        } catch (err) {
          // Collection might be empty or not have embeddings
        }
      } catch (error: any) {
        logger.debug(`Failed to update metrics for collection ${collectionName}`, {
          error: error.message
        });
      }
    }
  }

  /**
   * Get current metrics as Prometheus format
   */
  async getMetrics(): Promise<string> {
    return await chromaMetricsRegister.metrics();
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): {
    queries: Record<string, { success: number; failure: number; successRate: number }>;
    activeAlerts: Alert[];
    connectionHealth: number;
  } {
    const queries: Record<string, { success: number; failure: number; successRate: number }> = {};
    
    // This would need to be enhanced to track actual counts
    // For now, return a simplified summary
    return {
      queries,
      activeAlerts: this.alertManager.getActiveAlerts(),
      connectionHealth: 0 // Would need to be tracked
    };
  }

  /**
   * Get the underlying ChromaDB client
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Register a collection for monitoring
   */
  registerCollection(name: string): void {
    this.collections.add(name);
    logger.debug(`Registered collection for monitoring: ${name}`);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Setup and initialize ChromaDB monitoring
 */
export function setupMonitoring(config: MonitoringConfig = {}): ChromaDBMonitor {
  const defaultConfig: MonitoringConfig = {
    chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
    enableAlerts: true,
    alertThresholds: {
      errorRate: 10,        // 10% error rate threshold
      responseTimeP95: 1000, // 1 second P95 threshold
      connectionFailures: 3, // 3 failures in window
      queryFailures: 10     // 10 failures in window
    },
    alertChannels: {
      console: true,
      webhook: process.env.ALERT_WEBHOOK_URL || null,
      email: process.env.ALERT_EMAIL || null,
      slack: process.env.SLACK_WEBHOOK_URL || null
    },
    healthCheckInterval: 30000, // 30 seconds
    collectionNames: []
  };

  const finalConfig = { ...defaultConfig, ...config };

  const monitor = new ChromaDBMonitor(finalConfig);

  // Start health checks if interval is configured
  if (finalConfig.healthCheckInterval && finalConfig.healthCheckInterval > 0) {
    monitor.startHealthChecks(finalConfig.healthCheckInterval);
  }

  logger.info('ChromaDB monitoring setup completed', {
    chromaUrl: finalConfig.chromaUrl,
    alertsEnabled: finalConfig.enableAlerts
  });

  return monitor;
}

// ============================================================================
// Export Metrics Registry
// ============================================================================

export { chromaMetricsRegister };

// ============================================================================
// Example Usage (for documentation)
// ============================================================================

/*
// Basic setup
const monitor = setupMonitoring({
  chromaUrl: 'http://localhost:8000',
  enableAlerts: true,
  alertThresholds: {
    errorRate: 5,
    responseTimeP95: 500
  },
  alertChannels: {
    console: true,
    webhook: 'https://your-webhook-url.com/alerts'
  }
});

// Track a query
const results = await monitor.trackQuery(
  'search',
  'my_collection',
  async () => {
    const collection = await monitor.getClient().getCollection({ name: 'my_collection' });
    return await collection.query({
      queryTexts: ['some query'],
      nResults: 10
    });
  }
);

// Get metrics
const metrics = await monitor.getMetrics();
console.log(metrics);

// Get summary
const summary = monitor.getMetricsSummary();
console.log(summary);
*/

