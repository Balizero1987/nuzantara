/**
 * Pricing Routes
 * Official Bali Zero pricing information
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { baliZeroPricing, baliZeroQuickPrice } from '../../handlers/bali-zero/bali-zero-pricing.js';
import {
  getSubscriptionPlans,
  getSubscriptionDetails,
  calculateSubscriptionRenewal,
} from '../../handlers/bali-zero/pricing-subscription.js';
import {
  calculateUpgradeCost,
  processUpgrade,
  getUpgradeOptions,
} from '../../handlers/bali-zero/pricing-upgrade.js';
import {
  generateInvoice,
  getInvoiceDetails,
  getInvoiceHistory,
  downloadInvoice,
  calculateInvoiceTotals,
} from '../../handlers/bali-zero/pricing-invoices.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Pricing schemas
const PricingQuerySchema = z.object({
  service_type: z.enum(['visa', 'kitas', 'kitap', 'business', 'tax', 'all']).default('all'),
  specific_service: z.string().optional(),
  include_details: z.boolean().default(true),
});

const QuickPriceSchema = z.object({
  service: z.string(),
});

/**
 * POST /api/pricing/official
 * Get official Bali Zero pricing information
 */
router.post('/official', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = PricingQuerySchema.parse(req.body);
    const result = await baliZeroPricing(params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/quick
 * Quick price lookup for specific service
 */
router.post('/quick', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = QuickPriceSchema.parse(req.body);
    const result = await baliZeroQuickPrice(params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/pricing/official
 * Get all official pricing (convenience GET endpoint)
 */
router.get('/official', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = {
      service_type: (req.query.service_type as any) || 'all',
      include_details: true,
    };
    const result = await baliZeroPricing(params);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/subscriptions
 * Handler #23: Get subscription plans
 */
router.post('/subscriptions', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await getSubscriptionPlans(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/pricing/subscriptions/:plan_id
 * Handler #23: Get specific subscription plan details
 */
router.get('/subscriptions/:plan_id', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await getSubscriptionDetails({
      plan_id: req.params.plan_id,
      include_features: req.query.include_features !== 'false',
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/subscriptions/renewal
 * Handler #23: Calculate subscription renewal date
 */
router.post('/subscriptions/renewal', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await calculateSubscriptionRenewal(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/upgrade/calculate
 * Handler #24: Calculate upgrade cost
 */
router.post('/upgrade/calculate', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await calculateUpgradeCost(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/upgrade/process
 * Handler #24: Process plan upgrade
 */
router.post('/upgrade/process', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await processUpgrade(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/pricing/upgrade/options/:current_plan
 * Handler #24: Get available upgrade options
 */
router.get('/upgrade/options/:current_plan', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await getUpgradeOptions({
      current_plan: req.params.current_plan,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/invoices/generate
 * Handler #25: Generate invoice for service
 */
router.post('/invoices/generate', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await generateInvoice(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/pricing/invoices/:invoice_id
 * Handler #25: Get invoice details
 */
router.get('/invoices/:invoice_id', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await getInvoiceDetails({
      invoice_id: req.params.invoice_id,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/pricing/invoices
 * Handler #25: Get invoice history
 */
router.get('/invoices', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await getInvoiceHistory({
      status: (req.query.status as any) || 'all',
      limit: parseInt(req.query.limit as any) || 10,
    });
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/invoices/download
 * Handler #25: Download invoice
 */
router.post('/invoices/download', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await downloadInvoice(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/pricing/invoices/calculate-totals
 * Handler #25: Calculate invoice totals
 */
router.post('/invoices/calculate-totals', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const result = await calculateInvoiceTotals(req.body || {});
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
