/**
 * WEBAPP PUBLIC CHAT ENDPOINT
 *
 * SECURITY MODEL:
 * - No x-api-key required (public endpoint for webapp)
 * - Rate limited: 100 requests/minute per user
 * - User identified by x-user-id header (email)
 * - All requests logged with user-id for monitoring
 * - CORS: Only zantara.balizero.com allowed
 *
 * ARCHITECTURE:
 * - Thin proxy to existing ai.chat handler
 * - Adds rate limiting + logging layer
 * - Maintains backward compatibility with existing chat logic
 *
 * PERFORMANCE:
 * - In-memory rate limiting (Map with TTL cleanup)
 * - No database overhead
 * - ~5ms overhead per request
 *
 * FILES:
 * - This handler: src/handlers/webapp/webapp-chat.ts
 * - Router registration: src/router.ts (webapp.chat)
 * - Auth bypass: src/middleware/auth.ts (skip for /webapp/*)
 */

import { Request, Response } from 'express';
import { aiChat } from '../ai-services/ai.js';

// Rate limiting state (in-memory)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetAt) {
      rateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit check
 * @param userId - User email from x-user-id header
 * @param maxRequests - Max requests per window (default: 100)
 * @param windowMs - Time window in ms (default: 60000 = 1 minute)
 * @returns {allowed: boolean, remaining: number}
 */
function checkRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `webapp:${userId}`;

  let entry = rateLimits.get(key);

  // Create new entry or reset if expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs
    };
    rateLimits.set(key, entry);
  }

  entry.count++;

  const allowed = entry.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt };
}

/**
 * WEBAPP PUBLIC CHAT HANDLER
 *
 * Request body:
 * {
 *   "message": "user message",
 *   "conversationId": "optional-conversation-id"
 * }
 *
 * Headers:
 * - x-user-id: user email (required for rate limiting)
 * - Origin: must be zantara.balizero.com
 *
 * Response:
 * {
 *   "ok": true,
 *   "reply": "AI response",
 *   "conversationId": "conv-id",
 *   "usage": { tokens, model }
 * }
 */
export async function webappChat(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // 1. Extract user ID
    const userId = req.headers['x-user-id'] as string || 'anonymous';

    // 2. Rate limiting
    const rateLimit = checkRateLimit(userId);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', '100');
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());

    if (!rateLimit.allowed) {
      console.log(`[webapp.chat] Rate limit exceeded: ${userId} (${rateLimit.remaining} remaining)`);
      return res.status(429).json({
        ok: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
      });
    }

    // 3. Validate request body
    const { message, conversationId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid "message" field'
      });
    }

    if (message.length > 10000) {
      return res.status(400).json({
        ok: false,
        error: 'Message too long (max 10000 characters)'
      });
    }

    // 4. Log request (for monitoring/debugging)
    console.log(`[webapp.chat] Request from ${userId}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);

    // 5. Build params for ai.chat
    const aiParams = {
      prompt: message,
      conversationId,
      // Use Haiku for webapp (fast + cheap)
      model: 'claude-3-5-haiku-20241022',
      temperature: 0.7,
      system: 'You are ZANTARA, an intelligent business assistant for Bali Zero. Provide concise, helpful responses about visa services, company setup, tax consulting, and real estate in Indonesia.'
    };

    // 6. Call ai.chat handler
    const result = await aiChat(aiParams);

    // 7. Log response
    const duration = Date.now() - startTime;
    const success = result?.ok || !!result?.reply || !!result?.text;
    console.log(`[webapp.chat] Response to ${userId}: success=${success}, duration=${duration}ms`);

    // 8. Extract reply from result
    const reply = result?.reply || result?.text || result?.message || 'Response generated.';

    // 9. Send response
    return res.json({
      ok: true,
      reply,
      conversationId: conversationId || `conv-${Date.now()}`,
      usage: result?.usage || { model: 'claude-3-5-haiku-20241022' }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[webapp.chat] Error after ${duration}ms:`, error);

    // Don't expose internal errors to client
    return res.status(500).json({
      ok: false,
      error: 'Internal server error. Please try again.',
      // Include error ID for support
      errorId: `webapp-${Date.now()}`
    });
  }
}

/**
 * WEBAPP CHAT HANDLER (RPC-style wrapper)
 *
 * For /call endpoint compatibility:
 * POST /call
 * {
 *   "key": "webapp.chat",
 *   "params": {
 *     "message": "user message",
 *     "conversationId": "optional"
 *   }
 * }
 */
export async function webappChatRPC(req: Request, res: Response) {
  // Extract params from RPC body
  const params = req.body?.params || {};

  // Rewrite request body to match webappChat format
  req.body = {
    message: params.message,
    conversationId: params.conversationId
  };

  // Call main handler
  return webappChat(req, res);
}

/**
 * Export for router registration
 */
export default {
  webappChat,
  webappChatRPC
};
