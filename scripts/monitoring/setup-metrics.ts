/**
 * ZANTARA Monitoring & Metrics Setup
 * Prometheus-compatible metrics for production monitoring
 */

import { register, Counter, Histogram, Gauge } from 'prom-client';

// HTTP Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 3, 5],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
});

export const dbConnectionsIdle = new Gauge({
  name: 'db_connections_idle',
  help: 'Number of idle database connections',
});

export const dbErrorsTotal = new Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['error_type'],
});

// Cache metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

export const cacheOperationDuration = new Histogram({
  name: 'cache_operation_duration_seconds',
  help: 'Duration of cache operations in seconds',
  labelNames: ['operation', 'cache_name'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

// Application metrics
export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active WebSocket/HTTP connections',
  labelNames: ['type'],
});

export const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
});

export const cpuUsage = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage',
});

// AI/RAG metrics
export const aiRequestDuration = new Histogram({
  name: 'ai_request_duration_seconds',
  help: 'Duration of AI/LLM requests in seconds',
  labelNames: ['model', 'agent'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
});

export const aiRequestsTotal = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI/LLM requests',
  labelNames: ['model', 'agent', 'status'],
});

export const ragQueryDuration = new Histogram({
  name: 'rag_query_duration_seconds',
  help: 'Duration of RAG queries in seconds',
  labelNames: ['collection'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5, 10],
});

// Business metrics
export const userSessionsActive = new Gauge({
  name: 'user_sessions_active',
  help: 'Number of active user sessions',
});

export const userActionsTotal = new Counter({
  name: 'user_actions_total',
  help: 'Total number of user actions',
  labelNames: ['action_type'],
});

/**
 * Collect system metrics
 */
export function collectSystemMetrics() {
  const usage = process.memoryUsage();

  memoryUsage.set({ type: 'heap_used' }, usage.heapUsed);
  memoryUsage.set({ type: 'heap_total' }, usage.heapTotal);
  memoryUsage.set({ type: 'rss' }, usage.rss);
  memoryUsage.set({ type: 'external' }, usage.external);

  // CPU usage (simplified)
  const cpuUsageValue = process.cpuUsage();
  cpuUsage.set((cpuUsageValue.user + cpuUsageValue.system) / 1000000);
}

/**
 * Express middleware for HTTP metrics
 */
export function metricsMiddleware(req: any, res: any, next: any) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();

    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestTotal.inc({ method, route, status_code: statusCode });

    if (statusCode.startsWith('5') || statusCode.startsWith('4')) {
      httpErrorsTotal.inc({
        method,
        route,
        status_code: statusCode,
        error_type: statusCode.startsWith('5') ? 'server_error' : 'client_error',
      });
    }
  });

  next();
}

/**
 * Get metrics for Prometheus scraping
 */
export async function getMetrics(): Promise<string> {
  // Collect current system metrics
  collectSystemMetrics();

  // Return all metrics in Prometheus format
  return register.metrics();
}

/**
 * Health check with detailed status
 */
export async function getHealthStatus(): Promise<any> {
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    memory: {
      heapUsed: Math.floor(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.floor(memory.heapTotal / 1024 / 1024),
      rss: Math.floor(memory.rss / 1024 / 1024),
    },
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Initialize metrics collection
 */
export function initializeMetrics() {
  // Collect default metrics (CPU, memory, event loop, etc.)
  require('prom-client').collectDefaultMetrics({
    prefix: 'zantara_',
    timeout: 10000,
  });

  // Collect system metrics every 15 seconds
  setInterval(collectSystemMetrics, 15000);

  console.log('[Metrics] Prometheus metrics initialized');
}
