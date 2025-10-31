/**
 * ZANTARA Observability Middleware
 * Prometheus metrics and structured logging
 */

import { Request, Response, NextFunction } from 'express';
import * as promClient from 'prom-client';

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'zantara_backend_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Custom metrics
const httpRequestsTotal = new promClient.Counter({
  name: 'zantara_backend_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
  name: 'zantara_backend_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.003, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

const activeRequests = new promClient.Gauge({
  name: 'zantara_backend_active_requests',
  help: 'Number of active requests',
  registers: [register]
});

const httpResponseSize = new promClient.Summary({
  name: 'zantara_backend_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  registers: [register]
});

// Cache metrics
const cacheHits = new promClient.Counter({
  name: 'zantara_backend_cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register]
});

const cacheMisses = new promClient.Counter({
  name: 'zantara_backend_cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register]
});

// Metrics middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';

  // Track active requests
  activeRequests.inc();

  // Hook into response
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = (Date.now() - start) / 1000;

    // Track metrics
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);

    // Track response size
    if (data) {
      const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
      httpResponseSize.labels(req.method, route).observe(size);
    }

    // Decrement active requests
    activeRequests.dec();

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

// Metrics endpoint handler
export async function metricsHandler(req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
}

// Export metrics objects for external use
export { register, httpRequestsTotal, httpRequestDuration, cacheHits, cacheMisses };