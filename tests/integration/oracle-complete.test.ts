/**
 * Integration Test: Oracle System Flow
 * Tests oracle simulation, analysis, and prediction handlers
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

describe('Oracle Integration - Complete Flow', () => {

  describe('Oracle Simulation', () => {
    it('should simulate visa application scenario', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'oracle.simulate',
          params: {
            scenario: 'visa_application',
            service_type: 'E23 KITAS',
            user_profile: {
              nationality: 'Italian',
              current_status: 'tourist',
              employment: 'remote worker'
            }
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('simulation_result');
    });

    it('should simulate PT PMA setup scenario', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'oracle.simulate',
          params: {
            scenario: 'company_setup',
            company_type: 'PT PMA',
            business_sector: 'technology'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  describe('Oracle Analysis', () => {
    it('should analyze user situation', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'oracle.analyze',
          params: {
            user_situation: 'I want to start a business in Bali',
            budget: '50000 USD',
            timeline: '3 months'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('analysis');
    });
  });

  describe('Oracle Prediction', () => {
    it('should predict timeline and costs', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'oracle.predict',
          params: {
            service: 'Working KITAS',
            variables: {
              processing_location: 'offshore',
              urgency: 'normal'
            }
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('prediction');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing parameters gracefully', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'oracle.simulate',
          params: {}
        });

      // Should either succeed with default scenario or return validation error
      expect([200, 400]).toContain(res.status);
    });
  });
});
