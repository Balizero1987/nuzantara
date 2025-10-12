/**
 * Tests for RAG Handler
 * Tests RAG query, search, and Bali Zero chat integration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock RAG service
const mockGenerateAnswer = jest.fn();
const mockSearch = jest.fn();
const mockBaliZeroChat = jest.fn();
const mockHealthCheck = jest.fn();

jest.unstable_mockModule('../../services/ragService.ts', () => ({
  ragService: {
    generateAnswer: mockGenerateAnswer,
    search: mockSearch,
    baliZeroChat: mockBaliZeroChat,
    healthCheck: mockHealthCheck,
  },
}));

const { ragQuery, ragSearch, baliZeroChat, ragHealth } = await import('../rag.ts');

describe('RAG Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGenerateAnswer.mockResolvedValue({
      success: true,
      query: 'test query',
      answer: 'Test RAG answer with sources',
      sources: [
        { content: 'Source 1', score: 0.95 },
        { content: 'Source 2', score: 0.87 },
      ],
    });

    mockSearch.mockResolvedValue({
      success: true,
      results: [
        { content: 'Search result 1', score: 0.92 },
        { content: 'Search result 2', score: 0.85 },
      ],
    });

    mockBaliZeroChat.mockResolvedValue({
      success: true,
      answer: 'Bali Zero chat response',
      model: 'claude-3-haiku',
      sources: [],
    });

    mockHealthCheck.mockResolvedValue(true);
  });

  describe('ragQuery', () => {
    it('should generate answer with LLM', async () => {
      const params = {
        query: 'What are PT PMA requirements?',
        k: 3,
        use_llm: true,
      };

      const result = await ragQuery(params);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('sources');
      expect(mockGenerateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'What are PT PMA requirements?',
          k: 3,
          use_llm: true,
        })
      );
    });

    it('should require query parameter', async () => {
      const params = {};

      await expect(ragQuery(params)).rejects.toThrow('Query parameter is required');
    });

    it('should pass conversation history to RAG', async () => {
      const params = {
        query: 'What about timeline?',
        conversation_history: [
          { role: 'user', content: 'Tell me about PT PMA' },
          { role: 'assistant', content: 'PT PMA is...' },
        ],
      };

      await ragQuery(params);

      expect(mockGenerateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_history: expect.any(Array),
        })
      );
    });

    it('should default k to 5 if not specified', async () => {
      const params = {
        query: 'Test query',
      };

      await ragQuery(params);

      expect(mockGenerateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          k: 5,
        })
      );
    });

    it('should default use_llm to true', async () => {
      const params = {
        query: 'Test query',
      };

      await ragQuery(params);

      expect(mockGenerateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          use_llm: true,
        })
      );
    });

    it('should handle RAG service errors gracefully', async () => {
      mockGenerateAnswer.mockRejectedValueOnce(new Error('RAG backend unavailable'));

      const params = {
        query: 'Test query',
      };

      const result = await ragQuery(params);

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('RAG service unavailable');
    });

    it('should return sources even when use_llm is false', async () => {
      mockGenerateAnswer.mockResolvedValueOnce({
        success: true,
        query: 'test',
        sources: [{ content: 'Source 1', score: 0.9 }],
      });

      const params = {
        query: 'Test query',
        use_llm: false,
      };

      const result = await ragQuery(params);

      expect(result.success).toBe(true);
      expect(result.sources).toHaveLength(1);
    });
  });

  describe('ragSearch', () => {
    it('should perform fast semantic search', async () => {
      const params = {
        query: 'KITAS requirements',
        k: 5,
      };

      const result = await ragSearch(params);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('results');
      expect(mockSearch).toHaveBeenCalledWith('KITAS requirements', 5);
    });

    it('should require query parameter', async () => {
      const params = {};

      await expect(ragSearch(params)).rejects.toThrow('Query parameter is required');
    });

    it('should default k to 5', async () => {
      const params = {
        query: 'Test',
      };

      await ragSearch(params);

      expect(mockSearch).toHaveBeenCalledWith('Test', 5);
    });

    it('should handle search errors', async () => {
      mockSearch.mockRejectedValueOnce(new Error('Search failed'));

      const params = {
        query: 'Test',
      };

      await expect(ragSearch(params)).rejects.toThrow();
    });
  });

  describe('baliZeroChat', () => {
    it('should route to Bali Zero specialized chat', async () => {
      const params = {
        query: 'What documents do I need for B211A visa?',
        user_role: 'member',
      };

      const result = await baliZeroChat(params);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('answer');
      expect(result).toHaveProperty('model');
      expect(mockBaliZeroChat).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'What documents do I need for B211A visa?',
          user_role: 'member',
        })
      );
    });

    it('should require query parameter', async () => {
      const params = {};

      await expect(baliZeroChat(params)).rejects.toThrow('Query parameter is required');
    });

    it('should default user_role to member', async () => {
      const params = {
        query: 'Test query',
      };

      await baliZeroChat(params);

      expect(mockBaliZeroChat).toHaveBeenCalledWith(
        expect.objectContaining({
          user_role: 'member',
        })
      );
    });

    it('should pass conversation history', async () => {
      const params = {
        query: 'Tell me more',
        conversation_history: [{ role: 'user', content: 'Previous message' }],
      };

      await baliZeroChat(params);

      expect(mockBaliZeroChat).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_history: expect.any(Array),
        })
      );
    });

    it('should handle chat errors', async () => {
      mockBaliZeroChat.mockRejectedValueOnce(new Error('Chat failed'));

      const params = {
        query: 'Test',
      };

      await expect(baliZeroChat(params)).rejects.toThrow();
    });
  });

  describe('ragHealth', () => {
    it('should return healthy status when RAG available', async () => {
      const result = await ragHealth({});

      expect(result.success).toBe(true);
      expect(result.status).toBe('healthy');
      expect(result.rag_backend).toBe(true);
      expect(mockHealthCheck).toHaveBeenCalled();
    });

    it('should return unhealthy status when RAG unavailable', async () => {
      mockHealthCheck.mockResolvedValueOnce(false);

      const result = await ragHealth({});

      expect(result.success).toBe(true);
      expect(result.status).toBe('unhealthy');
      expect(result.rag_backend).toBe(false);
    });

    it('should handle health check errors', async () => {
      mockHealthCheck.mockRejectedValueOnce(new Error('Health check failed'));

      const result = await ragHealth({});

      expect(result.success).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result).toHaveProperty('error');
    });

    it('should include backend URL in response', async () => {
      const result = await ragHealth({});

      expect(result).toHaveProperty('backend_url');
    });
  });
});
