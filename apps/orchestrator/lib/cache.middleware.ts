import { Request, Response, NextFunction } from 'express';
import { cacheService } from './cache.service';

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Only cache GET and POST requests
  if (req.method !== 'GET' && req.method !== 'POST') {
    return next();
  }

  const key = cacheService.generateKey('api', {
    url: req.originalUrl,
    body: req.body,
    query: req.query
  });

  const cached = await cacheService.get<any>(key);
  if (cached) {
    console.log(`💾 Cache hit: ${key.substring(0, 20)}...`);
    return res.json({
      ...(typeof cached === 'object' ? cached : { data: cached }),
      _cache: true,
      _cached_at: new Date().toISOString()
    });
  }

  console.log(`🔍 Cache miss: ${key.substring(0, 20)}...`);

  // Store original res.json
  const originalJson = res.json.bind(res);
  res.json = function(data: any) {
    // Cache the response
    cacheService.set(key, data, 3600); // 1 hour TTL
    return originalJson(data);
  };

  next();
};
