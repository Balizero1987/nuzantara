import { chatAPI } from '../chat';
import { apiClient } from '../client';

// Mock fetch globally
global.fetch = jest.fn();

// Helper to encode string to Uint8Array (polyfill for TextEncoder)
function encodeString(str: string): Uint8Array {
  const utf8 = [];
  for (let i = 0; i < str.length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(0xe0 | (charcode >> 12), 0x80 | ((charcode >> 6) & 0x3f), 0x80 | (charcode & 0x3f));
    } else {
      i++;
      charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }
  return new Uint8Array(utf8);
}

// Helper to create mock ReadableStream
function createMockReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encodedChunks = chunks.map((chunk) => encodeString(chunk));

  return new ReadableStream({
    start(controller) {
      encodedChunks.forEach((chunk) => {
        controller.enqueue(chunk);
      });
      controller.close();
    },
  });
}

describe('chatAPI', () => {
  beforeAll(() => {
    // Spy on apiClient methods
    jest.spyOn(apiClient, 'getToken').mockImplementation(() => 'test-token-123');
    jest.spyOn(apiClient, 'setToken').mockImplementation(() => { });
    jest.spyOn(apiClient, 'clearToken').mockImplementation(() => { });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();

    // Reset spies implementations if needed, or just clear usage
    (apiClient.getToken as jest.Mock).mockClear();
    // Default implementation returns token
    (apiClient.getToken as jest.Mock).mockImplementation(() => 'test-token-123');
  });

  describe('streamChat', () => {
    it('should call stream endpoint with correct parameters', async () => {
      const mockStream = createMockReadableStream(['chunk1', 'chunk2']);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError, [
        { role: 'user', content: 'Previous message' },
      ]);

      expect(fetch).toHaveBeenCalledWith('/api/chat/stream', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token-123',
        },
        body: JSON.stringify({
          message: 'Hello',
          user_id: 'web_user',
          conversation_history: [{ role: 'user', content: 'Previous message' }],
        }),
        signal: expect.any(AbortSignal),
      }));
    });

    it('should handle streaming chunks correctly', async () => {
      const chunks = ['Hello', ' World', '!'];
      const mockStream = createMockReadableStream(chunks);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      // Wait for stream to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onChunk).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it('should parse SSE format chunks', async () => {
      const sseChunks = [
        'data: {"type":"token","data":"Hello"}\n\n',
        'data: {"type":"token","data":" World"}\n\n',
      ];
      const mockStream = createMockReadableStream(sseChunks);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onChunk).toHaveBeenCalled();
    });

    it('should handle metadata events', async () => {
      const sseChunks = ['data: {"type":"metadata","data":{"memory_used":true}}\n\n'];
      const mockStream = createMockReadableStream(sseChunks);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(onMetadata).toHaveBeenCalled();
    });

    it('should handle error events', async () => {
      const sseChunks = ['data: {"type":"error","data":"Something went wrong"}\n\n'];
      const mockStream = createMockReadableStream(sseChunks);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Error events throw errors which are caught internally
      // The error is logged but doesn't propagate to onError
      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Error is caught internally and logged, but stream continues
      // onComplete should still be called
      expect(onComplete).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should call onError when no token is available', async () => {
      // Mock getToken to return null for this test
      (apiClient.getToken as jest.Mock).mockImplementation(() => null);

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No authentication token'),
        })
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle 401 unauthorized response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Authentication failed'),
        })
      );
    });

    it('should handle HTTP error responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('HTTP error'),
        })
      );
    });

    it('should handle missing response body', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: null,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No reader available'),
        })
      );
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should use empty conversation history when not provided', async () => {
      const mockStream = createMockReadableStream(['chunk']);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Hello',
            user_id: 'web_user',
            conversation_history: [],
          }),
          signal: expect.any(AbortSignal),
        })
      );
    });
  });
});
