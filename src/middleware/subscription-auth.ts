/**
 * Subscription Authentication Middleware
 * 
 * Handles PRO+ subscription validation and usage tracking
 * Separates subscription limits from technical rate limits
 */

import type { Request, Response, NextFunction } from "express";

export interface SubscriptionInfo {
  plan: 'FREE' | 'PRO' | 'PRO+';
  userId?: string;
  subscriptionId?: string;
  validUntil?: Date;
  usageLimit?: number;
  currentUsage?: number;
}

export interface RequestWithSubscription extends Request {
  subscription?: SubscriptionInfo;
}

// Mock subscription database - in production this would be a real database
const subscriptionDatabase = new Map<string, SubscriptionInfo>();

// Mock function to get subscription info - replace with real implementation
function getSubscriptionInfo(userId: string): SubscriptionInfo | null {
  // For now, assume all users with PRO+ payment are valid
  // In production, this would check a real payment/subscription database
  
  // Mock PRO+ subscription for users who paid $60
  return {
    plan: 'PRO+',
    userId,
    subscriptionId: 'pro_plus_' + userId,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    usageLimit: 10000, // 10k requests per month for PRO+
    currentUsage: 0 // Reset monthly
  };
}

export function subscriptionAuth(req: RequestWithSubscription, res: Response, next: NextFunction) {
  // Get user identification
  const userId = req.header('x-user-id');
  const apiKey = req.header('x-api-key');
  
  if (!userId && !apiKey) {
    // No user identification - treat as free user
    req.subscription = { plan: 'FREE' };
    return next();
  }

  try {
    const subscriptionInfo = getSubscriptionInfo(userId || apiKey || 'anonymous');
    
    if (subscriptionInfo) {
      req.subscription = subscriptionInfo;
      
      // Check if subscription is still valid
      if (subscriptionInfo.validUntil && subscriptionInfo.validUntil < new Date()) {
        req.subscription.plan = 'FREE'; // Expired subscription
        console.warn(`⚠️ Expired subscription for user ${userId}`);
      }
      
      // Log subscription status for debugging
      console.log(`✅ Subscription validated: ${subscriptionInfo.plan} for user ${userId}`);
    } else {
      req.subscription = { plan: 'FREE' };
    }
    
    return next();
  } catch (error) {
    console.error('❌ Subscription validation error:', error);
    req.subscription = { plan: 'FREE' };
    return next();
  }
}

/**
 * Check if user has PRO+ subscription
 */
export function requireProPlus(req: RequestWithSubscription, res: Response, next: NextFunction) {
  if (!req.subscription || req.subscription.plan !== 'PRO+') {
    return res.status(402).json({
      ok: false,
      error: 'SUBSCRIPTION_REQUIRED',
      message: 'This feature requires a PRO+ subscription.',
      currentPlan: req.subscription?.plan || 'FREE',
      upgradeUrl: 'https://balizero.com/upgrade'
    });
  }
  
  return next();
}

/**
 * Track usage for subscription limits (separate from technical rate limits)
 */
export function trackSubscriptionUsage(req: RequestWithSubscription, res: Response, next: NextFunction) {
  if (!req.subscription) {
    return next();
  }
  
  // Increment usage counter
  if (req.subscription.currentUsage !== undefined && req.subscription.usageLimit) {
    req.subscription.currentUsage++;
    
    // Check subscription usage limits (different from technical rate limits)
    if (req.subscription.currentUsage > req.subscription.usageLimit) {
      return res.status(402).json({
        ok: false,
        error: 'SUBSCRIPTION_USAGE_EXCEEDED',
        message: `Your ${req.subscription.plan} plan usage limit has been reached.`,
        currentUsage: req.subscription.currentUsage,
        usageLimit: req.subscription.usageLimit,
        upgradeUrl: 'https://balizero.com/upgrade'
      });
    }
    
    // Warn when approaching limit (90%)
    const usagePercentage = (req.subscription.currentUsage / req.subscription.usageLimit) * 100;
    if (usagePercentage >= 90) {
      console.warn(`⚠️ User ${req.subscription.userId} approaching usage limit: ${usagePercentage.toFixed(1)}%`);
    }
  }
  
  return next();
}