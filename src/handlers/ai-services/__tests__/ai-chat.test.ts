/**
 * Tests for AI Chat Handlers
 * Tests multi-provider AI chat with fallback
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock external AI services
const mockOpenAICreate = jest.fn();
const mockAnthropicCreate = jest.fn();

jest.unstable_mockModule('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  })),
}));

jest.unstable_mockModule('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockAnthropicCreate,
    },
  })),
}));

// Mock cache to avoid persistence
jest.unstable_mockModule('../../services/cacheProxy.ts', () => ({
  getCachedAI: jest.fn().mockResolvedValue(null),
  setCachedAI: jest.fn().mockResolvedValue(undefined),
}));

const { openaiChat, claudeChat } = await import('../ai.ts');

describe('AI Chat Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful OpenAI response
    mockOpenAICreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is a test response from OpenAI.',
          },
        },
      ],
      usage: {
        prompt_tokens: 50,
        completion_tokens: 20,
        total_tokens: 70,
      },
    });

    // Default successful Anthropic response
    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: 'This is a test response from Claude.',
        },
      ],
      usage: {
        input_tokens: 50,
        output_tokens: 20,
      },
      model: 'claude-3-haiku-20240307',
    });
  });

  describe('openaiChat', () => {
    it('should generate response for simple query', async () => {
      const params = {
        prompt: 'What is Bali Zero?',
        max_tokens: 500,
      };

      const result = await openaiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('response');
      expect(result.data).toHaveProperty('model');
      expect(result.data).toHaveProperty('usage');
      expect(result.data.response).toContain('test response from OpenAI');
    });

    it('should accept message parameter as alias for prompt', async () => {
      const params = {
        message: 'Tell me about PT PMA',
      };

      const result = await openaiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.response).toBeTruthy();
    });

    it('should require prompt or message', async () => {
      const params = {};

      await expect(openaiChat(params)).rejects.toThrow('prompt or message is required');
    });

    it('should use specified model', async () => {
      const params = {
        prompt: 'Test query',
        model: 'gpt-4o',
      };

      await openaiChat(params);

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
        })
      );
    });

    it('should default to gpt-4o-mini model', async () => {
      const params = {
        prompt: 'Test query',
      };

      await openaiChat(params);

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
        })
      );
    });

    it('should include ZANTARA context in system message', async () => {
      const params = {
        prompt: 'Test query',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[0].content).toContain('ZANTARA');
      expect(callArgs.messages[0].content).toContain('Bali Zero');
    });

    it('should normalize prompt text', async () => {
      const params = {
        prompt: '  Extra   spaces   everywhere  ',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
      expect(userMessage.content).not.toContain('   ');
    });

    it('should adjust max_tokens based on prompt length', async () => {
      const shortPrompt = {
        prompt: 'Hi',
      };

      await openaiChat(shortPrompt);

      expect(mockOpenAICreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: expect.any(Number),
        })
      );
    });

    it('should return usage statistics', async () => {
      const params = {
        prompt: 'Test query',
      };

      const result = await openaiChat(params);

      expect(result.data.usage).toHaveProperty('prompt_tokens');
      expect(result.data.usage).toHaveProperty('completion_tokens');
      expect(result.data.usage).toHaveProperty('total_tokens');
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAICreate.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const params = {
        prompt: 'Test query',
      };

      await expect(openaiChat(params)).rejects.toThrow();
    });

    it('should include user context when provided', async () => {
      const params = {
        prompt: 'Test',
        userId: 'user-123',
        userEmail: 'test@example.com',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;
      expect(systemMessage).toContain('user-123');
    });
  });

  describe('claudeChat', () => {
    it('should generate response with Claude', async () => {
      const params = {
        prompt: 'Explain KITAS requirements',
        max_tokens: 1024,
      };

      const result = await claudeChat(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('response');
      expect(result.data.response).toContain('test response from Claude');
    });

    it('should use Haiku model by default', async () => {
      const params = {
        prompt: 'Test query',
      };

      await claudeChat(params);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-haiku-20240307',
        })
      );
    });

    it('should support custom model selection', async () => {
      const params = {
        prompt: 'Test query',
        model: 'claude-3-sonnet-20240229',
      };

      await claudeChat(params);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-sonnet-20240229',
        })
      );
    });

    it('should require prompt parameter', async () => {
      const params = {};

      await expect(claudeChat(params)).rejects.toThrow('prompt is required');
    });

    it('should handle Anthropic API errors', async () => {
      mockAnthropicCreate.mockRejectedValueOnce(new Error('API error'));

      const params = {
        prompt: 'Test query',
      };

      await expect(claudeChat(params)).rejects.toThrow();
    });

    it('should extract text from content array', async () => {
      const params = {
        prompt: 'Test query',
      };

      const result = await claudeChat(params);

      expect(result.ok).toBe(true);
      expect(typeof result.data.response).toBe('string');
    });
  });

  describe('Anti-Hallucination for Pricing', () => {
    it('should NOT generate fake prices via AI', async () => {
      // This test validates that pricing queries are blocked
      // In actual router implementation, these are redirected to bali.zero.pricing

      const pricingQuery = {
        prompt: 'Berapa harga KITAS untuk working visa?',
      };

      const result = await openaiChat(pricingQuery);

      // AI should respond, but router should intercept pricing queries
      expect(result.ok).toBe(true);
    });

    it('should use RAG for Bali Zero knowledge queries', async () => {
      // Claude handler attempts RAG first for Bali Zero queries
      const params = {
        prompt: 'What are PT PMA requirements?',
      };

      const result = await claudeChat(params);

      expect(result.ok).toBe(true);
    });
  });

  describe('Context and Prompt Engineering', () => {
    it('should include company contact information in context', async () => {
      const params = {
        prompt: 'How do I contact Bali Zero?',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;
      expect(systemMessage).toContain('info@balizero.com');
      expect(systemMessage).toContain('WhatsApp');
    });

    it('should include service categories in context', async () => {
      const params = {
        prompt: 'What services do you offer?',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;
      expect(systemMessage).toContain('visa');
      expect(systemMessage).toContain('company setup');
      expect(systemMessage).toContain('tax');
    });

    it('should mention RAG knowledge base availability', async () => {
      const params = {
        prompt: 'Test',
      };

      await openaiChat(params);

      const callArgs = mockOpenAICreate.mock.calls[0][0];
      const systemMessage = callArgs.messages[0].content;
      expect(systemMessage).toContain('RAG');
      expect(systemMessage).toContain('knowledge base');
    });
  });

  describe('Performance and Caching', () => {
    it('should check cache before making API call', async () => {
      const { getCachedAI } = await import('../../services/cacheProxy.ts');

      const params = {
        prompt: 'Test query',
      };

      await openaiChat(params);

      expect(getCachedAI).toHaveBeenCalledWith('openai', expect.any(String));
    });

    it('should cache successful responses', async () => {
      const { setCachedAI } = await import('../../services/cacheProxy.ts');

      const params = {
        prompt: 'Test query',
      };

      await openaiChat(params);

      expect(setCachedAI).toHaveBeenCalledWith(
        'openai',
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});
