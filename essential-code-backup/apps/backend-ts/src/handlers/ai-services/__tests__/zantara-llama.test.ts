import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock global fetch for RAG backend calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Zantara Llama', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../zantara-llama.js');
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('zantaraChat', () => {
    it('should handle success case with valid params', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          response: 'Test response from ZANTARA',
          model_used: 'zantara-llama-3.1-8b',
          usage: { output_tokens: 50 },
        }),
      } as Response);

      const result = await handlers.zantaraChat({
        message: 'Test prompt',
        mode: 'santai',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.answer).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.zantaraChat({})).rejects.toThrow(BadRequestError);
      await expect(handlers.zantaraChat({})).rejects.toThrow('message is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.zantaraChat({
          invalid: 'data',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
