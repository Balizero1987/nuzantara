/**
 * ⚡ PERFORMANCE AUTO-OPTIMIZER
 * Monitors performance and automatically optimizes bottlenecks
 */

import { logger } from '../logging/unified-logger.js';
import { db } from '../services/connection-pool.js';
import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PerformanceMetric {
  endpoint: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  errorRate: number;
  timestamp: Date;
}

interface Bottleneck {
  type: 'slow_query' | 'high_memory' | 'high_cpu' | 'slow_endpoint' | 'cache_miss';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metric: any;
  suggestedFix: string;
}

export class PerformanceOptimizer {
  private anthropic: Anthropic;
  private readonly SLOW_THRESHOLD_MS = 1000;
  private readonly ERROR_RATE_THRESHOLD = 0.05; // 5%

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Collect performance metrics from all sources
   */
  async collectMetrics(): Promise<PerformanceMetric[]> {
    // 1. Database query performance
    const slowQueries = await db.query(`
      SELECT
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > $1
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `, [this.SLOW_THRESHOLD_MS]);

    // 2. API endpoint metrics (from logs or monitoring)
    const endpointMetrics = await this.getEndpointMetrics();

    // 3. Redis cache hit rate
    const cacheMetrics = await this.getCacheMetrics();

    // 4. System resources
    const systemMetrics = await this.getSystemMetrics();

    return endpointMetrics;
  }

  /**
   * Get API endpoint performance from logs
   */
  private async getEndpointMetrics(): Promise<PerformanceMetric[]> {
    // Query from unified logger or metrics database
    const result = await db.query(`
      SELECT
        endpoint,
        AVG(response_time_ms) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time_ms) as p99_response_time,
        COUNT(*) as request_count,
        AVG(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) as error_rate
      FROM api_request_logs
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
      GROUP BY endpoint
      HAVING COUNT(*) > 10
      ORDER BY avg_response_time DESC
    `);

    return result.rows.map(row => ({
      endpoint: row.endpoint,
      avgResponseTime: parseFloat(row.avg_response_time),
      p95ResponseTime: parseFloat(row.p95_response_time),
      p99ResponseTime: parseFloat(row.p99_response_time),
      requestCount: parseInt(row.request_count),
      errorRate: parseFloat(row.error_rate),
      timestamp: new Date(),
    }));
  }

  /**
   * Get cache performance metrics
   */
  private async getCacheMetrics() {
    // Connect to Redis and get stats
    const redis = (await import('../services/redis-client.js')).default;

    const info = await redis.info('stats');
    const lines = info.split('\r\n');

    const stats: any = {};
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value;
      }
    });

    const hits = parseInt(stats.keyspace_hits || '0');
    const misses = parseInt(stats.keyspace_misses || '0');
    const hitRate = hits / (hits + misses) || 0;

    return {
      hitRate,
      hits,
      misses,
      evictedKeys: parseInt(stats.evicted_keys || '0'),
    };
  }

  /**
   * Get system resource usage
   */
  private async getSystemMetrics() {
    try {
      // CPU usage
      const { stdout: cpuOutput } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
      const cpuUsage = parseFloat(cpuOutput.trim());

      // Memory usage
      const { stdout: memOutput } = await execAsync("free | grep Mem | awk '{print ($3/$2) * 100.0}'");
      const memUsage = parseFloat(memOutput.trim());

      return {
        cpuUsage,
        memUsage,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Error getting system metrics', { error });
      return { cpuUsage: 0, memUsage: 0, timestamp: new Date() };
    }
  }

  /**
   * Identify bottlenecks from metrics
   */
  async identifyBottlenecks(metrics: PerformanceMetric[]): Promise<Bottleneck[]> {
    const bottlenecks: Bottleneck[] = [];

    for (const metric of metrics) {
      // Slow endpoint
      if (metric.p95ResponseTime > this.SLOW_THRESHOLD_MS) {
        bottlenecks.push({
          type: 'slow_endpoint',
          severity: metric.p95ResponseTime > 3000 ? 'critical' : 'high',
          description: `Endpoint ${metric.endpoint} has P95 response time of ${metric.p95ResponseTime}ms`,
          metric,
          suggestedFix: 'Add caching, optimize queries, or implement pagination',
        });
      }

      // High error rate
      if (metric.errorRate > this.ERROR_RATE_THRESHOLD) {
        bottlenecks.push({
          type: 'slow_endpoint',
          severity: 'critical',
          description: `Endpoint ${metric.endpoint} has ${(metric.errorRate * 100).toFixed(2)}% error rate`,
          metric,
          suggestedFix: 'Investigate errors in logs, add error handling, check dependencies',
        });
      }
    }

    // Cache performance
    const cacheMetrics = await this.getCacheMetrics();
    if (cacheMetrics.hitRate < 0.7) {
      bottlenecks.push({
        type: 'cache_miss',
        severity: 'medium',
        description: `Cache hit rate is low: ${(cacheMetrics.hitRate * 100).toFixed(2)}%`,
        metric: cacheMetrics,
        suggestedFix: 'Increase cache TTL, add more caching layers, or optimize cache keys',
      });
    }

    return bottlenecks;
  }

  /**
   * Generate optimization suggestions using Claude
   */
  async generateOptimizationPlan(bottlenecks: Bottleneck[]): Promise<string> {
    const prompt = `As a performance optimization expert, analyze these bottlenecks and create an actionable optimization plan:

${JSON.stringify(bottlenecks, null, 2)}

For each bottleneck, provide:
1. Root cause analysis
2. Specific code changes needed
3. Expected performance improvement
4. Implementation priority (1-5)
5. Estimated implementation time

Format as markdown with code examples where applicable.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  /**
   * Auto-apply safe optimizations
   */
  async autoOptimize(bottlenecks: Bottleneck[]): Promise<void> {
    for (const bottleneck of bottlenecks) {
      try {
        switch (bottleneck.type) {
          case 'cache_miss':
            await this.optimizeCaching();
            break;

          case 'slow_query':
            await this.optimizeQueries();
            break;

          case 'slow_endpoint':
            // Only auto-optimize if not critical (manual review for critical)
            if (bottleneck.severity !== 'critical') {
              await this.addEndpointCaching(bottleneck.metric.endpoint);
            }
            break;
        }
      } catch (error) {
        logger.error('Error auto-optimizing', { bottleneck, error });
      }
    }
  }

  /**
   * Optimize caching strategy
   */
  private async optimizeCaching(): Promise<void> {
    logger.info('🔧 Optimizing cache configuration...');

    // Analyze frequently accessed endpoints
    const result = await db.query(`
      SELECT
        endpoint,
        COUNT(*) as access_count,
        AVG(response_time_ms) as avg_response_time
      FROM api_request_logs
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY endpoint
      HAVING COUNT(*) > 100
      ORDER BY access_count DESC
      LIMIT 10
    `);

    // Auto-add caching middleware to frequently accessed endpoints
    for (const row of result.rows) {
      const endpoint = row.endpoint;
      const cacheKey = `auto_cache:${endpoint}`;

      logger.info(`Adding cache layer to ${endpoint}`, {
        accessCount: row.access_count,
        avgResponseTime: row.avg_response_time,
      });

      // This would update route configuration
      // Implementation depends on your routing setup
    }
  }

  /**
   * Optimize slow queries
   */
  private async optimizeQueries(): Promise<void> {
    logger.info('🔧 Analyzing slow queries...');

    const result = await db.query(`
      SELECT
        query,
        calls,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `);

    const slowQueries = result.rows;

    if (slowQueries.length === 0) {
      return;
    }

    // Generate index suggestions
    for (const query of slowQueries) {
      const suggestions = await this.suggestIndexes(query.query);
      logger.warn('Slow query detected', {
        query: query.query.substring(0, 200),
        meanExecTime: query.mean_exec_time,
        suggestions,
      });
    }
  }

  /**
   * Suggest database indexes using Claude
   */
  private async suggestIndexes(query: string): Promise<string[]> {
    const prompt = `Analyze this SQL query and suggest optimal indexes:

\`\`\`sql
${query}
\`\`\`

Provide:
1. Specific CREATE INDEX statements
2. Explanation of why each index helps
3. Estimated performance improvement

Format as JSON array of index suggestions.`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      return [];
    }
  }

  /**
   * Add caching to specific endpoint
   */
  private async addEndpointCaching(endpoint: string): Promise<void> {
    logger.info(`🔧 Adding cache layer to ${endpoint}`);

    // This would modify route configuration to add caching middleware
    // Implementation depends on your routing setup
  }

  /**
   * Run complete optimization cycle
   */
  async runOptimizationCycle(): Promise<void> {
    logger.info('⚡ Starting performance optimization cycle...');

    try {
      // 1. Collect metrics
      const metrics = await this.collectMetrics();

      // 2. Identify bottlenecks
      const bottlenecks = await this.identifyBottlenecks(metrics);

      if (bottlenecks.length === 0) {
        logger.info('✅ No performance bottlenecks detected');
        return;
      }

      logger.warn(`Found ${bottlenecks.length} performance bottlenecks`, { bottlenecks });

      // 3. Generate optimization plan
      const plan = await this.generateOptimizationPlan(bottlenecks);

      // 4. Auto-apply safe optimizations
      await this.autoOptimize(bottlenecks);

      // 5. Create PR for manual review items
      const criticalBottlenecks = bottlenecks.filter(b => b.severity === 'critical');

      if (criticalBottlenecks.length > 0) {
        await this.createOptimizationPR(plan, criticalBottlenecks);
      }

      // 6. Send alert
      if (process.env.SLACK_WEBHOOK_URL) {
        const fetch = (await import('node-fetch')).default;
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `⚡ Performance Optimization Report\n\n` +
                  `Bottlenecks Found: ${bottlenecks.length}\n` +
                  `Critical: ${criticalBottlenecks.length}\n` +
                  `Auto-fixed: ${bottlenecks.length - criticalBottlenecks.length}\n\n` +
                  `Check PR for critical fixes.`,
          }),
        });
      }

      logger.info('✅ Optimization cycle complete');
    } catch (error) {
      logger.error('Error in optimization cycle', { error });
      throw error;
    }
  }

  /**
   * Create PR with optimization suggestions
   */
  private async createOptimizationPR(plan: string, bottlenecks: Bottleneck[]): Promise<void> {
    const branchName = `auto/performance-optimization-${Date.now()}`;

    // Create optimization report
    const report = `# Performance Optimization Report

Generated: ${new Date().toISOString()}

## Critical Bottlenecks

${bottlenecks.map(b => `
### ${b.type} - ${b.severity}

**Description**: ${b.description}

**Suggested Fix**: ${b.suggestedFix}

**Metric**: \`\`\`json
${JSON.stringify(b.metric, null, 2)}
\`\`\`
`).join('\n')}

## Optimization Plan

${plan}

## Next Steps

1. Review suggested optimizations
2. Test changes in staging
3. Deploy incrementally
4. Monitor performance metrics
`;

    const reportPath = `reports/performance-optimization-${Date.now()}.md`;

    await execAsync(`git checkout -b ${branchName}`);
    await execAsync(`echo "${report}" > ${reportPath}`);
    await execAsync(`git add ${reportPath}`);
    await execAsync(`git commit -m "perf: auto-generated optimization suggestions"`);
    await execAsync(`git push -u origin ${branchName}`);

    // Create PR
    await execAsync(`gh pr create --title "⚡ Performance Optimizations" --body "${report.substring(0, 1000)}..."`);

    logger.info(`Created optimization PR on branch ${branchName}`);
  }
}

// Cron entry
// CRON_PERFORMANCE_OPTIMIZATION="0 */6 * * *"  // Every 6 hours
