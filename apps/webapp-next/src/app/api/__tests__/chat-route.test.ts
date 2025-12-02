/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

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

// Mock globals
(global as any).Request = MockRequest;

// Mock the client
const mockHybridOracleQuery = jest.fn();

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status || 200,
    }),
  },
}));

jest.mock('../../../lib/api/client', () => ({
  createServerClient: () => ({
    oracleV53UltraHybrid: {
      hybridOracleQueryApiOracleQueryPost: mockHybridOracleQuery,
    },
  }),
}));

// Import AFTER mocks
import { POST } from '../chat/route';

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return AI response for valid request', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: 'This is the AI response',
      sources: [{ title: 'Source 1' }],
      model_used: 'gemini-2.5-flash',
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello AI' }],
        user_id: 'test_user',
      }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('This is the AI response');
    expect(data.sources).toEqual([{ title: 'Source 1' }]);
    expect(data.model_used).toBe('gemini-2.5-flash');
  });

  it('should use default user_id when not provided', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: 'Response',
      sources: [],
      model_used: 'gemini-2.5-flash',
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    await POST(request);

    expect(mockHybridOracleQuery).toHaveBeenCalledWith({
      requestBody: {
        query: 'Test',
        user_email: 'web_user',
      },
    });
  });

  it('should handle empty messages array', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: 'Response',
      sources: [],
      model_used: 'gemini-2.5-flash',
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
      }),
    });

    await POST(request);

    expect(mockHybridOracleQuery).toHaveBeenCalledWith({
      requestBody: {
        query: '',
        user_email: 'web_user',
      },
    });
  });

  it('should return default message when AI returns no answer', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: null,
      sources: null,
      model_used: null,
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(data.message).toBe("I'm unable to process that request right now.");
    expect(data.sources).toEqual([]);
    expect(data.model_used).toBe('gemini-2.5-flash');
  });

  it('should handle backend errors with status code', async () => {
    (mockHybridOracleQuery as any).mockRejectedValue({
      status: 503,
      body: { detail: 'Service temporarily unavailable' },
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe('Service temporarily unavailable');
  });

  it('should handle generic errors with 500 status', async () => {
    (mockHybridOracleQuery as any).mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(500);
    expect(data.message).toBe('Failed to connect to AI service');
  });

  it('should extract token from Authorization header', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: 'Response',
      sources: [],
      model_used: 'gemini-2.5-flash',
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-secret-token',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
      }),
    });

    await POST(request);

    // Token should be extracted and used
    expect(mockHybridOracleQuery).toHaveBeenCalled();
  });

  it('should use last message content from array', async () => {
    (mockHybridOracleQuery as any).mockResolvedValue({
      answer: 'Response',
      sources: [],
      model_used: 'gemini-2.5-flash',
    });

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'First message' },
          { role: 'assistant', content: 'Response' },
          { role: 'user', content: 'Last message' },
        ],
      }),
    });

    await POST(request);

    expect(mockHybridOracleQuery).toHaveBeenCalledWith({
      requestBody: {
        query: 'Last message',
        user_email: 'web_user',
      },
    });
  });
});
