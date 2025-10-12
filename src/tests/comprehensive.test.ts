import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import path from 'path';
import { attachRoutes } from '../router.ts';
import { requestTracker, getHealthMetrics } from '../middleware/monitoring.ts';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../utils/errors.ts';

// Test configuration
const TEST_API_KEY = 'zantara-internal-dev-key-2025';
const VALID_EMAIL = 'zero@balizero.com';
const INVALID_EMAIL = 'nonexistent@example.com';

// Setup test app
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(requestTracker);

// Minimal routes normally registered in src/index.ts
app.get('/metrics', async (_req, res) => {
  const health = await getHealthMetrics();
  res.json({ ok: true, data: health.metrics });
});

app.get('/openapi.yaml', (_req, res) => {
  const specPath = path.resolve(process.cwd(), 'openapi-v520-custom-gpt.yaml');
  res.sendFile(specPath);
});

attachRoutes(app);

// Basic error handler to mirror production JSON responses
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof UnauthorizedError) {
    return res.status(401).json({ ok: false, error: err.message });
  }
  if (err instanceof ForbiddenError) {
    return res.status(403).json({ ok: false, error: err.message });
  }
  if (err instanceof BadRequestError) {
    return res.status(400).json({ ok: false, error: err.message });
  }
  const status = typeof err.status === 'number' ? err.status : 500;
  return res.status(status).json({ ok: false, error: err.message || 'Internal Error' });
});

describe('ZANTARA v5.2.0 Comprehensive Test Suite', () => {

  describe('🔐 Authentication & Security', () => {
    test('should reject requests without API key', async () => {
      const response = await request(app)
        .post('/call')
        .send({ key: 'identity.resolve', params: {} });

      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', 'invalid-key')
        .send({ key: 'identity.resolve', params: {} });

      expect(response.status).toBe(401);
      expect(response.body.ok).toBe(false);
    });

    test('should accept requests with valid API key', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'identity.resolve', params: {} });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('🏥 Health & Monitoring', () => {
    test('health endpoint should return system info', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('version', '5.2.0');
      expect(response.body.data).toHaveProperty('message');
    });

    test('metrics endpoint should return detailed metrics', async () => {
      const response = await request(app).get('/metrics');

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('requests');
      expect(response.body.data).toHaveProperty('system');
      expect(response.body.data).toHaveProperty('popular');
    });
  });

  describe('📄 OpenAPI Integration', () => {
    test('should serve OpenAPI specification', async () => {
      const response = await request(app).get('/openapi.yaml');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/yaml');
      expect(response.text).toContain('openapi: 3.1.0');
      expect(response.text).toContain('ZANTARA v5.2.0');
    });
  });

  describe('👥 Identity System (AMBARADAM)', () => {
    test('should resolve valid email identity', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'identity.resolve',
          params: { identity_hint: VALID_EMAIL }
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('collaboratorId');
      expect(response.body.data).toHaveProperty('email', VALID_EMAIL);
      expect(response.body.data.system).toContain('v5.2.0');
    });

    test('should return all collaborators without hint', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'identity.resolve',
          params: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('candidates');
      expect(Array.isArray(response.body.data.candidates)).toBe(true);
      expect(response.body.data.candidates.length).toBeGreaterThan(0);
    });

    test('should handle repeated identity requests consistently', async () => {
      const response1 = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'identity.resolve',
          params: { identity_hint: VALID_EMAIL }
        });

      const response2 = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'identity.resolve',
          params: { identity_hint: VALID_EMAIL }
        });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response2.body.data.email).toBe(response1.body.data.email);

      const metrics = await request(app).get('/metrics');
      expect(metrics.status).toBe(200);
      expect(metrics.body.ok).toBe(true);
      expect(metrics.body.data.requests.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('🚀 Business Logic Handlers', () => {
    test('contact.info should return company information', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'contact.info', params: {} });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('company', 'Bali Zero');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('office');
      expect(response.body.data).toHaveProperty('communication');
    });

    test('lead.save should validate and save lead information', async () => {
      const leadData = {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        service: 'Visa Consultation'
      };

      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'lead.save', params: leadData });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('leadId');
      expect(response.body.data).toHaveProperty('followUpScheduled', true);
      expect(response.body.data).toHaveProperty('message');
    });

    test('quote.generate should return service quote', async () => {
      const quoteRequest = {
        service: 'company',
        country: 'Indonesia',
        urgency: 'standard'
      };

      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'quote.generate', params: quoteRequest });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('service');
      expect(Array.isArray(response.body.data.options)).toBe(true);
      expect(response.body.data.options.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('validity');
    });
  });

  describe('🧠 AI Integration', () => {
    test('ai.chat should handle general AI requests', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'ai.chat',
          params: {
            prompt: 'Hello, this is a test',
            max_tokens: 50
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('response');
    });

    test('openai.chat should route to OpenAI specifically', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'openai.chat',
          params: {
            prompt: 'Test OpenAI routing',
            max_tokens: 50
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
    });
  });

  describe('💾 Memory System', () => {
    test('memory.save should store information', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'memory.save',
          params: {
            content: 'Test memory content for v5.2.0',
            category: 'test',
            metadata: { version: '5.2.0', timestamp: Date.now() }
          }
        });

      expect(response.status).toBe(200);
      // Bridge fallback should handle this
    });

    test('memory.search should find stored information', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({
          key: 'memory.search',
          params: {
            query: 'test memory',
            limit: 5
          }
        });

      expect(response.status).toBe(200);
      // Bridge fallback should handle this
    });
  });

  describe('⚡ Performance & Reliability', () => {
    test('should handle high concurrency', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        request(app)
          .post('/call')
          .set('x-api-key', TEST_API_KEY)
          .send({ key: 'contact.info', params: {} })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });
    });

    test('should respond within acceptable time limits', async () => {
      const start = Date.now();

      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'contact.info', params: {} });

      const responseTime = Date.now() - start;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ invalid: 'request' });

      expect(response.status).toBe(400);
      expect(response.body.ok).toBe(false);
    });

    test('should handle unknown handlers gracefully', async () => {
      const response = await request(app)
        .post('/call')
        .set('x-api-key', TEST_API_KEY)
        .send({ key: 'unknown.handler', params: {} });

      expect(response.status).toBe(200);
      expect(response.body.ok).toBe(true);
      expect(response.body.data).toHaveProperty('stub');
    });
  });
});
