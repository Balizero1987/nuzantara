import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestError } from '../../../utils/errors.js';

// Mock WebSocket server
const mockWebSocketServer = {
  getStats: jest.fn().mockReturnValue({
    totalConnections: 0,
    channels: {},
    clients: []
  }),
  broadcast: jest.fn(),
  sendToUser: jest.fn()
};

jest.unstable_mockModule('../../services/websocket-server.js', () => ({
  getWebSocketServer: jest.fn().mockReturnValue(mockWebSocketServer)
}));

describe('Websocket Admin', () => {
  let handlers: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    handlers = await import('../websocket-admin.js');
  });

  describe('websocketStats', () => {
    it('should handle success case', async () => {
      const result = await handlers.websocketStats({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.enabled).toBe(true);
    });
  });

  describe('websocketBroadcast', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.websocketBroadcast({
        channel: 'test-channel',
        data: { message: 'Test broadcast' }
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.broadcast).toBe(true);
      expect(mockWebSocketServer.broadcast).toHaveBeenCalled();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.websocketBroadcast({})).rejects.toThrow(BadRequestError);
      await expect(handlers.websocketBroadcast({})).rejects.toThrow('channel and data are required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.websocketBroadcast({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

  describe('websocketSendToUser', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.websocketSendToUser({
        userId: 'test-user',
        channel: 'test-channel',
        data: { message: 'Test message' }
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data.sent).toBe(true);
      expect(mockWebSocketServer.sendToUser).toHaveBeenCalled();
    });

    it('should handle missing required params', async () => {
      await expect(handlers.websocketSendToUser({})).rejects.toThrow(BadRequestError);
      await expect(handlers.websocketSendToUser({})).rejects.toThrow('userId, channel, and data are required');
    });

    it('should handle invalid params', async () => {
      await expect(handlers.websocketSendToUser({
        invalid: 'data'
      })).rejects.toThrow(BadRequestError);
    });
  });

});
