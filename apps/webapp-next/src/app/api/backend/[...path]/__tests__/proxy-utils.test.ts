/**
 * Complete test coverage for proxy-utils.ts
 * Target: 100% coverage
 */

import { buildBackendUrl, executeProxyRequest, isStreamingResponse } from '../proxy-utils';

// Mock fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('proxy-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buildBackendUrl', () => {
    it('should build URL with path segments', () => {
      const url = buildBackendUrl('https://api.example.com', ['test', 'endpoint'], '');
      expect(url).toBe('https://api.example.com/test/endpoint');
    });

    it('should include query string', () => {
      const url = buildBackendUrl('https://api.example.com', ['test'], '?param=value');
      expect(url).toBe('https://api.example.com/test?param=value');
    });

    it('should handle empty path segments', () => {
      const url = buildBackendUrl('https://api.example.com', [], '');
      expect(url).toBe('https://api.example.com/');
    });

    it('should handle multiple path segments', () => {
      const url = buildBackendUrl('https://api.example.com', ['api', 'v1', 'users'], '');
      expect(url).toBe('https://api.example.com/api/v1/users');
    });
  });

  describe('executeProxyRequest', () => {
    it('should execute request with API key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      await executeProxyRequest({
        backendUrl: 'https://api.example.com/test',
        apiKey: 'test-key',
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          }),
        })
      );
    });

    it('should execute request without API key', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      await executeProxyRequest({
        backendUrl: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-API-Key': expect.anything(),
          }),
        })
      );
    });

    it('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      await executeProxyRequest({
        backendUrl: 'https://api.example.com/test',
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token',
          'Custom-Header': 'value',
        },
        body: JSON.stringify({ data: 'test' }),
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
            'Custom-Header': 'value',
          }),
          body: JSON.stringify({ data: 'test' }),
        })
      );
    });

    it('should include body for POST requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({}),
      });

      const body = JSON.stringify({ test: 'data' });
      await executeProxyRequest({
        backendUrl: 'https://api.example.com/test',
        method: 'POST',
        body,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body,
        })
      );
    });
  });

  describe('isStreamingResponse', () => {
    it('should return true for text/event-stream content type', () => {
      expect(isStreamingResponse('text/event-stream', '/test')).toBe(true);
    });

    it('should return true for path containing stream', () => {
      expect(isStreamingResponse('application/json', '/api/stream/endpoint')).toBe(true);
    });

    it('should return false for regular JSON response', () => {
      expect(isStreamingResponse('application/json', '/api/test')).toBe(false);
    });

    it('should return false for empty content type and non-stream path', () => {
      expect(isStreamingResponse('', '/api/test')).toBe(false);
    });

    it('should return true when both conditions match', () => {
      expect(isStreamingResponse('text/event-stream', '/api/stream')).toBe(true);
    });
  });
});

