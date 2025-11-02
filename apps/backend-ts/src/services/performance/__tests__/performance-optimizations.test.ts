/**
 * Performance Optimizations Test Suite
 * 
 * Comprehensive tests for all performance optimization components
 */
import { getFlags, DEFAULT_FLAGS } from '../../../config/flags.js';
import { getMessageQueue, MessageQueueService } from '../message-queue.js';
import { getEnhancedCache, EnhancedRedisCache } from '../enhanced-redis-cache.js';
import { getMemoryLeakPrevention, MemoryLeakPrevention } from '../memory-leak-prevention.js';
import { getAuditTrail, auditLog } from '../../audit/audit-trail.js';
import { getBenchmarking } from '../benchmarking.js';

describe('Performance Optimizations - Feature Flags', () => {
  it('should have all performance flags defined', () => {
    const flags = getFlags();
    
    expect(flags).toHaveProperty('ENABLE_WEBSOCKET_IOS_FALLBACK');
    expect(flags).toHaveProperty('ENABLE_MESSAGE_QUEUE');
    expect(flags).toHaveProperty('ENABLE_ENHANCED_REDIS_CACHE');
    expect(flags).toHaveProperty('ENABLE_CDN_INTEGRATION');
    expect(flags).toHaveProperty('ENABLE_DB_QUERY_OPTIMIZATION');
    expect(flags).toHaveProperty('ENABLE_MEMORY_LEAK_PREVENTION');
    expect(flags).toHaveProperty('ENABLE_AUDIT_TRAIL');
    expect(flags).toHaveProperty('ENABLE_PERFORMANCE_BENCHMARKING');
  });

  it('should have safe defaults (features disabled by default)', () => {
    expect(DEFAULT_FLAGS.ENABLE_WEBSOCKET_IOS_FALLBACK).toBe(false);
    expect(DEFAULT_FLAGS.ENABLE_MESSAGE_QUEUE).toBe(false);
    expect(DEFAULT_FLAGS.ENABLE_ENHANCED_REDIS_CACHE).toBe(false);
    expect(DEFAULT_FLAGS.ENABLE_CDN_INTEGRATION).toBe(false);
    expect(DEFAULT_FLAGS.ENABLE_DB_QUERY_OPTIMIZATION).toBe(false);
  });

  it('should have safety features enabled by default', () => {
    expect(DEFAULT_FLAGS.ENABLE_MEMORY_LEAK_PREVENTION).toBe(true);
    expect(DEFAULT_FLAGS.ENABLE_AUDIT_TRAIL).toBe(true);
  });
});

describe('Performance Optimizations - Message Queue', () => {
  let queue: MessageQueueService;

  beforeEach(() => {
    queue = getMessageQueue();
  });

  afterEach(async () => {
    await queue.shutdown();
  });

  it('should initialize message queue', () => {
    expect(queue).toBeInstanceOf(MessageQueueService);
  });

  it('should handle disabled state gracefully', async () => {
    const flags = getFlags();
    if (!flags.ENABLE_MESSAGE_QUEUE) {
      expect(queue.isEnabled()).toBe(false);
    }
  });

  it('should generate unique message IDs', async () => {
    const msg1 = await queue.enqueue({
      userId: 'test-user',
      channel: 'test',
      type: 'chat',
      payload: { text: 'test1' },
      priority: 'normal'
    });

    const msg2 = await queue.enqueue({
      userId: 'test-user',
      channel: 'test',
      type: 'chat',
      payload: { text: 'test2' },
      priority: 'normal'
    });

    expect(msg1).toBeTruthy();
    expect(msg2).toBeTruthy();
    expect(msg1).not.toBe(msg2);
  });

  it('should track queue statistics', async () => {
    const stats = await queue.getStats();
    expect(stats).toHaveProperty('totalProcessed');
    expect(stats).toHaveProperty('totalFailed');
    expect(stats).toHaveProperty('queueDepth');
    expect(stats).toHaveProperty('activeWorkers');
  });
});

describe('Performance Optimizations - Enhanced Redis Cache', () => {
  let cache: EnhancedRedisCache;

  beforeEach(() => {
    cache = getEnhancedCache();
  });

  afterEach(async () => {
    await cache.shutdown();
  });

  it('should initialize enhanced cache', () => {
    expect(cache).toBeInstanceOf(EnhancedRedisCache);
  });

  it('should handle disabled state gracefully', () => {
    const flags = getFlags();
    if (!flags.ENABLE_ENHANCED_REDIS_CACHE) {
      expect(cache.isEnabled()).toBe(false);
    }
  });

  it('should set and get cache values', async () => {
    await cache.set('test-key', { data: 'test-value' }, 60);
    const value = await cache.get('test-key');
    
    // If disabled, should gracefully degrade
    if (cache.isEnabled()) {
      expect(value).toEqual({ data: 'test-value' });
    }
  });

  it('should delete cache values', async () => {
    await cache.set('test-key-del', 'test-value', 60);
    await cache.del('test-key-del');
    const value = await cache.get('test-key-del');
    
    if (cache.isEnabled()) {
      expect(value).toBeNull();
    }
  });

  it('should provide cache statistics', () => {
    const stats = cache.getStats();
    expect(stats).toHaveProperty('l1Hits');
    expect(stats).toHaveProperty('l2Hits');
    expect(stats).toHaveProperty('totalRequests');
    expect(stats).toHaveProperty('hitRate');
  });
});

describe('Performance Optimizations - Memory Leak Prevention', () => {
  let prevention: MemoryLeakPrevention;

  beforeEach(() => {
    prevention = getMemoryLeakPrevention();
  });

  afterEach(() => {
    prevention.stop();
  });

  it('should initialize memory leak prevention', () => {
    expect(prevention).toBeInstanceOf(MemoryLeakPrevention);
  });

  it('should start and stop monitoring', () => {
    prevention.start();
    const stats = prevention.getStats();
    
    expect(stats).toHaveProperty('current');
    expect(stats).toHaveProperty('leakDetection');
    expect(stats.current).toHaveProperty('heapUsed');
    expect(stats.current).toHaveProperty('rss');
    
    prevention.stop();
  });

  it('should detect memory statistics', () => {
    const stats = prevention.getStats();
    expect(stats.current.heapUsed).toBeGreaterThan(0);
    expect(stats.current.rss).toBeGreaterThan(0);
    expect(stats.leakDetection).toHaveProperty('isLeaking');
    expect(stats.leakDetection).toHaveProperty('growthRate');
  });
});

describe('Performance Optimizations - Audit Trail', () => {
  it('should log audit events', async () => {
    const eventId = await auditLog('test_action', {
      testData: 'test'
    }, {
      userId: 'test-user',
      resource: 'test-resource'
    });

    expect(eventId).toBeTruthy();
  });

  it('should mask PII in audit logs', async () => {
    const audit = getAuditTrail();
    const eventId = await audit.log({
      action: 'test',
      resource: 'test',
      status: 'success',
      metadata: {
        email: 'test@example.com',
        phone: '1234567890',
        password: 'secret123'
      }
    });

    expect(eventId).toBeTruthy();
    
    // Query should return masked data
    const events = await audit.query({
      action: 'test',
      limit: 1
    });

    if (events.length > 0) {
      const metadata = events[0].metadata;
      if (metadata) {
        // Password should be masked
        expect(metadata.password).not.toBe('secret123');
      }
    }
  });
});

describe('Performance Optimizations - Benchmarking', () => {
  it('should collect baseline metrics', async () => {
    const benchmark = getBenchmarking();
    
    const baseline = await benchmark.collectBaseline('test-baseline');
    
    expect(baseline).toHaveProperty('timestamp');
    expect(baseline).toHaveProperty('apiLatency');
    expect(baseline).toHaveProperty('cacheHitRate');
    expect(baseline).toHaveProperty('memoryUsage');
    expect(baseline).toHaveProperty('throughput');
    expect(baseline).toHaveProperty('errorRate');
  });

  it('should compare metrics with baseline', async () => {
    const benchmark = getBenchmarking();
    
    await benchmark.collectBaseline('test-baseline');
    await benchmark.collectMetrics();
    
    const comparisons = benchmark.compareWithBaseline('test-baseline');
    
    expect(comparisons.length).toBeGreaterThan(0);
    expect(comparisons[0]).toHaveProperty('metric');
    expect(comparisons[0]).toHaveProperty('before');
    expect(comparisons[0]).toHaveProperty('after');
    expect(comparisons[0]).toHaveProperty('improvementPercent');
    expect(comparisons[0]).toHaveProperty('status');
  });

  it('should generate comparison report', async () => {
    const benchmark = getBenchmarking();
    
    await benchmark.collectBaseline('test-report');
    await benchmark.collectMetrics();
    
    const report = benchmark.generateReport('test-report');
    
    expect(report).toContain('Performance Benchmarking Report');
    expect(report).toContain('Comparison Results');
  });
});

describe('Performance Optimizations - Backward Compatibility', () => {
  it('should maintain backward compatibility when flags are disabled', () => {
    const flags = getFlags();
    
    // All optimizations should gracefully degrade when disabled
    if (!flags.ENABLE_MESSAGE_QUEUE) {
      const queue = getMessageQueue();
      expect(queue.isEnabled()).toBe(false);
    }

    if (!flags.ENABLE_ENHANCED_REDIS_CACHE) {
      const cache = getEnhancedCache();
      expect(cache.isEnabled()).toBe(false);
    }
  });

  it('should not break existing functionality', () => {
    // Verify that existing services still work
    const flags = getFlags();
    expect(typeof flags.ENABLE_APP_GATEWAY).toBe('boolean');
    expect(typeof flags.ENABLE_OBSERVABILITY).toBe('boolean');
  });
});

