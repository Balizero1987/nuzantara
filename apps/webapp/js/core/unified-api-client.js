 
/**
 * UnifiedAPIClient
 * Lightweight fetch wrapper with retries, auth headers, and timeout handling.
 */

import { API_CONFIG, getAuthHeaders, secureFetch } from '../api-config.js';

const DEFAULT_TIMEOUT = API_CONFIG?.timeouts?.default || 30000;
const DEFAULT_MAX_RETRIES = API_CONFIG?.retries?.maxAttempts || 3;
const DEFAULT_BACKOFF = API_CONFIG?.retries?.backoffMs || 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeContent(message) {
  if (message === undefined || message === null) {
    return '';
  }
  return typeof message === 'string' ? message : JSON.stringify(message);
}

class UnifiedAPIClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || API_CONFIG.backend?.url || '';
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = options.retries ?? DEFAULT_MAX_RETRIES;
    this.backoffMs = options.backoffMs || DEFAULT_BACKOFF;
    this.fetchImpl = options.fetchImpl || secureFetch;
  }

  buildUrl(endpoint = '') {
    if (!endpoint.startsWith('http')) {
      const base = this.baseURL?.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      return `${base}${path}`;
    }
    return endpoint;
  }

  async request(endpoint, { method = 'GET', body, headers = {}, retries } = {}) {
    const url = this.buildUrl(endpoint);
    const attempts = retries ?? this.maxRetries;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestHeaders = {
          ...getAuthHeaders(),
          ...headers,
        };

        const options = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
        };

        if (body !== undefined && body !== null) {
          if (!(body instanceof FormData)) {
            options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
          } else {
            options.body = body;
          }
        }

        const response = await this.fetchImpl(url, options);
        clearTimeout(timer);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Request failed with status ${response.status}`);
        }

        return this.parseResponse(response);
      } catch (error) {
        clearTimeout(timer);
        const isLastAttempt = attempt === attempts - 1;
        const shouldRetry = !isLastAttempt && (error.name === 'AbortError' || error.name === 'FetchError' || error.message.includes('network'));

        if (!shouldRetry) {
          console.error(`[UnifiedAPIClient] Request failed (${method} ${url}):`, error);
          throw error;
        }

        const backoff = this.backoffMs * (attempt + 1);
        await delay(backoff);
      }
    }

    throw new Error(`Failed to execute request: ${method} ${endpoint}`);
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to persist conversation messages with consistent payloads.
   */
  async storeConversationMessage({
    sessionId,
    userId,
    role = 'system',
    content,
    metadata = {},
  }) {
    const payload = {
      session_id: sessionId,
      user_id: userId,
      message_type: role,
      content: normalizeContent(content),
      metadata,
    };

    return this.post('/api/conversation/store', payload);
  }
}

if (typeof window !== 'undefined') {
  window.UnifiedAPIClient = UnifiedAPIClient;
}

export default UnifiedAPIClient;
