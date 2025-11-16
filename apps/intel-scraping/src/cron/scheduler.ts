// src/cron/scheduler.ts
import * as cron from 'node-cron';
import { ScraperOrchestrator } from '../scraper/orchestrator';
import { AIPipeline } from '../ai/pipeline';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

export class CronScheduler {
  private orchestrator: ScraperOrchestrator;
  private aiPipeline: AIPipeline | null = null;
  private pool: Pool;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.orchestrator = new ScraperOrchestrator();
    
    if (process.env.OPENROUTER_API_KEY) {
      this.aiPipeline = new AIPipeline({
        openRouterApiKey: process.env.OPENROUTER_API_KEY,
        maxArticlesPerSynthesis: 5,
        minQualityScore: 7,
        translateIndonesian: true,
        generateImages: true
      });
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  setupJobs() {
    console.log('⏰ Setting up cron jobs...');

    // SCRAPING JOBS
    // T1 Sources - Every 24 hours at 2 AM
    this.jobs.set('scrape-t1', cron.schedule('0 2 * * *', async () => {
      console.log('🕒 Starting T1 scraping...');
      await this.scrapeByTier('T1');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // T2 Sources - Every 48 hours at 3 AM
    this.jobs.set('scrape-t2', cron.schedule('0 3 */2 * *', async () => {
      console.log('🕒 Starting T2 scraping...');
      await this.scrapeByTier('T2');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // T3 Sources - Weekly on Monday at 4 AM
    this.jobs.set('scrape-t3', cron.schedule('0 4 * * 1', async () => {
      console.log('🕒 Starting T3 scraping...');
      await this.scrapeByTier('T3');
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // AI PROCESSING JOBS
    // Process articles every 6 hours
    if (this.aiPipeline) {
      this.jobs.set('ai-process', cron.schedule('0 */6 * * *', async () => {
        console.log('🤖 Starting AI processing...');
        await this.processAllCategories();
      }, { scheduled: true }));
    }

    // MAINTENANCE JOBS
    // Clean old articles - Daily at 1 AM
    this.jobs.set('cleanup', cron.schedule('0 1 * * *', async () => {
      console.log('🧹 Cleaning old articles...');
      await this.cleanupOldArticles();
    }, { scheduled: true }));

    // Generate daily report - Every day at 9 AM
    this.jobs.set('daily-report', cron.schedule('0 9 * * *', async () => {
      console.log('📊 Generating daily report...');
      await this.generateDailyReport();
    }, { scheduled: true, timezone: 'Asia/Jakarta' }));

    // Health check - Every hour
    this.jobs.set('health-check', cron.schedule('0 * * * *', async () => {
      await this.performHealthCheck();
    }, { scheduled: true }));

    console.log(`✅ ${this.jobs.size} cron jobs scheduled`);
  }

  private async scrapeByTier(tier: string) {
    try {
      const { rows: sources } = await this.pool.query(
        'SELECT id FROM sources WHERE tier = $1 AND active = true',
        [tier]
      );

      console.log(`📋 Scraping ${sources.length} ${tier} sources`);

      for (const source of sources) {
        await this.orchestrator.scrapeSource(source.id);
      }

      // Log metrics
      await this.pool.query(`
        INSERT INTO scraping_metrics (date, category, articles_scraped)
        VALUES (CURRENT_DATE, $1, $2)
      `, [tier, sources.length]);

    } catch (error) {
      console.error(`Scraping failed for ${tier}:`, error);
    }
  }

  private async processAllCategories() {
    if (!this.aiPipeline) {
      console.log('⚠️ AI Pipeline not configured');
      return;
    }

    try {
      const categories = ['immigration', 'business', 'tax', 'property', 'bali_news', 'ai_indonesia', 'finance'];
      
      for (const category of categories) {
        await this.aiPipeline.processCategory(category);
      }
    } catch (error) {
      console.error('AI processing failed:', error);
    }
  }

  private async cleanupOldArticles() {
    try {
      // Delete raw articles older than 30 days
      const { rowCount } = await this.pool.query(`
        DELETE FROM raw_articles
        WHERE
          scraped_date < NOW() - INTERVAL '30 days'
          AND processed = true
      `);

      console.log(`🗑️ Deleted ${rowCount} old raw articles`);

      // Note: processed_articles table doesn't have archived column in current schema
      // This would need to be added in a migration if needed

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  private async generateDailyReport() {
    try {
      const report: any = {};

      // Yesterday's metrics
      const { rows: [yesterday] } = await this.pool.query(`
        SELECT
          SUM(articles_scraped)::INTEGER as scraped,
          SUM(articles_processed)::INTEGER as processed,
          SUM(articles_published)::INTEGER as published,
          SUM(errors_count)::INTEGER as errors
        FROM scraping_metrics
        WHERE date = CURRENT_DATE - INTERVAL '1 day'
      `);

      report.yesterday = yesterday;

      // Top articles
      const { rows: topArticles } = await this.pool.query(`
        SELECT title, category, view_count
        FROM processed_articles
        WHERE published_date > NOW() - INTERVAL '24 hours'
        ORDER BY view_count DESC
        LIMIT 5
      `);

      report.topArticles = topArticles;

      // Cost summary
      if (this.aiPipeline) {
        const aiStats = this.aiPipeline.getClient().getUsageStats();
        report.costs = {
          ai: aiStats.totalCost || 0,
          images: 0 // Would need image client stats
        };
      }

      console.log('📈 Daily Report:', JSON.stringify(report, null, 2));

      // Send via email/Slack/webhook
      await this.sendReport(report);

    } catch (error) {
      console.error('Report generation failed:', error);
    }
  }

  private async performHealthCheck() {
    const health: any = {
      timestamp: new Date().toISOString(),
      services: {}
    };

    // Check database
    try {
      await this.pool.query('SELECT 1');
      health.services.database = 'healthy';
    } catch {
      health.services.database = 'unhealthy';
    }

    // Check AI service
    if (this.aiPipeline) {
      try {
        // Quick test with cheapest model
        await this.aiPipeline.getClient().complete('test', undefined, { maxTokens: 1 });
        health.services.ai = 'healthy';
      } catch {
        health.services.ai = 'unhealthy';
      }
    }

    // Log any issues
    if (Object.values(health.services).includes('unhealthy')) {
      console.error('⚠️ Health check failed:', health);
      // Send alert
    }
  }

  private async sendReport(report: any) {
    // Implement webhook/email/Slack notification
    if (process.env.WEBHOOK_URL) {
      try {
        await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      } catch (error) {
        console.error('Failed to send report:', error);
      }
    }
  }

  start() {
    this.setupJobs();
  }

  stop() {
    for (const [name, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job: ${name}`);
    }
    this.pool.end();
  }
}

