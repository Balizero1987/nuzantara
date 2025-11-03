import { describe, it, expect, beforeEach } from 'vitest';
import { RouteAnalytics, type RequestMetadata } from './route-analytics.js';

describe('RouteAnalytics', () => {
  let analytics: RouteAnalytics;

  beforeEach(() => {
    analytics = new RouteAnalytics();
  });

  describe('Request Recording', () => {
    it('should record a single request', () => {
      const metadata: RequestMetadata = {
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      };

      analytics.recordRequest(metadata);

      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');
      expect(routeAnalytics).toBeDefined();
      expect(routeAnalytics?.requestCount).toBe(1);
      expect(routeAnalytics?.avgDuration).toBe(50);
    });

    it('should record multiple requests', () => {
      const metadata1: RequestMetadata = {
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      };

      const metadata2: RequestMetadata = {
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 100,
        timestamp: Date.now(),
      };

      analytics.recordRequest(metadata1);
      analytics.recordRequest(metadata2);

      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');
      expect(routeAnalytics?.requestCount).toBe(2);
      expect(routeAnalytics?.avgDuration).toBe(75);
      expect(routeAnalytics?.minDuration).toBe(50);
      expect(routeAnalytics?.maxDuration).toBe(100);
    });

    it('should track error requests', () => {
      const successMetadata: RequestMetadata = {
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      };

      const errorMetadata: RequestMetadata = {
        method: 'get',
        path: '/test',
        statusCode: 500,
        duration: 30,
        timestamp: Date.now(),
        error: true,
      };

      analytics.recordRequest(successMetadata);
      analytics.recordRequest(errorMetadata);

      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');
      expect(routeAnalytics?.requestCount).toBe(2);
      expect(routeAnalytics?.errorCount).toBe(1);
    });

    it('should track status codes', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 10,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 10,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/test',
        statusCode: 404,
        duration: 10,
        timestamp: Date.now(),
      });

      const routeAnalytics = analytics.getRouteAnalytics('get', '/test');
      expect(routeAnalytics?.statusCodes.get(200)).toBe(2);
      expect(routeAnalytics?.statusCodes.get(404)).toBe(1);
    });
  });

  describe('Analytics Summary', () => {
    it('should provide accurate summary', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/users',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'post',
        path: '/users',
        statusCode: 201,
        duration: 100,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/posts',
        statusCode: 500,
        duration: 30,
        timestamp: Date.now(),
        error: true,
      });

      const summary = analytics.getSummary();
      expect(summary.totalRequests).toBe(3);
      expect(summary.totalErrors).toBe(1);
      expect(summary.errorRate).toBeCloseTo(0.333, 2);
      expect(summary.avgResponseTime).toBeCloseTo(60, 0);
    });

    it('should identify top routes', () => {
      // Create 5 requests to /users
      for (let i = 0; i < 5; i++) {
        analytics.recordRequest({
          method: 'get',
          path: '/users',
          statusCode: 200,
          duration: 50,
          timestamp: Date.now(),
        });
      }

      // Create 2 requests to /posts
      for (let i = 0; i < 2; i++) {
        analytics.recordRequest({
          method: 'get',
          path: '/posts',
          statusCode: 200,
          duration: 50,
          timestamp: Date.now(),
        });
      }

      const summary = analytics.getSummary();
      expect(summary.topRoutes[0]?.route).toBe('GET /users');
      expect(summary.topRoutes[0]?.requests).toBe(5);
    });

    it('should identify slowest routes', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/slow',
        statusCode: 200,
        duration: 1000,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/fast',
        statusCode: 200,
        duration: 10,
        timestamp: Date.now(),
      });

      const summary = analytics.getSummary();
      expect(summary.slowestRoutes[0]?.route).toBe('GET /slow');
      expect(summary.slowestRoutes[0]?.avgDuration).toBe(1000);
    });
  });

  describe('Query Operations', () => {
    it('should get slowest routes', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/slow',
        statusCode: 200,
        duration: 500,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/fast',
        statusCode: 200,
        duration: 10,
        timestamp: Date.now(),
      });

      const slowest = analytics.getSlowestRoutes(5);
      expect(slowest).toHaveLength(2);
      expect(slowest[0]?.route).toBe('GET /slow');
    });

    it('should get most accessed routes', () => {
      for (let i = 0; i < 10; i++) {
        analytics.recordRequest({
          method: 'get',
          path: '/popular',
          statusCode: 200,
          duration: 50,
          timestamp: Date.now(),
        });
      }

      analytics.recordRequest({
        method: 'get',
        path: '/rare',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      const mostAccessed = analytics.getMostAccessedRoutes(5);
      expect(mostAccessed[0]?.route).toBe('GET /popular');
      expect(mostAccessed[0]?.requests).toBe(10);
    });

    it('should get error-prone routes', () => {
      // Route with 50% error rate
      analytics.recordRequest({
        method: 'get',
        path: '/buggy',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/buggy',
        statusCode: 500,
        duration: 50,
        timestamp: Date.now(),
        error: true,
      });

      // Route with 100% success rate
      analytics.recordRequest({
        method: 'get',
        path: '/stable',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      const errorProne = analytics.getErrorProneRoutes(5);
      expect(errorProne).toHaveLength(1);
      expect(errorProne[0]?.route).toBe('GET /buggy');
      expect(errorProne[0]?.errorRate).toBe(0.5);
    });

    it('should identify stale routes', () => {
      const oldTimestamp = Date.now() - 3600000; // 1 hour ago

      analytics.recordRequest({
        method: 'get',
        path: '/stale',
        statusCode: 200,
        duration: 50,
        timestamp: oldTimestamp,
      });

      analytics.recordRequest({
        method: 'get',
        path: '/fresh',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      const stale = analytics.getStaleRoutes(1800000); // 30 minutes
      expect(stale).toHaveLength(1);
      expect(stale[0]?.route).toBe('GET /stale');
    });
  });

  describe('Clear Operations', () => {
    it('should clear all analytics', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      expect(analytics.getAllRouteAnalytics()).toHaveLength(1);

      analytics.clear();

      expect(analytics.getAllRouteAnalytics()).toHaveLength(0);
      const summary = analytics.getSummary();
      expect(summary.totalRequests).toBe(0);
    });

    it('should clear specific route analytics', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/test1',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      analytics.recordRequest({
        method: 'get',
        path: '/test2',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      expect(analytics.getAllRouteAnalytics()).toHaveLength(2);

      const cleared = analytics.clearRoute('get', '/test1');
      expect(cleared).toBe(true);
      expect(analytics.getAllRouteAnalytics()).toHaveLength(1);
    });
  });

  describe('Export Operations', () => {
    it('should export analytics data', () => {
      analytics.recordRequest({
        method: 'get',
        path: '/test',
        statusCode: 200,
        duration: 50,
        timestamp: Date.now(),
      });

      const exported = analytics.export();

      expect(exported.timestamp).toBeDefined();
      expect(exported.uptime).toBeGreaterThanOrEqual(0);
      expect(exported.summary).toBeDefined();
      expect(exported.routes).toHaveLength(1);
    });
  });
});
