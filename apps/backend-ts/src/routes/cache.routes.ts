/**
 * ZANTARA Cache API Routes
 * Provides direct cache management endpoints
 */

import { Router, Request, Response } from 'express';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  getCacheStats,
  invalidateCache
} from '../middleware/cache.middleware.js';
import logger from '../services/logger.js';

const router = Router();

/**
 * GET /cache/get?key=example
 * Retrieve value from cache
 */
router.get('/get', async (req: Request, res: Response) => {
  const key = req.query.key as string;

  if (!key) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: key'
    });
  }

  try {
    const value = await cacheGet(key);

    if (value) {
      try {
        const parsed = JSON.parse(value);
        res.json({
          status: 'hit',
          key,
          value: parsed,
          timestamp: new Date().toISOString()
        });
      } catch {
        res.json({
          status: 'hit',
          key,
          value,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      res.json({
        status: 'miss',
        key,
        message: 'Key not found in cache',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Cache get error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve from cache',
      error: error.message
    });
  }
});

/**
 * POST /cache/set
 * Store value in cache
 */
router.post('/set', async (req: Request, res: Response) => {
  const { key, value, ttl = 300 } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameters: key, value'
    });
  }

  try {
    await cacheSet(key, value, ttl);

    res.json({
      status: 'success',
      key,
      ttl,
      message: 'Value stored in cache',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache set error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to store in cache',
      error: error.message
    });
  }
});

/**
 * DELETE /cache/clear/:key
 * Delete specific cache key
 */
router.delete('/clear/:key', async (req: Request, res: Response) => {
  const key = req.params.key;

  if (!key) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: key'
    });
  }

  try {
    await cacheDel(key);

    res.json({
      status: 'success',
      key,
      message: 'Cache key deleted',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache delete error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete from cache',
      error: error.message
    });
  }
});

/**
 * POST /cache/invalidate
 * Invalidate cache by pattern
 */
router.post('/invalidate', async (req: Request, res: Response) => {
  const { pattern } = req.body;

  if (!pattern) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameter: pattern'
    });
  }

  try {
    const count = await invalidateCache(pattern);

    res.json({
      status: 'success',
      pattern,
      invalidated: count,
      message: `Invalidated ${count} cache entries`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to invalidate cache',
      error: error.message
    });
  }
});

/**
 * GET /cache/stats
 * Get cache statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getCacheStats();

    res.json({
      status: 'success',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cache stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve cache stats',
      error: error.message
    });
  }
});

/**
 * GET /cache/health
 * Check cache connection health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Test with a simple operation
    const testKey = 'cache:health:test';
    await cacheSet(testKey, 'ok', 10);
    const value = await cacheGet(testKey);

    if (value === 'ok') {
      res.json({
        status: 'healthy',
        connected: true,
        message: 'Redis cache is operational',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'degraded',
        connected: false,
        message: 'Redis cache test failed',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Cache health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      connected: false,
      message: 'Redis cache is not operational',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;