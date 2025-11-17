/**
 * AI Automation Monitoring Endpoints
 *
 * Provides monitoring and status endpoints for AI automation services
 *
 * Mounted at: /api/monitoring/ai
 *
 * Endpoints:
 * - GET /api/monitoring/ai/cron-status - Cron scheduler status
 * - GET /api/monitoring/ai/ai-stats - OpenRouter client stats
 * - GET /api/monitoring/ai/ai-health - AI automation health check
 * - GET /api/monitoring/ai/refactoring-stats - Refactoring agent stats
 * - GET /api/monitoring/ai/test-generator-stats - Test generator stats
 */

import { Router, Request, Response } from 'express';
import logger from '../services/logger.js';

const router = Router();

/**
 * Get cron scheduler status
 * GET /api/monitoring/cron-status
 */
router.get('/cron-status', async (req: Request, res: Response) => {
  try {
    // Dynamically import to avoid issues if not yet initialized
    const { getCronScheduler } = await import('../services/cron-scheduler.js');
    const status = getCronScheduler().getStatus();

    res.json({
      ok: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get cron status', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Cron scheduler not available',
      message: error.message
    });
  }
});

/**
 * Get OpenRouter client stats
 * GET /api/monitoring/ai-stats
 */
router.get('/ai-stats', async (req: Request, res: Response) => {
  try {
    const { openRouterClient } = await import('../services/ai/openrouter-client.js');
    const stats = openRouterClient.getStats();

    res.json({
      ok: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get AI stats', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'OpenRouter client not available',
      message: error.message
    });
  }
});

/**
 * Health check for AI automation
 * GET /api/monitoring/ai-health
 */
router.get('/ai-health', async (req: Request, res: Response) => {
  try {
    const { openRouterClient } = await import('../services/ai/openrouter-client.js');
    const { getCronScheduler } = await import('../services/cron-scheduler.js');

    // Check OpenRouter health
    const healthy = await openRouterClient.healthCheck();
    const stats = openRouterClient.getStats();
    const cronStatus = getCronScheduler().getStatus();

    res.json({
      ok: true,
      data: {
        healthy,
        openRouter: stats,
        cron: cronStatus,
        warnings: []
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('AI health check failed', { error: error.message });
    res.status(500).json({
      ok: false,
      healthy: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get refactoring agent stats
 * GET /api/monitoring/refactoring-stats
 */
router.get('/refactoring-stats', async (req: Request, res: Response) => {
  try {
    const { RefactoringAgent } = await import('../agents/refactoring-agent.js');
    const agent = new RefactoringAgent();
    const stats = agent.getStats();

    res.json({
      ok: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get refactoring stats', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Refactoring agent not available',
      message: error.message
    });
  }
});

/**
 * Get test generator stats
 * GET /api/monitoring/test-generator-stats
 */
router.get('/test-generator-stats', async (req: Request, res: Response) => {
  try {
    const { TestGeneratorAgent } = await import('../agents/test-generator-agent.js');
    const agent = new TestGeneratorAgent();
    const stats = agent.getStats();

    res.json({
      ok: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Failed to get test generator stats', { error: error.message });
    res.status(500).json({
      ok: false,
      error: 'Test generator not available',
      message: error.message
    });
  }
});

export default router;
