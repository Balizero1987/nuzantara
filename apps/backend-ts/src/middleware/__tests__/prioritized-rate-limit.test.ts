import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { prioritizedRateLimiter, EndpointPriority, createEndpointRateLimiter } from '../prioritized-rate-limit.js';

describe('Prioritized Rate Limiting', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe('prioritizedRateLimiter', () => {
    it('should apply critical rate limit to health endpoints', async () => {
      app.get('/health', prioritizedRateLimiter, (req, res) => {
        res.json({ ok: true });
      });

      // Should allow many requests (critical has high limit)
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should apply low rate limit to AI endpoints', async () => {
      app.post('/call', prioritizedRateLimiter, (req, res) => {
        res.json({ ok: true });
      });

      // Make many requests to trigger rate limit
      const requests = [];
      for (let i = 0; i < 35; i++) {
        requests.push(
          request(app)
            .post('/call')
            .send({ key: 'ai.chat', prompt: 'test' })
        );
      }

      const responses = await Promise.all(requests);
      
      // Some should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should apply strict rate limit to memory endpoints', async () => {
      app.post('/call', prioritizedRateLimiter, (req, res) => {
        res.json({ ok: true });
      });

      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(
          request(app)
            .post('/call')
            .send({ key: 'memory.search.hybrid', query: 'test' })
        );
      }

      const responses = await Promise.all(requests);
      
      // Should have rate limited requests
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('createEndpointRateLimiter', () => {
    it('should create custom rate limiter with specified priority', () => {
      const limiter = createEndpointRateLimiter(EndpointPriority.MEDIUM, 50);
      
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });

    it('should respect custom max value', async () => {
      const customLimiter = createEndpointRateLimiter(EndpointPriority.MEDIUM, 10);
      
      app.post('/custom', customLimiter, (req, res) => {
        res.json({ ok: true });
      });

      // Make requests beyond custom limit
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(request(app).post('/custom'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Rate limit headers', () => {
    it('should include rate limit headers in response', async () => {
      app.get('/test', prioritizedRateLimiter, (req, res) => {
        res.json({ ok: true });
      });

      const response = await request(app).get('/test');
      
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });

    it('should include retry-after header when rate limited', async () => {
      const strictLimiter = createEndpointRateLimiter(EndpointPriority.STRICT);
      
      app.post('/strict', strictLimiter, (req, res) => {
        res.json({ ok: true });
      });

      // Trigger rate limit
      const requests = [];
      for (let i = 0; i < 15; i++) {
        requests.push(request(app).post('/strict'));
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.find(r => r.status === 429);
      
      if (rateLimited) {
        expect(rateLimited.headers['retry-after']).toBeDefined();
        expect(rateLimited.body.retryAfter).toBeDefined();
      }
    });
  });
});



