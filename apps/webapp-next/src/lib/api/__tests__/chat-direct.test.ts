/**
 * Direct test for chat.ts to ensure coverage
 * Uses direct imports instead of dynamic mocks
 */

import { chatAPI } from '../chat';
import { apiClient } from '../client';
import { authAPI } from '../auth';
import { zantaraAPI } from '../zantara-integration';
import { fetchWithRetry } from '../fetch-utils';

// Mock dependencies
jest.mock('../client', () => ({
  apiClient: {
    getToken: jest.fn(),
  },
}));

jest.mock('../auth', () => ({
  authAPI: {
    getUser: jest.fn(),
  },
}));

jest.mock('../zantara-integration', () => ({
  zantaraAPI: {
    buildContext: jest.fn(),
    postProcessTurn: jest.fn(),
    saveConversation: jest.fn(),
    loadConversationHistory: jest.fn(),
    clearConversationHistory: jest.fn(),
    clearSession: jest.fn(),
  },
}));

jest.mock('../fetch-utils', () => ({
  fetchWithRetry: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

describe('chatAPI (direct import)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.getToken as jest.Mock).mockReturnValue('test-token');
    (authAPI.getUser as jest.Mock).mockReturnValue({ email: 'test@example.com' });
    (zantaraAPI.postProcessTurn as jest.Mock).mockReturnValue(Promise.resolve());
  });

  it('should export chatAPI', () => {
    expect(chatAPI).toBeDefined();
    expect(chatAPI.streamChat).toBeDefined();
    expect(chatAPI.quickChat).toBeDefined();
    expect(chatAPI.getContext).toBeDefined();
    expect(chatAPI.saveConversation).toBeDefined();
    expect(chatAPI.loadHistory).toBeDefined();
    expect(chatAPI.clearHistory).toBeDefined();
  });

  it('should handle streamChat with token from apiClient', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type": "token", "data": "Hello"}\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const onChunk = jest.fn();
    const onComplete = jest.fn();
    const onError = jest.fn();

    await chatAPI.streamChat('Test', onChunk, jest.fn(), onComplete, onError);

    await new Promise(resolve => setTimeout(resolve, 50));

    if (onError.mock.calls.length > 0) {
      console.error('onError called with:', onError.mock.calls[0][0]);
    }

    expect(onError).not.toHaveBeenCalled();
    expect(fetchWithRetry).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle token from localStorage fallback', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue(null);
    localStorageMock.getItem.mockReturnValue('localStorage-token');

    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn());

    expect(fetchWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer localStorage-token',
        }),
      })
    );
  });

  it('should handle no token error', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue(null);
    localStorageMock.getItem.mockReturnValue(null);

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should include zantara_context when context is built', async () => {
    const mockContext = {
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
    };

    (zantaraAPI.buildContext as jest.Mock).mockResolvedValue(mockContext);

    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn(), [], {
      enrichContext: true,
    });

    expect(fetchWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('zantara_context'),
      })
    );
  });

  it('should handle 401 authentication error', async () => {
    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Authentication failed. Please log in again.',
      })
    );
  });

  it('should handle other HTTP errors', async () => {
    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'HTTP error! status: 500',
      })
    );
  });

  it('should handle no reader available', async () => {
    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: null,
    });

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No reader available',
      })
    );
  });

  it('should handle metadata events', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode('data: {"type": "metadata", "data": {"intent": "question"}}\n\n')
        );
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const onMetadata = jest.fn();
    const onComplete = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), onMetadata, onComplete, jest.fn());

    expect(onMetadata).toHaveBeenCalledWith({ intent: 'question' });
    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle error events in stream', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type": "error", "data": "Stream error"}\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Stream error',
      })
    );
  });

  it('should handle JSON parse errors in SSE', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: invalid json\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const onComplete = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), onComplete, jest.fn());

    expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse SSE line');
    expect(onComplete).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should handle raw text streaming (non-SSE)', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('Raw text response'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const onChunk = jest.fn();
    const onComplete = jest.fn();

    await chatAPI.streamChat('Test', onChunk, jest.fn(), onComplete, jest.fn());

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(onChunk).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle non-Error exceptions', async () => {
    (fetchWithRetry as jest.Mock).mockRejectedValue('String error');

    const onError = jest.fn();

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), onError);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should call quickChat with correct options', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const streamChatSpy = jest.spyOn(chatAPI, 'streamChat');

    await chatAPI.quickChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn());

    expect(streamChatSpy).toHaveBeenCalledWith(
      'Test',
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      expect.any(Function),
      undefined,
      { enrichContext: false, saveConversation: false }
    );

    streamChatSpy.mockRestore();
  });

  it('should get context successfully', async () => {
    const mockContext = {
      session: {
        sessionId: 'test',
        userEmail: 'test@example.com',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      },
    };

    (zantaraAPI.buildContext as jest.Mock).mockResolvedValue(mockContext);

    const context = await chatAPI.getContext('test message');

    expect(context).toEqual(mockContext);
    expect(zantaraAPI.buildContext).toHaveBeenCalledWith('test message');
  });

  it('should handle getContext errors', async () => {
    (zantaraAPI.buildContext as jest.Mock).mockRejectedValue(new Error('Context error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const context = await chatAPI.getContext('test');

    expect(context).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should save conversation successfully', async () => {
    (zantaraAPI.saveConversation as jest.Mock).mockResolvedValue({
      success: true,
      conversationId: 123,
    });

    const result = await chatAPI.saveConversation([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]);

    expect(result).toBe(true);
  });

  it('should handle saveConversation errors', async () => {
    (zantaraAPI.saveConversation as jest.Mock).mockRejectedValue(new Error('Save error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await chatAPI.saveConversation([
      { role: 'user', content: 'Hello' },
    ]);

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should load history successfully', async () => {
    const mockHistory = [
      { role: 'user', content: 'Hello', timestamp: '2024-01-01' },
      { role: 'assistant', content: 'Hi!', timestamp: '2024-01-01' },
    ];

    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue(mockHistory);

    const history = await chatAPI.loadHistory(50);

    expect(history).toEqual(mockHistory);
    expect(zantaraAPI.loadConversationHistory).toHaveBeenCalledWith(50);
  });

  it('should handle loadHistory errors', async () => {
    (zantaraAPI.loadConversationHistory as jest.Mock).mockRejectedValue(new Error('Load error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const history = await chatAPI.loadHistory();

    expect(history).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should clear history successfully', async () => {
    (zantaraAPI.clearConversationHistory as jest.Mock).mockResolvedValue(true);
    (zantaraAPI.clearSession as jest.Mock).mockImplementation(() => { });

    const result = await chatAPI.clearHistory();

    expect(result).toBe(true);
    expect(zantaraAPI.clearSession).toHaveBeenCalled();
  });

  it('should handle clearHistory errors', async () => {
    (zantaraAPI.clearConversationHistory as jest.Mock).mockRejectedValue(new Error('Clear error'));

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await chatAPI.clearHistory();

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should post-process turn when saveConversation is enabled', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type": "token", "data": "Response"}\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    (zantaraAPI.postProcessTurn as jest.Mock).mockResolvedValue(undefined);

    const onComplete = jest.fn();
    await chatAPI.streamChat(
      'Hello',
      jest.fn(),
      jest.fn(),
      onComplete,
      jest.fn(),
      [{ role: 'user', content: 'Previous' }],
      { saveConversation: true }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(zantaraAPI.postProcessTurn).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle postProcessTurn errors gracefully', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type": "token", "data": "Response"}\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    (zantaraAPI.postProcessTurn as jest.Mock).mockRejectedValue(new Error('Post-process error'));

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const onComplete = jest.fn();

    await chatAPI.streamChat('Hello', jest.fn(), jest.fn(), onComplete, jest.fn(), [], {
      saveConversation: true,
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[ChatClient] Post-process failed:',
      expect.any(Error)
    );
    expect(onComplete).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should include conversation history in post-process', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"type": "token", "data": "Response"}\n\n'));
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    const conversationHistory = [
      { role: 'user', content: 'First' },
      { role: 'assistant', content: 'First response' },
    ];

    await chatAPI.streamChat(
      'Second',
      jest.fn(),
      jest.fn(),
      jest.fn(),
      jest.fn(),
      conversationHistory,
      { saveConversation: true }
    );

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(zantaraAPI.postProcessTurn).toHaveBeenCalledWith(
      'Second',
      'Response',
      expect.arrayContaining([
        { role: 'user', content: 'First' },
        { role: 'assistant', content: 'First response' },
        { role: 'user', content: 'Second' },
        { role: 'assistant', content: 'Response' },
      ])
    );
  });

  it('should handle server-side environment (no navigator/Intl)', async () => {
    const originalNavigator = (global as any).navigator;
    const originalIntl = (global as any).Intl;
    delete (global as any).navigator;
    delete (global as any).Intl;

    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn());

    expect(fetchWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"client_locale":"en-US"'),
      })
    );

    if (originalNavigator) (global as any).navigator = originalNavigator;
    if (originalIntl) (global as any).Intl = originalIntl;
  });

  it('should handle browser environment with navigator and Intl', async () => {
    (global as any).navigator = { language: 'it-IT' };
    (global as any).Intl = {
      DateTimeFormat: jest.fn().mockReturnValue({
        resolvedOptions: () => ({ timeZone: 'Europe/Rome' }),
      }),
    };

    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn());

    expect(fetchWithRetry).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"client_locale":"it-IT"'),
      })
    );
  });

  it('should log token sources in browser environment', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    (fetchWithRetry as jest.Mock).mockResolvedValue({
      ok: true,
      body: mockStream,
    });

    localStorageMock.getItem.mockReturnValue('localStorage-token');

    // We don't mock Object.keys as it breaks Jest. 
    // Instead we trust that console.log will be called regardless of token keys found.

    await chatAPI.streamChat('Test', jest.fn(), jest.fn(), jest.fn(), jest.fn());

    await new Promise(resolve => setTimeout(resolve, 50));

    // Verify console.log was called
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleLogSpy.mockRestore();
  });
});

