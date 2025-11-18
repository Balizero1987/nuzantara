import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Advisory', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../advisory.js');
  });

  describe('documentPrepare', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.documentPrepare({
        service: 'visa',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.checklist).toBeDefined();
      expect(result.data.required).toBeDefined();
      expect(Array.isArray(result.data.required)).toBe(true);
    });

    it('should handle missing required params', async () => {
      const result = await handlers.documentPrepare({});
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      // Defaults to 'visa' when no service specified
      expect(result.data.checklist).toContain('Visa');
    });

    it('should handle invalid params', async () => {
      const result = await handlers.documentPrepare({
        service: 'invalid-service',
      });
      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      // Falls back to 'visa' for unrecognized services
      expect(result.data.checklist).toContain('Visa');
    });
  });

  describe('assistantRoute', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.assistantRoute({
        intent: 'visa',
        inquiry: 'I need help with visa application',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.intent).toBeDefined();
      expect(result.data.message).toBeDefined();
    });

    it('should handle missing required params (all optional)', async () => {
      const result = await handlers.assistantRoute({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle invalid params', async () => {
      const result = await handlers.assistantRoute({
        intent: 'invalid-intent',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });
});
