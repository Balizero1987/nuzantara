/**
 * Handler #24: Plan Upgrade Management
 * Handles subscription plan upgrades with prorated pricing
 *
 * Features:
 * - Upgrade plans with prorated charges
 * - Calculate upgrade costs
 * - Manage feature upgrades
 * - Track upgrade history
 */

import { z } from 'zod';
import { ok } from '../../utils/response.js';
import { logger } from '../../logging/unified-logger.js';

const UpgradeRequestSchema = z.object({
  current_plan: z.enum(['starter', 'professional', 'enterprise', 'custom']),
  target_plan: z.enum(['starter', 'professional', 'enterprise', 'custom']),
  user_id: z.string().optional(),
  current_billing_date: z.string().optional(), // ISO date string
  apply_immediately: z.boolean().default(false),
});

const PLAN_PRICING = {
  starter: { monthly: 4999000, annual: 54890000 },
  professional: { monthly: 12999000, annual: 139989000 },
  enterprise: { monthly: 49999000, annual: 539989000 },
  custom: { monthly: 0, annual: 0 },
};

const PLAN_FEATURES = {
  starter: {
    cases_per_month: 1,
    team_members: 1,
    storage_gb: 5,
    support_level: 'email',
  },
  professional: {
    cases_per_month: 10,
    team_members: 5,
    storage_gb: 50,
    support_level: 'phone+email',
  },
  enterprise: {
    cases_per_month: -1, // Unlimited
    team_members: 100,
    storage_gb: 1000,
    support_level: 'dedicated',
  },
  custom: {
    cases_per_month: -1,
    team_members: -1,
    storage_gb: -1,
    support_level: 'custom',
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function calculateUpgradeCost(params: any) {
  try {
    const p = UpgradeRequestSchema.parse(params);
    logger.info('Calculating upgrade cost', { current: p.current_plan, target: p.target_plan });

    // Validate upgrade path
    const plan_order = ['starter', 'professional', 'enterprise', 'custom'];
    const current_index = plan_order.indexOf(p.current_plan);
    const target_index = plan_order.indexOf(p.target_plan);

    if (current_index === target_index) {
      return ok({
        error: 'Same plan selected',
        message: 'Please select a different plan',
      });
    }

    if (current_index > target_index && p.target_plan !== 'custom') {
      return ok({
        error: 'Downgrade not allowed via upgrade endpoint',
        message: 'Use the downgrade endpoint to change to a lower plan',
        note: 'Downgrades require a separate request',
      });
    }

    // Calculate prorated cost
    const current_monthly_cost = PLAN_PRICING[p.current_plan as keyof typeof PLAN_PRICING].monthly;
    const target_monthly_cost = PLAN_PRICING[p.target_plan as keyof typeof PLAN_PRICING].monthly;

    // Assuming 30 days per month for proration
    const days_in_month = 30;
    const current_billing = new Date(p.current_billing_date || new Date());
    const next_billing = new Date(current_billing);
    next_billing.setMonth(next_billing.getMonth() + 1);

    const days_remaining = Math.ceil((next_billing.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Daily rate calculation
    const current_daily_rate = current_monthly_cost / days_in_month;
    const target_daily_rate = target_monthly_cost / days_in_month;
    const prorated_amount = (target_daily_rate - current_daily_rate) * days_remaining;

    const response = {
      ok: true,
      upgrade_details: {
        from_plan: p.current_plan,
        to_plan: p.target_plan,
        effective_date: p.apply_immediately
          ? new Date().toISOString().split('T')[0]
          : next_billing.toISOString().split('T')[0],
      },
      current_plan_info: {
        monthly_cost: current_monthly_cost,
        daily_rate: current_daily_rate.toFixed(0),
      },
      target_plan_info: {
        monthly_cost: target_monthly_cost,
        daily_rate: target_daily_rate.toFixed(0),
      },
      proration: {
        days_remaining,
        credit_from_current: (current_daily_rate * days_remaining).toFixed(0),
        charge_for_target: (target_daily_rate * days_remaining).toFixed(0),
        net_prorated_amount: prorated_amount.toFixed(0),
      },
      feature_changes: {
        removed: [] as string[],
        added: [] as string[],
        upgraded: [] as string[],
      },
      payment_info: {
        currency: 'IDR',
        upgrade_charge: prorated_amount > 0 ? prorated_amount.toFixed(0) : '0',
        credit_amount: prorated_amount < 0 ? Math.abs(prorated_amount).toFixed(0) : '0',
        next_billing_amount: target_monthly_cost,
      },
    };

    // Calculate feature changes
    const current_features = PLAN_FEATURES[p.current_plan as keyof typeof PLAN_FEATURES];
    const target_features = PLAN_FEATURES[p.target_plan as keyof typeof PLAN_FEATURES];

    if (current_features.cases_per_month < target_features.cases_per_month) {
      response.feature_changes.upgraded.push(
        `Cases per month: ${current_features.cases_per_month} → ${target_features.cases_per_month}`
      );
    }
    if (current_features.team_members < target_features.team_members) {
      response.feature_changes.upgraded.push(
        `Team members: ${current_features.team_members} → ${target_features.team_members}`
      );
    }
    if (current_features.storage_gb < target_features.storage_gb) {
      response.feature_changes.upgraded.push(
        `Storage: ${current_features.storage_gb}GB → ${target_features.storage_gb}GB`
      );
    }
    if (current_features.support_level !== target_features.support_level) {
      response.feature_changes.upgraded.push(
        `Support: ${current_features.support_level} → ${target_features.support_level}`
      );
    }

    return ok(response);
  } catch (error: any) {
    logger.error('Calculate upgrade cost error', error, { error: error.message });
    return ok({
      error: 'Failed to calculate upgrade cost',
      message: error.message,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processUpgrade(params: any) {
  try {
    const p = UpgradeRequestSchema.parse(params);
    logger.info('Processing upgrade', {
      user_id: p.user_id,
      from: p.current_plan,
      to: p.target_plan,
    });

    // Get cost calculation
    const cost_calc = await calculateUpgradeCost(params);
    if (!cost_calc.ok) {
      return cost_calc;
    }

    const upgrade_cost = (cost_calc.data as any)?.payment_info?.upgrade_charge;

    const response = {
      ok: true,
      upgrade_status: 'pending_confirmation',
      upgrade_id: `UPG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      summary: {
        current_plan: p.current_plan,
        new_plan: p.target_plan,
        effective_date: p.apply_immediately ? new Date().toISOString() : 'Next billing cycle',
        cost: {
          upgrade_charge: upgrade_cost,
          currency: 'IDR',
          description: 'Prorated charge for plan upgrade',
        },
      },
      next_steps: [
        'Review upgrade details',
        'Confirm payment method',
        'Accept terms & conditions',
        'Complete upgrade',
      ],
      confirmation_required: true,
      expires_in: 24, // Hours
    };

    return ok(response);
  } catch (error: any) {
    logger.error('Process upgrade error', error, { error: error.message });
    return ok({
      error: 'Failed to process upgrade',
      message: error.message,
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUpgradeOptions(params: any) {
  try {
    const { current_plan } = params || {};

    if (!current_plan || !(current_plan in PLAN_FEATURES)) {
      return ok({
        error: 'Invalid current_plan',
        available_plans: Object.keys(PLAN_FEATURES),
      });
    }

    const plan_order = ['starter', 'professional', 'enterprise', 'custom'];
    const current_index = plan_order.indexOf(current_plan);

    const upgrade_options = plan_order.slice(current_index + 1).map((plan) => ({
      plan_name: plan,
      features: PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES],
      monthly_cost: PLAN_PRICING[plan as keyof typeof PLAN_PRICING].monthly,
      recommended: plan === 'professional' && current_plan === 'starter',
    }));

    return ok({
      ok: true,
      current_plan,
      available_upgrades: upgrade_options,
      downgrade_options: plan_order.slice(0, current_index).map((plan) => ({
        plan_name: plan,
        note: 'Downgrade - contact support',
      })),
      contact_for_custom: 'Support team available at support@balizero.com',
    });
  } catch (error: any) {
    logger.error('Get upgrade options error', error, { error: error.message });
    return ok({
      error: 'Failed to fetch upgrade options',
    });
  }
}
