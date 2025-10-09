/**
 * Rate Limiting Middleware
 *
 * Protects expensive endpoints (AI chat, RAG queries) from abuse
 * Uses express-rate-limit with Redis-like in-memory store
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Identify users by API key, IP, or user ID
 */
function getRateLimitKey(req: Request): string {
  // Priority: x-user-id > x-api-key > IP address
  const userId = req.header('x-user-id');
  if (userId) return `user:${userId}`;

  const apiKey = req.header('x-api-key');
  if (apiKey) return `key:${apiKey.substring(0, 12)}`;

  const ip = req.header('x-forwarded-for') || req.ip || 'unknown';
  return `ip:${ip}`;
}

/**
 * Bali Zero Chat Rate Limiter
 *
 * Limits: 20 requests per 1 minute per user/IP
 * Use case: Prevent RAG + AI chat abuse (expensive Anthropic API calls)
 */
export const baliZeroChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Custom key generator
  keyGenerator: getRateLimitKey,

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    const identifier = getRateLimitKey(req);
    console.warn(`🚨 Rate limit exceeded for ${identifier} on ${req.path}`);

    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please wait 1 minute before trying again.',
      retryAfter: 60
    });
  },

  // Skip rate limiting for internal API keys (optional)
  skip: (req) => {
    const apiKey = req.header('x-api-key');
    const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
    return internalKeys.includes(apiKey || '');
  }
});

/**
 * General AI Chat Rate Limiter
 *
 * Limits: 30 requests per 1 minute per user/IP
 * Use case: ai.chat, openai.chat, claude.chat, gemini.chat, cohere.chat
 */
export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,

  handler: (req, res) => {
    const identifier = getRateLimitKey(req);
    console.warn(`🚨 Rate limit exceeded for ${identifier} on ${req.path}`);

    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many AI requests. Please wait 1 minute.',
      retryAfter: 60
    });
  },

  skip: (req) => {
    const apiKey = req.header('x-api-key');
    const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
    return internalKeys.includes(apiKey || '');
  }
});

/**
 * RAG Query Rate Limiter
 *
 * Limits: 15 requests per 1 minute per user/IP
 * Use case: rag.query, rag.search (ChromaDB + embeddings expensive)
 */
export const ragQueryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,

  handler: (req, res) => {
    const identifier = getRateLimitKey(req);
    console.warn(`🚨 Rate limit exceeded for ${identifier} on ${req.path}`);

    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many search requests. Please wait 1 minute.',
      retryAfter: 60
    });
  },

  skip: (req) => {
    const apiKey = req.header('x-api-key');
    const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
    return internalKeys.includes(apiKey || '');
  }
});

/**
 * Strict Rate Limiter (for high-cost operations)
 *
 * Limits: 5 requests per 1 minute per user/IP
 * Use case: Memory operations, batch handlers, expensive analytics
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getRateLimitKey,

  handler: (req, res) => {
    const identifier = getRateLimitKey(req);
    console.warn(`🚨 Rate limit exceeded for ${identifier} on ${req.path}`);

    res.status(429).json({
      ok: false,
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'This endpoint has strict rate limits. Please wait 1 minute.',
      retryAfter: 60
    });
  },

  skip: (req) => {
    const apiKey = req.header('x-api-key');
    const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
    return internalKeys.includes(apiKey || '');
  }
});
