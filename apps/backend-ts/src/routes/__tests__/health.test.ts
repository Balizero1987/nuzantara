import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../health.js';
import { featureFlags, FeatureFlag } from '../../services/feature-flags.js';

// Mock services
jest.mock('../../services/feature-flags.js', () => ({
  featureFlags: {
    isEnabled: jest.fn(),
    getAllFlags: jest.fn().mockReturnValue({}),
  },
  FeatureFlag: {
    ENABLE_ENHANCED_POOLING: 'enable_enhanced_pooling',
    ENABLE_CIRCUIT_BREAKER: 'enable_circuit_breaker',
  },
}));

jest.mock('../../services/connection-pool.js', () => ({
  getDatabasePool: jest.fn(() => ({
    healthCheck: jest.fn().mockResolvedValue(true),
    getMetrics: jest.fn().mockReturnValue({
      total: 10,
      active: 3,
      idle: 7,
      waiting: 0,
      max: 20,
      min: 5,
    }),
  })),
}));

jest.mock('../../services/chromadb-pool.js', () => ({
  getChromaDBPool: jest.fn(() => ({
    healthCheck: jest.fn().mockResolvedValue(true),
    getLastHealthCheck: jest.fn().mockReturnValue(Date.now()),
  })),
}));

jest.mock('../../services/circuit-breaker.js', () => ({
  dbCircuitBreaker: {
    getStats: jest.fn().mockReturnValue({
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      totalRequests: 100,
      totalFailures: 2,
    }),
  },
  ragCircuitBreaker: {
    getStats: jest.fn().mockReturnValue({
      state: 'CLOSED',
      failures: 0,
    }),
  },
}));

describe('Health Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(healthRoutes);
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
      expect(response.body.data.uptime).toBeDefined();
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information', async () => {
      (featureFlags.isEnabled as jest.Mock).mockReturnValue(false);
      
      const response = await request(app).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();
    });

    it('should include database pool metrics when enabled', async () => {
      (featureFlags.isEnabled as jest.Mock).mockImplementation((flag) => {
        return flag === FeatureFlag.ENABLE_ENHANCED_POOLING;
      });
      
      const response = await request(app).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body.data.services.postgresql).toBeDefined();
    });

    it('should include circuit breaker stats when enabled', async () => {
      (featureFlags.isEnabled as jest.Mock).mockImplementation((flag) => {
        return flag === FeatureFlag.ENABLE_CIRCUIT_BREAKER;
      });
      
      const response = await request(app).get('/health/detailed');
      
      expect(response.status).toBe(200);
      expect(response.body.data.circuitBreakers).toBeDefined();
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      (featureFlags.isEnabled as jest.Mock).mockReturnValue(false);
      
      const response = await request(app).get('/health/ready');
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.ready).toBe(true);
      expect(response.body.data.checks).toBeDefined();
    });

    it('should return 503 if not ready', async () => {
      (featureFlags.isEnabled as jest.Mock).mockReturnValue(true);
      
      // Mock database health check to fail
      const { getDatabasePool } = require('../../services/connection-pool.js');
      getDatabasePool.mockReturnValueOnce({
        healthCheck: jest.fn().mockResolvedValue(false),
      });
      
      const response = await request(app).get('/health/ready');
      
      expect(response.status).toBe(503);
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app).get('/health/live');
      
      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data.alive).toBe(true);
      expect(response.body.data.pid).toBe(process.pid);
    });
  });

  describe('GET /metrics', () => {
    it('should return Prometheus metrics', async () => {
      (featureFlags.isEnabled as jest.Mock).mockReturnValue(false);
      
      const response = await request(app).get('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('process_memory_heap_used_bytes');
      expect(response.text).toContain('process_uptime_seconds');
    });

    it('should include database pool metrics when enabled', async () => {
      (featureFlags.isEnabled as jest.Mock).mockImplementation((flag) => {
        return flag === FeatureFlag.ENABLE_ENHANCED_POOLING;
      });
      
      const response = await request(app).get('/metrics');
      
      expect(response.text).toContain('db_pool');
    });

    it('should include circuit breaker metrics when enabled', async () => {
      (featureFlags.isEnabled as jest.Mock).mockImplementation((flag) => {
        return flag === FeatureFlag.ENABLE_CIRCUIT_BREAKER;
      });
      
      const response = await request(app).get('/metrics');
      
      expect(response.text).toContain('circuit_breaker');
    });
  });
});

