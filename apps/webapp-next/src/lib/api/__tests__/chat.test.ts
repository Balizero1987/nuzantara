/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

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

describe('chatAPI', () => {
  let chatAPI: any;
  let mockFetchWithRetry: any;
  let mockGetToken: any;

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();

    // Mock fetchWithRetry
    mockFetchWithRetry = jest.fn();
    jest.doMock('../fetch-utils', () => ({
      fetchWithRetry: mockFetchWithRetry,
    }));

    // Mock client
    mockGetToken = jest.fn(() => 'test-token');
    jest.doMock('../client', () => ({
      apiClient: {
        getToken: mockGetToken,
      },
      client: {
        conversations: {
          saveConversationApiBaliZeroConversationsSavePost: jest.fn().mockImplementation(() =>
            Promise.resolve({
              conversation_id: 1,
              messages_saved: 1,
            })
          ),
          getConversationHistoryApiBaliZeroConversationsHistoryGet: jest
            .fn()
            .mockImplementation(() => Promise.resolve({ messages: [] })),
        },
        memory: {
          generateEmbeddingApiMemoryEmbedPost: jest
            .fn()
            .mockImplementation(() => Promise.resolve({ embedding: [] })),
          searchMemoriesSemanticApiMemorySearchPost: jest.fn().mockImplementation(() =>
            Promise.resolve({
              results: [],
            })
          ),
        },
        crmClients: {
          getClientByEmailApiCrmClientsByEmailEmailGet: jest
            .fn()
            .mockImplementation(() => Promise.resolve({ id: 1 })),
          getClientSummaryApiCrmClientsClientIdSummaryGet: jest
            .fn()
            .mockImplementation(() => Promise.resolve({})),
        },
        agenticFunctions: {
          getAgentsStatusApiAgentsStatusGet: jest.fn().mockImplementation(() =>
            Promise.resolve({
              agents_available: [],
              active_journeys: [],
              pending_alerts: 0,
            })
          ),
        },
      },
    }));

    jest.doMock('../auth', () => ({
      authAPI: {
        getUser: jest.fn(() => ({ email: 'test@example.com' })),
      },
    }));

    jest.doMock('../zantara-integration', () => ({
      zantaraAPI: {
        buildContext: jest.fn().mockImplementation(() =>
          Promise.resolve({
            session: { sessionId: 'test', userEmail: 'test@example.com' },
          })
        ),
        postProcessTurn: jest.fn().mockImplementation(() => Promise.resolve({})),
      },
    }));

    // Import module under test
    const module = await import('../chat');
    chatAPI = module.chatAPI;
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

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onMetadata = jest.fn();
      const onComplete = jest.fn();
      const onError = jest.fn();

      await chatAPI.streamChat('Hello', onChunk, onMetadata, onComplete, onError);

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/chat/stream'),
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

      mockFetchWithRetry.mockResolvedValue({
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

      mockFetchWithRetry.mockResolvedValue({
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
      mockGetToken.mockReturnValue(null);

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
