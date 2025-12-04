/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */

/**
 * Tests for /api/auth/login route handler
 */

import { createPublicClient } from '@/lib/api/client';

// Mock Request for node environment - MUST be before imports
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

// Mock global Request
(global as any).Request = MockRequest;

// Mock NextResponse
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: { status?: number }) => {
        return {
          json: async () => body,
          status: init?.status || 200,
        };
      },
    },
  };
});

// Mock client
jest.mock('@/lib/api/client', () => ({
  createPublicClient: jest.fn(),
  createServerClient: jest.fn(),
}));

// Import AFTER mocks are set up
import { POST } from '../auth/login/route';

describe('POST /api/auth/login', () => {
  let mockTeamLoginApiAuthTeamLoginPost: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock implementation
    mockTeamLoginApiAuthTeamLoginPost = jest.fn();
    (createPublicClient as jest.Mock).mockReturnValue({
      identity: {
        teamLoginApiAuthTeamLoginPost: mockTeamLoginApiAuthTeamLoginPost,
      },
    });
  });

  it('should return token and user on successful login', async () => {
    const mockResponse = {
      token: 'jwt-token-123',
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    };
    mockTeamLoginApiAuthTeamLoginPost.mockResolvedValue(mockResponse);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', pin: '123456' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('jwt-token-123');
    expect(data.user).toEqual(mockResponse.user);
    expect(data.message).toBe('Login successful');
  });

  it('should call backend with correct credentials', async () => {
    mockTeamLoginApiAuthTeamLoginPost.mockResolvedValue({
      token: 'token',
      user: {},
    });

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', pin: '999999' }),
    });

    await POST(request);

    expect(mockTeamLoginApiAuthTeamLoginPost).toHaveBeenCalledWith({
      requestBody: { email: 'user@example.com', pin: '999999' },
    });
  });

  it('should return 500 on backend error without status', async () => {
    mockTeamLoginApiAuthTeamLoginPost.mockRejectedValue(new Error('Network error'));

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', pin: '123456' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Authentication service unavailable');
  });

  it('should return backend status code on error', async () => {
    const backendError = {
      status: 401,
      body: { detail: 'Invalid credentials' },
    };
    mockTeamLoginApiAuthTeamLoginPost.mockRejectedValue(backendError);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', pin: 'wrong' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid credentials');
  });

  it('should return default message when no detail in error', async () => {
    const backendError = {
      status: 403,
      body: {},
    };
    mockTeamLoginApiAuthTeamLoginPost.mockRejectedValue(backendError);

    const request = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', pin: '123456' }),
    });

    const response = await POST(request);
    const data: any = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Authentication service unavailable');
  });
});
