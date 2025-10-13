/**
 * Subscription-aware Rate Limiting Middleware
 * 
 * Integra il sistema di abbonamenti con il rate limiting
 * Garantisce che gli utenti PRO+ non ricevano messaggi fastidiosi sui limiti
 */

import type { Request, Response, NextFunction } from 'express';
import { subscriptionManager } from '../services/subscription-manager.js';

/**
 * Extract user identifier from request
 */
function getUserId(req: Request): string {
  // Try to get user ID from various sources
  const userId = req.header('x-user-id');
  if (userId) return userId;

  const email = req.header('x-user-email');
  if (email) return email.replace(/[^a-zA-Z0-9]/g, '_');

  const apiKey = req.header('x-api-key');
  if (apiKey) return `key_${apiKey.substring(0, 12)}`;

  const ip = req.header('x-forwarded-for') || req.ip || 'unknown';
  return `ip_${ip}`;
}

/**
 * Subscription-aware rate limiter
 * 
 * Checks user subscription status before applying rate limits
 */
export async function subscriptionRateLimiter(req: Request, res: Response, next: NextFunction) {
  const userId = getUserId(req);
  const handlerKey = req.body?.key as string;

  try {
    // Check if user has active PRO+ subscription
    const hasProPlus = await subscriptionManager.hasActiveProPlus(userId);
    
    if (hasProPlus) {
      // PRO+ users get much higher limits
      console.log(`✨ PRO+ user ${userId} - High limits applied`);
      
      // Check PRO+ limits (which are very high)
      const usageType = getUsageType(handlerKey);
      if (usageType) {
        const { allowed, remaining, limit } = await subscriptionManager.trackUsage(userId, usageType);
        
        // Add headers to show remaining usage
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-Subscription-Plan', 'PRO_PLUS');
        
        if (!allowed) {
          // Even PRO+ has limits (but they're very high)
          return res.status(429).json({
            ok: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'PRO+ monthly limit reached. Contact support for Enterprise plan.',
            plan: 'PRO_PLUS',
            limit,
            remaining: 0
          });
        }
      }
      
      // PRO+ user within limits, proceed
      return next();
    }

    // Check if user should see usage warning
    const shouldWarn = await subscriptionManager.shouldShowUsageWarning(userId);
    
    if (shouldWarn) {
      // Add warning header but don't block request
      res.setHeader('X-Usage-Warning', 'approaching-limits');
      res.setHeader('X-Upgrade-Link', 'https://cursor.com/settings/billing');
    }

    // For non-PRO+ users, apply normal rate limits
    const usage = await subscriptionManager.getUsageStats(userId);
    if (usage) {
      res.setHeader('X-Usage-ApiCalls', usage.usage.apiCalls.toString());
      res.setHeader('X-Usage-AiRequests', usage.usage.aiRequests.toString());
    }

    // Continue to normal rate limiters
    next();
  } catch (error) {
    console.error('Error in subscription rate limiter:', error);
    // On error, allow request to proceed
    next();
  }
}

/**
 * Map handler keys to usage types
 */
function getUsageType(handlerKey: string): 'apiCalls' | 'aiRequests' | 'ragQueries' | null {
  if (!handlerKey) return 'apiCalls';

  // AI handlers
  if (handlerKey.startsWith('ai.') || handlerKey.includes('chat')) {
    return 'aiRequests';
  }

  // RAG handlers
  if (handlerKey.startsWith('rag.') || handlerKey.includes('search')) {
    return 'ragQueries';
  }

  // Default to API calls
  return 'apiCalls';
}

/**
 * Middleware to fix PRO+ subscription issues
 * 
 * Special endpoint to fix subscription for users who just paid
 */
export async function fixSubscriptionEndpoint(req: Request, res: Response) {
  const { email, secret } = req.body;

  // Simple security check
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      ok: false,
      error: 'Unauthorized'
    });
  }

  if (!email) {
    return res.status(400).json({
      ok: false,
      error: 'Email required'
    });
  }

  try {
    await subscriptionManager.fixUserSubscription(email);
    
    return res.json({
      ok: true,
      message: `Subscription fixed for ${email}. Full PRO+ access granted!`,
      plan: 'PRO_PLUS',
      limits: {
        apiCalls: 50000,
        aiRequests: 10000,
        ragQueries: 5000,
        storageGB: 100
      }
    });
  } catch (error) {
    console.error('Error fixing subscription:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to fix subscription'
    });
  }
}

/**
 * Get user subscription status endpoint
 */
export async function getSubscriptionStatus(req: Request, res: Response) {
  const userId = getUserId(req);

  try {
    const subscription = await subscriptionManager.getSubscription(userId);
    const usage = await subscriptionManager.getUsageStats(userId);

    if (!subscription) {
      return res.json({
        ok: true,
        plan: 'FREE',
        status: 'active',
        limits: {
          apiCalls: 100,
          aiRequests: 10,
          ragQueries: 5,
          storageGB: 1
        },
        usage: usage?.usage || {
          apiCalls: 0,
          aiRequests: 0,
          ragQueries: 0,
          storageGB: 0
        }
      });
    }

    return res.json({
      ok: true,
      plan: subscription.plan,
      status: subscription.status,
      lastPaymentDate: subscription.lastPaymentDate,
      nextBillingDate: subscription.nextBillingDate,
      limits: subscription.usageLimits,
      usage: usage?.usage || {
        apiCalls: 0,
        aiRequests: 0,
        ragQueries: 0,
        storageGB: 0
      },
      paymentAmount: subscription.paymentAmount,
      currency: subscription.currency
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return res.status(500).json({
      ok: false,
      error: 'Failed to get subscription status'
    });
  }
}