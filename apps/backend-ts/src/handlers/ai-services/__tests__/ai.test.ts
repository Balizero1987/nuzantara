import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AI Service', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../ai.js');
  });

  describe('aiChat', () => {
    describe('Identity Recognition', () => {
      it('should recognize "zero" and return personalized response', async () => {
        const result = await handlers.aiChat({
          prompt: 'Hi, this is zero',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data).toHaveProperty('response');
        expect(result.data.response).toContain('Zero');
        expect(result.data.recognized).toBe(true);
      });

      it('should recognize "antonello" and return personalized response', async () => {
        const result = await handlers.aiChat({
          message: 'Hello, I am Antonello',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data.response).toContain('Antonello');
        expect(result.data.recognized).toBe(true);
      });

      it('should recognize "zainal" and return Indonesian response', async () => {
        const result = await handlers.aiChat({
          prompt: 'This is Zainal speaking',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data.response).toContain('Zainal');
        expect(result.data.recognized).toBe(true);
      });

      it('should recognize by role "founder"', async () => {
        const result = await handlers.aiChat({
          prompt: 'Im the founder of the company',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });

      it('should recognize by role "CEO"', async () => {
        const result = await handlers.aiChat({
          prompt: 'I am the CEO',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });

      it('should recognize by department "technology"', async () => {
        const result = await handlers.aiChat({
          prompt: 'I work in technology department',
          sessionId: 'test-session'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });
    });

    describe('Response Structure', () => {
      it('should return ok=true for valid identity', async () => {
        const result = await handlers.aiChat({
          prompt: 'Hello, zero here'
        });

        expect(result.ok).toBe(true);
      });

      it('should include response field', async () => {
        const result = await handlers.aiChat({
          prompt: 'I am antonello'
        });

        expect(result.data).toHaveProperty('response');
        expect(typeof result.data.response).toBe('string');
      });

      it('should include timestamp in response', async () => {
        const result = await handlers.aiChat({
          prompt: 'zainal speaking'
        });

        expect(result.data).toHaveProperty('ts');
        expect(typeof result.data.ts).toBe('number');
      });

      it('should include recognized flag for identity match', async () => {
        const result = await handlers.aiChat({
          prompt: 'I am the founder'
        });

        expect(result.data).toHaveProperty('recognized');
        expect(result.data.recognized).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty prompt with identity keyword', async () => {
        const result = await handlers.aiChat({
          prompt: 'zero',
          sessionId: 'test'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });

      it('should handle mixed case in identity recognition', async () => {
        const result = await handlers.aiChat({
          prompt: 'ANTONELLO here'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });

      it('should handle identity name with extra text', async () => {
        const result = await handlers.aiChat({
          prompt: 'Good morning, this is Zainal Abidin from Bali Zero'
        });

        expect(result.ok).toBe(true);
        expect(result.data.recognized).toBe(true);
      });
    });
  });
});
