import { BaliZeroScraper } from './core';
import { Pool } from 'pg';
import Bull from 'bull';
import * as cron from 'node-cron';
import * as dotenv from 'dotenv';

dotenv.config();

export class ScraperOrchestrator {
  private scraper: BaliZeroScraper;
  private pool: Pool;
  private queue: Bull.Queue;

  constructor() {
    this.scraper = new BaliZeroScraper();
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Redis queue for job management
    this.queue = new Bull('scraping-queue', {
      redis: {
        port: parseInt(process.env.REDIS_PORT || '6379'),
        host: process.env.REDIS_HOST || 'localhost',
      }
    });

    this.setupQueueProcessors();
    this.setupCronJobs();
  }

  private setupQueueProcessors() {
    // Process scraping jobs with concurrency limit
    this.queue.process('scrape-source', 10, async (job) => {
      const { sourceId } = job.data;

      try {
        const result = await this.scraper.scrapeSource(sourceId);

        // Log metrics
        await this.logMetrics(sourceId, result);

        return result;
      } catch (error) {
        console.error(`Failed to scrape source ${sourceId}:`, error);
        throw error;
      }
    });

    // Queue event handlers
    this.queue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed: ${result.count} articles`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ Job ${job.id} failed:`, err.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} stalled and will be retried`);
    });
  }

  private setupCronJobs() {
    // T1 sources - every 24 hours at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🕒 Starting T1 sources scraping...');
      await this.queueSourcesByTier('T1');
    });

    // T2 sources - every 48 hours at 3 AM
    cron.schedule('0 3 */2 * *', async () => {
      console.log('🕒 Starting T2 sources scraping...');
      await this.queueSourcesByTier('T2');
    });

    // T3 sources - weekly on Mondays at 4 AM
    cron.schedule('0 4 * * 1', async () => {
      console.log('🕒 Starting T3 sources scraping...');
      await this.queueSourcesByTier('T3');
    });

    // Health check - every hour
    cron.schedule('0 * * * *', async () => {
      await this.performHealthCheck();
    });
  }

  private async queueSourcesByTier(tier: string) {
    const { rows: sources } = await this.pool.query(
      'SELECT id FROM sources WHERE tier = $1 AND active = true',
      [tier]
    );

    console.log(`📋 Queueing ${sources.length} ${tier} sources`);

    for (const source of sources) {
      await this.queue.add('scrape-source', {
        sourceId: source.id
      }, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      });
    }
  }

  private async logMetrics(sourceId: string, result: any) {
    try {
      await this.pool.query(`
        INSERT INTO scraping_metrics (
          date, source_id, articles_scraped, errors_count
        ) VALUES (CURRENT_DATE, $1, $2, $3)
      `, [
        sourceId,
        result.count || 0,
        result.success ? 0 : 1
      ]);
    } catch (err: any) {
      // Handle case where constraint doesn't exist or duplicate
      if (err.code === '23505') {
        // Unique constraint violation - update instead
        await this.pool.query(`
          UPDATE scraping_metrics
          SET articles_scraped = articles_scraped + $1,
              errors_count = errors_count + $2
          WHERE date = CURRENT_DATE AND source_id = $3
        `, [result.count || 0, result.success ? 0 : 1, sourceId]).catch(() => {});
      } else {
        console.warn('Failed to log metrics:', err.message);
      }
    }
  }

  private async performHealthCheck() {
    const stats = await this.queue.getJobCounts();
    const { rows: [metrics] } = await this.pool.query(`
      SELECT
        COUNT(DISTINCT source_id) as sources_scraped,
        SUM(articles_scraped) as total_articles,
        AVG(avg_quality_score) as avg_quality
      FROM scraping_metrics
      WHERE date = CURRENT_DATE
    `).catch(() => ({ rows: [{ sources_scraped: 0, total_articles: 0, avg_quality: 0 }] }));

    console.log('📊 Health Check:');
    console.log(`   Queue: ${stats.active} active, ${stats.waiting} waiting, ${stats.failed} failed`);
    console.log(`   Today: ${metrics.sources_scraped} sources, ${metrics.total_articles} articles`);
    console.log(`   Quality: ${metrics.avg_quality?.toFixed(1) || 'N/A'}/10`);

    // Alert if too many failures
    if (stats.failed > 10) {
      console.error('⚠️ WARNING: High failure rate detected!');
      // Send notification (email, Slack, etc.)
    }
  }

  async start() {
    await this.scraper.initialize();
    console.log('🚀 Scraper Orchestrator started');

    // Start with immediate scrape of high-priority sources
    await this.queueSourcesByTier('T1');
  }

  // Public method to scrape a source
  async scrapeSource(sourceId: string) {
    return await this.scraper.scrapeSource(sourceId);
  }

  async stop() {
    await this.queue.close();
    await this.scraper.close();
    await this.pool.end();
  }
}

