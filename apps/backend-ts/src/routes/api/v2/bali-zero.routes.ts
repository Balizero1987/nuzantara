/**
 * ZANTARA Bali Zero API Routes with Redis Caching
 * Enhanced with cache layer for improved performance
 */

import { Router, Request, Response } from 'express';
import { kbliLookup, kbliRequirements } from '../../../handlers/bali-zero/kbli.js';
import { baliZeroPricing, baliZeroQuickPrice } from '../../../handlers/bali-zero/bali-zero-pricing.js';
import { baliZeroChat } from '../../../handlers/rag/rag.js';
import { cacheMiddleware, generateCacheKey, cacheGet, cacheSet } from '../../../middleware/cache.middleware.js';
import { baliZeroChatLimiter } from '../../../middleware/rate-limit.js';
import { flagGate } from '../../../middleware/flagGate.js';
import logger from '../../../services/logger.js';
import { auditService } from '../../../services/audit-service.js';

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

/**
 * Bali Zero Chat Stream - SSE (Server-Sent Events)
 * GET /api/v2/bali-zero/chat-stream
 * 
 * Real-time token streaming with:
 * - <100ms first token latency
 * - <50ms inter-token latency
 * - Connection management (heartbeat, reconnect)
 * - Back-pressure handling
 * - Graceful error handling
 * - Rate limiting
 * - Audit trail
 * - Feature flag protected
 */
router.get('/chat-stream', 
  flagGate('ENABLE_SSE_STREAMING'), // Feature flag protection
  baliZeroChatLimiter, // Rate limiting (20 req/min)
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const connectionId = req.headers['x-connection-id'] as string || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const userEmail = (req as any).user?.email || req.query.user_email as string;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { query, user_email, user_role, conversation_history } = req.query;

      if (!query || typeof query !== 'string') {
        auditService.logStreamOperation({
          connectionId,
          userId,
          userEmail,
          ipAddress,
          query: '',
          endpoint: req.path,
          success: false,
          error: 'Missing query parameter'
        });
        return res.status(400).json({ error: 'query parameter is required' });
      }

      // Parse conversation history if provided
      let parsedHistory: Array<{ role: string; content: string }> | undefined;
      if (conversation_history && typeof conversation_history === 'string') {
        try {
          parsedHistory = JSON.parse(conversation_history);
        } catch (error) {
          logger.warn('[Stream] Failed to parse conversation_history:', error);
        }
      }

      // Audit log: Stream started
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query,
        endpoint: req.path,
        success: true
      });

      // Import streaming service
      const { streamingService } = await import('../../../services/streaming-service.js');

      // Track metrics for audit
      let firstTokenLatency: number | undefined;
      let tokensReceived = 0;

      // Wrap response to track metrics
      const originalWrite = res.write.bind(res);
      let firstTokenSent = false;

      res.write = function(chunk: any, encoding?: any) {
        if (!firstTokenSent && chunk.toString().includes('"type":"token"')) {
          firstTokenSent = true;
          firstTokenLatency = Date.now() - startTime;
        }
        if (chunk.toString().includes('"type":"token"')) {
          tokensReceived++;
        }
        return originalWrite(chunk, encoding);
      } as any;

      // Start streaming
      await streamingService.streamChat(req, res, {
        query,
        user_email: (user_email as string) || userEmail,
        user_role: user_role as string | undefined,
        conversation_history: parsedHistory
      });

      // Audit log: Stream completed successfully
      const duration = Date.now() - startTime;
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query,
        endpoint: req.path,
        success: true,
        firstTokenLatency,
        tokensReceived,
        duration
      });

    } catch (error: any) {
      logger.error('[Stream] Chat stream error:', error);
      
      // Audit log: Stream failed
      const duration = Date.now() - startTime;
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query: req.query.query as string || '',
        endpoint: req.path,
        success: false,
        duration,
        error: error.message || 'Stream initialization failed'
      });

      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Stream initialization failed' });
      }
    }
  }
);

/**
 * POST /api/v2/bali-zero/chat-stream
 * Alternative POST endpoint for SSE (supports larger payloads)
 * Same security, rate limiting, and audit trail as GET endpoint
 */
router.post('/chat-stream',
  flagGate('ENABLE_SSE_STREAMING'), // Feature flag protection
  baliZeroChatLimiter, // Rate limiting (20 req/min)
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    const connectionId = req.headers['x-connection-id'] as string || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const userEmail = (req as any).user?.email || req.body.user_email;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    try {
      const { query, user_email, user_role, conversation_history } = req.body;

      if (!query || typeof query !== 'string') {
        auditService.logStreamOperation({
          connectionId,
          userId,
          userEmail,
          ipAddress,
          query: '',
          endpoint: req.path,
          success: false,
          error: 'Missing query parameter'
        });
        return res.status(400).json({ error: 'query is required' });
      }

      // Audit log: Stream started
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query,
        endpoint: req.path,
        success: true
      });

      // Import streaming service
      const { streamingService } = await import('../../../services/streaming-service.js');

      // Track metrics for audit
      let firstTokenLatency: number | undefined;
      let tokensReceived = 0;
      let firstTokenSent = false;

      // Wrap response to track metrics
      const originalWrite = res.write.bind(res);
      res.write = function(chunk: any, encoding?: any) {
        if (!firstTokenSent && chunk.toString().includes('"type":"token"')) {
          firstTokenSent = true;
          firstTokenLatency = Date.now() - startTime;
        }
        if (chunk.toString().includes('"type":"token"')) {
          tokensReceived++;
        }
        return originalWrite(chunk, encoding);
      } as any;

      // Start streaming
      await streamingService.streamChat(req, res, {
        query,
        user_email: user_email || userEmail,
        user_role,
        conversation_history: Array.isArray(conversation_history) ? conversation_history : undefined
      });

      // Audit log: Stream completed successfully
      const duration = Date.now() - startTime;
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query,
        endpoint: req.path,
        success: true,
        firstTokenLatency,
        tokensReceived,
        duration
      });

    } catch (error: any) {
      logger.error('[Stream] Chat stream error:', error);
      
      // Audit log: Stream failed
      const duration = Date.now() - startTime;
      auditService.logStreamOperation({
        connectionId,
        userId,
        userEmail,
        ipAddress,
        query: req.body.query || '',
        endpoint: req.path,
        success: false,
        duration,
        error: error.message || 'Stream initialization failed'
      });

      if (!res.headersSent) {
        res.status(500).json({ error: error.message || 'Stream initialization failed' });
      }
    }
  }
);

export default router;