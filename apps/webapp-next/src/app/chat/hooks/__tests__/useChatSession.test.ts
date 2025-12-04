/**
 * @jest-environment jsdom
 * 
 * Complete test coverage for useChatSession.ts
 * Target: 100% coverage
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useChatSession } from '../useChatSession';
import { useRouter } from 'next/navigation';
import { zantaraAPI } from '@/lib/api/zantara-integration';
import { useChatStore } from '@/lib/store/chat-store';
import { apiClient } from '@/lib/api/client';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api/zantara-integration', () => ({
  zantaraAPI: {
    initSession: jest.fn(),
    loadConversationHistory: jest.fn(),
    getCRMContext: jest.fn(),
  },
}));

jest.mock('@/lib/store/chat-store', () => ({
  useChatStore: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getToken: jest.fn(),
  },
}));

const mockRouter = {
  push: jest.fn(),
};

describe('useChatSession', () => {
  const mockSetSession = jest.fn();
  const mockReplaceMessages = jest.fn();
  const mockSetCRMContext = jest.fn();
  const mockSetSessionInitialized = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useChatStore as unknown as jest.Mock).mockReturnValue({
      setSession: mockSetSession,
      replaceMessages: mockReplaceMessages,
      setCRMContext: mockSetCRMContext,
      setSessionInitialized: mockSetSessionInitialized,
    });
    (apiClient.getToken as jest.Mock).mockReturnValue('test-token');
    
    // Mock localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should initialize session when token is available', async () => {
    const mockSession = {
      sessionId: 'test-session',
      userEmail: 'test@example.com',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    (zantaraAPI.initSession as jest.Mock).mockResolvedValue(mockSession);
    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useChatSession());

    await waitFor(() => {
      expect(zantaraAPI.initSession).toHaveBeenCalled();
      expect(mockSetSession).toHaveBeenCalledWith(mockSession);
      expect(mockSetSessionInitialized).toHaveBeenCalledWith(true);
    });

    expect(result.current.isInitialized).toBe(true);
  });

  it('should load conversation history when available', async () => {
    const mockSession = {
      sessionId: 'test-session',
      userEmail: 'test@example.com',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    const mockHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ];

    (zantaraAPI.initSession as jest.Mock).mockResolvedValue(mockSession);
    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue(mockHistory);

    renderHook(() => useChatSession());

    await waitFor(() => {
      expect(zantaraAPI.loadConversationHistory).toHaveBeenCalledWith(50);
      expect(mockReplaceMessages).toHaveBeenCalled();
    });
  });

  it('should load CRM context when session has crmClientId', async () => {
    const mockSession = {
      sessionId: 'test-session',
      userEmail: 'test@example.com',
      crmClientId: 123,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    const mockCRMContext = {
      clientId: 123,
      clientName: 'Test Client',
      status: 'active',
      practices: [{ id: 1, type: 'visa', status: 'active' }],
    };

    (zantaraAPI.initSession as jest.Mock).mockResolvedValue(mockSession);
    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue([]);
    (zantaraAPI.getCRMContext as jest.Mock).mockResolvedValue(mockCRMContext);

    renderHook(() => useChatSession());

    await waitFor(() => {
      expect(zantaraAPI.getCRMContext).toHaveBeenCalledWith('test@example.com');
      expect(mockSetCRMContext).toHaveBeenCalledWith({
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
        practices: [{ id: 1, type: 'visa', status: 'active' }],
      });
    });
  });

  it('should handle initialization errors gracefully', async () => {
    (zantaraAPI.initSession as jest.Mock).mockRejectedValue(new Error('Init failed'));

    const { result } = renderHook(() => useChatSession());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });

  it('should migrate token from old keys', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue(null);
    (globalThis.localStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === 'zantara_token') return 'old-token';
      return null;
    });

    const mockSession = {
      sessionId: 'test-session',
      userEmail: 'test@example.com',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    (zantaraAPI.initSession as jest.Mock).mockResolvedValue(mockSession);
    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue([]);

    renderHook(() => useChatSession());

    await waitFor(() => {
      expect(globalThis.localStorage.setItem).toHaveBeenCalledWith(
        'zantara_auth_token',
        'old-token'
      );
      expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith('zantara_token');
    });
  });

  it('should redirect to login when no token found after retry', async () => {
    (apiClient.getToken as jest.Mock).mockReturnValue(null);
    (globalThis.localStorage.getItem as jest.Mock).mockReturnValue(null);

    renderHook(() => useChatSession());

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    }, { timeout: 200 });
  });

  it('should not initialize twice', async () => {
    const mockSession = {
      sessionId: 'test-session',
      userEmail: 'test@example.com',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    };

    (zantaraAPI.initSession as jest.Mock).mockResolvedValue(mockSession);
    (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useChatSession());

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    const initCallCount = (zantaraAPI.initSession as jest.Mock).mock.calls.length;

    rerender();

    await waitFor(() => {
      // Should not call initSession again
      expect((zantaraAPI.initSession as jest.Mock).mock.calls.length).toBe(initCallCount);
    });
  });
});

