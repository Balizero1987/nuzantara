/**
 * Pricing Routes
 * Official Bali Zero pricing information
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.ts';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.ts';
import { baliZeroPricing, baliZeroQuickPrice } from '../../handlers/bali-zero/bali-zero-pricing.ts';
import { BadRequestError } from '../../utils/errors.ts';

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

export default router;
