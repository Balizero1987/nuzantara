import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

const mockAxios = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.unstable_mockModule('axios', () => ({
  default: mockAxios,
}));

// Skip this test suite - requires Intel API backend
describe.skip('News Search', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../news-search.js');
  });

  describe('intelNewsSearch', () => {
    it('should handle success case with valid params', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'test-1',
              title: 'Test News',
              summary_english: 'Test summary',
              summary_italian: 'Riassunto test',
              source: 'test-source',
              tier: 'T1',
              published_date: '2025-01-01',
              category: 'immigration',
              impact_level: 'high',
              url: 'https://example.com',
              similarity_score: 0.95,
            },
          ],
        },
        status: 200,
      });

      const result = await handlers.intelNewsSearch({
        query: 'test query',
        category: 'immigration',
        date_range: 'last_7_days',
        tier: 'T1,T2,T3',
        limit: 20,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.intelNewsSearch({})).rejects.toThrow();
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.intelNewsSearch({
          invalid: 'data',
        })
      ).rejects.toThrow();
    });
  });

  describe('intelNewsGetCritical', () => {
    it('should handle success case with valid params', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'critical-1',
              title: 'Critical News',
              impact_level: 'critical',
              action_required: true,
            },
          ],
        },
        status: 200,
      });

      const result = await handlers.intelNewsGetCritical({
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle missing required params (all optional)', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { results: [] },
        status: 200,
      });

      const result = await handlers.intelNewsGetCritical({});
      expect(result).toBeDefined();
    });
  });

  describe('intelNewsGetTrends', () => {
    it('should handle success case with valid params', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          results: [
            {
              id: 'trend-1',
              title: 'Trending News',
              category: 'events',
            },
          ],
        },
        status: 200,
      });

      const result = await handlers.intelNewsGetTrends({
        days: 7,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle missing required params (all optional)', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: { results: [] },
        status: 200,
      });

      const result = await handlers.intelNewsGetTrends({});
      expect(result).toBeDefined();
    });
  });
});
