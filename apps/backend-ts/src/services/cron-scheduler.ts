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
        logger.error('❌ Daily refactoring job failed', error instanceof Error ? error : new Error(String(error)));
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
        logger.error('❌ Daily test generation job failed', error instanceof Error ? error : new Error(String(error)));
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
