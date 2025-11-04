import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock AI chat
jest.mock('../../ai-services/ai.js', () => ({
  aiChat: jest.fn().mockResolvedValue({
    ok: true,
    data: { response: 'Test response', answer: 'Test answer' },
  }),
}));

describe('Chat', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../chat.js');
  });

  describe('zeroChat', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zeroChat({
        prompt: 'Test prompt',
        userId: 'zero',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.response).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.zeroChat({})).rejects.toThrow(BadRequestError);
      await expect(handlers.zeroChat({})).rejects.toThrow('prompt or message is required');
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.zeroChat({
          prompt: 'test',
          userId: 'not-zero',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
