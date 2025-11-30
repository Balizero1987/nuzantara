import type { ChatMetadata } from './types';
import { apiClient } from './client';

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
      const storage = globalThis.localStorage;
      token =
        storage.getItem('token') ||
        storage.getItem('zantara_token') ||
        storage.getItem('zantara_session_token') ||
        '';
    }

    console.log(
      '[ChatClient] Token available:',
      !!token,
      token ? `${token.substring(0, 10)}...` : 'None'
    );

    // Log token sources only in browser
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const storage = globalThis.localStorage;
      console.log('[ChatClient] Token sources:', {
        apiClient: apiClient.getToken() ? 'found' : 'not found',
        localStorage_token: storage.getItem('token') ? 'found' : 'not found',
        zantara_token: storage.getItem('zantara_token') ? 'found' : 'not found',
        zantara_session_token: storage.getItem('zantara_session_token') ? 'found' : 'not found',
        allKeys: Object.keys(storage).filter((k) => k.toLowerCase().includes('token')),
      });
    }
    console.log('[ChatClient] Conversation history length:', conversationHistory?.length || 0);

    if (!token) {
      console.error('[ChatClient] No token found in any storage location');
      onError(new Error('No authentication token found. Please log in.'));
      return;
    }

    try {
      const response = await fetch('/api/chat/stream', {
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
    } catch (error) {
      onError(error as Error);
    }
  },
};
