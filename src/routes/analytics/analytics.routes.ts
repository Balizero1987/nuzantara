/**
 * Analytics Routes
 * Analytics, dashboard, and reporting endpoints
 * Extracted from router.ts (modular refactor)
 */

import { Router } from 'express';
import { z } from 'zod';
import { ok, err } from '../../utils/response.js';
import { apiKeyAuth, RequestWithCtx } from '../../middleware/auth.js';
import { analyticsHandlers } from '../../handlers/analytics/analytics.js';
import { weeklyReportHandlers } from '../../handlers/analytics/weekly-report.js';
import { BadRequestError } from '../../utils/errors.js';

const router = Router();

// Analytics schemas
const AnalyticsReportSchema = z.object({
  propertyId: z.string().optional().default('365284833'),
  startDate: z.string().optional().default('7daysAgo'),
  endDate: z.string().optional().default('today'),
  metrics: z.array(z.string()).optional().default(['activeUsers', 'sessions', 'pageviews']),
  dimensions: z.array(z.string()).optional().default(['date']),
});

const WeeklyReportSchema = z.object({
  week: z.string().optional(),
  year: z.number().optional(),
  includeCharts: z.boolean().optional().default(false),
});

/**
 * POST /api/analytics/report
 * Get analytics report with traffic data
 */
router.post('/report', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = AnalyticsReportSchema.parse(req.body);
    const result = await analyticsHandlers['analytics.report'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/analytics/weekly-report
 * Generate weekly activity report
 */
router.post('/weekly-report', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = WeeklyReportSchema.parse(req.body);
    const result = await weeklyReportHandlers['weekly.report.generate'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * POST /api/analytics/weekly-report/summary
 * Get weekly report summary
 */
router.post('/weekly-report/summary', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = WeeklyReportSchema.parse(req.body);
    const result = await weeklyReportHandlers['weekly.report.summary'](params);
    return res.json(result);
  } catch (error: any) {
    if (error instanceof BadRequestError) {
      return res.status(400).json(err(error.message));
    }
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

/**
 * GET /api/analytics/report
 * Get analytics report (convenience GET endpoint)
 */
router.get('/report', apiKeyAuth, async (req: RequestWithCtx, res) => {
  try {
    const params = {
      propertyId: (req.query.propertyId as string) || '365284833',
      startDate: (req.query.startDate as string) || '7daysAgo',
      endDate: (req.query.endDate as string) || 'today',
    };
    const result = await analyticsHandlers['analytics.report'](params);
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json(err(error?.message || 'Internal Error'));
  }
});

export default router;
