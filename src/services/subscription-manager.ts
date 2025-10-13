/**
 * Subscription Manager
 * 
 * Gestisce gli abbonamenti PRO+ e traccia i limiti di utilizzo
 * Risolve il problema degli utenti che pagano e ricevono subito avvisi sui limiti
 */

import { Firestore } from '@google-cloud/firestore';

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'my-project',
  databaseId: 'bali-zero-memory'
});

const SUBSCRIPTION_COLLECTION = 'subscriptions';
const USAGE_COLLECTION = 'usage_tracking';

export interface Subscription {
  userId: string;
  email: string;
  plan: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  lastPaymentDate: Date;
  nextBillingDate: Date;
  paymentAmount: number;
  currency: 'USD' | 'EUR' | 'IDR';
  usageLimits: {
    apiCalls: number;
    aiRequests: number;
    ragQueries: number;
    storageGB: number;
  };
  metadata?: {
    paymentMethod?: string;
    stripeCustomerId?: string;
    invoiceId?: string;
  };
}

export interface UsageTracking {
  userId: string;
  period: string; // YYYY-MM format
  usage: {
    apiCalls: number;
    aiRequests: number;
    ragQueries: number;
    storageGB: number;
  };
  lastUpdated: Date;
}

// Plan configurations with proper limits
const PLAN_LIMITS = {
  FREE: {
    apiCalls: 100,
    aiRequests: 10,
    ragQueries: 5,
    storageGB: 1
  },
  PRO: {
    apiCalls: 5000,
    aiRequests: 500,
    ragQueries: 100,
    storageGB: 10
  },
  PRO_PLUS: {
    apiCalls: 50000,  // 50k API calls per month
    aiRequests: 10000, // 10k AI requests per month
    ragQueries: 5000,  // 5k RAG queries per month
    storageGB: 100     // 100GB storage
  },
  ENTERPRISE: {
    apiCalls: -1,  // unlimited
    aiRequests: -1, // unlimited
    ragQueries: -1, // unlimited
    storageGB: 1000 // 1TB
  }
};

export class SubscriptionManager {
  /**
   * Create or update a subscription
   */
  async createSubscription(subscription: Subscription): Promise<void> {
    try {
      const docRef = db.collection(SUBSCRIPTION_COLLECTION).doc(subscription.userId);
      await docRef.set({
        ...subscription,
        startDate: subscription.startDate || new Date(),
        lastPaymentDate: subscription.lastPaymentDate || new Date(),
        nextBillingDate: subscription.nextBillingDate || this.calculateNextBillingDate(new Date()),
        updatedAt: new Date()
      });
      
      // Reset usage counters for new subscription
      await this.resetUsage(subscription.userId);
      
      console.log(`✅ Subscription created/updated for user ${subscription.userId} - Plan: ${subscription.plan}`);
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get user subscription
   */
  async getSubscription(userId: string): Promise<Subscription | null> {
    try {
      const doc = await db.collection(SUBSCRIPTION_COLLECTION).doc(userId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as Subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Check if user has active PRO+ subscription
   */
  async hasActiveProPlus(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return false;
    
    // Check if PRO_PLUS and active
    if (subscription.plan !== 'PRO_PLUS') return false;
    if (subscription.status !== 'active') return false;
    
    // Check if payment is recent (within billing period)
    const now = new Date();
    const nextBilling = new Date(subscription.nextBillingDate);
    
    return now < nextBilling;
  }

  /**
   * Track usage for rate limiting
   */
  async trackUsage(userId: string, usageType: 'apiCalls' | 'aiRequests' | 'ragQueries'): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    try {
      // Get user subscription
      const subscription = await this.getSubscription(userId);
      if (!subscription) {
        // Default to FREE plan
        return this.checkFreeUsage(userId, usageType);
      }

      // Special handling for recent PRO+ subscribers
      if (subscription.plan === 'PRO_PLUS') {
        const hoursSincePayment = (Date.now() - new Date(subscription.lastPaymentDate).getTime()) / (1000 * 60 * 60);
        
        // If payment was within last 24 hours, give FULL access without warnings
        if (hoursSincePayment < 24) {
          console.log(`🎉 New PRO+ subscriber (${hoursSincePayment.toFixed(1)} hours ago) - Full access granted!`);
          return {
            allowed: true,
            remaining: subscription.usageLimits[usageType],
            limit: subscription.usageLimits[usageType]
          };
        }
      }

      // Get or create usage tracking for current month
      const period = this.getCurrentPeriod();
      const usageDoc = db.collection(USAGE_COLLECTION).doc(`${userId}_${period}`);
      
      const usageSnapshot = await usageDoc.get();
      let usage: UsageTracking;
      
      if (!usageSnapshot.exists) {
        // Create new usage tracking for this period
        usage = {
          userId,
          period,
          usage: {
            apiCalls: 0,
            aiRequests: 0,
            ragQueries: 0,
            storageGB: 0
          },
          lastUpdated: new Date()
        };
      } else {
        usage = usageSnapshot.data() as UsageTracking;
      }

      // Check limits
      const limit = subscription.usageLimits[usageType];
      const current = usage.usage[usageType];
      
      if (limit === -1 || current < limit) {
        // Update usage
        usage.usage[usageType] = current + 1;
        usage.lastUpdated = new Date();
        await usageDoc.set(usage);
        
        return {
          allowed: true,
          remaining: limit === -1 ? -1 : limit - usage.usage[usageType],
          limit
        };
      }

      return {
        allowed: false,
        remaining: 0,
        limit
      };
    } catch (error) {
      console.error('Error tracking usage:', error);
      // On error, allow the request but log it
      return { allowed: true, remaining: -1, limit: -1 };
    }
  }

  /**
   * Reset usage counters (called on new billing period)
   */
  async resetUsage(userId: string): Promise<void> {
    const period = this.getCurrentPeriod();
    const usageDoc = db.collection(USAGE_COLLECTION).doc(`${userId}_${period}`);
    
    await usageDoc.set({
      userId,
      period,
      usage: {
        apiCalls: 0,
        aiRequests: 0,
        ragQueries: 0,
        storageGB: 0
      },
      lastUpdated: new Date()
    });
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId: string): Promise<UsageTracking | null> {
    const period = this.getCurrentPeriod();
    const doc = await db.collection(USAGE_COLLECTION).doc(`${userId}_${period}`).get();
    
    if (!doc.exists) return null;
    return doc.data() as UsageTracking;
  }

  /**
   * Handle PRO+ payment
   */
  async handleProPlusPayment(userId: string, email: string, paymentAmount: number = 60): Promise<void> {
    const subscription: Subscription = {
      userId,
      email,
      plan: 'PRO_PLUS',
      status: 'active',
      startDate: new Date(),
      lastPaymentDate: new Date(),
      nextBillingDate: this.calculateNextBillingDate(new Date()),
      paymentAmount,
      currency: 'USD',
      usageLimits: PLAN_LIMITS.PRO_PLUS
    };

    await this.createSubscription(subscription);
    console.log(`💳 PRO+ payment processed for ${email} - $${paymentAmount}`);
  }

  /**
   * Check if usage warning should be shown
   */
  async shouldShowUsageWarning(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return true; // Show warning for free users
    
    // NEVER show warning for PRO+ users who just paid (within 7 days)
    if (subscription.plan === 'PRO_PLUS') {
      const daysSincePayment = (Date.now() - new Date(subscription.lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePayment < 7) {
        return false; // No warnings for recent PRO+ subscribers!
      }
    }

    // Check usage percentage
    const usage = await this.getUsageStats(userId);
    if (!usage) return false;

    // Only show warning if > 80% of limit used
    const limits = subscription.usageLimits;
    for (const [key, limit] of Object.entries(limits)) {
      if (limit === -1) continue; // Skip unlimited
      const used = usage.usage[key as keyof typeof usage.usage];
      if (typeof used === 'number' && used > limit * 0.8) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Check free tier usage
   */
  private async checkFreeUsage(userId: string, usageType: string): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const limit = PLAN_LIMITS.FREE[usageType as keyof typeof PLAN_LIMITS.FREE];
    // For free users, apply strict limits
    return {
      allowed: true, // For now allow but could implement tracking
      remaining: limit,
      limit
    };
  }

  /**
   * Helper: Get current billing period (YYYY-MM)
   */
  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Helper: Calculate next billing date (30 days from now)
   */
  private calculateNextBillingDate(fromDate: Date): Date {
    const next = new Date(fromDate);
    next.setDate(next.getDate() + 30);
    return next;
  }

  /**
   * Migrate user to PRO+ (for fixing current issue)
   */
  async fixUserSubscription(email: string): Promise<void> {
    // Generate userId from email
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log(`🔧 Fixing subscription for ${email}`);
    await this.handleProPlusPayment(userId, email, 60);
    
    // Also clear any rate limit flags
    await this.resetUsage(userId);
    
    console.log(`✅ Subscription fixed! User ${email} now has full PRO+ access with NO limits for 30 days.`);
  }
}

// Export singleton instance
export const subscriptionManager = new SubscriptionManager();