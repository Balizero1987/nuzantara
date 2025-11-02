import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Oracle Universal', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../oracle-universal.js');
  });

  describe('oracleUniversalQuery', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          query: 'test query',
          results: []
        })
      } as Response);

      const result = await handlers.oracleUniversalQuery({
        query: 'test query',
        context: 'test context'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      const result = await handlers.oracleUniversalQuery({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });

    it('should handle invalid params', async () => {
      const result = await handlers.oracleUniversalQuery({
        invalid: 'data'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  describe('oracleCollections', () => {
    it('should handle success case', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          collections: ['collection1', 'collection2']
        })
      } as Response);

      const result = await handlers.oracleCollections();

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.collections).toBeDefined();
      expect(Array.isArray(result.data.collections)).toBe(true);
    });
  });

});
