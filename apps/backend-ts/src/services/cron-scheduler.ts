/**
 * ZANTARA Cron Scheduler for Autonomous Agents
 * Runs maintenance tasks automatically
 */

import cron, { ScheduledTask, ScheduleOptions } from 'node-cron';
import { logger } from '../logging/unified-logger.js';
import { AgentOrchestrator } from '../agents/agent-orchestrator.js';

/**
 * Cron Scheduler for Autonomous Agents
 * Runs maintenance tasks automatically
 */
export class CronScheduler {
  private orchestrator: AgentOrchestrator | null = null;
  private jobs: Map<string, ScheduledTask>;
  private enabled: boolean;

  constructor() {
    this.jobs = new Map();
    this.enabled = process.env.ENABLE_CRON === 'true' || process.env.NODE_ENV === 'production';
  }

  /**
   * Initialize all scheduled jobs
   */
  async start() {
    if (!this.enabled) {
      logger.info('🕐 Cron Scheduler is DISABLED (set ENABLE_CRON=true to enable)');
      return;
    }

    logger.info('🕐 Starting Cron Scheduler for Autonomous Agents...');

    // Initialize orchestrator with API keys from environment
    const openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY || '';

    if (!openRouterApiKey || !deepseekApiKey) {
      logger.warn('⚠️  Agent orchestrator API keys not configured. Cron jobs will be limited.');
    } else {
      this.orchestrator = new AgentOrchestrator({
        openRouterApiKey,
        deepseekApiKey,
      });
    }

    // Job 1: Nightly Self-Healing (2:00 AM)
    this.scheduleJob('nightly-healing', process.env.CRON_SELF_HEALING || '0 2 * * *', async () => {
      logger.info('🔧 [CRON] Starting nightly self-healing...');
      try {
        if (!this.orchestrator) {
          logger.warn('⚠️  [CRON] Orchestrator not initialized, skipping self-healing');
          return;
        }
        const taskId = await this.orchestrator.submitTask(
          'self-healing',
          { action: 'scan-and-fix', description: 'Nightly scan for errors and auto-fix' },
          { priority: 'high', timestamp: new Date() }
        );
        logger.info('✅ [CRON] Nightly self-healing submitted', { taskId });
      } catch (error: any) {
        logger.error('❌ [CRON] Nightly self-healing failed', { error: error.message });
      }
    });

    // Job 2: Auto-Test Generation (3:00 AM)
    this.scheduleJob('nightly-tests', process.env.CRON_AUTO_TESTS || '0 3 * * *', async () => {
      logger.info('🧪 [CRON] Starting auto-test generation...');
      try {
        if (!this.orchestrator) {
          logger.warn('⚠️  [CRON] Orchestrator not initialized, skipping test generation');
          return;
        }
        const taskId = await this.orchestrator.submitTask(
          'test-writer',
          { action: 'update-tests', description: 'Generate missing tests for handlers' },
          { priority: 'medium', timestamp: new Date() }
        );
        logger.info('✅ [CRON] Auto-test generation submitted', { taskId });
      } catch (error: any) {
        logger.error('❌ [CRON] Auto-test generation failed', { error: error.message });
      }
    });

    // Job 3: Weekly PR Creation (Sunday 4:00 AM)
    this.scheduleJob('weekly-pr', process.env.CRON_WEEKLY_PR || '0 4 * * 0', async () => {
      logger.info('📝 [CRON] Starting weekly PR creation...');
      try {
        if (!this.orchestrator) {
          logger.warn('⚠️  [CRON] Orchestrator not initialized, skipping PR creation');
          return;
        }
        const taskId = await this.orchestrator.submitTask(
          'pr-agent',
          { action: 'create-weekly-summary', description: 'Create PR with weekly improvements' },
          { priority: 'low', timestamp: new Date() }
        );
        logger.info('✅ [CRON] Weekly PR creation submitted', { taskId });
      } catch (error: any) {
        logger.error('❌ [CRON] Weekly PR creation failed', { error: error.message });
      }
    });

    // Job 4: Health Check (Every 15 minutes)
    this.scheduleJob('health-check', process.env.CRON_HEALTH_CHECK || '*/15 * * * *', async () => {
      logger.debug('💓 [CRON] Running health check...');
      try {
        const health = await this.checkSystemHealth();
        if (health.critical && this.orchestrator) {
          // Trigger self-healing immediately
          const taskId = await this.orchestrator.submitTask(
            'self-healing',
            { action: 'emergency-fix', description: `Critical issue detected: ${health.issue}` },
            { priority: 'critical', timestamp: new Date() }
          );
          logger.warn('⚠️  [CRON] Critical health issue detected, emergency healing triggered', { taskId });
        }
        logger.debug('✅ [CRON] Health check completed', { status: health.status });
      } catch (error: any) {
        logger.error('❌ [CRON] Health check failed', { error: error.message });
      }
    });

    // Job 5: Daily Metrics Report (9:00 AM)
    this.scheduleJob('daily-report', process.env.CRON_DAILY_REPORT || '0 9 * * *', async () => {
      logger.info('📊 [CRON] Generating daily metrics report...');
      try {
        const metrics = await this.generateMetricsReport();
        await this.sendReport(metrics);
        logger.info('✅ [CRON] Daily report completed', { metrics });
      } catch (error: any) {
        logger.error('❌ [CRON] Daily report failed', { error: error.message });
      }
    });

    logger.info('✅ Cron Scheduler started with 5 jobs');
    this.logSchedule();
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(name: string, cronExpression: string, task: () => Promise<void>) {
    const timezone = process.env.CRON_TIMEZONE || 'Asia/Singapore';

    const options: ScheduleOptions = {
      scheduled: true,
      timezone,
    };

    const job = cron.schedule(cronExpression, task, options);

    this.jobs.set(name, job);
    logger.info(`📅 Scheduled job: ${name} (${cronExpression}) [${timezone}]`);
  }

  /**
   * Stop all scheduled jobs
   */
  async stop() {
    if (!this.enabled) return;

    logger.info('🛑 Stopping Cron Scheduler...');
    for (const [name, job] of this.jobs.entries()) {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    }
    this.jobs.clear();
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    critical: boolean;
    issue?: string;
  }> {
    // Basic health check - can be enhanced with actual metrics
    try {
      // Check if we can access basic system resources
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      if (heapUsedPercent > 90) {
        return {
          status: 'critical',
          critical: true,
          issue: `High memory usage: ${heapUsedPercent.toFixed(1)}%`,
        };
      }

      if (heapUsedPercent > 75) {
        return {
          status: 'degraded',
          critical: false,
          issue: `Elevated memory usage: ${heapUsedPercent.toFixed(1)}%`,
        };
      }

      return { status: 'healthy', critical: false };
    } catch (error: any) {
      return {
        status: 'critical',
        critical: true,
        issue: `Health check error: ${error.message}`,
      };
    }
  }

  /**
   * Generate daily metrics report
   */
  private async generateMetricsReport() {
    // Collect metrics from orchestrator if available
    if (this.orchestrator) {
      const tasks = this.orchestrator.getAllTasks();
      const completed = tasks.filter((t) => t.status === 'completed').length;
      const failed = tasks.filter((t) => t.status === 'failed').length;
      const pending = tasks.filter((t) => t.status === 'pending').length;

      return {
        timestamp: new Date().toISOString(),
        agentTasks: {
          total: tasks.length,
          completed,
          failed,
          pending,
        },
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      };
    }

    return {
      timestamp: new Date().toISOString(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * Send report via configured channels
   */
  private async sendReport(metrics: any) {
    // Log the report (can be extended to send to Slack/Email)
    logger.info('📊 Daily Metrics Report', { metrics });

    // TODO: Implement Slack webhook integration
    // TODO: Implement email integration
  }

  /**
   * Log current schedule
   */
  private logSchedule() {
    logger.info('📅 Active Cron Jobs:');
    logger.info('  - Nightly Self-Healing: Daily at 2:00 AM');
    logger.info('  - Auto-Test Generation: Daily at 3:00 AM');
    logger.info('  - Weekly PR Creation: Sunday at 4:00 AM');
    logger.info('  - Health Check: Every 15 minutes');
    logger.info('  - Daily Report: Daily at 9:00 AM');
  }

  /**
   * Get status of scheduler
   */
  getStatus() {
    return {
      enabled: this.enabled,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }

  /**
   * Get job status for monitoring
   */
  getJobStatus() {
    return Array.from(this.jobs.entries()).map(([name, job]) => ({
      name,
      running: true, // cron-scheduler doesn't expose running state directly
    }));
  }

  /**
   * Get orchestrator for external access
   */
  getOrchestrator(): AgentOrchestrator | null {
    return this.orchestrator;
  }
}

// Singleton instance
let cronScheduler: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler {
  if (!cronScheduler) {
    cronScheduler = new CronScheduler();
  }
  return cronScheduler;
}
