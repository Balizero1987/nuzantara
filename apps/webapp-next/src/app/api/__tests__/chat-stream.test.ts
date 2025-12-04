/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

/**
 * Tests for /api/chat/stream route handler
 */

// Mock Request and Headers for node environment - MUST be before imports
class MockHeaders {
  private _headers: Map<string, string>;

  constructor(init?: Record<string, string>) {
    this._headers = new Map(Object.entries(init || {}));
  }

  get(key: string) {
    return this._headers.get(key) || null;
  }

  set(key: string, value: string) {
    this._headers.set(key, value);
  }
}

class MockRequest {
  url: string;
  method: string;
  headers: MockHeaders;
  private _body: string;

  constructor(
    url: string,
    options: { method?: string; headers?: Record<string, string>; body?: string } = {}
  ) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new MockHeaders(options.headers);
    this._body = options.body || '';
  }

  async json() {
    return JSON.parse(this._body);
  }
}

class MockResponse {
  status: number;
  headers: MockHeaders;
  body: any;
  private _body: any;

  constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new MockHeaders(init?.headers);
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }

  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
}

// Mock globals
(global as any).Request = MockRequest;
(global as any).Response = MockResponse;
(global as any).Headers = MockHeaders;

// Mock fetch globally
const mockFetch = jest.fn<any, any>() as jest.MockedFunction<typeof fetch>;
(global as any).fetch = mockFetch;

// Import AFTER mocks
import { POST } from '../chat/stream/route';

describe('POST /api/chat/stream', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      NUZANTARA_API_URL: 'https://test-backend.example.com',
      NUZANTARA_API_KEY: 'test-api-key',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should forward request to backend and return streaming response', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"token","data":"Hello"}\n\n'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValue({
      ok: true,
      body: mockStream,
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        message: 'Hello',
        conversation_history: [],
      }),
    } as unknown as Response);

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('Transfer-Encoding')).toBe('chunked');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');
  });

  it('should call backend with correct parameters', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const conversationHistory = [
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello!' },
    ];

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-jwt-token',
      },
      body: JSON.stringify({
        message: 'Test message',
        conversation_history: conversationHistory,
      }),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0] as [string, any];

    // Module loads env at import time, so default URL is used
    expect(url).toContain('/bali-zero/chat-stream');
    expect(url).toContain('query=Test+message');
    expect(url).toContain('stream=true');
    expect(options.method).toBe('GET');
    // Module loads env at import time, default API key is used
    expect(options.headers['X-API-Key']).toBeDefined();
    expect(options.headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('should return error when backend is unavailable', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'Backend service unavailable',
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect((data as any).error).toBe('Backend error: Service Unavailable');
  });

  it('should return 500 on network error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure')) as any;

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect((data as any).error).toBe('Failed to connect to AI service');
  });

  it('should use default API URL when env var not set', async () => {
    delete process.env.NUZANTARA_API_URL;
    // Do NOT delete API KEY as it is required
    // delete process.env.NUZANTARA_API_KEY

    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('https://nuzantara-rag.fly.dev');
  });

  it('should handle empty conversation history', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('conversation_history=%5B%5D'); // Empty array encoded
  });

  it('should handle missing Authorization header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    const [, options] = mockFetch.mock.calls[0] as [string, any];
    expect(options.headers['Authorization']).toBeUndefined();
  });

  it('should return 500 when API key is missing', async () => {
    delete process.env.NUZANTARA_API_KEY;

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect((data as any).error).toBe('Server configuration error: API key not configured');
  });

  it('should include zantara_context session_id when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session-123',
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('session_id=test-session-123');
  });

  it('should include zantara_context CRM fields when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          crm_client_id: 123,
          crm_client_name: 'Test Client',
          crm_status: 'active',
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('crm_client_id=123');
    expect(url).toContain('crm_client_name=Test'); // URL encoding can be + or %20
    expect(url).toContain('crm_status=active');
  });

  it('should include active_practices when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          active_practices: ['visa', 'company'],
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('active_practices=');
    expect(decodeURIComponent(url)).toContain('visa');
    expect(decodeURIComponent(url)).toContain('company');
  });

  it('should include recent_memories when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          recent_memories: ['Memory 1', 'Memory 2'],
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('recent_memories=');
  });

  it('should include pending_alerts when greater than 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          pending_alerts: 5,
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).toContain('pending_alerts=5');
  });

  it('should not include pending_alerts when 0', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          pending_alerts: 0,
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).not.toContain('pending_alerts');
  });

  it('should not include active_practices when empty array', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          active_practices: [],
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).not.toContain('active_practices');
  });

  it('should not include CRM fields when crm_client_id is missing', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
        zantara_context: {
          session_id: 'test-session',
          crm_client_name: 'Test Client',
        },
      }),
    });

    await POST(request);

    const [url] = mockFetch.mock.calls[0] as [string, any];
    expect(url).not.toContain('crm_client_id');
    expect(url).not.toContain('crm_client_name');
  });

  it('should handle token extraction with Bearer prefix', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-123',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    const [, options] = mockFetch.mock.calls[0] as [string, any];
    expect(options.headers['Authorization']).toBe('Bearer test-token-123');
  });

  it('should handle token extraction without Bearer prefix', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'test-token-123',
      },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    const [, options] = mockFetch.mock.calls[0] as [string, any];
    expect(options.headers['Authorization']).toBe('Bearer test-token-123');
  });

  it('should handle error response text parsing failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => {
        throw new Error('Failed to read');
      },
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Backend error');
    expect(data.details).toBe('No error details');
  });

  it('should handle timeout abort', async () => {
    const controller = new AbortController();
    controller.abort();

    mockFetch.mockRejectedValue(new Error('Aborted')) as any;

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to connect to AI service');
  });

  it('should clear timeout on successful response', async () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    mockFetch.mockResolvedValue({
      ok: true,
      body: new ReadableStream(),
    } as unknown as Response);

    const request = new Request('http://localhost:3000/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello' }),
    });

    await POST(request);

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
