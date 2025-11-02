import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

const mockRagService = {
  generateAnswer: jest.fn().mockResolvedValue({
    success: true,
    query: 'test query',
    answer: 'test answer',
    sources: [],
    conversation_history: []
  }),
  baliZeroChat: jest.fn().mockResolvedValue({
    success: true,
    response: 'test response',
    sources: [],
    conversation_history: []
  }),
  search: jest.fn().mockResolvedValue({
    success: true,
    results: [],
    query: 'test query'
  }),
  healthCheck: jest.fn().mockResolvedValue({
    status: 'healthy',
    backend: 'connected'
  })
};

jest.unstable_mockModule('../../services/ragService.js', () => ({
  ragService: mockRagService
}));

describe('RAG Handler', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../rag.js');
  });

  describe('ragQuery', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.ragQuery({
        query: 'test query',
        k: 5,
        use_llm: true
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.query).toBe('test query');
    });

    it('should handle missing required params', async () => {
      await expect(handlers.ragQuery({})).rejects.toThrow();
    });

    it('should handle invalid params', async () => {
      await expect(handlers.ragQuery({
        invalid: 'data'
      })).rejects.toThrow();
    });
  });

  describe('baliZeroChat', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.baliZeroChat({
        query: 'test query',
        user_role: 'member',
        user_email: 'test@example.com'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.response).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.baliZeroChat({})).rejects.toThrow();
    });
  });
});
