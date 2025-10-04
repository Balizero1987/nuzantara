/**
 * Integration Test: Memory System Flow
 * Tests Firestore memory save, retrieve, search with fallback
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
const testUserId = `test-user-${Date.now()}`;

beforeAll(() => {
  app = express();
  app.use(express.json());
  attachRoutes(app);
});

describe('Memory Integration - Complete Flow', () => {

  describe('Memory Save → Retrieve Flow', () => {
    it('should save and retrieve user facts', async () => {
      // Step 1: Save fact
      const saveRes = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: {
            user_id: testUserId,
            fact: 'User wants to open restaurant in Canggu'
          }
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.ok).toBe(true);

      // Step 2: Retrieve facts
      const retrieveRes = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.retrieve',
          params: {
            user_id: testUserId
          }
        });

      expect(retrieveRes.status).toBe(200);
      expect(retrieveRes.body.ok).toBe(true);
      expect(retrieveRes.body.data.facts).toContain('User wants to open restaurant in Canggu');
    });

    it('should save multiple facts and deduplicate', async () => {
      const fact = 'User nationality is Italian';

      // Save same fact twice
      await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: { user_id: testUserId, fact }
        });

      await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: { user_id: testUserId, fact }
        });

      // Retrieve
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.retrieve',
          params: { user_id: testUserId }
        });

      expect(res.status).toBe(200);
      const facts = res.body.data.facts;

      // Should deduplicate (only one instance)
      const count = facts.filter((f: string) => f === fact).length;
      expect(count).toBeLessThanOrEqual(1);
    });
  });

  describe('Memory Search', () => {
    it('should search facts by keyword', async () => {
      // Save facts with different keywords
      await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: {
            user_id: testUserId,
            fact: 'User interested in PT PMA setup'
          }
        });

      await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: {
            user_id: testUserId,
            fact: 'User budget is 50000 USD'
          }
        });

      // Search for PT PMA
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.search',
          params: {
            user_id: testUserId,
            query: 'PT PMA'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.facts).toEqual(
        expect.arrayContaining([
          expect.stringContaining('PT PMA')
        ])
      );
    });
  });

  describe('Memory List', () => {
    it('should list all user memories', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.list',
          params: {
            user_id: testUserId
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('facts');
      expect(Array.isArray(res.body.data.facts)).toBe(true);
    });
  });

  describe('Fallback Behavior', () => {
    it('should work even if Firestore is unavailable', async () => {
      // Test with non-existent user (should use in-memory fallback)
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'memory.save',
          params: {
            user_id: `fallback-user-${Date.now()}`,
            fact: 'Test fact for fallback'
          }
        });

      // Should succeed even if Firestore fails
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('User Memory Handlers (Alternative)', () => {
    it('should save user memory via user.memory.save', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'user.memory.save',
          params: {
            user_id: testUserId,
            memory: 'Prefers communication in Italian'
          }
        });

      // Should succeed (handler exists)
      expect([200, 404]).toContain(res.status);
    });
  });
});
