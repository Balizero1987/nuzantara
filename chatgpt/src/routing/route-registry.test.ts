import { describe, it, expect, beforeEach } from 'vitest';
import { RouteRegistry, ConflictType } from './route-registry.js';
import type { RouteDefinition } from './unified-router.js';

describe('RouteRegistry', () => {
  let registry: RouteRegistry;

  beforeEach(() => {
    registry = new RouteRegistry();
  });

  describe('Route Registration', () => {
    it('should register a single route', () => {
      const route: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({ success: true }),
      };

      registry.register(route);

      expect(registry.has('get', '/test')).toBe(true);
      expect(registry.getAll()).toHaveLength(1);
    });

    it('should register multiple routes', () => {
      const routes: RouteDefinition[] = [
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/users', handler: async () => ({}) },
        { method: 'get', path: '/posts', handler: async () => ({}) },
      ];

      registry.registerMany(routes);

      expect(registry.getAll()).toHaveLength(3);
    });

    it('should filter routes by method', () => {
      const routes: RouteDefinition[] = [
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/users', handler: async () => ({}) },
        { method: 'get', path: '/posts', handler: async () => ({}) },
      ];

      registry.registerMany(routes);

      const getRoutes = registry.getByMethod('get');
      expect(getRoutes).toHaveLength(2);
      expect(getRoutes.every((r) => r.method === 'get')).toBe(true);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect exact duplicate routes', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      const conflicts = registry.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]?.type).toBe(ConflictType.EXACT_DUPLICATE);
      expect(conflicts[0]?.severity).toBe('error');
    });

    it('should detect ambiguous patterns', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/users/:id',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'get',
        path: '/users/:userId',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      const conflicts = registry.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some((c) => c.type === ConflictType.AMBIGUOUS)).toBe(true);
    });

    it('should not conflict on different methods', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'post',
        path: '/test',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      const errors = registry.getConflictsBySeverity('error');
      expect(errors).toHaveLength(0);
    });

    it('should allow different paths', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/users',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'get',
        path: '/posts',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      const conflicts = registry.getConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const routes: RouteDefinition[] = [
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/users', handler: async () => ({}) },
        { method: 'get', path: '/posts', handler: async () => ({}) },
      ];

      registry.registerMany(routes);

      const stats = registry.getStats();
      expect(stats.totalRoutes).toBe(3);
      expect(stats.routesByMethod['GET']).toBe(2);
      expect(stats.routesByMethod['POST']).toBe(1);
    });

    it('should detect errors in validation', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      expect(registry.hasErrors()).toBe(true);

      expect(() => registry.validate()).toThrow('Route registration errors');
    });
  });

  describe('Route Information', () => {
    it('should extract parameter names', () => {
      const route: RouteDefinition = {
        method: 'get',
        path: '/users/:userId/posts/:postId',
        handler: async () => ({}),
      };

      registry.register(route);

      const info = registry.get('get', '/users/:userId/posts/:postId');
      expect(info?.params).toEqual(['userId', 'postId']);
    });

    it('should normalize patterns', () => {
      const route1: RouteDefinition = {
        method: 'get',
        path: '/users/:id',
        handler: async () => ({}),
      };

      const route2: RouteDefinition = {
        method: 'get',
        path: '/posts/:postId',
        handler: async () => ({}),
      };

      registry.register(route1);
      registry.register(route2);

      const info1 = registry.get('get', '/users/:id');
      const info2 = registry.get('get', '/posts/:postId');

      expect(info1?.pattern).toBe('/users/:*');
      expect(info2?.pattern).toBe('/posts/:*');
    });
  });

  describe('Clear Operations', () => {
    it('should clear all routes', () => {
      const routes: RouteDefinition[] = [
        { method: 'get', path: '/users', handler: async () => ({}) },
        { method: 'post', path: '/posts', handler: async () => ({}) },
      ];

      registry.registerMany(routes);
      expect(registry.getAll()).toHaveLength(2);

      registry.clear();
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should clear conflicts on clear', () => {
      const route: RouteDefinition = {
        method: 'get',
        path: '/test',
        handler: async () => ({}),
      };

      registry.register(route);
      registry.register(route); // Duplicate

      expect(registry.getConflicts()).toHaveLength(1);

      registry.clear();
      expect(registry.getConflicts()).toHaveLength(0);
    });
  });
});
