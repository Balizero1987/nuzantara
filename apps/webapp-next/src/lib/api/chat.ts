import type { ChatMetadata } from './types';
import { apiClient } from './client';
import { AUTH_TOKEN_KEY } from '@/lib/constants';
import { authAPI } from './auth';
import { zantaraAPI, type ZantaraContext } from './zantara-integration';
import { fetchWithRetry } from './fetch-utils';

export interface EnrichedChatRequest {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  context?: ZantaraContext;
}

export const chatAPI = {
  /**
   * Stream chat with full ZANTARA integration
   * - Enriches context with CRM, Memory, and Agentic data
   * - Saves conversations to backend
   * - Stores important memories
   */
  async streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: ChatMetadata) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    conversationHistory?: Array<{ role: string; content: string }>,
    options?: {
      enrichContext?: boolean;
      saveConversation?: boolean;
    }
  ): Promise<void> {
    const { enrichContext = true, saveConversation = true } = options || {};

    // Try multiple ways to get token
    let token = apiClient.getToken();

    // Fallback: try localStorage directly (only in browser)
    if (!token && typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      token = globalThis.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    }

    console.log(
      '[ChatClient] Token available:',
      !!token,
      token ? `${token.substring(0, 10)}...` : 'None'
    );

    // Log token sources only in browser
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const storage = globalThis.localStorage;
      const allKeys = Object.keys(storage);
      const tokenKeys = allKeys.filter((k) => k.toLowerCase().includes('token'));
      const tokenValues = tokenKeys.map((k) => ({
        key: k,
        value: storage.getItem(k)?.substring(0, 20) + '...',
      }));

      console.log('[ChatClient] Token sources:', {
        apiClient: apiClient.getToken() ? 'found' : 'not found',
        apiClientValue: apiClient.getToken()
          ? apiClient.getToken()?.substring(0, 20) + '...'
          : 'none',
        localStorage_token: storage.getItem('token') ? 'found' : 'not found',
        zantara_token: storage.getItem('zantara_token') ? 'found' : 'not found',
        zantara_session_token: storage.getItem('zantara_session_token') ? 'found' : 'not found',
        allTokenKeys: tokenKeys,
        tokenValues: tokenValues,
      });
    }
    console.log('[ChatClient] Conversation history length:', conversationHistory?.length || 0);

    // Get token from single source of truth
    // const token = apiClient.getToken(); // Already got above

    if (!token) {
      console.error('[ChatClient] No authentication token found');
      onError(new Error('No authentication token found. Please log in.'));
      return;
    }

    // Build enriched context if enabled
    let context: ZantaraContext | undefined;
    if (enrichContext) {
      try {
        console.log('[ChatClient] Building ZANTARA context...');
        context = await zantaraAPI.buildContext(message);
        console.log('[ChatClient] Context built:', {
          hasSession: !!context.session,
          hasMemories: !!context.recentMemories?.length,
          hasCRM: !!context.crmContext,
          hasAgents: !!context.agentsStatus,
        });
      } catch (error) {
        console.warn('[ChatClient] Failed to build context, proceeding without:', error);
      }
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 180 second timeout

      // Build request body with enriched context
      const requestBody: Record<string, unknown> = {
        message: message,
        user_id: authAPI.getUser()?.email || 'web_user',
        conversation_history: conversationHistory || [],
        metadata: {
          client_locale: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
          client_timezone:
            typeof Intl !== 'undefined'
              ? Intl.DateTimeFormat().resolvedOptions().timeZone
              : 'UTC',
        },
      };

      if (context) {
        requestBody.zantara_context = {
          session_id: context.session.sessionId,
          user_email: context.session.userEmail,
          crm_client_id: context.crmContext?.clientId,
          crm_client_name: context.crmContext?.clientName,
          crm_status: context.crmContext?.status,
          active_practices: context.crmContext?.practices?.map(p => p.type),
          recent_memories: context.recentMemories?.map(m => m.content),
          agents_available: context.agentsStatus?.available,
          pending_alerts: context.agentsStatus?.pendingAlerts,
        };
      }

      const response = await fetchWithRetry('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
        timeout: 180000, // 180 second timeout (3 mins)
        retries: 2, // Retry connection failures twice
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Post-process turn: save to backend and extract memories
          if (saveConversation && accumulatedContent) {
            const allMessages = [
              ...(conversationHistory || []).map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              })),
              { role: 'user' as const, content: message },
              { role: 'assistant' as const, content: accumulatedContent },
            ];

            // Fire and forget - don't block completion
            zantaraAPI.postProcessTurn(message, accumulatedContent, allMessages).catch(err => {
              console.warn('[ChatClient] Post-process failed:', err);
            });
          }

          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process buffer line by line
        if (buffer.includes('data: ')) {
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                const event = JSON.parse(dataStr);
                if (event.type === 'token' && event.data) {
                  accumulatedContent += event.data;
                  onChunk(event.data);
                } else if (event.type === 'metadata') {
                  onMetadata(event.data);
                } else if (event.type === 'error') {
                  throw new Error(event.data);
                }
              } catch {
                console.warn('Failed to parse SSE line');
              }
            }
          }
        } else {
          // Fallback for raw text streaming if not SSE
          accumulatedContent += buffer;
          onChunk(buffer);
          buffer = '';
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        onError(error);
      } else {
        onError(new Error(String(error)));
      }
    }
  },

  /**
   * Quick chat without context enrichment (for simple queries)
   */
  async quickChat(
    message: string,
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: ChatMetadata) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<void> {
    return this.streamChat(
      message,
      onChunk,
      onMetadata,
      onComplete,
      onError,
      conversationHistory,
      { enrichContext: false, saveConversation: false }
    );
  },

  /**
   * Get conversation context for the current session
   */
  async getContext(message: string): Promise<ZantaraContext | null> {
    try {
      return await zantaraAPI.buildContext(message);
    } catch (error) {
      console.error('[ChatClient] Failed to get context:', error);
      return null;
    }
  },

  /**
   * Save conversation manually
   */
  async saveConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<boolean> {
    try {
      const result = await zantaraAPI.saveConversation(messages);
      return result.success;
    } catch (error) {
      console.error('[ChatClient] Failed to save conversation:', error);
      return false;
    }
  },

  /**
   * Load conversation history from backend
   */
  async loadHistory(limit: number = 50): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    try {
      return await zantaraAPI.loadConversationHistory(limit);
    } catch (error) {
      console.error('[ChatClient] Failed to load history:', error);
      return [];
    }
  },

  /**
   * Clear conversation history (both local and backend)
   */
  async clearHistory(): Promise<boolean> {
    try {
      // Clear backend
      const result = await zantaraAPI.clearConversationHistory();

      // Clear local session
      zantaraAPI.clearSession();

      return result;
    } catch (error) {
      console.error('[ChatClient] Failed to clear history:', error);
      return false;
    }
  },
};
