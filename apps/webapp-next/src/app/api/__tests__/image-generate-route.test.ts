/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

// Mock Request for node environment
class MockRequest {
  url: string;
  method: string;
  headers: Map<string, string>;
  private _body: string;

  constructor(
    url: string,
    options: { method?: string; headers?: Record<string, string>; body?: string } = {}
  ) {
    this.url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body || '';
  }

  async json() {
    return JSON.parse(this._body);
  }
}

class MockResponse {
  status: number;
  headers: Map<string, string>;
  body: any;
  private _body: any;

  constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
    this._body = body;
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Map(Object.entries(init?.headers || {}));
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
}

// Mock globals
(global as any).Request = MockRequest;
(global as any).Response = MockResponse;

// Mock global fetch
const mockFetch = jest.fn() as unknown as jest.Mock<(...args: any[]) => Promise<any>>;
(global as any).fetch = mockFetch;

// Import AFTER mocks
import { POST } from '../image/generate/route';

describe('Image Generate API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      NUZANTARA_API_KEY: 'test-api-key',
      NUZANTARA_API_URL: 'https://test-backend.example.com',
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('should return generated image for valid request', async () => {
    const mockImageData = {
      image_url: 'https://example.com/image.png',
      prompt: 'A beautiful sunset',
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockImageData,
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset',
        style: 'realistic',
      }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.image_url).toBe('https://example.com/image.png');
    expect(data.prompt).toBe('A beautiful sunset');
  });

  it('should forward authorization header to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ image_url: 'test.png' }),
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-auth-token',
      },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer my-auth-token',
        }),
      })
    );
  });

  it('should handle backend error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'Invalid prompt' }),
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: '' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid prompt');
  });

  it('should handle backend error without detail', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Image generation failed');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to connect to Image service');
  });

  it('should use correct API URL and key', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ image_url: 'test.png' }),
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/image/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': expect.any(String),
        }),
      })
    );
  });

  it('should forward request body to backend', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ image_url: 'test.png' }),
    });

    const requestBody = {
      prompt: 'A cat in space',
      style: 'cartoon',
      size: '1024x1024',
    };

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(requestBody),
      })
    );
  });

  it('should handle empty authorization header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ image_url: 'test.png' }),
    });

    const request = new Request('http://localhost/api/image/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test' }),
    });

    await POST(request);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: '',
        }),
      })
    );
  });
});
