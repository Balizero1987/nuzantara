/**
 * Tests for AI Service Handler
 * Tests AI chat functionality with ZANTARA integration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { aiChat } from '../ai.js';

// Mock the zantara-llama module
jest.mock('../zantara-llama.js', () => ({
  zantaraChat: jest.fn()
}));

// Mock logger
jest.mock('../../../services/logger.js', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock response utilities
jest.mock('../../../utils/response.js', () => ({
  ok: jest.fn((data) => ({ ok: true, data }))
}));

describe('AI Service Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aiChat', () => {
    it('should return personalized response for recognized team member', async () => {
      const params = {
        prompt: 'Hello Zero, how are you?',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('response');
      expect(result.data).toHaveProperty('recognized', true);
      expect(result.data.response).toContain('Ciao Zero!');
    });

    it('should recognize Zainal Abidin as CEO', async () => {
      const params = {
        prompt: 'Hi Zainal, can you help me?',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
      expect(result.data.response).toContain('Selamat datang kembali Zainal!');
    });

    it('should recognize Antonello as Founder', async () => {
      const params = {
        prompt: 'Antonello, I need access to the systems',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
      expect(result.data.response).toContain('Ciao Antonello!');
    });

    it('should recognize by role (CEO)', async () => {
      const params = {
        prompt: 'Hello CEO, I need your help',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
    });

    it('should recognize by department (technology)', async () => {
      const params = {
        prompt: 'Hi technology team, can you help?',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
    });

    it('should use zantaraChat for unrecognized users', async () => {
      const { zantaraChat } = await import('../zantara-llama.js');
      const mockZantaraResponse = {
        response: 'Hello! I am ZANTARA, how can I help you?',
        model: 'zantara-llama',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 }
      };
      
      (zantaraChat as jest.Mock).mockResolvedValue(mockZantaraResponse);

      const params = {
        prompt: 'Hello, I am a new user',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(zantaraChat).toHaveBeenCalledWith({
        message: 'Hello, I am a new user',
        sessionId: 'test-session'
      });
      expect(result).toEqual(mockZantaraResponse);
    });

    it('should handle zantaraChat errors gracefully', async () => {
      const { zantaraChat } = await import('../zantara-llama.js');
      (zantaraChat as jest.Mock).mockRejectedValue(new Error('ZANTARA service unavailable'));

      const params = {
        prompt: 'Hello, I need help',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.response).toContain('Ciao! Sono ZANTARA');
      expect(result.data.model).toBe('zantara-fallback');
      expect(result.data).toHaveProperty('usage');
    });

    it('should handle empty prompt gracefully', async () => {
      const params = {
        prompt: '',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('response');
    });

    it('should handle missing sessionId', async () => {
      const params = {
        prompt: 'Hello Zero'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
    });

    it('should handle null/undefined params', async () => {
      const result = await aiChat(null);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('response');
    });

    it('should use message parameter when prompt is not provided', async () => {
      const { zantaraChat } = await import('../zantara-llama.js');
      const mockResponse = { response: 'Test response' };
      (zantaraChat as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        message: 'Hello ZANTARA',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(zantaraChat).toHaveBeenCalledWith({
        message: 'Hello ZANTARA',
        sessionId: 'test-session'
      });
    });

    it('should prioritize prompt over message parameter', async () => {
      const { zantaraChat } = await import('../zantara-llama.js');
      const mockResponse = { response: 'Test response' };
      (zantaraChat as jest.Mock).mockResolvedValue(mockResponse);

      const params = {
        prompt: 'This is the prompt',
        message: 'This is the message',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(zantaraChat).toHaveBeenCalledWith({
        message: 'This is the prompt',
        sessionId: 'test-session'
      });
    });

    it('should include timestamp in response', async () => {
      const params = {
        prompt: 'Hello Zero'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('ts');
      expect(typeof result.data.ts).toBe('number');
    });

    it('should handle case-insensitive recognition', async () => {
      const params = {
        prompt: 'hello ZERO, how are you?',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
    });

    it('should handle partial name matches', async () => {
      const params = {
        prompt: 'Hi Zainal, can you help me with the project?',
        sessionId: 'test-session'
      };

      const result = await aiChat(params);

      expect(result.ok).toBe(true);
      expect(result.data.recognized).toBe(true);
    });
  });
});
