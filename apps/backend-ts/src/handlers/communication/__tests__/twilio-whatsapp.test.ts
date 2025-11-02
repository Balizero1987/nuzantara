import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        sid: 'test-sid',
        status: 'sent'
      })
    }
  }));
});

describe('Twilio Whatsapp', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../twilio-whatsapp.js');
    // Setup env vars for tests
    process.env.TWILIO_ACCOUNT_SID = 'test-account-sid';
    process.env.TWILIO_AUTH_TOKEN = 'test-auth-token';
  });

  // Helper to create mock req/res
  function createMockReqRes(params: any = {}) {
    const mockReq = {
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

  describe('twilioWhatsappWebhook', () => {
    it('should handle success case with valid params', async () => {
      const { req, res } = createMockReqRes({
        body: {
          Body: 'Test message',
          From: 'whatsapp:+1234567890',
          To: 'whatsapp:+14155238886',
          MessageSid: 'test-sid'
        }
      });

      await handlers.twilioWhatsappWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();
    });

    it('should handle missing required params', async () => {
      const { req, res } = createMockReqRes({
        body: {}
      });

      await handlers.twilioWhatsappWebhook(req, res);

      // Should still return 200 to Twilio
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid params', async () => {
      const { req, res } = createMockReqRes({
        body: {
          invalid: 'data'
        }
      });

      await handlers.twilioWhatsappWebhook(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('sendTwilioWhatsapp', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.sendTwilioWhatsapp(
        'whatsapp:+1234567890',
        'Test message'
      );

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      // Function expects 2 string params
      await expect(handlers.sendTwilioWhatsapp()).rejects.toThrow();
    });

    it('should handle invalid params', async () => {
      await expect(handlers.sendTwilioWhatsapp('', '')).rejects.toThrow();
    });
  });

  describe('twilioSendWhatsapp', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.twilioSendWhatsapp({
        to: 'whatsapp:+1234567890',
        message: 'Test message'
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle missing required params', async () => {
      await expect(handlers.twilioSendWhatsapp({})).rejects.toThrow();
    });

    it('should handle invalid params', async () => {
      await expect(handlers.twilioSendWhatsapp({
        invalid: 'data'
      })).rejects.toThrow();
    });
  });

});
