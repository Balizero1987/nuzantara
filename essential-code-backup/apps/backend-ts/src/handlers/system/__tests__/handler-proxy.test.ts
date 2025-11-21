import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock router.getHandler - must be defined before any imports
const mockHandler = jest.fn().mockResolvedValue({ ok: true, data: { test: 'result' } });
const mockGetHandler = jest.fn().mockResolvedValue(mockHandler);

// Mock the entire router module including dynamic imports
jest.mock('../../../routing/router.js', () => {
  const actualRouter = jest.requireActual('../../../routing/router.js');
  return {
    ...actualRouter,
    getHandler: jest.fn().mockImplementation(async (key: string) => {
      return mockGetHandler(key);
    }),
  };
});

describe('Handler Proxy', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset mocks before each test
    mockGetHandler.mockResolvedValue(mockHandler);
    mockHandler.mockResolvedValue({ ok: true, data: { test: 'result' } });
    // Re-import to get fresh module instance
    handlers = await import('../handler-proxy.js');
  });

  describe('executeHandler', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.executeHandler({
        handler_key: 'test.handler',
        handler_params: { test: 'data' },
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.handler).toBe('test.handler');
      expect(result.data.executed).toBe(true);
      expect(mockGetHandler).toHaveBeenCalledWith('test.handler');
      expect(mockHandler).toHaveBeenCalledWith({ test: 'data' }, undefined);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.executeHandler({})).rejects.toThrow(BadRequestError);
      await expect(handlers.executeHandler({})).rejects.toThrow('handler_key is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.executeHandler({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should handle non-existent handler', async () => {
      mockGetHandler.mockResolvedValueOnce(null);

      const result = await handlers.executeHandler({
        handler_key: 'nonexistent.handler',
        handler_params: {},
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should handle handler execution errors', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      mockGetHandler.mockResolvedValueOnce(errorHandler);

      const result = await handlers.executeHandler({
        handler_key: 'error.handler',
        handler_params: {},
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Handler execution failed');
    });
  });

  describe('executeBatchHandlers', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.executeBatchHandlers({
        handlers: [
          { key: 'test.handler1', params: { param1: 'value1' } },
          { key: 'test.handler2', params: { param2: 'value2' } },
        ],
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.executed).toBe(2);
      expect(result.data.results).toBeDefined();
      expect(result.data.results.length).toBe(2);
      expect(mockGetHandler).toHaveBeenCalledTimes(2);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.executeBatchHandlers({})).rejects.toThrow(BadRequestError);
      await expect(handlers.executeBatchHandlers({})).rejects.toThrow('handlers array is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.executeBatchHandlers({
          handlers: 'not-an-array',
        })
      ).rejects.toThrow(BadRequestError);

      await expect(
        handlers.executeBatchHandlers({
          handlers: [],
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should handle handler failures in batch', async () => {
      const errorHandler = jest.fn().mockRejectedValue(new Error('Handler error'));
      mockGetHandler.mockResolvedValueOnce(mockHandler).mockResolvedValueOnce(errorHandler);

      const result = await handlers.executeBatchHandlers({
        handlers: [
          { key: 'success.handler', params: {} },
          { key: 'error.handler', params: {} },
        ],
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.results.length).toBe(2);
      expect(result.data.results[0].ok).toBe(true);
      expect(result.data.results[1].ok).toBe(false);
    });
  });
});
