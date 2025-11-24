/**
 * Performance Cache Optimizer
 *
 * Redis-based caching system to fix 30s+ timeout issues
 * Implements parallel query execution and intelligent caching
 */

import { redisClient } from '../redis-client.js';
import logger from '../logger.js';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix: string;
  enabled: boolean;
}

export interface QueryResult {
  data: any;
  cached: boolean;
  queryTime: number;
  cacheKey?: string;
}

export class CacheOptimizer {
  private static instance: CacheOptimizer;
  private cacheConfigs: Map<string, CacheConfig> = new Map();

  static getInstance(): CacheOptimizer {
    if (!CacheOptimizer.instance) {
      CacheOptimizer.instance = new CacheOptimizer();
    }
    return CacheOptimizer.instance;
  }

  constructor() {
    // Configure cache settings for different query types
    this.cacheConfigs.set('pricing', { ttl: 1800, keyPrefix: 'pricing:', enabled: true }); // 30 min
    this.cacheConfigs.set('team', { ttl: 7200, keyPrefix: 'team:', enabled: true }); // 2 hours
    this.cacheConfigs.set('legal', { ttl: 86400, keyPrefix: 'legal:', enabled: true }); // 24 hours
    this.cacheConfigs.set('rag_query', { ttl: 600, keyPrefix: 'rag:', enabled: true }); // 10 min
    this.cacheConfigs.set('business_setup', { ttl: 1800, keyPrefix: 'biz:', enabled: true }); // 30 min
  }

  /**
   * Get cached result or execute query
   */
  async cachedQuery<T>(
    queryType: string,
    queryKey: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<QueryResult> {
    const config = this.cacheConfigs.get(queryType);
    if (!config || !config.enabled) {
      // Cache disabled, execute directly
      const startTime = Date.now();
      const data = await queryFn();
      return {
        data,
        cached: false,
        queryTime: Date.now() - startTime,
      };
    }

    const cacheKey = `${config.keyPrefix}${queryKey}`;
    const startTime = Date.now();

    try {
      // Try to get from cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        logger.debug(`🎯 Cache HIT: ${queryType}:${queryKey}`);
        return {
          data,
          cached: true,
          queryTime: Date.now() - startTime,
          cacheKey,
        };
      }

      // Cache miss, execute query
      logger.debug(`❌ Cache MISS: ${queryType}:${queryKey}`);
      const data = await queryFn();

      // Store in cache
      const cacheTTL = ttl || config.ttl;
      await redisClient.setex(cacheKey, cacheTTL, JSON.stringify(data));

      return {
        data,
        cached: false,
        queryTime: Date.now() - startTime,
        cacheKey,
      };
    } catch (error) {
      logger.error(`Cache query failed for ${queryType}:${queryKey}`, error instanceof Error ? error : new Error(String(error)));
      // Fallback to direct execution
      const data = await queryFn();
      return {
        data,
        cached: false,
        queryTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute multiple queries in parallel with caching
   */
  async parallelQueries<T>(
    queries: Array<{
      type: string;
      key: string;
      fn: () => Promise<T>;
      ttl?: number;
    }>
  ): Promise<QueryResult[]> {
    const startTime = Date.now();

    logger.info(`🚀 Executing ${queries.length} queries in parallel...`);

    // Execute all queries in parallel
    const results = await Promise.all(
      queries.map((query) => this.cachedQuery(query.type, query.key, query.fn, query.ttl))
    );

    const totalTime = Date.now() - startTime;
    const cacheHits = results.filter((r) => r.cached).length;

    logger.info(
      `✅ Parallel queries completed: ${totalTime}ms, ${cacheHits}/${queries.length} cache hits`
    );

    return results;
  }

  /**
   * Invalidate cache for a specific type
   */
  async invalidateCache(queryType: string, pattern?: string): Promise<void> {
    const config = this.cacheConfigs.get(queryType);
    if (!config) return;

    try {
      const searchPattern = pattern ? `${config.keyPrefix}${pattern}*` : `${config.keyPrefix}*`;

      const keys = await (redisClient as any).keys(searchPattern);
      if (keys.length > 0) {
        await (redisClient as any).del(...keys);
        logger.info(`🗑️ Cache invalidated: ${keys.length} keys for ${queryType}`);
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache for ${queryType}`, error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    try {
      const stats: any = {};

      for (const [type, config] of this.cacheConfigs) {
        const keys = await (redisClient as any).keys(`${config.keyPrefix}*`);
        stats[type] = {
          enabled: config.enabled,
          ttl: config.ttl,
          cachedKeys: keys.length,
          prefix: config.keyPrefix,
        };
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get cache stats', error instanceof Error ? error : new Error(String(error)));
      return {};
    }
  }

  /**
   * Warm up cache with common queries
   */
  async warmupCache(
    queryWarmups: Array<{
      type: string;
      key: string;
      fn: () => Promise<any>;
    }>
  ): Promise<void> {
    logger.info(`🔥 Warming up cache with ${queryWarmups.length} queries...`);

    for (const warmup of queryWarmups) {
      try {
        await this.cachedQuery(warmup.type, warmup.key, warmup.fn);
      } catch (error) {
        logger.warn(`Cache warmup failed for ${warmup.type}:${warmup.key}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    logger.info('✅ Cache warmup completed');
  }
}

// Export singleton
export const cacheOptimizer = CacheOptimizer.getInstance();
