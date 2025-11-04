import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

describe('Memory', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../memory.js');
  });

  describe('memorySave', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.memorySave({
        userId: 'test-user',
        data: 'Test memory data',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.memorySave({})).rejects.toThrow(BadRequestError);
      await expect(handlers.memorySave({})).rejects.toThrow('userId is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.memorySave({
          userId: 'test-user',
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('memorySearch', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.memorySearch({
        userId: 'test-user',
        query: 'test query',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.memorySearch({})).rejects.toThrow(BadRequestError);
      await expect(handlers.memorySearch({})).rejects.toThrow('userId is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.memorySearch({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('memoryRetrieve', () => {
    it('should handle success case with valid params', async () => {
      // First save some memory
      await handlers.memorySave({
        userId: 'test-user-retrieve',
        data: 'Test data',
      });

      const result = await handlers.memoryRetrieve({
        userId: 'test-user-retrieve',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.memory).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.memoryRetrieve({})).rejects.toThrow(BadRequestError);
      await expect(handlers.memoryRetrieve({})).rejects.toThrow('userId is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.memoryRetrieve({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
