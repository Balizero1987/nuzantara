import { Pool } from 'pg';

export const ALERT_RULES = {
  // Source Health
  sourceDown: {
    condition: 'source.lastScraped < NOW() - INTERVAL "48 hours"',
    severity: 'warning',
    message: 'Source {name} has not been scraped in 48+ hours',
    action: 'notify'
  },

  // Cost Alerts
  highCost: {
    condition: 'daily.cost > 5.00',
    severity: 'warning',
    message: 'Daily cost exceeded $5 threshold: ${cost}',
    action: 'notify'
  },

  // Performance
  slowProcessing: {
    condition: 'processing.avgTime > 5000',
    severity: 'warning',
    message: 'Average processing time > 5s',
    action: 'notify'
  },

  // Queue
  queueBacklog: {
    condition: 'queue.waiting > 500',
    severity: 'critical',
    message: 'Queue backlog critical: {count} jobs waiting',
    action: 'alert'
  },

  // Error Rate
  highErrors: {
    condition: 'errors.rate > 10',
    severity: 'critical',
    message: 'High error rate detected: {rate}%',
    action: 'alert'
  }
};

export class AlertManager {
  private pool: Pool;
  private alertHistory: any[] = [];

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async checkAlerts(): Promise<any[]> {
    const alerts: any[] = [];

    // Check source health
    const sourceAlerts = await this.checkSourceHealth();
    alerts.push(...sourceAlerts);

    // Check costs
    const costAlerts = await this.checkCosts();
    alerts.push(...costAlerts);

    // Check performance
    const perfAlerts = await this.checkPerformance();
    alerts.push(...perfAlerts);

    // Check error rates
    const errorAlerts = await this.checkErrorRates();
    alerts.push(...errorAlerts);

    // Store alerts
    this.alertHistory.push(...alerts);

    return alerts;
  }

  private async checkSourceHealth(): Promise<any[]> {
    const alerts: any[] = [];

    const { rows } = await this.pool.query(`
      SELECT id, name, last_scraped
      FROM sources
      WHERE active = true
        AND (last_scraped < NOW() - INTERVAL '48 hours' OR last_scraped IS NULL)
      LIMIT 10
    `);

    for (const source of rows) {
      alerts.push({
        type: 'warning',
        severity: 'warning',
        message: `Source ${source.name} has not been scraped in 48+ hours`,
        source: source.id,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private async checkCosts(): Promise<any[]> {
    const alerts: any[] = [];

    const { rows: [costs] } = await this.pool.query(`
      SELECT SUM(total_cost)::NUMERIC as daily_cost
      FROM scraping_metrics
      WHERE date = CURRENT_DATE
    `);

    const dailyCost = Number(costs.daily_cost) || 0;

    if (dailyCost > 5.00) {
      alerts.push({
        type: 'warning',
        severity: 'warning',
        message: `Daily cost exceeded $5 threshold: $${dailyCost.toFixed(2)}`,
        cost: dailyCost,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private async checkPerformance(): Promise<any[]> {
    const alerts: any[] = [];

    const { rows: [perf] } = await this.pool.query(`
      SELECT
        AVG(scraping_duration_seconds)::NUMERIC as avg_time
      FROM scraping_metrics
      WHERE date = CURRENT_DATE
    `);

    const avgTime = Number(perf.avg_time) || 0;

    if (avgTime > 5000) {
      alerts.push({
        type: 'warning',
        severity: 'warning',
        message: `Average processing time > 5s: ${(avgTime / 1000).toFixed(1)}s`,
        avgTime,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  private async checkErrorRates(): Promise<any[]> {
    const alerts: any[] = [];

    const { rows: [errors] } = await this.pool.query(`
      SELECT
        SUM(errors_count)::INTEGER as total_errors,
        SUM(articles_scraped)::INTEGER as total_scraped
      FROM scraping_metrics
      WHERE date = CURRENT_DATE
    `);

    const totalErrors = Number(errors.total_errors) || 0;
    const totalScraped = Number(errors.total_scraped) || 1;
    const errorRate = (totalErrors / totalScraped) * 100;

    if (errorRate > 10) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `High error rate detected: ${errorRate.toFixed(1)}%`,
        errorRate,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  getAlertHistory(limit: number = 50): any[] {
    return this.alertHistory.slice(-limit);
  }

  clearAlertHistory() {
    this.alertHistory = [];
  }
}

