/**
 * Selective Rate Limiting for /call RPC endpoint
 *
 * Applies different rate limits based on the handler key being called
 */

import type { Request, Response, NextFunction } from 'express';
import {
  baliZeroChatLimiter,
  aiChatLimiter,
  ragQueryLimiter,
  strictLimiter,
} from './rate-limit.js';

// Map handler keys to their appropriate rate limiters
const RATE_LIMIT_MAP: Record<string, any> = {
  // Bali Zero Chat (expensive: RAG + AI)
  'bali.zero.chat': baliZeroChatLimiter,

  // AI Chat handlers (expensive: API calls)
  'ai.chat': aiChatLimiter,

  // RAG queries (expensive: ChromaDB + embeddings)
  'rag.query': ragQueryLimiter,
  'rag.search': ragQueryLimiter,

  // Strict limit for batch/expensive operations
  'system.handlers.batch': strictLimiter,
  'memory.search.hybrid': strictLimiter,
  'memory.search.semantic': strictLimiter,
};

/**
 * Selective Rate Limiter Middleware
 *
 * Checks the request body for a 'key' field and applies the appropriate rate limiter
 * If no specific limiter is configured, the request passes through
 */
export function selectiveRateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.body?.key as string;

  if (!key) {
    // No key in body, pass through (will be caught by handler not found)
    return next();
  }

  const limiter = RATE_LIMIT_MAP[key];

  if (limiter) {
    // Apply the specific rate limiter for this handler
    return limiter(req, res, next);
  }

  // No rate limit configured for this handler, pass through
  return next();
}
