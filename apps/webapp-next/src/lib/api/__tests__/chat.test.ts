/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock fetchWithRetry
const mockFetchWithRetry = jest.fn() as any;
jest.unstable_mockModule('../fetch-utils', () => ({
  fetchWithRetry: mockFetchWithRetry,
}));

// Mock apiClient
const mockApiClient = {
  getToken: jest.fn(() => 'test-token'),
};
jest.unstable_mockModule('../client', () => ({
  apiClient: mockApiClient,
  client: {
    conversations: {
      saveConversationApiBaliZeroConversationsSavePost: (jest.fn() as any).mockResolvedValue({ conversation_id: 1, messages_saved: 1 }),
      getConversationHistoryApiBaliZeroConversationsHistoryGet: (jest.fn() as any).mockResolvedValue({ messages: [] }),
    },
    memory: {
      generateEmbeddingApiMemoryEmbedPost: (jest.fn() as any).mockResolvedValue({ embedding: [] }),
      searchMemoriesSemanticApiMemorySearchPost: (jest.fn() as any).mockResolvedValue({ results: [] }),
    },
    crmClients: {
      getClientByEmailApiCrmClientsByEmailEmailGet: (jest.fn() as any).mockResolvedValue({ id: 1 }),
      getClientSummaryApiCrmClientsClientIdSummaryGet: (jest.fn() as any).mockResolvedValue({}),
    },
    agenticFunctions: {
      getAgentsStatusApiAgentsStatusGet: (jest.fn() as any).mockResolvedValue({ agents_available: [], active_journeys: [], pending_alerts: 0 }),
    },
  },
}));

// Mock authAPI
jest.unstable_mockModule('../auth', () => ({
  authAPI: {
    getUser: jest.fn(() => ({ email: 'test@example.com' })),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Import module under test dynamically
const { chatAPI } = await import('../chat');

describe('chatAPI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('streamChat', () => {
    it('should stream chat response successfully', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: {"type": "token", "data": "Hello"}\n\n'));
          controller.enqueue(encoder.encode('data: {"type": "token", "data": " World"}\n\n'));
          controller.close();
        },
      });

      (mockFetchWithRetry as any).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        '/api/chat/stream',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
          body: expect.stringContaining('"message":"Hello"'),
        })
      );

      expect(onChunk).toHaveBeenCalledWith('Hello');
      expect(onChunk).toHaveBeenCalledWith(' World');
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle metadata events', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode('data: {"type": "metadata", "data": {"intent": "greeting"}}\n\n')
          );
          controller.close();
        },
      });

      (mockFetchWithRetry as any).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onMetadata).toHaveBeenCalledWith({ intent: 'greeting' });
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle stream errors', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: {"type": "error", "data": "Stream error"}\n\n'));
          controller.close();
        },
      });

      (mockFetchWithRetry as any).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle network errors', async () => {
      mockFetchWithRetry.mockRejectedValue(new Error('Network error'));

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle authentication errors', async () => {
      mockFetchWithRetry.mockResolvedValue({
        ok: false,
        status: 401,
      });

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle missing token', async () => {
      (mockApiClient.getToken as any).mockReturnValue(null);

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
