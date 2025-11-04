import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import {
  registerRoutes,
  defineRoutes,
  getRouteRegistry,
  getRouteAnalytics,
  resetRouterState,
  type RouteDefinition,
} from './unified-router.js';

describe('Unified Router with Guardrails', () => {
  beforeEach(() => {
    resetRouterState();
  });

  afterEach(() => {
    resetRouterState();
  });

  describe('Basic Registration', () => {
    it('should register routes without conflicts', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'get',
          path: '/health',
          handler: async () => ({ status: 'ok' }),
        },
        {
          method: 'get',
          path: '/users',
          handler: async () => ({ users: [] }),
        },
      ];

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      const registry = getRouteRegistry();
      expect(registry.getAll()).toHaveLength(2);
      expect(registry.hasErrors()).toBe(false);
    });

    it('should log warnings for route conflicts', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'get',
          path: '/users/:id',
          name: 'getUserById',
          handler: async () => ({ user: {} }),
        },
        {
          method: 'get',
          path: '/users/:userId',
          name: 'getUserByUserId',
          handler: async () => ({ user: {} }),
        },
      ];

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes, { strictMode: false }));

      const registry = getRouteRegistry();
      const conflicts = registry.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should throw in strict mode on conflicts', () => {
      const routes: RouteDefinition[] = [
        {
          method: 'get',
          path: '/test',
          handler: async () => ({ success: true }),
        },
        {
          method: 'get',
          path: '/test',
          handler: async () => ({ success: true }),
        },
      ];

      const app = express();
      app.use(express.json());

      expect(() => {
        app.use(registerRoutes(routes, { strictMode: true }));
      }).toThrow('Route registration errors');
    });
  });

  describe('Analytics Integration', () => {
    it('should track request metrics', async () => {
      const routes = defineRoutes({
        method: 'get',
        path: '/test',
        handler: async () => ({ success: true }),
      });

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes, { enableAnalytics: true }));

      // Make requests
      await supertest(app).get('/test').expect(200);
      await supertest(app).get('/test').expect(200);

      const analytics = getRouteAnalytics();
      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');

      expect(routeAnalytics?.requestCount).toBe(2);
      expect(routeAnalytics?.errorCount).toBe(0);
      expect(routeAnalytics?.avgDuration).toBeGreaterThanOrEqual(0);
    });

    it('should track error requests', async () => {
      const routes = defineRoutes({
        method: 'get',
        path: '/error',
        handler: async () => {
          throw new Error('Test error');
        },
      });

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      // Error handler
      app.use(
        (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
          res.status(500).json({ error: err.message });
        }
      );

      await supertest(app).get('/error').expect(500);

      const analytics = getRouteAnalytics();
      const routeAnalytics = analytics.getRouteAnalytics('get', '/error');

      expect(routeAnalytics?.errorCount).toBe(1);
    });

    it('should track different status codes', async () => {
      const routes = defineRoutes(
        {
          method: 'get',
          path: '/ok',
          handler: async ({ res }) => {
            res.status(200).json({ status: 'ok' });
          },
        },
        {
          method: 'get',
          path: '/created',
          handler: async ({ res }) => {
            res.status(201).json({ created: true });
          },
        }
      );

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      await supertest(app).get('/ok').expect(200);
      await supertest(app).get('/created').expect(201);

      const analytics = getRouteAnalytics();
      const okAnalytics = analytics.getRouteAnalytics('get', '/ok');
      const createdAnalytics = analytics.getRouteAnalytics('get', '/created');

      expect(okAnalytics?.statusCodes.get(200)).toBe(1);
      expect(createdAnalytics?.statusCodes.get(201)).toBe(1);
    });
  });

  describe('Registry Queries', () => {
    it('should provide route statistics', () => {
      const routes = defineRoutes(
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/users', handler: async () => ({}) },
        { method: 'get', path: '/posts', handler: async () => ({}) },
        { method: 'delete', path: '/posts/:id', handler: async () => ({}) }
      );

      const app = express();
      app.use(registerRoutes(routes));

      const registry = getRouteRegistry();
      const stats = registry.getStats();

      expect(stats.totalRoutes).toBe(4);
      expect(stats.routesByMethod['GET']).toBe(2);
      expect(stats.routesByMethod['POST']).toBe(1);
      expect(stats.routesByMethod['DELETE']).toBe(1);
    });

    it('should filter routes by method', () => {
      const routes = defineRoutes(
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/users', handler: async () => ({}) },
        { method: 'get', path: '/posts', handler: async () => ({}) }
      );

      const app = express();
      app.use(registerRoutes(routes));

      const registry = getRouteRegistry();
      const getRoutes = registry.getByMethod('get');

      expect(getRoutes).toHaveLength(2);
      expect(getRoutes.every((r) => r.method === 'get')).toBe(true);
    });
  });

  describe('Analytics Queries', () => {
    it('should get slowest routes', async () => {
      const routes = defineRoutes(
        {
          method: 'get',
          path: '/slow',
          handler: async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
            return { slow: true };
          },
        },
        {
          method: 'get',
          path: '/fast',
          handler: async () => ({ fast: true }),
        }
      );

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      await supertest(app).get('/slow').expect(200);
      await supertest(app).get('/fast').expect(200);

      const analytics = getRouteAnalytics();
      const slowest = analytics.getSlowestRoutes(5);

      expect(slowest.length).toBeGreaterThan(0);
      expect(slowest[0]?.route).toBe('GET /slow');
    });

    it('should get most accessed routes', async () => {
      const routes = defineRoutes({
        method: 'get',
        path: '/popular',
        handler: async () => ({ success: true }),
      });

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      // Make multiple requests
      for (let i = 0; i < 5; i++) {
        await supertest(app).get('/popular');
      }

      const analytics = getRouteAnalytics();
      const mostAccessed = analytics.getMostAccessedRoutes(5);

      expect(mostAccessed[0]?.route).toBe('GET /popular');
      expect(mostAccessed[0]?.requests).toBe(5);
    });

    it('should get analytics summary', async () => {
      const routes = defineRoutes(
        { method: 'get', path: '/route1', handler: async () => ({}) },
        { method: 'get', path: '/route2', handler: async () => ({}) }
      );

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes));

      await supertest(app).get('/route1');
      await supertest(app).get('/route2');

      const analytics = getRouteAnalytics();
      const summary = analytics.getSummary();

      expect(summary.totalRequests).toBe(2);
      expect(summary.avgResponseTime).toBeGreaterThanOrEqual(0);
      expect(summary.uptime).toBeGreaterThan(0);
      expect(summary.routeStats).toHaveLength(2);
    });
  });

  describe('Options Configuration', () => {
    it('should disable registry when configured', async () => {
      const routes = defineRoutes({
        method: 'get',
        path: '/test',
        handler: async () => ({ success: true }),
      });

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes, { enableRegistry: false }));

      await supertest(app).get('/test').expect(200);

      // Registry should not have tracked anything
      const registry = getRouteRegistry();
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should disable analytics when configured', async () => {
      const routes = defineRoutes({
        method: 'get',
        path: '/test',
        handler: async () => ({ success: true }),
      });

      const app = express();
      app.use(express.json());
      app.use(registerRoutes(routes, { enableAnalytics: false }));

      await supertest(app).get('/test').expect(200);

      // Analytics should not have tracked anything
      const analytics = getRouteAnalytics();
      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');
      expect(routeAnalytics).toBeUndefined();
    });
  });
});
