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
      localStorageMock.getItem.mockReturnValue(null);

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should get token from localStorage when apiClient has no token', async () => {
      mockGetToken.mockReturnValue(null);
      localStorageMock.getItem.mockReturnValue('localStorage-token');

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer localStorage-token',
          }),
        })
      );
    });

    it('should build context when enrichContext is enabled', async () => {
      const mockBuildContext = jest.fn() as jest.MockedFunction<() => Promise<any>>;
      mockBuildContext.mockResolvedValue({
        session: {
          sessionId: 'test',
          userEmail: 'test@example.com',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        },
        crmContext: {
          clientId: 123,
          clientName: 'Test Client',
          status: 'active',
        },
      });

      jest.resetModules(); // Reset modules to apply new mock
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...(jest.requireActual('../zantara-integration') as any).zantaraAPI,
          buildContext: mockBuildContext,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn(), [], {
        enrichContext: true,
      });

      expect(mockBuildContext).toHaveBeenCalledWith('Hello');
    });

    it('should not build context when enrichContext is disabled', async () => {
      // @ts-ignore
      const mockBuildContext = jest.fn();
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...(jest.requireActual('../zantara-integration') as any).zantaraAPI,
          buildContext: mockBuildContext,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn(), [], {
        enrichContext: false,
      });

      expect(mockBuildContext).not.toHaveBeenCalled();
    });

    it('should handle context building errors gracefully', async () => {
      const mockBuildContextError = jest.fn() as jest.MockedFunction<() => Promise<any>>;
      mockBuildContextError.mockRejectedValue(new Error('Context error'));

      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          buildContext: mockBuildContextError,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError, [], {
        enrichContext: true,
      });

      // Should not error, just proceed without context
      expect(onError).not.toHaveBeenCalled();
    });

    it('should include zantara_context in request when context is available', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          buildContext: jest.fn().mockResolvedValue({
            session: {
              sessionId: 'test-session',
              userEmail: 'test@example.com',
              startedAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              messageCount: 0,
            },
            crmContext: {
              clientId: 123,
              clientName: 'Test Client',
              status: 'active',
              practices: [{ id: 1, type: 'visa', status: 'active' }],
            },
            recentMemories: [{ content: 'Memory 1', relevance: 0.9, type: 'preference' }],
            agentsStatus: {
              available: ['journey1'],
              activeJourneys: 1,
              pendingAlerts: 2,
            },
          }),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn(), [], {
        enrichContext: true,
      });

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('zantara_context'),
        })
      );
    });

    it('should include metadata in request', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn());

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('metadata'),
        })
      );
    });

    it('should handle server-side environment (no navigator/Intl)', async () => {
      const originalNavigator = global.navigator;
      const originalIntl = global.Intl;
      delete (global as any).navigator;
      delete (global as any).Intl;

      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn());

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"client_locale":"en-US"'),
        })
      );

      global.navigator = originalNavigator;
      global.Intl = originalIntl;
    });

    it('should post-process turn when saveConversation is enabled', async () => {
      // @ts-ignore
      const mockPostProcess = jest.fn().mockResolvedValue();
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          postProcessTurn: mockPostProcess,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: {"type": "token", "data": "Response"}\n\n'));
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onComplete = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), onComplete, jest.fn(), [], {
        saveConversation: true,
      });

      // Wait for async post-processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockPostProcess).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should not post-process when saveConversation is disabled', async () => {
      // @ts-ignore
      const mockPostProcess = jest.fn();
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          postProcessTurn: mockPostProcess,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: {"type": "token", "data": "Response"}\n\n'));
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn(), [], {
        saveConversation: false,
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockPostProcess).not.toHaveBeenCalled();
    });

    it('should handle no reader available', async () => {
      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: null,
      });

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle raw text streaming (non-SSE)', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('Raw text response'));
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onComplete = jest.fn();
      await chatAPI.streamChat('Hello', onChunk, jest.fn(), onComplete, jest.fn());

      expect(onChunk).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle parse errors in SSE data', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode('data: invalid json\n\n'));
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const onChunk = jest.fn();
      const onComplete = jest.fn();
      await chatAPI.streamChat('Hello', onChunk, jest.fn(), onComplete, jest.fn());

      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle non-Error exceptions', async () => {
      mockFetchWithRetry.mockRejectedValue('String error');

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle timeout abort', async () => {
      const controller = new AbortController();
      controller.abort();

      mockFetchWithRetry.mockRejectedValue(new Error('Aborted'));

      const onError = jest.fn();
      await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), jest.fn(), onError);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('quickChat', () => {
    it('should call streamChat with enrichContext and saveConversation disabled', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const streamChatSpy = jest.spyOn(chatAPI, 'streamChat');

      await chatAPI.quickChat('Hello', jest.fn(), jest.fn(), jest.fn(), jest.fn());

      expect(streamChatSpy).toHaveBeenCalledWith(
        'Hello',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        undefined,
        { enrichContext: false, saveConversation: false }
      );
    });
  });

  describe('getContext', () => {
    it('should get context successfully', async () => {
      // @ts-ignore
      const mockBuildContext = jest.fn().mockResolvedValue({
        session: {
          sessionId: 'test',
          userEmail: 'test@example.com',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        },
      });



      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...(jest.requireActual('../zantara-integration') as any).zantaraAPI,
          buildContext: mockBuildContext,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const context = await chatAPI.getContext('test message');

      expect(context).toBeDefined();
      expect(mockBuildContext).toHaveBeenCalledWith('test message');
    });

    it('should handle context errors gracefully', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          buildContext: jest.fn().mockRejectedValue(new Error('Context error')),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const context = await chatAPI.getContext('test message');

      expect(context).toBeNull();
    });
  });

  describe('saveConversation', () => {
    it('should save conversation successfully', async () => {
      // Mock zantaraAPI.saveConversation by mocking the module
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          saveConversation: jest.fn().mockResolvedValue({
            success: true,
            conversationId: 123,
            messagesSaved: 2,
          }),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const result = await chatAPI.saveConversation([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ]);

      expect(result).toBe(true);
    });

    it('should return false on save error', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          saveConversation: jest.fn().mockRejectedValue(new Error('Save error')),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const result = await chatAPI.saveConversation([{ role: 'user', content: 'Hello' }]);

      expect(result).toBe(false);
    });
  });

  describe('loadHistory', () => {
    it('should load history successfully', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          loadConversationHistory: jest.fn().mockResolvedValue([
            { role: 'user', content: 'Hello', timestamp: '2024-01-01' },
            { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01' },
          ]),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const history = await chatAPI.loadHistory(50);

      expect(history).toHaveLength(2);
    });

    it('should handle load errors gracefully', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          loadConversationHistory: jest.fn().mockRejectedValue(new Error('Load error')),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const history = await chatAPI.loadHistory();

      expect(history).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('should clear history successfully', async () => {
      const clearSessionMock = jest.fn();
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          clearConversationHistory: jest.fn().mockResolvedValue(true),
          clearSession: clearSessionMock,
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const result = await chatAPI.clearHistory();

      expect(result).toBe(true);
      expect(clearSessionMock).toHaveBeenCalled();
    });

    it('should handle clear errors gracefully', async () => {
      jest.resetModules();
      jest.doMock('../zantara-integration', () => ({
        zantaraAPI: {
          ...jest.requireActual('../zantara-integration').zantaraAPI,
          // @ts-ignore
          clearConversationHistory: jest.fn().mockRejectedValue(new Error('Clear error')),
        },
      }));

      const module = await import('../chat');
      const chatAPI = (module as any).chatAPI;

      const result = await chatAPI.clearHistory();

      expect(result).toBe(false);
    });
  });
});
