/**
 * ZANTARA Bali Zero API Routes with Redis Caching
 * Enhanced with cache layer for improved performance
 */

import { Router, Request, Response } from 'express';
import { kbliLookup, kbliRequirements } from '../../../handlers/bali-zero/kbli.js';
import { baliZeroPricing, baliZeroQuickPrice } from '../../../handlers/bali-zero/bali-zero-pricing.js';
import { baliZeroChat } from '../../../handlers/rag/rag.js';
import { cacheMiddleware, generateCacheKey, cacheGet, cacheSet } from '../../../middleware/cache.middleware.js';
import logger from '../../../services/logger.js';

const router = Router();

/**
 * KBLI Business Code Lookup - CACHED
 * GET/POST /api/v2/bali-zero/kbli
 */
router.get('/kbli', cacheMiddleware('kbli', 600), async (req: Request, res: Response) => {
  const params = { params: req.query };
  const mockReq = { body: params } as any;
  return kbliLookup(mockReq, res);
});

router.post('/kbli', async (req: Request, res: Response) => {
  try {
    // Generate cache key from request
    const cacheKey = generateCacheKey('kbli', req.body);

    // Check cache first
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info(`Cache hit: ${cacheKey}`);
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Create mock response to capture result
    let result: any;
    const mockRes = {
      json: (data: any) => {
        result = data;
        return data;
      },
      status: (code: number) => mockRes
    } as any;

    // Execute handler
    await kbliLookup(req, mockRes);

    // Cache the result
    if (result) {
      await cacheSet(cacheKey, result, 600); // 10 minutes TTL
      res.setHeader('X-Cache', 'MISS');
      return res.json(result);
    }

    return res.status(500).json({ error: 'No result from handler' });
  } catch (error: any) {
    logger.error('KBLI cache error:', error);
    // Fallback to direct handler on cache error
    return kbliLookup(req, res);
  }
});

/**
 * KBLI Requirements - CACHED
 * POST /api/v2/bali-zero/kbli/requirements
 */
router.post('/kbli/requirements', async (req: Request, res: Response) => {
  try {
    const cacheKey = generateCacheKey('kbli-requirements', req.body);

    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Execute with mock response
    let result: any;
    const mockRes = {
      json: (data: any) => {
        result = data;
        return data;
      },
      status: (code: number) => mockRes
    } as any;

    await kbliRequirements(req, mockRes);

    // Cache and return
    if (result) {
      await cacheSet(cacheKey, result, 900); // 15 minutes TTL
      res.setHeader('X-Cache', 'MISS');
      return res.json(result);
    }

    return res.status(500).json({ error: 'No result from handler' });
  } catch (error: any) {
    logger.error('KBLI requirements cache error:', error);
    return kbliRequirements(req, res);
  }
});

/**
 * Bali Zero Pricing - CACHED (Long TTL - prices stable)
 * GET/POST /api/v2/bali-zero/pricing
 */
router.get('/pricing', cacheMiddleware('pricing', 3600), async (req: Request, res: Response) => {
  try {
    const result = await baliZeroPricing(req.query);
    return res.json(result);
  } catch (error: any) {
    logger.error('Pricing error:', error);
    return res.status(500).json({ error: 'Pricing system error' });
  }
});

router.post('/pricing', async (req: Request, res: Response) => {
  try {
    const cacheKey = generateCacheKey('pricing', req.body);

    // Check cache
    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Execute handler
    const result = await baliZeroPricing(req.body);

    // Cache with long TTL (1 hour - prices don't change often)
    if (result) {
      await cacheSet(cacheKey, result, 3600);
      res.setHeader('X-Cache', 'MISS');
      return res.json(result);
    }

    return res.status(500).json({ error: 'No result from handler' });
  } catch (error: any) {
    logger.error('Pricing cache error:', error);
    // Fallback to direct handler
    try {
      const result = await baliZeroPricing(req.body);
      return res.json(result);
    } catch (fallbackError: any) {
      return res.status(500).json({ error: 'Pricing system error' });
    }
  }
});

/**
 * Quick Price Lookup - CACHED
 * POST /api/v2/bali-zero/price
 */
router.post('/price', async (req: Request, res: Response) => {
  try {
    const cacheKey = generateCacheKey('quick-price', req.body);

    const cached = await cacheGet(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    // Execute handler
    const result = await baliZeroQuickPrice(req.body);

    if (result) {
      await cacheSet(cacheKey, result, 3600); // 1 hour TTL
      res.setHeader('X-Cache', 'MISS');
      return res.json(result);
    }

    return res.status(500).json({ error: 'No result from handler' });
  } catch (error: any) {
    logger.error('Quick price cache error:', error);
    // Fallback to direct handler
    try {
      const result = await baliZeroQuickPrice(req.body);
      return res.json(result);
    } catch (fallbackError: any) {
      return res.status(500).json({ error: 'Price lookup error' });
    }
  }
});

/**
 * Bali Zero Chat - CACHED (Short TTL - dynamic content)
 * POST /api/v2/bali-zero/chat
 */
router.post('/chat', async (req: Request, res: Response) => {
  try {
    // Generate cache key excluding user-specific data
    const cacheableParams = {
      query: req.body.query,
      // Don't cache conversation history
    };
    const cacheKey = generateCacheKey('chat', cacheableParams);

    // Only cache if no conversation history (new queries)
    if (!req.body.conversation_history || req.body.conversation_history.length === 0) {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Note', 'Cached response for common query');
        return res.json(JSON.parse(cached));
      }
    }

    // Execute handler
    const result = await baliZeroChat(req.body);

    // Cache only successful responses without conversation context
    if (result && result.success && (!req.body.conversation_history || req.body.conversation_history.length === 0)) {
      await cacheSet(cacheKey, result, 300); // 5 minutes TTL for chat
      res.setHeader('X-Cache', 'MISS');
    }

    return res.json(result);
  } catch (error: any) {
    logger.error('Chat cache error:', error);
    // Fallback to direct handler
    const result = await baliZeroChat(req.body);
    return res.json(result);
  }
});

export default router;