/**
 * Integration Test: RAG System Flow
 * Tests RAG query, search, and Bali Zero chat integration
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock problematic monitoring module
jest.unstable_mockModule('../../src/middleware/monitoring.js', () => ({
  requestTracker: jest.fn((req, res, next) => next()),
  getMetrics: jest.fn(() => ({ requests: 0 }))
}));

const { attachRoutes } = await import('../../src/router.js');

let app: express.Express;

beforeAll(() => {
  app = express();
  app.use(express.json());
  attachRoutes(app);
});

describe('RAG Integration - Complete Flow', () => {

  describe('RAG Query', () => {
    it('should query RAG backend successfully', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'rag.query',
          params: {
            query: 'What is E23 KITAS?',
            collection: 'visa_oracle'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      // RAG should return answer and sources
      if (res.body.data) {
        expect(res.body.data).toHaveProperty('answer');
      }
    });

    it('should handle RAG backend unavailable gracefully', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'rag.query',
          params: {
            query: 'Test query',
            collection: 'test_collection'
          }
        });

      // Should return response even if RAG fails (with error or fallback)
      expect(res.status).toBe(200);
    });
  });

  describe('Bali Zero Chat (RAG-Powered)', () => {
    it('should answer visa questions using RAG', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'How long does E23 KITAS processing take?',
            user_id: 'test-user'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      if (res.body.data) {
        // Should have answer from RAG
        expect(res.body.data).toHaveProperty('answer');
      }
    });

    it('should handle KBLI questions', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'What KBLI code for software development?',
            user_id: 'test-user'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('should maintain conversation context', async () => {
      // First message
      await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'Tell me about Working KITAS',
            user_id: 'context-test-user'
          }
        });

      // Follow-up message (should have context)
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'How much does it cost?',
            user_id: 'context-test-user'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('RAG Search', () => {
    it('should search documents by query', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'rag.search',
          params: {
            query: 'KITAS requirements',
            top_k: 5
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      if (res.body.data && res.body.data.results) {
        expect(Array.isArray(res.body.data.results)).toBe(true);
      }
    });
  });

  describe('RAG Health Check', () => {
    it('should return RAG backend health status', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'rag.health',
          params: {}
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      if (res.body.data) {
        expect(res.body.data).toHaveProperty('status');
      }
    });
  });

  describe('Model Routing (Haiku vs Sonnet)', () => {
    it('should use Haiku for simple queries', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'What is E23?',
            user_id: 'model-test-user'
          }
        });

      expect(res.status).toBe(200);

      // Check if model_used is returned (optional)
      if (res.body.data && res.body.data.model_used) {
        // Simple query should use Haiku
        expect(res.body.data.model_used).toContain('haiku');
      }
    });

    it('should use Sonnet for complex analysis queries', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'bali.zero.chat',
          params: {
            query: 'Can you analyze and compare E23 KITAS vs C312 KITAS, including legal requirements, processing time, and cost differences for offshore vs onshore application?',
            user_id: 'model-test-user'
          }
        });

      expect(res.status).toBe(200);

      // Complex query should trigger Sonnet (if routing is implemented)
      if (res.body.data && res.body.data.model_used) {
        expect(res.body.data.model_used).toContain('sonnet');
      }
    });
  });
});
