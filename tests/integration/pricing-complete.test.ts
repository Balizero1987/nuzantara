/**
 * Integration Test: Pricing Flow
 * Tests the complete pricing system including anti-hallucination routing
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
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

describe('Pricing Integration - Complete Flow', () => {

  describe('Anti-Hallucination: AI Price Query Block', () => {
    it('should redirect price queries from ai.chat to official pricing', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'ai.chat',
          params: {
            message: 'Quanto costa un Working KITAS?'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('official_pricing_notice');
      expect(res.body.data.redirect_to).toBe('bali.zero.pricing');
      expect(res.body.data.reason).toContain('AI NON può fornire prezzi');
    });

    it('should allow ai.chat for non-price queries', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'ai.chat',
          params: {
            message: 'What is the capital of Indonesia?'
          }
        });

      expect(res.status).toBe(200);
      // Should NOT have redirect (no price keywords)
      expect(res.body.data).not.toHaveProperty('redirect_to');
    });
  });

  describe('Official Pricing Handler', () => {
    it('should return all official 2025 prices', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'all'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('official_notice');
      expect(res.body.data.official_notice).toContain('PREZZI UFFICIALI BALI ZERO 2025');
      expect(res.body.data).toHaveProperty('single_entry_visas');
      expect(res.body.data).toHaveProperty('kitas_permits');
      expect(res.body.data).toHaveProperty('disclaimer');
    });

    it('should return visa prices only when requested', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'visa'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('single_entry_visas');
      expect(res.body.data).toHaveProperty('multiple_entry_visas');
      expect(res.body.data).not.toHaveProperty('kitas_permits');
    });

    it('should return KITAS prices only when requested', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'kitas'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('kitas_permits');
      expect(res.body.data.kitas_permits).toHaveProperty('Working KITAS (E23)');
      expect(res.body.data.kitas_permits['Working KITAS (E23)']).toHaveProperty('offshore');
      expect(res.body.data.kitas_permits['Working KITAS (E23)']).toHaveProperty('onshore');
    });

    it('should search for specific service', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'all',
            specific_service: 'E23'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('search_results');
      expect(res.body.data.search_term).toBe('E23');
      // Should find Working KITAS (E23) and Freelance KITAS (E23)
    });

    it('should include contact info in all responses', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'visa'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('contact_info');
      expect(res.body.data.contact_info).toHaveProperty('email');
      expect(res.body.data.contact_info.email).toBe('info@balizero.com');
    });

    it('should include multi-language disclaimer', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: {
            service_type: 'all'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.data.disclaimer).toHaveProperty('it');
      expect(res.body.data.disclaimer).toHaveProperty('id');
      expect(res.body.data.disclaimer).toHaveProperty('en');
      expect(res.body.data.disclaimer.en).toContain('OFFICIAL');
    });
  });

  describe('Quick Price Lookup', () => {
    it('should find service by partial name', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.quick',
          params: {
            service: 'Working KITAS'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('service');
      expect(res.body.data.service.name).toContain('Working KITAS');
      expect(res.body.data).toHaveProperty('official_notice');
    });

    it('should handle service not found gracefully', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.quick',
          params: {
            service: 'NONEXISTENT_SERVICE_12345'
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data.message).toContain('non trovato');
      expect(res.body.data).toHaveProperty('contact');
    });
  });

  describe('REST Endpoint (Alternative to /call)', () => {
    // TODO: Test REST endpoint when available
    // it('should work via REST endpoint', async () => {
    //   const res = await request(app)
    //     .post('/pricing.official')
    //     .set('x-api-key', 'zantara-internal-dev-key-2025')
    //     .send({ service_type: 'visa' });
    //   expect(res.status).toBe(200);
    // });
  });

  describe('Authentication', () => {
    it('should require API key', async () => {
      const res = await request(app)
        .post('/call')
        .send({
          key: 'pricing.official',
          params: { service_type: 'all' }
        });

      // Should fail without API key
      expect([401, 403]).toContain(res.status);
    });

    it('should accept internal API key', async () => {
      const res = await request(app)
        .post('/call')
        .set('x-api-key', 'zantara-internal-dev-key-2025')
        .send({
          key: 'pricing.official',
          params: { service_type: 'all' }
        });

      expect(res.status).toBe(200);
    });
  });
});
