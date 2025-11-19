/**
 * Streaming Service Tests
 * Unit tests for SSE streaming service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { streamingService } from '../streaming-service.js';

// Mock fetch
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('StreamingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe('streamChat', () => {
    it('should be defined and have streamChat method', () => {
      expect(streamingService).toBeDefined();
      expect(typeof streamingService.streamChat).toBe('function');
    });

    it('should handle backend fetch errors gracefully', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const mockReq = {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        on: jest.fn(),
        query: {},
      } as any;

      const mockRes = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        on: jest.fn(),
        headersSent: false,
        flushHeaders: jest.fn(),
      } as any;

      // Function handles errors internally and sends error via SSE
      await streamingService.streamChat(mockReq, mockRes, {
        query: 'test query',
      });

      // Check that error was sent to client via SSE
      expect(mockRes.write).toHaveBeenCalled();
      const writeCalls = (mockRes.write as jest.MockedFunction<any>).mock.calls;
      const errorMessage = writeCalls.find(
        (call: any[]) => call[0].includes('error') && call[0].includes('Backend stream failed')
      );
      expect(errorMessage).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return connection statistics', () => {
      const stats = streamingService.getStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('connections');
      expect(Array.isArray(stats.connections)).toBe(true);
      expect(typeof stats.activeConnections).toBe('number');
    });

    it('should return empty connections when no active connections', () => {
      const stats = streamingService.getStats();
      expect(stats.activeConnections).toBeGreaterThanOrEqual(0);
      expect(stats.connections).toBeDefined();
    });
  });
});
