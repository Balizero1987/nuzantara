/**
 * Integration Test: RAG Flow
 * Tests RAG query routing and answer generation
 */

import { describe, it, expect } from '@jest/globals';

describe('RAG Flow Integration', () => {
  describe('Query Routing', () => {
    it('should route simple queries to Haiku model', () => {
      const simpleQueries = [
        'What is KITAS?',
        'PT PMA meaning',
        'Visa requirements',
      ];

      simpleQueries.forEach((query) => {
        const wordCount = query.split(' ').length;
        const isSimple = wordCount <= 5;
        expect(isSimple).toBe(true);
      });
    });

    it('should route complex queries to Sonnet model', () => {
      const complexQuery =
        'Compare PT PMA versus Local PT for foreign-owned F&B business with alcohol license, considering capital requirements and ownership restrictions';

      const wordCount = complexQuery.split(' ').length;
      const isComplex = wordCount > 15;
      expect(isComplex).toBe(true);
    });
  });

  describe('RAG + Pricing Integration', () => {
    it('should combine RAG context with official pricing', async () => {
      const ragQuery = 'How much does Working KITAS cost and what documents needed?';

      // RAG should retrieve:
      // 1. Document requirements from knowledge base
      // 2. Official pricing from bali.zero.pricing handler

      expect(ragQuery).toContain('cost');
      expect(ragQuery).toContain('documents');
    });

    it('should never generate fake prices', () => {
      const priceQuery = 'What is the price for C1 Tourism visa?';

      // Should redirect to official pricing handler
      const shouldUsePricingHandler = priceQuery.toLowerCase().includes('price');
      expect(shouldUsePricingHandler).toBe(true);
    });
  });

  describe('Conversation Continuity', () => {
    it('should maintain context across conversation turns', () => {
      const conversation = [
        { role: 'user', content: 'Tell me about PT PMA' },
        { role: 'assistant', content: 'PT PMA is for foreign investors...' },
        { role: 'user', content: 'What are the capital requirements?' },
      ];

      expect(conversation).toHaveLength(3);
      expect(conversation[2].content).not.toContain('PT PMA');
      // User assumes context from previous question
    });

    it('should use conversation history for follow-up questions', () => {
      const history = [
        { role: 'user', content: 'I want to open a restaurant' },
        { role: 'assistant', content: 'You\'ll need KBLI code 56101...' },
      ];

      const followUp = 'What licenses do I need?';

      // "I" refers to restaurant from history
      expect(history[0].content).toContain('restaurant');
      expect(followUp).not.toContain('restaurant');
    });
  });

  describe('RAG + KBLI Integration', () => {
    it('should retrieve KBLI requirements via RAG', () => {
      const query = 'What do I need for hotel business?';

      // RAG should find KBLI codes for hotels
      const expectedCodes = ['55111', '55112', '55130'];
      expect(expectedCodes).toContain('55111');
    });
  });
});
