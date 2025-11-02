import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Registry Admin', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../registry-admin.js');
  });

  describe('listAllHandlers', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.listAllHandlers({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.handlers).toBeDefined();
      expect(Array.isArray(result.data.handlers)).toBe(true);
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.listAllHandlers({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });

  describe('getHandlerStats', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.getHandlerStats({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.getHandlerStats({});

      expect(result).toBeDefined();
    });
  });

  describe('listModuleHandlers', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.listModuleHandlers({
        module: 'ai-services'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.listModuleHandlers({});

      expect(result).toBeDefined();
    });
  });

  describe('searchHandlers', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.searchHandlers({
        query: 'chat'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.searchHandlers({});

      expect(result).toBeDefined();
    });
  });

});
