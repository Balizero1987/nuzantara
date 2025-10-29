import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { redis } from '../utils/redis';
import { logger } from '../utils/logger';

const CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600', 10);

function generateCacheKey(req: Request): string {
  const data = {
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    query: req.query
  };
  const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `unified:cache:${hash}`;
}

export async function cacheMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only cache GET and POST requests
  if (!['GET', 'POST'].includes(req.method)) {
    return next();
  }

  const cacheKey = generateCacheKey(req);

  try {
    // Try to get cached response
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit: ${cacheKey.substring(0, 30)}...`);
      const data = JSON.parse(cached);
      return res.json({
        ...data,
        _cache: true,
        _cached_at: new Date().toISOString()
      });
    }

    logger.debug(`Cache miss: ${cacheKey.substring(0, 30)}...`);

    // Intercept response to cache it
    const originalJson = res.json.bind(res);
    res.json = function(data: any) {
      // Cache the response
      redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
        .catch(err => logger.error('Cache set error:', err));
      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error('Cache middleware error:', error);
    next();
  }
}
