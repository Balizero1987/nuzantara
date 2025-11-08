/**
 * Cron Scheduler for AI Automation
 *
 * Manages automated jobs for:
 * - AI code refactoring (daily 2 AM UTC)
 * - AI test generation (daily 3 AM UTC)
 * - AI health check (every hour)
 *
 * SAFETY: All jobs include anti-loop protection
 */

import cron from 'node-cron';
import logger from './logger.js';

export class CronScheduler {
  private jobs: Map<string, cron.ScheduledTask> = new Map();
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

    // ========================================
    // AI AUTOMATION JOBS (OpenRouter)
    // ========================================

    // Daily AI Code Refactoring (2 AM UTC, uses DeepSeek Coder - FREE)
    this.scheduleJob('ai-code-refactoring', '0 2 * * *', async () => {
      logger.info('🔧 Starting daily AI code refactoring...');

      try {
        const { RefactoringAgent } = await import('../agents/refactoring-agent.js');
        const refactoringAgent = new RefactoringAgent();

        // Get tech debt hotspots (replace with actual implementation)
        const hotspots = await this.getTechDebtHotspots();

        if (hotspots.length === 0) {
          logger.info('No tech debt hotspots found, skipping refactoring');
          return;
        }

        logger.info(`Found ${hotspots.length} tech debt hotspots, processing top 5...`);

        const results = [];
        for (const hotspot of hotspots.slice(0, 5)) { // Top 5 per day (ANTI-LOOP)
          const result = await refactoringAgent.refactorFile(
            hotspot.file,
            hotspot.issues
          );
          results.push(result);
        }

        const successful = results.filter(r => r.success).length;
        const skipped = results.filter(r => r.skipped).length;

        logger.info(`✅ Daily refactoring complete: ${successful} successful, ${skipped} skipped, ${results.length - successful - skipped} failed`);

        // Log stats
        logger.info('Refactoring Agent Stats:', refactoringAgent.getStats());

      } catch (error) {
        logger.error('❌ Daily refactoring job failed', { error });
      }
    });

    // Daily Test Generation (3 AM UTC, uses Qwen 2.5 - FREE)
    this.scheduleJob('ai-test-generation', '0 3 * * *', async () => {
      logger.info('🧪 Starting daily AI test generation...');

      try {
        const { TestGeneratorAgent } = await import('../agents/test-generator-agent.js');
        const testGenerator = new TestGeneratorAgent();

        // Get untested files (replace with actual implementation)
        const untestedFiles = await this.getUntestedFiles();

        if (untestedFiles.length === 0) {
          logger.info('No untested files found, skipping test generation');
          return;
        }

        logger.info(`Found ${untestedFiles.length} untested files, processing top 10...`);

        const results = [];
        for (const file of untestedFiles.slice(0, 10)) { // Top 10 per day (ANTI-LOOP)
          const result = await testGenerator.generateTests(file);
          results.push(result);
        }

        const successful = results.filter(r => r.success).length;
        const skipped = results.filter(r => r.skipped).length;
        const avgCoverage = successful > 0
          ? results.filter(r => r.coverage).reduce((sum, r) => sum + (r.coverage || 0), 0) / successful
          : 0;

        logger.info(`✅ Test generation complete: ${successful} successful, ${skipped} skipped, avg coverage: ${avgCoverage.toFixed(1)}%`);

        // Log stats
        logger.info('Test Generator Stats:', testGenerator.getStats());

      } catch (error) {
        logger.error('❌ Daily test generation job failed', { error });
      }
    });

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
        logger.error('❌ Health check failed', { error });
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
          logger.error(`❌ Cron job failed: ${name} (${duration}ms)`, { error });
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
   * PLACEHOLDER: Get tech debt hotspots
   * TODO: Implement actual code analysis
   * Could use: eslint, sonarqube, or custom analysis
   */
  private async getTechDebtHotspots(): Promise<Array<{ file: string; issues: any[] }>> {
    // Example implementation using file complexity/size heuristics
    const fs = await import('fs');
    const path = await import('path');

    const hotspots: Array<{ file: string; issues: any[] }> = [];

    // Simple heuristic: Find large files without tests
    const srcDir = path.join(process.cwd(), 'src');

    const findLargeFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          findLargeFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lineCount = content.split('\n').length;

          // Files > 200 lines are candidates for refactoring
          if (lineCount > 200 && lineCount < 1000) {
            hotspots.push({
              file: fullPath,
              issues: [
                {
                  type: 'complexity',
                  description: `Large file (${lineCount} lines)`,
                  severity: 'medium'
                }
              ]
            });
          }
        }
      }
    };

    findLargeFiles(srcDir);

    return hotspots.slice(0, 20); // Return top 20
  }

  /**
   * PLACEHOLDER: Get untested files
   * TODO: Implement actual coverage analysis
   * Could use: jest coverage reports, istanbul, etc.
   */
  private async getUntestedFiles(): Promise<string[]> {
    const fs = await import('fs');
    const path = await import('path');

    const untestedFiles: string[] = [];
    const srcDir = path.join(process.cwd(), 'src');

    const findUntestedFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== '__tests__') {
          findUntestedFiles(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
          // Check if corresponding test file exists
          const testPath = fullPath.replace(/\.ts$/, '.test.ts');
          const testDir = path.join(path.dirname(fullPath), '__tests__');
          const testPathInDir = path.join(testDir, entry.name.replace(/\.ts$/, '.test.ts'));

          if (!fs.existsSync(testPath) && !fs.existsSync(testPathInDir)) {
            untestedFiles.push(fullPath);
          }
        }
      }
    };

    findUntestedFiles(srcDir);

    return untestedFiles.slice(0, 50); // Return top 50
 * ZANTARA Cron Scheduler for Autonomous Agents
 * Runs maintenance tasks automatically
 */

import cron, { ScheduledTask } from 'node-cron';
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

    const job = cron.schedule(cronExpression, task, {
      scheduled: true,
      timezone,
    });

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
export const cronScheduler = new CronScheduler();
let cronScheduler: CronScheduler | null = null;

export function getCronScheduler(): CronScheduler {
  if (!cronScheduler) {
    cronScheduler = new CronScheduler();
  }
  return cronScheduler;
}
