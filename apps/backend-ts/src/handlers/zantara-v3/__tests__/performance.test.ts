/**
 * ZANTARA v3 Ω Performance & Load Tests
 * Detailed performance testing for:
 * - Load testing with varying concurrency
 * - Response time analysis
 * - Memory usage monitoring
 * - Throughput measurements
 * - Stress testing
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';

// Mock Express request/response helpers
function createMockRequest(body: any = {}, headers: any = {}): Partial<Request> {
  return {
    body,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    ip: '127.0.0.1',
    method: 'POST',
    path: '',
  } as Partial<Request>;
}

function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

// Performance metrics collector
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // requests per second
  errors: any[];
}

function calculateMetrics(responseTimes: number[], totalTime: number, errors: any[]): PerformanceMetrics {
  const sorted = [...responseTimes].sort((a, b) => a - b);
  const successful = responseTimes.length;
  const failed = errors.length;

  return {
    totalRequests: successful + failed,
    successfulRequests: successful,
    failedRequests: failed,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0,
    minResponseTime: Math.min(...responseTimes),
    maxResponseTime: Math.max(...responseTimes),
    p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
    throughput: (successful + failed) / (totalTime / 1000), // requests per second
    errors,
  };
}

describe('⚡ ZANTARA v3 Ω Performance & Load Tests', () => {
  let zantaraUnified: any;
  let zantaraCollective: any;
  let zantaraEcosystem: any;

  beforeEach(async () => {
    zantaraUnified = await import('../zantara-unified.js');
    zantaraCollective = await import('../zantara-collective.js');
    zantaraEcosystem = await import('../zantara-ecosystem.js');
    jest.clearAllMocks();
  });

  describe('📊 Load Testing - Unified Endpoint', () => {
    it('should handle 10 concurrent requests efficiently', async () => {
      const concurrency = 10;
      const requests = Array.from({ length: concurrency }, (_, i) => {
        const req = createMockRequest({
          params: {
            query: `load test ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return { req, res, index: i };
      });

      const startTime = Date.now();
      const responseTimes: number[] = [];
      const errors: any[] = [];

      const results = await Promise.all(
        requests.map(async ({ req, res, index }) => {
          try {
            const reqStart = Date.now();
            await zantaraUnified.zantaraUnifiedQuery(req, res);
            const reqEnd = Date.now();
            responseTimes.push(reqEnd - reqStart);
            return { success: true, index };
          } catch (error: any) {
            errors.push({ index, error: error.message });
            return { success: false, index, error: error.message };
          }
        })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const metrics = calculateMetrics(responseTimes, totalTime, errors);

      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(concurrency * 0.9); // At least 90% success
      expect(metrics.avgResponseTime).toBeLessThan(2000); // Average under 2 seconds
      expect(metrics.p95).toBeLessThan(3000); // 95th percentile under 3 seconds
      expect(metrics.throughput).toBeGreaterThan(2); // At least 2 requests/second
    }, 30000);

    it('should handle 50 concurrent requests with acceptable degradation', async () => {
      const concurrency = 50;
      const requests = Array.from({ length: concurrency }, (_, i) => {
        const req = createMockRequest({
          params: {
            query: `heavy load ${i}`,
            domain: 'all',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return { req, res };
      });

      const startTime = Date.now();
      const responseTimes: number[] = [];
      const errors: any[] = [];

      await Promise.all(
        requests.map(async ({ req, res }) => {
          try {
            const reqStart = Date.now();
            await zantaraUnified.zantaraUnifiedQuery(req, res);
            const reqEnd = Date.now();
            responseTimes.push(reqEnd - reqStart);
          } catch (error: any) {
            errors.push({ error: error.message });
          }
        })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      const metrics = calculateMetrics(responseTimes, totalTime, errors);

      // With higher concurrency, we allow some degradation
      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(concurrency * 0.8); // At least 80% success
      expect(metrics.avgResponseTime).toBeLessThan(5000); // Average under 5 seconds
      expect(metrics.p95).toBeLessThan(8000); // 95th percentile under 8 seconds
    }, 60000);

    it('should handle 100 sequential requests consistently', async () => {
      const requestCount = 100;
      const responseTimes: number[] = [];
      const errors: any[] = [];

      for (let i = 0; i < requestCount; i++) {
        const req = createMockRequest({
          params: {
            query: `sequential ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;

        try {
          const startTime = Date.now();
          await zantaraUnified.zantaraUnifiedQuery(req, res);
          const endTime = Date.now();
          responseTimes.push(endTime - startTime);
        } catch (error: any) {
          errors.push({ index: i, error: error.message });
        }
      }

      const metrics = calculateMetrics(responseTimes, Date.now(), errors);

      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(requestCount * 0.95); // 95% success rate
      expect(metrics.maxResponseTime).toBeLessThan(3000); // No request should exceed 3 seconds
      
      // Sequential requests should have consistent response times
      const variance = metrics.maxResponseTime - metrics.minResponseTime;
      expect(variance).toBeLessThan(2000); // Variance under 2 seconds
    }, 120000); // 2 minute timeout for sequential test
  });

  describe('📈 Throughput Analysis', () => {
    it('should achieve minimum throughput of 5 requests/second for quick queries', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let requestCount = 0;
      const responseTimes: number[] = [];

      while (Date.now() - startTime < duration) {
        const req = createMockRequest({
          params: {
            query: `throughput test ${requestCount}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;

        const reqStart = Date.now();
        await zantaraUnified.zantaraUnifiedQuery(req, res);
        const reqEnd = Date.now();
        responseTimes.push(reqEnd - reqStart);

        requestCount++;
      }

      const actualDuration = Date.now() - startTime;
      const throughput = (requestCount / actualDuration) * 1000; // requests per second

      expect(throughput).toBeGreaterThanOrEqual(5); // At least 5 req/s
    }, 10000);

    it('should handle burst traffic (10 requests in 1 second)', async () => {
      const burstSize = 10;
      const startTime = Date.now();

      const requests = Array.from({ length: burstSize }, (_, i) => {
        const req = createMockRequest({
          params: {
            query: `burst ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraUnified.zantaraUnifiedQuery(req, res);
      });

      await Promise.all(requests);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // All requests complete within 5 seconds
    }, 10000);
  });

  describe('💾 Memory Usage Monitoring', () => {
    it('should not have significant memory leaks during load', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const req = createMockRequest({
          params: {
            query: `memory test ${i}`,
            domain: 'all',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        await zantaraUnified.zantaraUnifiedQuery(req, res);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be less than 50MB for 50 requests
      expect(memoryIncreaseMB).toBeLessThan(50);
    }, 30000);

    it('should handle large response payloads efficiently', async () => {
      const req = createMockRequest({
        params: {
          query: 'comprehensive business analysis',
          domain: 'all',
          mode: 'comprehensive',
          include_sources: true,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const startTime = Date.now();
      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);
      const endTime = Date.now();

      const responseTime = endTime - startTime;

      expect(result.ok).toBe(true);
      expect(responseTime).toBeLessThan(5000); // Even comprehensive should complete in 5 seconds
    }, 10000);
  });

  describe('🔥 Stress Testing', () => {
    it('should handle sustained load for 30 seconds', async () => {
      const duration = 30000; // 30 seconds
      const startTime = Date.now();
      let requestCount = 0;
      let errorCount = 0;

      while (Date.now() - startTime < duration) {
        const req = createMockRequest({
          params: {
            query: `stress test ${requestCount}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;

        try {
          await zantaraUnified.zantaraUnifiedQuery(req, res);
          requestCount++;
        } catch (error) {
          errorCount++;
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const actualDuration = Date.now() - startTime;
      const errorRate = errorCount / (requestCount + errorCount);

      // Error rate should be less than 5%
      expect(errorRate).toBeLessThan(0.05);
      // Should process at least 10 requests in 30 seconds
      expect(requestCount).toBeGreaterThanOrEqual(10);
    }, 45000); // 45 second timeout

    it('should recover gracefully after error spikes', async () => {
      // First, send some valid requests
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest({
          params: {
            query: `valid ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        await zantaraUnified.zantaraUnifiedQuery(req, res);
      }

      // Send some requests with potential issues
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest({
          params: {
            query: '', // Empty query might cause issues
            domain: 'all',
            mode: 'comprehensive',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        
        // Should not throw, but handle gracefully
        try {
          await zantaraUnified.zantaraUnifiedQuery(req, res);
        } catch (error) {
          // Errors are acceptable for invalid inputs
        }
      }

      // System should still work after errors
      const recoveryReq = createMockRequest({
        params: {
          query: 'recovery test',
          domain: 'kbli',
          mode: 'quick',
        },
      }) as Request;
      const recoveryRes = createMockResponse() as Response;
      const recoveryResult = await zantaraUnified.zantaraUnifiedQuery(recoveryReq, recoveryRes);

      expect(recoveryResult.ok).toBe(true);
    }, 30000);
  });

  describe('⏱️ Response Time Benchmarks', () => {
    it('should respond to quick queries within 500ms (p95)', async () => {
      const responseTimes: number[] = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const req = createMockRequest({
          params: {
            query: `benchmark ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;

        const startTime = Date.now();
        await zantaraUnified.zantaraUnifiedQuery(req, res);
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

      expect(p95).toBeLessThan(500);
    }, 15000);

    it('should respond to comprehensive queries within 3s (p95)', async () => {
      const responseTimes: number[] = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const req = createMockRequest({
          params: {
            query: `comprehensive benchmark ${i}`,
            domain: 'all',
            mode: 'comprehensive',
            include_sources: true,
          },
        }) as Request;
        const res = createMockResponse() as Response;

        const startTime = Date.now();
        await zantaraUnified.zantaraUnifiedQuery(req, res);
        const endTime = Date.now();
        responseTimes.push(endTime - startTime);
      }

      const sorted = [...responseTimes].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

      expect(p95).toBeLessThan(3000);
    }, 60000);
  });

  describe('🔄 Mixed Workload Performance', () => {
    it('should handle mixed endpoint workloads efficiently', async () => {
      const workload = [
        // Unified queries
        ...Array.from({ length: 5 }, () => ({
          type: 'unified',
          req: createMockRequest({
            params: { query: 'test', domain: 'kbli', mode: 'quick' },
          }) as Request,
          res: createMockResponse() as Response,
          handler: zantaraUnified.zantaraUnifiedQuery,
        })),
        // Collective queries
        ...Array.from({ length: 5 }, () => ({
          type: 'collective',
          req: createMockRequest({
            params: {
              action: 'query',
              data: { query: 'test', limit: 5 },
              userId: 'test-user',
            },
          }) as Request,
          res: createMockResponse() as Response,
          handler: zantaraCollective.zantaraCollectiveIntelligence,
        })),
        // Ecosystem analyses
        ...Array.from({ length: 5 }, () => ({
          type: 'ecosystem',
          req: createMockRequest({
            params: {
              scenario: 'business_setup',
              business_type: 'restaurant',
              ownership: 'foreign',
              scope: 'quick',
            },
          }) as Request,
          res: createMockResponse() as Response,
          handler: zantaraEcosystem.zantaraEcosystemAnalysis,
        })),
      ];

      const startTime = Date.now();
      const responseTimes: number[] = [];
      const errors: any[] = [];

      await Promise.all(
        workload.map(async ({ req, res, handler, type }) => {
          try {
            const reqStart = Date.now();
            await handler(req, res);
            const reqEnd = Date.now();
            responseTimes.push(reqEnd - reqStart);
          } catch (error: any) {
            errors.push({ type, error: error.message });
          }
        })
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const metrics = calculateMetrics(responseTimes, totalTime, errors);

      expect(metrics.successfulRequests).toBeGreaterThanOrEqual(14); // At least 14/15 successful
      expect(metrics.avgResponseTime).toBeLessThan(3000); // Average under 3 seconds
      expect(metrics.throughput).toBeGreaterThan(3); // At least 3 requests/second
    }, 60000);
  });
});
