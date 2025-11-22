/**
 * ZANTARA Monitoring Routes
 * Endpoints for monitoring cron jobs and agent tasks
 */

import { Router } from 'express';
import { getCronScheduler } from '../services/cron-scheduler.js';
import { logger } from '../logging/unified-logger.js';

const router = Router();

/**
 * GET /api/monitoring/cron-status
 * Get status of all cron jobs
 */
router.get('/cron-status', async (_req, res) => {
  try {
    const scheduler = getCronScheduler();
    const schedulerStatus = scheduler.getStatus();
    const jobs = schedulerStatus.jobs || [];
    const orchestrator = scheduler.getOrchestrator();

    const status = {
      enabled: process.env.ENABLE_CRON === 'true' || process.env.NODE_ENV === 'production',
      timezone: process.env.CRON_TIMEZONE || 'Asia/Singapore',
      jobs: [
        {
          name: 'nightly-healing',
          schedule: process.env.CRON_SELF_HEALING || '0 2 * * *',
          description: 'Daily self-healing scan at 2:00 AM',
          status: jobs.includes('nightly-healing') ? 'active' : 'inactive',
        },
        {
          name: 'nightly-tests',
          schedule: process.env.CRON_AUTO_TESTS || '0 3 * * *',
          description: 'Auto-test generation at 3:00 AM',
          status: jobs.includes('nightly-tests') ? 'active' : 'inactive',
        },
        {
          name: 'weekly-pr',
          schedule: process.env.CRON_WEEKLY_PR || '0 4 * * 0',
          description: 'Weekly PR creation on Sunday at 4:00 AM',
          status: jobs.includes('weekly-pr') ? 'active' : 'inactive',
        },
        {
          name: 'health-check',
          schedule: process.env.CRON_HEALTH_CHECK || '*/15 * * * *',
          description: 'System health check every 15 minutes',
          status: jobs.includes('health-check') ? 'active' : 'inactive',
        },
        {
          name: 'daily-report',
          schedule: process.env.CRON_DAILY_REPORT || '0 9 * * *',
          description: 'Daily metrics report at 9:00 AM',
          status: jobs.includes('daily-report') ? 'active' : 'inactive',
        },
      ],
      orchestrator: orchestrator
        ? {
            initialized: true,
            tasksCount: orchestrator.getAllTasks().length,
          }
        : {
            initialized: false,
            reason: 'API keys not configured',
          },
      timestamp: new Date().toISOString(),
    };

    logger.info('Cron status requested', { jobsActive: jobs.length });
    res.json({ success: true, status });
  } catch (error: any) {
    logger.error('Failed to get cron status', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monitoring/agent-tasks
 * Get all agent tasks
 */
router.get('/agent-tasks', async (_req, res) => {
  try {
    const scheduler = getCronScheduler();
    const orchestrator = scheduler.getOrchestrator();

    if (!orchestrator) {
      return res.json({
        success: true,
        tasks: [],
        message: 'Agent orchestrator not initialized',
      });
    }

    const tasks = orchestrator.getAllTasks();

    res.json({
      success: true,
      tasks: tasks.map((t: any) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        startTime: t.startTime,
        endTime: t.endTime,
        error: t.error,
      })),
      summary: {
        total: tasks.length,
        pending: tasks.filter((t: any) => t.status === 'pending').length,
        running: tasks.filter((t: any) => t.status === 'running').length,
        completed: tasks.filter((t: any) => t.status === 'completed').length,
        failed: tasks.filter((t: any) => t.status === 'failed').length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get agent tasks', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/monitoring/trigger-job
 * Manually trigger a cron job (for testing)
 */
router.post('/trigger-job', async (req, res) => {
  try {
    const { jobName } = req.body;

    if (!jobName) {
      return res.status(400).json({
        success: false,
        error: 'jobName is required',
      });
    }

    const scheduler = getCronScheduler();
    const orchestrator = scheduler.getOrchestrator();

    if (!orchestrator) {
      return res.status(503).json({
        success: false,
        error: 'Agent orchestrator not initialized',
      });
    }

    let taskId: string;

    switch (jobName) {
      case 'nightly-healing':
        taskId = await orchestrator.submitTask(
          'self-healing',
          { action: 'scan-and-fix', description: 'Manual trigger: self-healing' },
          { timestamp: new Date(), metadata: { priority: 'high' } }
        );
        break;

      case 'nightly-tests':
        taskId = await orchestrator.submitTask(
          'test-writer',
          { action: 'update-tests', description: 'Manual trigger: test generation' },
          { timestamp: new Date(), metadata: { priority: 'medium' } }
        );
        break;

      case 'weekly-pr':
        taskId = await orchestrator.submitTask(
          'pr-agent',
          { action: 'create-weekly-summary', description: 'Manual trigger: PR creation' },
          { timestamp: new Date(), metadata: { priority: 'low' } }
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown job: ${jobName}`,
        });
    }

    logger.info('Manual job trigger', { jobName, taskId });

    res.json({
      success: true,
      message: `Job ${jobName} triggered successfully`,
      taskId,
    });
  } catch (error: any) {
    logger.error('Failed to trigger job', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
