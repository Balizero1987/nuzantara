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
const mockFetch = jest.fn() as unknown as jest.Mock<(...args: any[]) => Promise<any>>;
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
    });

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
    });

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
    });

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
    });

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
    mockFetch.mockRejectedValue(new Error('Network failure'));

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
    });

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
    });

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
    });

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
});
