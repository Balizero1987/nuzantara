/**
 * Handler #23: Subscription Plans Management
 * Manages subscription plans, billing cycles, and renewals
 *
 * Features:
 * - List available subscription plans
 * - Get subscription details
 * - Calculate renewal dates
 * - Apply promotional discounts
 */

import { z } from 'zod';
import { ok } from '../../utils/response.js';
import { logger } from '../../logging/unified-logger.js';

const SubscriptionQuerySchema = z.object({
  plan_type: z.enum(['starter', 'professional', 'enterprise', 'custom']).optional(),
  billing_cycle: z.enum(['monthly', 'quarterly', 'annual']).optional(),
  currency: z.enum(['IDR', 'USD']).default('IDR'),
});

const SubscriptionDetailSchema = z.object({
  plan_id: z.string(),
  include_features: z.boolean().default(true),
});

// OFFICIAL BALI ZERO SUBSCRIPTION PLANS 2025
const SUBSCRIPTION_PLANS = {
  starter: {
    plan_id: 'plan_starter_2025',
    name: 'Starter Plan',
    description: 'Perfect for individuals and small businesses',
    features: [
      'Basic visa consultation',
      '1 case per month',
      'Email support',
      'Access to KBLI database',
      'Monthly tax report',
    ],
    pricing: {
      monthly: { IDR: '4.999.000', USD: '315' },
      quarterly: { IDR: '14.299.000', USD: '900' }, // 5% discount
      annual: { IDR: '54.890.000', USD: '3465' }, // 10% discount
    },
    renewal_terms: 'Auto-renews on billing date',
    cancellation_notice: '7 days',
    features_limit: {
      cases_per_month: 1,
      team_members: 1,
      storage_gb: 5,
    },
  },

  professional: {
    plan_id: 'plan_professional_2025',
    name: 'Professional Plan',
    description: 'For growing businesses with multiple services',
    features: [
      'Full visa consultation',
      '10 cases per month',
      'Phone + email support',
      'Access to all databases',
      'Monthly tax reports',
      'Company setup assistance',
      'Priority support (48hr response)',
      'Custom reporting',
    ],
    pricing: {
      monthly: { IDR: '12.999.000', USD: '825' },
      quarterly: { IDR: '37.497.000', USD: '2375' }, // 5% discount
      annual: { IDR: '139.989.000', USD: '8865' }, // 10% discount
    },
    renewal_terms: 'Auto-renews on billing date',
    cancellation_notice: '14 days',
    features_limit: {
      cases_per_month: 10,
      team_members: 5,
      storage_gb: 50,
    },
  },

  enterprise: {
    plan_id: 'plan_enterprise_2025',
    name: 'Enterprise Plan',
    description: 'Full-featured for large organizations',
    features: [
      'Unlimited consultations',
      'Unlimited cases',
      'Phone + email + chat support',
      'Dedicated account manager',
      'Access to all databases + custom data',
      'Weekly reports + custom analytics',
      'API access',
      'White-label option',
      'SLA guarantee (99.5% uptime)',
      'Custom integrations',
      'Quarterly business review',
    ],
    pricing: {
      monthly: { IDR: '49.999.000', USD: '3165' },
      quarterly: { IDR: '144.997.000', USD: '9180' }, // 5% discount
      annual: { IDR: '539.989.000', USD: '34200' }, // 10% discount
    },
    renewal_terms: 'Auto-renews on billing date',
    cancellation_notice: '30 days',
    features_limit: {
      cases_per_month: -1, // Unlimited
      team_members: 100,
      storage_gb: 1000,
    },
  },

  custom: {
    plan_id: 'plan_custom_2025',
    name: 'Custom Plan',
    description: 'Tailored solutions for unique needs',
    features: [
      'Custom feature selection',
      'Custom pricing',
      'Dedicated support team',
      'Custom SLA',
      'Custom integrations',
    ],
    pricing: {
      monthly: { IDR: 'Contact for quote', USD: 'Contact for quote' },
      quarterly: { IDR: 'Contact for quote', USD: 'Contact for quote' },
      annual: { IDR: 'Contact for quote', USD: 'Contact for quote' },
    },
    renewal_terms: 'Custom negotiation',
    cancellation_notice: 'Custom',
    features_limit: {
      cases_per_month: -1,
      team_members: -1,
      storage_gb: -1,
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSubscriptionPlans(params: any) {
  try {
    const p = SubscriptionQuerySchema.parse(params || {});
    logger.info('Fetching subscription plans', {
      plan_type: p.plan_type,
      billing_cycle: p.billing_cycle,
    });

    let response_data: any = {
      official_notice: '🔒 OFFICIAL BALI ZERO SUBSCRIPTION PLANS 2025',
      last_updated: '2025-01-01',
      currency: p.currency,
    };

    if (p.plan_type) {
      // Return specific plan
      const plan = SUBSCRIPTION_PLANS[p.plan_type as keyof typeof SUBSCRIPTION_PLANS];
      if (plan) {
        response_data.plan = {
          ...plan,
          selected_billing_cycle: p.billing_cycle || 'annual',
          current_pricing:
            plan.pricing[p.billing_cycle as keyof typeof plan.pricing] || plan.pricing.annual,
        };
      } else {
        response_data.error = 'Plan not found';
      }
    } else {
      // Return all plans with summary
      response_data.plans = Object.entries(SUBSCRIPTION_PLANS).reduce((acc, [key, plan]) => {
        acc[key] = {
          name: plan.name,
          description: plan.description,
          pricing_summary:
            plan.pricing[p.billing_cycle as keyof typeof plan.pricing] || plan.pricing.annual,
          features_count: plan.features.length,
        };
        return acc;
      }, {} as any);

      response_data.billing_cycles_available = ['monthly', 'quarterly', 'annual'];
      response_data.discount_info = {
        quarterly: '5% discount on monthly rate',
        annual: '10% discount on monthly rate',
      };
    }

    response_data.contact_info = {
      email: 'subscriptions@balizero.com',
      phone: '+62 813 3805 1876',
      website: 'https://balizero.com/plans',
    };

    response_data.disclaimer = {
      it: '⚠️ Questi sono i piani di abbonamento UFFICIALI di Bali Zero 2025.',
      id: '⚠️ Ini adalah rencana berlangganan RESMI Bali Zero 2025.',
      en: '⚠️ These are OFFICIAL Bali Zero 2025 subscription plans.',
    };

    return ok(response_data);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get subscription plans error');
    return ok({
      error: 'Failed to fetch subscription plans',
      contact_info: {
        email: 'subscriptions@balizero.com',
        phone: '+62 813 3805 1876',
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getSubscriptionDetails(params: any) {
  try {
    const p = SubscriptionDetailSchema.parse(params);
    logger.info({ plan_id: p.plan_id }, 'Fetching subscription details');

    // Find plan by ID
    let found_plan = null;
    for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (plan.plan_id === p.plan_id) {
        found_plan = { key, ...plan };
        break;
      }
    }

    if (!found_plan) {
      return ok({
        error: `Plan with ID ${p.plan_id} not found`,
        available_plans: Object.keys(SUBSCRIPTION_PLANS),
      });
    }

    const response = {
      ok: true,
      plan: p.include_features ? found_plan : { ...found_plan, features: undefined },
      renewal_info: {
        auto_renewal: true,
        cancellation_notice_days: parseInt(found_plan.cancellation_notice.split(' ')[0]),
        can_upgrade: true,
        can_downgrade: true,
      },
      support_info: {
        email: 'support@balizero.com',
        phone: '+62 813 3805 1876',
        response_time: 'Varies by plan',
      },
    };

    return ok(response);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Get subscription details error');
    return ok({
      error: 'Failed to fetch subscription details',
      message: 'Please provide a valid plan_id',
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function calculateSubscriptionRenewal(params: any) {
  try {
    const { plan_id, current_billing_date, billing_cycle } = params || {};

    if (!plan_id || !current_billing_date) {
      return ok({
        error: 'plan_id and current_billing_date are required',
      });
    }

    const current_date = new Date(current_billing_date);
    const next_renewal = new Date(current_date);

    // Calculate next renewal based on billing cycle
    if (billing_cycle === 'monthly') {
      next_renewal.setMonth(next_renewal.getMonth() + 1);
    } else if (billing_cycle === 'quarterly') {
      next_renewal.setMonth(next_renewal.getMonth() + 3);
    } else if (billing_cycle === 'annual') {
      next_renewal.setFullYear(next_renewal.getFullYear() + 1);
    }

    const days_until_renewal = Math.ceil(
      (next_renewal.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return ok({
      plan_id,
      current_billing_date: current_date.toISOString().split('T')[0],
      next_renewal_date: next_renewal.toISOString().split('T')[0],
      billing_cycle,
      days_until_renewal,
      renewal_status: days_until_renewal > 0 ? 'pending' : 'overdue',
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Calculate renewal error');
    return ok({
      error: 'Failed to calculate renewal date',
    });
  }
}
