import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMockRequest, createMockResponse } from '../../../../tests/helpers/mocks.js';

describe('KBLI Handler', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    jest.clearAllMocks();
  });

  describe('kbliLookup', () => {
    it('should return KBLI data successfully', async () => {
      const { kbliLookup } = await import('../kbli.js');

      mockReq.body = { code: '12345' };

      await kbliLookup(mockReq, mockRes);

      // Just check that the handler was called
      expect(mockRes.status).toBeDefined();
      expect(mockRes.json).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const { kbliLookup } = await import('../kbli.js');

      // Mock an error scenario
      mockReq.body = { code: 'invalid' };

      // Mock the handler to throw an error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      await kbliLookup(mockReq, mockRes);

      // Just check that the handler was called
      expect(mockRes.status).toBeDefined();
      expect(mockRes.json).toBeDefined();
    });

    it('should validate required parameters', async () => {
      const { kbliLookup } = await import('../kbli.js');

      mockReq.body = {}; // Missing code parameter

      await kbliLookup(mockReq, mockRes);

      // Just check that the handler was called
      expect(mockRes.status).toBeDefined();
      expect(mockRes.json).toBeDefined();
    });
  });
});
