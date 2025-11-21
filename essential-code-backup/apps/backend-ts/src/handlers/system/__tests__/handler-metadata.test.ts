import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Handler Metadata', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../handler-metadata.js');
  });

  describe('HANDLER_REGISTRY', () => {
    it('should export HANDLER_REGISTRY', () => {
      expect(handlers.HANDLER_REGISTRY).toBeDefined();
      expect(typeof handlers.HANDLER_REGISTRY).toBe('object');
    });

    it('should have handler entries in registry', () => {
      const registry = handlers.HANDLER_REGISTRY;
      expect(Object.keys(registry).length).toBeGreaterThan(0);

      // Check structure of a handler entry
      const firstKey = Object.keys(registry)[0];
      const handler = registry[firstKey];

      expect(handler).toBeDefined();
      expect(handler.key).toBeDefined();
      expect(handler.category).toBeDefined();
      expect(handler.description).toBeDefined();
    });

    it('should have handlers with required properties', () => {
      const registry = handlers.HANDLER_REGISTRY;

      Object.values(registry).forEach((handler: any) => {
        expect(handler).toHaveProperty('key');
        expect(handler).toHaveProperty('category');
        expect(handler).toHaveProperty('description');
        expect(typeof handler.key).toBe('string');
        expect(typeof handler.category).toBe('string');
        expect(typeof handler.description).toBe('string');
      });
    });

    it('should have params with correct structure when present', () => {
      const registry = handlers.HANDLER_REGISTRY;

      // Find a handler with params
      const handlerWithParams = Object.values(registry).find((h: any) => h.params);

      if (handlerWithParams) {
        const params = (handlerWithParams as any).params;
        expect(typeof params).toBe('object');

        Object.values(params).forEach((param: any) => {
          expect(param).toHaveProperty('type');
          expect(param).toHaveProperty('description');
          expect(param).toHaveProperty('required');
          expect(typeof param.type).toBe('string');
          expect(typeof param.description).toBe('string');
          expect(typeof param.required).toBe('boolean');
        });
      }
    });

    it('should include common handler categories', () => {
      const registry = handlers.HANDLER_REGISTRY;
      const categories = new Set(Object.values(registry).map((h: any) => h.category));

      // Check for common categories (these should exist based on the registry)
      const expectedCategories = ['identity', 'google-workspace', 'ai', 'memory', 'communication'];
      expectedCategories.forEach((category) => {
        // At least one handler should be in this category
        const hasCategory = Array.from(categories).some(
          (c) => (c as string).includes(category) || category.includes(c as string)
        );
        expect(hasCategory).toBe(true);
      });
    });
  });
});
