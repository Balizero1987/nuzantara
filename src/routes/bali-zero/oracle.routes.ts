/**
 * Oracle Routes
 * Bali Zero service simulation and prediction engine
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { oracleSimulate, oracleAnalyze, oraclePredict } from '../../handlers/bali-zero/oracle.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Oracle schemas
const OracleBaseSchema = z.object({
  service: z.string().optional(),
  scenario: z.string().optional(),
  urgency: z.enum(['low', 'normal', 'high']).optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  region: z.string().optional(),
  budget: z.number().optional(),
  goals: z.array(z.string()).optional(),
});

/**
 * POST /api/oracle/simulate
 * Simulate service outcomes with probability analysis
 */
router.post('/simulate', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = OracleBaseSchema.parse(req.body);
    const result = await oracleSimulate(params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/oracle/analyze
 * Analyze service requirements and risk factors
 */
router.post('/analyze', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = OracleBaseSchema.parse(req.body);
    const result = await oracleAnalyze(params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/oracle/predict
 * Predict timeline and completion forecast
 */
router.post('/predict', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = OracleBaseSchema.parse(req.body);
    const result = await oraclePredict(params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
