/**
 * Prioritized Rate Limiting per Endpoint
 * 
 * Different rate limits based on endpoint priority and cost
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../services/logger.js';

export enum EndpointPriority {
  CRITICAL = 'critical',    // Health checks, auth
  HIGH = 'high',            // Core API endpoints
  MEDIUM = 'medium',        // Standard operations
  LOW = 'low',              // Expensive operations (AI, RAG)
  STRICT = 'strict'         // Very expensive operations
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  priority: EndpointPriority;
  message: string;
}

/**
 * Rate limit configurations by priority
 */
const RATE_LIMIT_CONFIGS: Record<EndpointPriority, RateLimitConfig> = {
  [EndpointPriority.CRITICAL]: {
    windowMs: 60 * 1000,
    max: 1000, // Very high for health checks
    priority: EndpointPriority.CRITICAL,
    message: 'Critical endpoint rate limit exceeded',
  },
  [EndpointPriority.HIGH]: {
    windowMs: 60 * 1000,
    max: 200,
    priority: EndpointPriority.HIGH,
    message: 'High priority endpoint rate limit exceeded',
  },
  [EndpointPriority.MEDIUM]: {
    windowMs: 60 * 1000,
    max: 100,
    priority: EndpointPriority.MEDIUM,
    message: 'Standard endpoint rate limit exceeded',
  },
  [EndpointPriority.LOW]: {
    windowMs: 60 * 1000,
    max: 30,
    priority: EndpointPriority.LOW,
    message: 'Low priority endpoint rate limit exceeded',
  },
  [EndpointPriority.STRICT]: {
    windowMs: 60 * 1000,
    max: 10,
    priority: EndpointPriority.STRICT,
    message: 'Strict rate limit exceeded for expensive operation',
  },
};

/**
 * Get rate limit key from request
 */
function getRateLimitKey(req: Request): string {
  const userId = req.header('x-user-id');
  if (userId) return `user:${userId}`;

  const apiKey = req.header('x-api-key');
  if (apiKey) return `key:${apiKey.substring(0, 12)}`;

  // Use session ID or connection ID to avoid IPv6 issues
  // Fallback to 'anonymous' for anonymous requests
  return 'anonymous';
}

/**
 * Create rate limiter for a specific priority
 */
function createRateLimiter(priority: EndpointPriority) {
  const config = RATE_LIMIT_CONFIGS[priority];

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: getRateLimitKey,
    // Skip IPv6 validation warning by not using IP directly
    validate: {
      ip: false, // We handle IP separately in keyGenerator
    },
    
    handler: (req: Request, res: Response) => {
      const identifier = getRateLimitKey(req);
      logger.warn(`🚨 Rate limit exceeded [${priority}]: ${identifier} on ${req.path}`);
      
      const retryAfter = Math.ceil(config.windowMs / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', config.max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Priority', priority);
      
      res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        priority,
        retryAfter,
      });
    },

    skip: (req: Request) => {
      // Skip for internal API keys
      const apiKey = req.header('x-api-key');
      const internalKeys = (process.env.API_KEYS_INTERNAL || '').split(',').filter(Boolean);
      return internalKeys.includes(apiKey || '');
    },
  });
}

// Pre-created limiters for each priority
export const criticalRateLimiter = createRateLimiter(EndpointPriority.CRITICAL);
export const highRateLimiter = createRateLimiter(EndpointPriority.HIGH);
export const mediumRateLimiter = createRateLimiter(EndpointPriority.MEDIUM);
export const lowRateLimiter = createRateLimiter(EndpointPriority.LOW);
export const strictRateLimiter = createRateLimiter(EndpointPriority.STRICT);

/**
 * Map endpoint patterns to priorities
 */
const ENDPOINT_PRIORITY_MAP: Array<{ pattern: RegExp; priority: EndpointPriority }> = [
  // Critical endpoints
  { pattern: /^\/health/, priority: EndpointPriority.CRITICAL },
  { pattern: /^\/metrics/, priority: EndpointPriority.CRITICAL },
  { pattern: /^\/auth/, priority: EndpointPriority.CRITICAL },
  
  // High priority endpoints
  { pattern: /^\/api\/v1\/handlers/, priority: EndpointPriority.HIGH },
  { pattern: /^\/zantara/, priority: EndpointPriority.HIGH },
  
  // Medium priority endpoints
  { pattern: /^\/api\/v1\//, priority: EndpointPriority.MEDIUM },
  
  // Low priority (expensive) endpoints
  { pattern: /\/ai\.chat/, priority: EndpointPriority.LOW },
  { pattern: /\/rag\./, priority: EndpointPriority.LOW },
  { pattern: /\/bali\.zero\.chat/, priority: EndpointPriority.LOW },
  
  // Strict priority (very expensive)
  { pattern: /\/memory\.search\./, priority: EndpointPriority.STRICT },
  { pattern: /\/system\.handlers\.batch/, priority: EndpointPriority.STRICT },
];

/**
 * Get priority for an endpoint path
 */
function getEndpointPriority(path: string): EndpointPriority {
  for (const { pattern, priority } of ENDPOINT_PRIORITY_MAP) {
    if (pattern.test(path)) {
      return priority;
    }
  }
  // Default to medium priority
  return EndpointPriority.MEDIUM;
}

/**
 * Prioritized rate limiting middleware
 */
export function prioritizedRateLimiter(req: Request, res: Response, next: NextFunction) {
  const priority = getEndpointPriority(req.path);
  const limiter = createRateLimiter(priority);
  return limiter(req, res, next);
}

/**
 * Create custom rate limiter for specific route
 */
export function createEndpointRateLimiter(
  priority: EndpointPriority,
  customMax?: number
): ReturnType<typeof rateLimit> {
  const config = RATE_LIMIT_CONFIGS[priority];
  const max = customMax || config.max;

  return rateLimit({
    windowMs: config.windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: true,
    keyGenerator: getRateLimitKey,
    
    handler: (req: Request, res: Response) => {
      const identifier = getRateLimitKey(req);
      logger.warn(`🚨 Rate limit exceeded [${priority}]: ${identifier} on ${req.path}`);
      
      const retryAfter = Math.ceil(config.windowMs / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', max.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Priority', priority);
      
      res.status(429).json({
        ok: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: config.message,
        priority,
        retryAfter,
      });
    },
  });
}

