import type { ChatMetadata } from './types';
import { apiClient } from '@/lib/api/client';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

// Timeout and retry configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

/**
 * Fetch with timeout using AbortController
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeout: number = DEFAULT_TIMEOUT,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);

      // Retry on 502, 503, 504
      if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
        console.warn(`[ChatAPI] Received ${response.status}, retry attempt ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 4000));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on abort (timeout)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      // Retry on network errors
      if (attempt < maxRetries) {
        console.warn(`[ChatAPI] Retry attempt ${attempt + 1}/${maxRetries} after error:`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt] || 4000));
        continue;
      }
    }
  }

  throw lastError || new Error('Request failed after all retries');
}

export const chatAPI = {
  // Client-side chat API wrapper
  async streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: ChatMetadata) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<void> {
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

    if (!token) {
      console.error('[ChatClient] No token found in any storage location');
      onError(new Error('No authentication token found. Please log in.'));
      return;
    }

    try {
      const response = await fetchWithRetry(
        '/api/chat/stream',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message,
            user_id: 'web_user',
            conversation_history: conversationHistory || [],
          }),
        },
        60000 // 60s timeout for streaming
      );

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

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          onComplete();
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process buffer line by line (assuming backend sends SSE-like or chunked text)
        // If backend sends raw text chunks, just call onChunk.
        // If backend sends "data: {...}", parse it.
        // The proxy returns response.body directly.
        // Let's assume the backend sends raw text or SSE.
        // The original code handled SSE "data: ".

        // Simple text streaming for now, or try to parse SSE if detected
        if (buffer.includes('data: ')) {
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6);
              try {
                // Try to parse as JSON first
                const event = JSON.parse(dataStr);
                if (event.type === 'token' && event.data) onChunk(event.data);
                else if (event.type === 'metadata') onMetadata(event.data);
                else if (event.type === 'error') throw new Error(event.data);
              } catch (e) {
                // If not JSON, maybe just text?
                // But "data: " implies SSE structure.
                console.warn('Failed to parse SSE:', e);
              }
            }
          }
        } else {
          // Fallback for raw text streaming if not SSE
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
};
