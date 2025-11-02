/**
 * Enhanced Health Check Endpoints
 * 
 * Provides detailed health information for load balancer and monitoring
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import logger from '../services/logger.js';
import { featureFlags, FeatureFlag } from '../services/feature-flags.js';
import { getDatabasePool } from '../services/connection-pool.js';
import { getChromaDBPool } from '../services/chromadb-pool.js';
import { dbCircuitBreaker, ragCircuitBreaker } from '../services/circuit-breaker.js';
import { ok, err } from '../utils/response.js';

const router = Router();

/**
 * Basic health check for load balancer
 */
router.get('/health', async (_req: Request, res: Response) => {
  try {
    res.status(200).json(ok({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || 'unknown',
    }));
  } catch (error: any) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json(err('Service unhealthy'));
  }
});

/**
 * Detailed health check with all services
 */
router.get('/health/detailed', async (_req: Request, res: Response) => {
  const health: any = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    services: {},
    circuitBreakers: {},
    featureFlags: {},
    metrics: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      cpu: {
        usage: process.cpuUsage(),
      },
    },
  };

  let allHealthy = true;

  // Check PostgreSQL
  try {
    if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
      const pool = getDatabasePool();
      const dbHealthy = await pool.healthCheck();
      const metrics = pool.getMetrics();
      
      health.services.postgresql = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        metrics: metrics || null,
        circuitBreaker: dbCircuitBreaker.getStats(),
      };

      if (!dbHealthy) allHealthy = false;
    } else {
      health.services.postgresql = {
        status: 'check_disabled',
        note: 'Enhanced pooling disabled via feature flag',
      };
    }
  } catch (error: any) {
    health.services.postgresql = {
      status: 'unhealthy',
      error: error.message,
    };
    allHealthy = false;
  }

  // Check ChromaDB
  try {
    if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
      const chromaPool = getChromaDBPool();
      const chromaHealthy = await chromaPool.healthCheck();
      
      health.services.chromadb = {
        status: chromaHealthy ? 'healthy' : 'unhealthy',
        lastHealthCheck: chromaPool.getLastHealthCheck(),
      };

      if (!chromaHealthy) allHealthy = false;
    } else {
      health.services.chromadb = {
        status: 'check_disabled',
        note: 'Enhanced pooling disabled via feature flag',
      };
    }
  } catch (error: any) {
    health.services.chromadb = {
      status: 'unhealthy',
      error: error.message,
    };
    allHealthy = false;
  }

  // Circuit breaker status
  if (featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)) {
    health.circuitBreakers = {
      database: dbCircuitBreaker.getStats(),
      rag: ragCircuitBreaker.getStats(),
    };
  }

  // Feature flags status
  health.featureFlags = featureFlags.getAllFlags();

  // Overall status
  health.status = allHealthy ? 'healthy' : 'degraded';

  const statusCode = allHealthy ? 200 : 503;
  res.status(statusCode).json(ok(health));
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Check critical services
    const checks: any = {
      database: false,
      application: true,
    };

    if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
      try {
        const pool = getDatabasePool();
        checks.database = await pool.healthCheck();
      } catch {
        checks.database = false;
      }
    } else {
      checks.database = true; // Skip if disabled
    }

    const ready = Object.values(checks).every(v => v === true);

    if (ready) {
      res.status(200).json(ok({ ready: true, checks }));
    } else {
      res.status(503).json(err('Service not ready', checks));
    }
  } catch (error: any) {
      res.status(503).json(err('Readiness check failed'));
  }
});

/**
 * Liveness probe - checks if service is alive
 */
router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json(ok({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  }));
});

/**
 * Metrics endpoint for Prometheus
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics: string[] = [];

    // Process metrics
    const memUsage = process.memoryUsage();
    metrics.push(`# HELP process_memory_heap_used_bytes Memory used by the process heap`);
    metrics.push(`# TYPE process_memory_heap_used_bytes gauge`);
    metrics.push(`process_memory_heap_used_bytes ${memUsage.heapUsed}`);

    metrics.push(`# HELP process_memory_heap_total_bytes Total heap memory`);
    metrics.push(`# TYPE process_memory_heap_total_bytes gauge`);
    metrics.push(`process_memory_heap_total_bytes ${memUsage.heapTotal}`);

    metrics.push(`# HELP process_memory_rss_bytes Resident set size`);
    metrics.push(`# TYPE process_memory_rss_bytes gauge`);
    metrics.push(`process_memory_rss_bytes ${memUsage.rss}`);

    metrics.push(`# HELP process_uptime_seconds Process uptime in seconds`);
    metrics.push(`# TYPE process_uptime_seconds gauge`);
    metrics.push(`process_uptime_seconds ${process.uptime()}`);

    // Database pool metrics
    if (featureFlags.isEnabled(FeatureFlag.ENABLE_ENHANCED_POOLING)) {
      try {
        const pool = getDatabasePool();
        const poolMetrics = pool.getMetrics();
        if (poolMetrics) {
          metrics.push(`# HELP db_pool_total_connections Total database connections`);
          metrics.push(`# TYPE db_pool_total_connections gauge`);
          metrics.push(`db_pool_total_connections ${poolMetrics.total}`);

          metrics.push(`# HELP db_pool_active_connections Active database connections`);
          metrics.push(`# TYPE db_pool_active_connections gauge`);
          metrics.push(`db_pool_active_connections ${poolMetrics.active}`);

          metrics.push(`# HELP db_pool_idle_connections Idle database connections`);
          metrics.push(`# TYPE db_pool_idle_connections gauge`);
          metrics.push(`db_pool_idle_connections ${poolMetrics.idle}`);

          metrics.push(`# HELP db_pool_waiting_connections Waiting database connections`);
          metrics.push(`# TYPE db_pool_waiting_connections gauge`);
          metrics.push(`db_pool_waiting_connections ${poolMetrics.waiting}`);
        }
      } catch (error) {
        // Ignore errors in metrics
      }
    }

    // Circuit breaker metrics
    if (featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)) {
      const dbStats = dbCircuitBreaker.getStats();
      metrics.push(`# HELP circuit_breaker_state Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)`);
      metrics.push(`# TYPE circuit_breaker_state gauge`);
      metrics.push(`circuit_breaker_state{service="database"} ${dbStats.state === 'CLOSED' ? 0 : dbStats.state === 'OPEN' ? 1 : 2}`);

      metrics.push(`# HELP circuit_breaker_failures_total Total failures`);
      metrics.push(`# TYPE circuit_breaker_failures_total counter`);
      metrics.push(`circuit_breaker_failures_total{service="database"} ${dbStats.totalFailures}`);
    }

    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(metrics.join('\n') + '\n');
  } catch (error: any) {
    logger.error(`Metrics endpoint error: ${error.message}`);
    res.status(500).json(err('Metrics collection failed'));
  }
});

export default router;

