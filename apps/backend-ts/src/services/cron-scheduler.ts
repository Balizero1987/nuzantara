/**
 * Cron Scheduler for AI Automation
 *
 * Manages automated jobs for:
 * - AI health check (every hour)
 */

import cron from 'node-cron';
import logger from './logger.js';

export class CronScheduler {
  private jobs: Map<string, any> = new Map();
  private isRunning = false;

  /**
   * Start all cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Cron scheduler already running');
      return;
    }

    logger.info('🕐 Starting AI automation cron scheduler...');

    // Health check (every hour) - monitors AI agents
    this.scheduleJob('ai-health-check', '0 * * * *', async () => {
      try {
        const { openRouterClient } = await import('./ai/openrouter-client.js');

        const stats = openRouterClient.getStats();

        // Log stats
        logger.info('🏥 AI Automation Health Check', stats);

        // Warn if approaching limits
        if (stats.callsThisHour > 80) {
          logger.warn(`⚠️  Approaching hourly rate limit: ${stats.callsThisHour}/100`);
        }

        if (stats.costToday > 0.8) {
          logger.warn(`⚠️  Approaching daily budget: $${stats.costToday.toFixed(2)}/$${stats.dailyBudget}`);
        }

        if (stats.circuitBreakerOpen) {
          logger.error('🚨 Circuit breaker is OPEN - AI automation paused');
        }

      } catch (error) {
        logger.error('❌ Health check failed', error instanceof Error ? error : new Error(String(error)));
      }
    });

    this.isRunning = true;
    logger.info(`✅ Cron scheduler started with ${this.jobs.size} jobs`);
    this.listJobs();
  }

  /**
   * Stop all cron jobs
   */
  stop() {
    logger.info('🛑 Stopping cron scheduler...');

    for (const [name, task] of this.jobs) {
      task.stop();
      logger.info(`Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.isRunning = false;

    logger.info('✅ Cron scheduler stopped');
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(
    name: string,
    schedule: string,
    callback: () => Promise<void>
  ): void {
    const task = cron.schedule(
      schedule,
      async () => {
        logger.info(`⏰ Running cron job: ${name}`);
        const startTime = Date.now();

        try {
          await callback();
          const duration = Date.now() - startTime;
          logger.info(`✅ Cron job completed: ${name} (${duration}ms)`);
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`❌ Cron job failed: ${name} (${duration}ms)`, error instanceof Error ? error : new Error(String(error)));
        }
      },
      {
        timezone: 'UTC' // Use UTC for reliability
      }
    );

    this.jobs.set(name, task);
    logger.info(`📅 Scheduled job: ${name} (${schedule})`);
  }

  /**
   * List all scheduled jobs
   */
  listJobs(): void {
    logger.info(`\n📋 Scheduled Jobs (${this.jobs.size}):`);
    for (const name of this.jobs.keys()) {
      logger.info(`  - ${name}`);
    }
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys())
    };
  }

  /**
   * Get the orchestrator instance
   */
  getOrchestrator(): any {
    return this.getOrchestrator();
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
