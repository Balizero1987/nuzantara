import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock aiChat service - ensure it's set up before module import
const mockAiChat = jest.fn().mockResolvedValue({
  ok: true,
  data: { 
    response: JSON.stringify({
      predictions: ['Test prediction'],
      recommendations: ['Test recommendation']
    }),
    answer: 'Test answer'
  }
});

jest.unstable_mockModule('../ai.js', () => ({
  aiChat: mockAiChat
}));

describe('Advanced Ai', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Set up mock to return immediately
    mockAiChat.mockResolvedValue({
      ok: true,
      data: { 
        response: JSON.stringify({
          predictions: ['Test prediction'],
          recommendations: ['Test recommendation']
        }),
        answer: 'Test answer'
      }
    });
    handlers = await import('../advanced-ai.js');
  });

  describe('aiAnticipate', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.aiAnticipate({
        context: 'Test context',
        scenario: 'Test scenario'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.anticipation).toBeDefined();
    }, 10000);

    it('should handle missing required params', async () => {
      await expect(handlers.aiAnticipate({})).rejects.toThrow(BadRequestError);
      await expect(handlers.aiAnticipate({})).rejects.toThrow('context or scenario required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.aiAnticipate({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('aiLearn', () => {
    it('should handle success case with valid params', async () => {
      mockAiChat.mockResolvedValueOnce({
        ok: true,
        data: {
          response: JSON.stringify({
            learning: 'Test learning output'
          }),
          answer: 'Test answer'
        }
      });

      const result = await handlers.aiLearn({
        feedback: 'Positive feedback',
        learning_type: 'incremental'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    }, 10000);

    it('should handle missing required params', async () => {
      await expect(handlers.aiLearn({})).rejects.toThrow(BadRequestError);
      await expect(handlers.aiLearn({})).rejects.toThrow('feedback, pattern, or performance_data required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.aiLearn({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('xaiExplain', () => {
    it('should handle success case with valid params', async () => {
      mockAiChat.mockResolvedValueOnce({
        ok: true,
        data: {
          response: 'Test explanation',
          answer: 'Test answer'
        }
      });

      const result = await handlers.xaiExplain({
        decision: 'Approved transaction',
        context: 'Financial processing'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.decision).toBeDefined();
      expect(result.data.decisionId).toBeDefined();
      expect(result.data.reasoning).toBeDefined();
    }, 10000);

    it('should handle missing required params', async () => {
      await expect(handlers.xaiExplain({})).rejects.toThrow(BadRequestError);
      await expect(handlers.xaiExplain({})).rejects.toThrow('decision parameter required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.xaiExplain({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});
