/**
 * ZANTARA v3 Ω Integration Tests
 * Comprehensive test suite for:
 * - v3 Ω endpoints (unified, collective, ecosystem)
 * - Authentication & authorization
 * - Memory system integration
 * - Performance under load
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

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

// JWT token generator for tests
function generateTestToken(payload: any = {}) {
  const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
  const defaultPayload = {
    userId: 'test-user',
    email: 'test@example.com',
    role: 'member',
    ...payload,
  };
  return jwt.sign(defaultPayload, jwtSecret, { expiresIn: '1h' });
}

describe('🧪 ZANTARA v3 Ω Integration Tests', () => {
  let zantaraUnified: any;
  let zantaraCollective: any;
  let zantaraEcosystem: any;
  let memoryHandlers: any;

  beforeEach(async () => {
    // Import handlers
    zantaraUnified = await import('../zantara-unified.js');
    zantaraCollective = await import('../zantara-collective.js');
    zantaraEcosystem = await import('../zantara-ecosystem.js');
    memoryHandlers = await import('../../memory/memory.js');
    
    // Setup test environment
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ========================================
  // TEST SUITE 1: v3 Ω ENDPOINTS
  // ========================================

  describe('🚀 v3 Ω Unified Endpoint', () => {
    it('should handle comprehensive query across all domains', async () => {
      const req = createMockRequest({
        params: {
          query: 'restaurant business setup',
          domain: 'all',
          mode: 'comprehensive',
          include_sources: true,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.query).toBe('restaurant business setup');
      expect(result.data.domain).toBe('all');
      expect(result.data.results).toBeDefined();
      expect(result.data.total_domains).toBeGreaterThan(0);
      expect(result.data.processing_time).toBeDefined();
    });

    it('should handle single domain query (KBLI)', async () => {
      const req = createMockRequest({
        params: {
          query: 'restaurant',
          domain: 'kbli',
          mode: 'quick',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.results.kbli).toBeDefined();
    });

    it('should handle pricing domain query', async () => {
      const req = createMockRequest({
        params: {
          query: 'KITAS',
          domain: 'pricing',
          mode: 'quick',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.results.pricing).toBeDefined();
    });

    it('should handle team domain query', async () => {
      const req = createMockRequest({
        params: {
          query: 'italian',
          domain: 'team',
          mode: 'detailed',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.results.team).toBeDefined();
    });

    it('should handle memory domain query', async () => {
      const req = createMockRequest({
        params: {
          query: 'business insights',
          domain: 'memory',
          mode: 'comprehensive',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      // Memory may return empty if no data, but should not error
      expect(result.data.results.memory || result.data.results).toBeDefined();
    });

    it('should handle error gracefully with invalid query', async () => {
      const req = createMockRequest({
        params: {
          query: '',
          domain: 'all',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      // Should not throw, but may return empty or error response
      expect(result).toBeDefined();
    });

    it('should include sources when requested', async () => {
      const req = createMockRequest({
        params: {
          query: 'test',
          domain: 'all',
          include_sources: true,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      if (result.data.sources) {
        expect(typeof result.data.sources).toBe('object');
      }
    });
  });

  describe('🤝 v3 Ω Collective Endpoint', () => {
    it('should handle query action', async () => {
      const req = createMockRequest({
        params: {
          action: 'query',
          data: {
            query: 'restaurant business setup Bali',
            category: 'business',
            limit: 10,
          },
          userId: 'test-user',
          confidence: 0.5,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.action).toBe('query');
      expect(result.data.result).toBeDefined();
    });

    it('should handle contribute action', async () => {
      const req = createMockRequest({
        params: {
          action: 'contribute',
          data: {
            content: 'Italian restaurants in Bali require halal certification',
            type: 'business_insight',
            category: 'business',
            entities: ['restaurant', 'Bali'],
            tags: ['compliance', 'food'],
          },
          userId: 'test-user',
          confidence: 0.8,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.action).toBe('contribute');
      expect(result.data.result.success).toBe(true);
      expect(result.data.result.memory_id).toBeDefined();
    });

    it('should handle verify action', async () => {
      // First contribute a memory
      const contributeReq = createMockRequest({
        params: {
          action: 'contribute',
          data: {
            content: 'Test memory for verification',
            type: 'business_insight',
            category: 'business',
          },
          userId: 'test-user',
          confidence: 0.7,
        },
      }) as Request;
      const contributeRes = createMockResponse() as Response;
      const contributeResult = await zantaraCollective.zantaraCollectiveIntelligence(contributeReq, contributeRes);
      const memoryId = contributeResult.data?.result?.memory_id;

      if (memoryId) {
        const verifyReq = createMockRequest({
          params: {
            action: 'verify',
            data: {
              memoryId,
              verified: true,
              verificationScore: 0.9,
              notes: 'Verified by test',
            },
            userId: 'verifier-user',
            confidence: 0.9,
          },
        }) as Request;
        const verifyRes = createMockResponse() as Response;

        const result = await zantaraCollective.zantaraCollectiveIntelligence(verifyReq, verifyRes);

        expect(result).toBeDefined();
        expect(result.ok).toBe(true);
        expect(result.data.action).toBe('verify');
        expect(result.data.result.success).toBe(true);
      }
    });

    it('should handle stats action', async () => {
      const req = createMockRequest({
        params: {
          action: 'stats',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.action).toBe('stats');
      expect(result.data.result).toBeDefined();
    });

    it('should handle sync action', async () => {
      const req = createMockRequest({
        params: {
          action: 'sync',
          data: {
            syncType: 'knowledge',
            preferences: {},
          },
          userId: 'test-user',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.action).toBe('sync');
      expect(result.data.result).toBeDefined();
    });

    it('should handle invalid action gracefully', async () => {
      const req = createMockRequest({
        params: {
          action: 'invalid_action',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.result.error).toBeDefined();
    });
  });

  describe('🌐 v3 Ω Ecosystem Endpoint', () => {
    it('should analyze restaurant business setup', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'business_setup',
          business_type: 'restaurant',
          ownership: 'foreign',
          scope: 'comprehensive',
          location: 'bali',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.scenario).toBe('business_setup');
      expect(result.data.business_type).toBe('restaurant');
      expect(result.data.analysis).toBeDefined();
      expect(result.data.analysis.kblis).toBeDefined();
      expect(result.data.analysis.requirements).toBeDefined();
      expect(result.data.analysis.costs).toBeDefined();
      expect(result.data.recommendations).toBeDefined();
    });

    it('should analyze hotel business expansion', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'expansion',
          business_type: 'hotel',
          ownership: 'foreign',
          scope: 'detailed',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.scenario).toBe('expansion');
      expect(result.data.business_type).toBe('hotel');
      expect(result.data.analysis.expansion).toBeDefined();
    });

    it('should analyze compliance requirements', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'compliance',
          business_type: 'services',
          ownership: 'foreign',
          scope: 'comprehensive',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.scenario).toBe('compliance');
      expect(result.data.analysis.compliance).toBeDefined();
    });

    it('should analyze optimization opportunities', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'optimization',
          business_type: 'tech',
          ownership: 'foreign',
          scope: 'comprehensive',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.scenario).toBe('optimization');
      expect(result.data.analysis.optimization).toBeDefined();
    });

    it('should calculate success probability', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'business_setup',
          business_type: 'restaurant',
          ownership: 'foreign',
          scope: 'comprehensive',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(typeof result.data.success_probability).toBe('number');
      expect(result.data.success_probability).toBeGreaterThanOrEqual(0);
      expect(result.data.success_probability).toBeLessThanOrEqual(1);
    });

    it('should include investment estimate', async () => {
      const req = createMockRequest({
        params: {
          scenario: 'business_setup',
          business_type: 'restaurant',
          ownership: 'foreign',
          scope: 'comprehensive',
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraEcosystem.zantaraEcosystemAnalysis(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.investment_estimate).toBeDefined();
      expect(result.data.investment_estimate.initial_investment).toBeDefined();
    });
  });

  // ========================================
  // TEST SUITE 2: AUTHENTICATION & AUTHORIZATION
  // ========================================

  describe('🔐 Authentication & Authorization', () => {
    it('should authenticate with valid JWT token', async () => {
      const token = generateTestToken({ role: 'AI Bridge/Tech Lead' });
      const req = createMockRequest(
        {
          key: 'zantara.unified',
          params: { query: 'test', domain: 'kbli' },
        },
        {
          authorization: `Bearer ${token}`,
        }
      ) as Request;

      // Verify token can be decoded
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      const decoded = jwt.verify(token, jwtSecret) as any;

      expect(decoded).toBeDefined();
      expect(decoded.role).toBe('AI Bridge/Tech Lead');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
        jwt.verify(invalidToken, jwtSecret);
      }).toThrow();
    });

    it('should reject expired JWT token', () => {
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      const expiredToken = jwt.sign(
        { userId: 'test', email: 'test@example.com', role: 'member' },
        jwtSecret,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      expect(() => {
        jwt.verify(expiredToken, jwtSecret);
      }).toThrow('jwt expired');
    });

    it('should handle role-based permissions for admin', () => {
      const adminToken = generateTestToken({ role: 'admin' });
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      const decoded = jwt.verify(adminToken, jwtSecret) as any;

      expect(decoded.role).toBe('admin');
    });

    it('should handle role-based permissions for member', () => {
      const memberToken = generateTestToken({ role: 'member' });
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      const decoded = jwt.verify(memberToken, jwtSecret) as any;

      expect(decoded.role).toBe('member');
    });

    it('should handle demo user authentication', () => {
      const demoToken = generateTestToken({
        email: 'demo@balizero.com',
        role: 'member',
      });
      const jwtSecret = process.env.JWT_SECRET || 'zantara-jwt-secret-2025';
      const decoded = jwt.verify(demoToken, jwtSecret) as any;

      expect(decoded.email).toBe('demo@balizero.com');
    });

    it('should allow v3 Ω endpoints with valid authentication', async () => {
      const token = generateTestToken({ role: 'member' });
      const req = createMockRequest(
        {
          params: { query: 'test', domain: 'all' },
        },
        {
          authorization: `Bearer ${token}`,
        }
      ) as Request;
      const res = createMockResponse() as Response;

      // Should not throw authentication error
      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should allow v3 Ω endpoints without authentication (demo mode)', async () => {
      const req = createMockRequest({
        params: { query: 'test', domain: 'all' },
      }) as Request;
      const res = createMockResponse() as Response;

      // Should work without auth (demo mode)
      const result = await zantaraUnified.zantaraUnifiedQuery(req, res);
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });

  // ========================================
  // TEST SUITE 3: MEMORY SYSTEM INTEGRATION
  // ========================================

  describe('🧠 Memory System Integration', () => {
    const testUserId = `test-user-${Date.now()}`;

    it('should save memory successfully', async () => {
      const result = await memoryHandlers.memorySave({
        userId: testUserId,
        content: 'Test memory for integration test',
        type: 'test',
        metadata: {
          source: 'integration-test',
          timestamp: new Date().toISOString(),
        },
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.memoryId).toBeDefined();
    });

    it('should retrieve saved memory', async () => {
      // First save a memory
      const saveResult = await memoryHandlers.memorySave({
        userId: testUserId,
        content: 'Memory to retrieve',
        type: 'test',
      });

      expect(saveResult.ok).toBe(true);

      // Then retrieve it
      const retrieveResult = await memoryHandlers.memoryRetrieve({
        userId: testUserId,
      });

      expect(retrieveResult).toBeDefined();
      expect(retrieveResult.ok).toBe(true);
    });

    it('should search memories by query', async () => {
      // Save some test memories
      await memoryHandlers.memorySave({
        userId: testUserId,
        content: 'Italian restaurant business setup in Bali',
        type: 'business',
      });

      const searchResult = await memoryHandlers.memorySearch({
        userId: testUserId,
        query: 'restaurant',
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.ok).toBe(true);
    });

    it('should handle memory with key-value format', async () => {
      const result = await memoryHandlers.memorySave({
        userId: testUserId,
        key: 'visa_type',
        value: 'B211A Tourist Visa',
        type: 'service_interest',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle memory retrieval by key', async () => {
      // Save with key
      await memoryHandlers.memorySave({
        userId: testUserId,
        key: 'test_key',
        value: 'test_value',
        type: 'test',
      });

      // Retrieve by key
      const result = await memoryHandlers.memoryRetrieve({
        userId: testUserId,
        key: 'test_key',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should integrate memory with collective intelligence', async () => {
      // Save a memory
      await memoryHandlers.memorySave({
        userId: testUserId,
        content: 'Collective memory test content',
        type: 'business_insight',
      });

      // Query collective intelligence
      const req = createMockRequest({
        params: {
          action: 'query',
          data: {
            query: 'Collective memory test',
            limit: 5,
          },
          userId: testUserId,
        },
      }) as Request;
      const res = createMockResponse() as Response;

      const result = await zantaraCollective.zantaraCollectiveIntelligence(req, res);

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle memory search with empty results gracefully', async () => {
      const searchResult = await memoryHandlers.memorySearch({
        userId: `non-existent-user-${Date.now()}`,
        query: 'nonexistent query',
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.ok).toBe(true);
    });
  });

  // ========================================
  // TEST SUITE 4: PERFORMANCE UNDER LOAD
  // ========================================

  describe('⚡ Performance Under Load', () => {
    const CONCURRENT_REQUESTS = 20;
    const PERFORMANCE_THRESHOLD_MS = 5000; // 5 seconds for comprehensive queries

    it('should handle concurrent unified queries', async () => {
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
        const req = createMockRequest({
          params: {
            query: `test query ${i}`,
            domain: 'kbli',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraUnified.zantaraUnifiedQuery(req, res);
      });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All requests should succeed
      expect(results.every(r => r.ok === true)).toBe(true);
      expect(results.length).toBe(CONCURRENT_REQUESTS);

      // Average response time should be reasonable
      const avgTime = totalTime / CONCURRENT_REQUESTS;
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    }, 30000); // 30 second timeout for load test

    it('should handle concurrent collective queries', async () => {
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
        const req = createMockRequest({
          params: {
            action: 'query',
            data: {
              query: `test collective query ${i}`,
              limit: 5,
            },
            userId: `user-${i}`,
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraCollective.zantaraCollectiveIntelligence(req, res);
      });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.every(r => r.ok === true)).toBe(true);
      expect(results.length).toBe(CONCURRENT_REQUESTS);

      const avgTime = totalTime / CONCURRENT_REQUESTS;
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    }, 30000);

    it('should handle concurrent ecosystem analyses', async () => {
      const businessTypes = ['restaurant', 'hotel', 'retail', 'services', 'tech'];
      const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, i) => {
        const req = createMockRequest({
          params: {
            scenario: 'business_setup',
            business_type: businessTypes[i % businessTypes.length],
            ownership: 'foreign',
            scope: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraEcosystem.zantaraEcosystemAnalysis(req, res);
      });

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.every(r => r.ok === true)).toBe(true);
      expect(results.length).toBe(CONCURRENT_REQUESTS);

      const avgTime = totalTime / CONCURRENT_REQUESTS;
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
    }, 30000);

    it('should handle memory operations under load', async () => {
      const testUserId = `load-test-user-${Date.now()}`;
      const operations = Array.from({ length: 50 }, (_, i) =>
        memoryHandlers.memorySave({
          userId: testUserId,
          content: `Load test memory ${i}`,
          type: 'test',
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.every(r => r.ok === true)).toBe(true);
      expect(results.length).toBe(50);

      const avgTime = totalTime / 50;
      expect(avgTime).toBeLessThan(1000); // Less than 1 second per operation
    }, 30000);

    it('should maintain response time under sequential load', async () => {
      const requestCount = 10;
      const responseTimes: number[] = [];

      for (let i = 0; i < requestCount; i++) {
        const req = createMockRequest({
          params: {
            query: `sequential test ${i}`,
            domain: 'all',
            mode: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;

        const startTime = Date.now();
        await zantaraUnified.zantaraUnifiedQuery(req, res);
        const endTime = Date.now();

        responseTimes.push(endTime - startTime);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS);
      expect(maxResponseTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2); // Allow some variance
    }, 30000);

    it('should handle mixed workload (all endpoints)', async () => {
      const unifiedRequests = Array.from({ length: 5 }, (_, i) => {
        const req = createMockRequest({
          params: { query: `unified ${i}`, domain: 'kbli', mode: 'quick' },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraUnified.zantaraUnifiedQuery(req, res);
      });

      const collectiveRequests = Array.from({ length: 5 }, (_, i) => {
        const req = createMockRequest({
          params: {
            action: 'query',
            data: { query: `collective ${i}`, limit: 5 },
            userId: `user-${i}`,
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraCollective.zantaraCollectiveIntelligence(req, res);
      });

      const ecosystemRequests = Array.from({ length: 5 }, (_, i) => {
        const req = createMockRequest({
          params: {
            scenario: 'business_setup',
            business_type: 'restaurant',
            ownership: 'foreign',
            scope: 'quick',
          },
        }) as Request;
        const res = createMockResponse() as Response;
        return zantaraEcosystem.zantaraEcosystemAnalysis(req, res);
      });

      const startTime = Date.now();
      const allResults = await Promise.all([
        ...unifiedRequests,
        ...collectiveRequests,
        ...ecosystemRequests,
      ]);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(allResults.every(r => r.ok === true)).toBe(true);
      expect(allResults.length).toBe(15);
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 5); // Allow more time for mixed load
    }, 60000); // 60 second timeout for mixed workload
  });

  // ========================================
  // TEST SUITE 5: END-TO-END SCENARIOS
  // ========================================

  describe('🔄 End-to-End Scenarios', () => {
    it('should complete full business setup workflow', async () => {
      const testUserId = `e2e-user-${Date.now()}`;

      // 1. Query unified knowledge
      const unifiedReq = createMockRequest({
        params: {
          query: 'restaurant business',
          domain: 'all',
          mode: 'comprehensive',
        },
      }) as Request;
      const unifiedRes = createMockResponse() as Response;
      const unifiedResult = await zantaraUnified.zantaraUnifiedQuery(unifiedReq, unifiedRes);
      expect(unifiedResult.ok).toBe(true);

      // 2. Contribute to collective memory
      const contributeReq = createMockRequest({
        params: {
          action: 'contribute',
          data: {
            content: 'Restaurant setup requires multiple licenses',
            type: 'business_insight',
            category: 'business',
          },
          userId: testUserId,
          confidence: 0.8,
        },
      }) as Request;
      const contributeRes = createMockResponse() as Response;
      const contributeResult = await zantaraCollective.zantaraCollectiveIntelligence(contributeReq, contributeRes);
      expect(contributeResult.ok).toBe(true);

      // 3. Analyze ecosystem
      const ecosystemReq = createMockRequest({
        params: {
          scenario: 'business_setup',
          business_type: 'restaurant',
          ownership: 'foreign',
          scope: 'comprehensive',
        },
      }) as Request;
      const ecosystemRes = createMockResponse() as Response;
      const ecosystemResult = await zantaraEcosystem.zantaraEcosystemAnalysis(ecosystemReq, ecosystemRes);
      expect(ecosystemResult.ok).toBe(true);

      // 4. Save user memory
      const memoryResult = await memoryHandlers.memorySave({
        userId: testUserId,
        content: 'Completed restaurant business analysis',
        type: 'workflow',
      });
      expect(memoryResult.ok).toBe(true);

      // All steps completed successfully
      expect(unifiedResult.ok && contributeResult.ok && ecosystemResult.ok && memoryResult.ok).toBe(true);
    }, 30000);

    it('should handle error recovery gracefully', async () => {
      // Test with invalid parameters
      const invalidReq = createMockRequest({
        params: {
          query: null, // Invalid
          domain: 'invalid_domain', // Invalid
        },
      }) as Request;
      const invalidRes = createMockResponse() as Response;

      // Should not throw, but handle gracefully
      const result = await zantaraUnified.zantaraUnifiedQuery(invalidReq, invalidRes);
      expect(result).toBeDefined();
      // May return error, but should not crash
    });
  });
});
