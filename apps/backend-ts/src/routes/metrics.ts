/**
 * ZANTARA Metrics Endpoint - TypeScript Backend
 * Prometheus-compatible metrics for monitoring
 */

import { Router, Request, Response } from 'express';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const router = Router();

// Create a Registry to register metrics
const register = new Registry();

// System Metrics
const httpRequestsTotal = new Counter({
  name: 'zantara_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register],
});

const httpRequestDuration = new Histogram({
  name: 'zantara_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const activeConnections = new Gauge({
  name: 'zantara_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const websocketConnections = new Gauge({
  name: 'zantara_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Oracle Query Metrics
const oracleQueriesTotal = new Counter({
  name: 'zantara_oracle_queries_total',
  help: 'Total Oracle queries',
  labelNames: ['collection', 'status'],
  registers: [register],
});

const oracleQueryDuration = new Histogram({
  name: 'zantara_oracle_query_duration_seconds',
  help: 'Oracle query duration in seconds',
  labelNames: ['collection'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Cache Metrics
const cacheHits = new Counter({
  name: 'zantara_cache_hits_total',
  help: 'Total cache hits',
  registers: [register],
});

const cacheMisses = new Counter({
  name: 'zantara_cache_misses_total',
  help: 'Total cache misses',
  registers: [register],
});

// Export metrics
export const metrics = {
  httpRequestsTotal,
  httpRequestDuration,
  activeConnections,
  websocketConnections,
  oracleQueriesTotal,
  oracleQueryDuration,
  cacheHits,
  cacheMisses,
};

/**
 * Metrics endpoint - returns Prometheus format
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metricsData = await register.metrics();
    res.send(metricsData);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).send('Error generating metrics');
  }
});

/**
 * Health check with metrics
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;
