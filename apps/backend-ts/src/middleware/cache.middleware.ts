/**
 * ZANTARA Redis Cache Middleware
 * Provides caching functionality with Upstash Redis
 */

import { createClient, RedisClientType } from 'redis';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../services/logger.js';
import { cacheHits, cacheMisses } from './observability.middleware.js';

// Redis client instance
let redis: RedisClientType | null = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
export async function initializeRedis(): Promise<void> {
  if (!process.env.REDIS_URL) {
    logger.warn('Redis URL not configured - cache disabled');
    return;
  }

  try {
    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false,
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.error('Redis reconnection failed after 3 attempts');
            return false;
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    redis.on('error', (err) => {
      logger.error('Redis client error:', err);
      isConnected = false;
    });

    redis.on('connect', () => {
      logger.info('Redis connected successfully');
      isConnected = true;
    });

    redis.on('disconnect', () => {
      logger.warn('Redis disconnected');
      isConnected = false;
    });

    await redis.connect();
  } catch (error) {
    logger.error('Failed to initialize Redis:', error);
    redis = null;
    isConnected = false;
  }
}

/**
 * Get value from cache
 */
export async function cacheGet(key: string): Promise<string | null> {
  if (!redis || !isConnected) return null;

  try {
    const value = await redis.get(key);
    if (value) {
      cacheHits.inc();
      logger.debug(`Cache hit: ${key}`);
    } else {
      cacheMisses.inc();
      logger.debug(`Cache miss: ${key}`);
    }
    return value;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(key: string, value: any, ttl: number = 300): Promise<void> {
  if (!redis || !isConnected) return;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.setEx(key, ttl, serialized);
    logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
  } catch (error) {
    logger.error('Cache set error:', error);
  }
}

/**
 * Delete key from cache
 */
export async function cacheDel(key: string): Promise<void> {
  if (!redis || !isConnected) return;

  try {
    await redis.del(key);
    logger.debug(`Cache deleted: ${key}`);
  } catch (error) {
    logger.error('Cache delete error:', error);
  }
}

/**
 * Generate cache key from request
 */
export function generateCacheKey(prefix: string, params: any): string {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `cache:${prefix}:${hash}`;
}

/**
 * Cache middleware for GET requests
 */
export function cacheMiddleware(keyPrefix: string, ttl: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(keyPrefix, {
      path: req.path,
      query: req.query,
      params: req.params
    });

    try {
      const cached = await cacheGet(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);

        try {
          const parsed = JSON.parse(cached);
          return res.json(parsed);
        } catch {
          return res.send(cached);
        }
      }

      // Cache miss - store original send method
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      const originalSend = res.send;
      res.send = function(data: any) {
        // Store in cache before sending
        cacheSet(cacheKey, data, ttl).catch(err =>
          logger.error('Failed to cache response:', err)
        );

        return originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache patterns
 */
export async function invalidateCache(pattern: string): Promise<number> {
  if (!redis || !isConnected) return 0;

  try {
    const keys = await redis.keys(`cache:${pattern}:*`);
    if (keys.length > 0) {
      const deleted = await redis.del(keys);
      logger.info(`Invalidated ${deleted} cache entries for pattern: ${pattern}`);
      return deleted;
    }
    return 0;
  } catch (error) {
    logger.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<any> {
  if (!redis || !isConnected) {
    return { status: 'disconnected' };
  }

  try {
    const info = await redis.info('stats');
    const dbSize = await redis.dbSize();

    return {
      status: 'connected',
      size: dbSize,
      info: info.split('\n').reduce((acc: any, line: string) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {})
    };
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    return { status: 'error', error: error.message };
  }
}

// Auto-initialize on module load
initializeRedis().catch(err =>
  logger.error('Failed to auto-initialize Redis:', err)
);