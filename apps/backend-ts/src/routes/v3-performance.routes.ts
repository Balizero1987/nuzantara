/**
 * V3 Performance Metrics Endpoint
 * 
 * Monitor cache performance and optimization metrics
 */

import { Router } from 'express';
import { ok } from '../utils/response.js';
import { getV3Cache } from '../services/v3-performance-cache.js';
import { isV3CacheInitialized } from '../services/v3-cache-init.js';
import { logger } from '../logging/unified-logger.js';

const router = Router();

/**
 * GET /v3/metrics - Get V3 cache performance metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const cache = getV3Cache();
    const metrics = cache.getMetrics();
    
    const hitRate = metrics.totalQueries > 0
      ? (metrics.cacheHits / metrics.totalQueries) * 100
      : 0;
    
    const missRate = metrics.totalQueries > 0
      ? (metrics.cacheMisses / metrics.totalQueries) * 100
      : 0;

    return res.json(ok({
      status: 'healthy',
      cache_initialized: isV3CacheInitialized(),
      performance: {
        total_queries: metrics.totalQueries,
        cache_hits: metrics.cacheHits,
        cache_misses: metrics.cacheMisses,
        hit_rate_percent: parseFloat(hitRate.toFixed(2)),
        miss_rate_percent: parseFloat(missRate.toFixed(2)),
        average_response_time_ms: parseFloat(metrics.averageResponseTime.toFixed(2))
      },
      domain_metrics: metrics.domainMetrics,
      cache_stats: metrics.cacheStats,
      optimization_impact: {
        baseline_response_time_ms: 30000,
        current_average_ms: parseFloat(metrics.averageResponseTime.toFixed(2)),
        improvement_percent: calculateImprovement(metrics.averageResponseTime),
        time_saved_per_query_ms: 30000 - metrics.averageResponseTime
      },
      targets: {
        quick_mode: { target: 500, current: metrics.averageResponseTime, status: metrics.averageResponseTime < 500 ? 'ACHIEVED' : 'IN_PROGRESS' },
        detailed_mode: { target: 2000, current: metrics.averageResponseTime, status: metrics.averageResponseTime < 2000 ? 'ACHIEVED' : 'IN_PROGRESS' },
        comprehensive_mode: { target: 5000, current: metrics.averageResponseTime, status: metrics.averageResponseTime < 5000 ? 'ACHIEVED' : 'IN_PROGRESS' }
      }
    }));
  } catch (error: any) {
    logger.error('Failed to get V3 metrics:', error);
    return res.status(500).json(ok({
      error: 'Failed to retrieve metrics',
      message: error.message
    }));
  }
});

/**
 * POST /v3/metrics/reset - Reset performance metrics
 */
router.post('/metrics/reset', async (req, res) => {
  try {
    const cache = getV3Cache();
    cache.resetMetrics();
    
    logger.info('V3 cache metrics reset');
    
    return res.json(ok({
      status: 'success',
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    logger.error('Failed to reset V3 metrics:', error);
    return res.status(500).json(ok({
      error: 'Failed to reset metrics',
      message: error.message
    }));
  }
});

/**
 * POST /v3/cache/invalidate/:domain - Invalidate cache for specific domain
 */
router.post('/cache/invalidate/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const cache = getV3Cache();
    
    const count = await cache.invalidateDomain(domain as any);
    
    logger.info(`Invalidated ${count} cache entries for domain: ${domain}`);
    
    return res.json(ok({
      status: 'success',
      domain,
      entries_invalidated: count,
      timestamp: new Date().toISOString()
    }));
  } catch (error: any) {
    logger.error('Failed to invalidate cache:', error);
    return res.status(500).json(ok({
      error: 'Failed to invalidate cache',
      message: error.message
    }));
  }
});

/**
 * GET /v3/health - V3 system health check
 */
router.get('/health', async (req, res) => {
  const cache = getV3Cache();
  const metrics = cache.getMetrics();
  
  const health = {
    status: 'healthy',
    cache_initialized: isV3CacheInitialized(),
    performance_grade: getPerformanceGrade(metrics.averageResponseTime),
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    cache_health: {
      hit_rate: metrics.totalQueries > 0 ? (metrics.cacheHits / metrics.totalQueries) * 100 : 0,
      total_queries: metrics.totalQueries,
      cache_size: metrics.cacheStats?.cacheSize || 0
    }
  };
  
  return res.json(ok(health));
});

/**
 * Calculate performance improvement vs baseline
 */
function calculateImprovement(currentTime: number): number {
  const baseline = 30000; // 30 seconds
  if (currentTime >= baseline) return 0;
  return parseFloat((((baseline - currentTime) / baseline) * 100).toFixed(2));
}

/**
 * Get performance grade based on response time
 */
function getPerformanceGrade(responseTime: number): string {
  if (responseTime < 500) return 'A+ (Excellent)';
  if (responseTime < 1000) return 'A (Very Good)';
  if (responseTime < 2000) return 'B (Good)';
  if (responseTime < 5000) return 'C (Acceptable)';
  if (responseTime < 10000) return 'D (Needs Improvement)';
  return 'F (Critical - Needs Immediate Attention)';
}

export default router;
