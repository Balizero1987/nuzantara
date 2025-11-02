import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

jest.mock('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  get: jest.fn(),
  post: jest.fn()
}));

// Mock global fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Instagram', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../instagram.js');
    (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    // Reset axios mocks
    const axios = (await import('axios')).default;
    (axios.post as jest.MockedFunction<any>).mockReset();
  });
  
  // Helper to create mock req/res
  function createMockReqRes(params: any = {}) {
    const mockReq = {
      query: params.query || {},
      body: params.body || {},
      ...params
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    return { req: mockReq, res: mockRes };
  }

  describe('instagramWebhookVerify', () => {
    it('should handle success case with valid params', async () => {
      // Set verify token that matches the default or env
      const verifyToken = process.env.INSTAGRAM_VERIFY_TOKEN || 'zantara-balizero-2025-secure-token';
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
          'hub.challenge': 'test-challenge'
        }
      });

      await handlers.instagramWebhookVerify(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('test-challenge');
    });

    it('should handle missing required params', async () => {
      const { req, res } = createMockReqRes({
        query: {}
      });

      await handlers.instagramWebhookVerify(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
    });

    it('should handle invalid params', async () => {
      const { req, res } = createMockReqRes({
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token'
        }
      });

      await handlers.instagramWebhookVerify(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('instagramWebhookReceiver', () => {
    it('should handle success case with valid params', async () => {
      const { req, res } = createMockReqRes({
        body: {
          object: 'instagram',
          entry: [{
            id: 'test-page-id',
            messaging: []
          }]
        }
      });

      await handlers.instagramWebhookReceiver(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('EVENT_RECEIVED');
    });

    it('should handle missing required params', async () => {
      const { req, res } = createMockReqRes({
        body: {}
      });

      await handlers.instagramWebhookReceiver(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Function should handle gracefully
    });

    it('should handle invalid params', async () => {
      const { req, res } = createMockReqRes({
        body: {
          object: 'not-instagram'
        }
      });

      await handlers.instagramWebhookReceiver(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      // Should handle invalid object type gracefully
    });
  });

  describe('getInstagramUserAnalytics', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.getInstagramUserAnalytics({
        userId: 'test-user-id'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.getInstagramUserAnalytics({})).rejects.toThrow(BadRequestError);
      await expect(handlers.getInstagramUserAnalytics({})).rejects.toThrow('userId is required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.getInstagramUserAnalytics({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('sendManualInstagramMessage', () => {
    it('should handle success case with valid params', async () => {
      process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
      
      // Mock axios.post (Instagram uses axios, not fetch)
      const axios = (await import('axios')).default;
      (axios.post as jest.MockedFunction<any>).mockResolvedValueOnce({
        data: { success: true, message_id: 'test-id' },
        status: 200
      });

      const result = await handlers.sendManualInstagramMessage({
        to: 'test-user-id',
        message: 'Test message'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      
      delete process.env.INSTAGRAM_ACCESS_TOKEN;
    });

    it('should handle missing required params', async () => {
      await expect(handlers.sendManualInstagramMessage({})).rejects.toThrow(BadRequestError);
    });

    it('should handle invalid params', async () => {
      await expect(handlers.sendManualInstagramMessage({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('buildInstagramPrompt', () => {
    // buildInstagramPrompt is not exported - skip these tests
    it.skip('should handle success case with valid params', async () => {
      // Function not exported
    });

    it.skip('should handle missing required params', async () => {
      // Function not exported
    });

    it.skip('should handle invalid params', async () => {
      // Function not exported
    });
  });

});
