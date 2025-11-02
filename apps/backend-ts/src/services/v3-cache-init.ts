/**
 * V3 Performance Cache Initialization
 * 
 * Initialize cache system on server startup
 * Auto-warm frequently accessed queries
 */

import { initializeV3Cache, getV3Cache } from './v3-performance-cache.js';
import { initializeEnhancedCache } from './performance/enhanced-redis-cache.js';
import logger from './logger.js';

let cacheInitialized = false;

/**
 * Initialize all caching layers for V3 endpoints
 */
export async function initializeV3CacheSystem(): Promise<void> {
  if (cacheInitialized) {
    logger.info('V3 Cache system already initialized');
    return;
  }

  try {
    logger.info('🚀 Initializing V3 Performance Cache System...');

    // Initialize enhanced Redis cache (L1 + L2)
    await initializeEnhancedCache({
      l1Ttl: 60,        // 1 minute in-memory
      l2Ttl: 3600,      // 1 hour Redis
      maxL1Size: 2000,  // Increased for v3
      enableCompression: true,
      enableWarming: true,
      enableStats: true
    });

    // Initialize V3-specific cache
    await initializeV3Cache();

    cacheInitialized = true;
    logger.info('✅ V3 Performance Cache System initialized successfully');

    // Schedule periodic cache statistics logging
    setInterval(() => {
      const cache = getV3Cache();
      const metrics = cache.getMetrics();
      
      logger.info(`📊 V3 Cache Stats: ${metrics.totalQueries} queries, ${metrics.cacheHits} hits, ${(metrics.cacheHits / metrics.totalQueries * 100).toFixed(1)}% hit rate`);
    }, 300000); // Every 5 minutes

  } catch (error: any) {
    logger.error('❌ Failed to initialize V3 cache system:', error);
    // Don't throw - application should work without cache
  }
}

/**
 * Shutdown cache system gracefully
 */
export async function shutdownV3CacheSystem(): Promise<void> {
  if (!cacheInitialized) {
    return;
  }

  try {
    logger.info('Shutting down V3 cache system...');
    const cache = getV3Cache();
    await cache.shutdown();
    cacheInitialized = false;
    logger.info('✅ V3 cache system shut down successfully');
  } catch (error: any) {
    logger.error('Error shutting down V3 cache system:', error);
  }
}

/**
 * Get cache initialization status
 */
export function isV3CacheInitialized(): boolean {
  return cacheInitialized;
}
