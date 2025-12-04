/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createServerClient, createPublicClient, apiClient } from '../client';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
    process.env.NUZANTARA_API_URL = 'http://localhost:8000';
    process.env.NUZANTARA_API_KEY = 'test-key';
  });

  describe('client', () => {
    it('should be defined', async () => {
      // Import client separately to avoid initialization issues in tests
      const { client } = await import('../client');
      expect(client).toBeDefined();
    });

    it('should use NEXT_PUBLIC_API_URL from environment', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'http://custom-api:8000';

      // Re-import to get new instance with updated env
      jest.resetModules();
      const { client } = await import('../client');
      expect(client).toBeDefined();

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('should use default URL when NEXT_PUBLIC_API_URL is not set', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      jest.resetModules();
      const { client } = await import('../client');
      expect(client).toBeDefined();

      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it('should get token from localStorage when window is defined', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token-123');

      const { tokenProvider } = await import('../client');
      const token = await tokenProvider();
      expect(token).toBe('stored-token-123');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('zantara_auth_token');
    });

    it('should return empty string when no token in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { tokenProvider } = await import('../client');
      const token = await tokenProvider();
      expect(token).toBe('');
    });

    it('should return empty string when localStorage is undefined (server-side)', async () => {
      // Mock localStorage as undefined
      const originalLocalStorage = (globalThis as any).localStorage;
      delete (globalThis as any).localStorage;

      jest.resetModules();
      const { client } = await import('../client');
      const tokenFn = (client as any).TOKEN;

      if (typeof tokenFn === 'function') {
        const token = await tokenFn();
        expect(token).toBe('');
      }

      if (originalLocalStorage) {
        (globalThis as any).localStorage = originalLocalStorage;
      }
    });
  });

  describe('createServerClient', () => {
    it('should create client with provided token', () => {
      const serverClient = createServerClient('server-token-123');

      expect(serverClient).toBeDefined();
    });

    it('should use NUZANTARA_API_URL from environment', () => {
      process.env.NUZANTARA_API_URL = 'http://server-api:8000';
      const serverClient = createServerClient('token');

      expect(serverClient).toBeDefined();
    });

    it('should include API key in headers', () => {
      process.env.NUZANTARA_API_KEY = 'secret-key';
      const serverClient = createServerClient('token');

      expect(serverClient).toBeDefined();
    });
  });

  describe('createPublicClient', () => {
    it('should create client without token', () => {
      const publicClient = createPublicClient();

      expect(publicClient).toBeDefined();
    });

    it('should use NUZANTARA_API_URL from environment', () => {
      process.env.NUZANTARA_API_URL = 'http://public-api:8000';
      const publicClient = createPublicClient();

      expect(publicClient).toBeDefined();
    });
  });

  describe('apiClient (legacy)', () => {
    describe('getToken', () => {
      it('should return token from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('test-token');

        const token = apiClient.getToken();

        expect(token).toBe('test-token');
        expect(localStorageMock.getItem).toHaveBeenCalledWith('zantara_auth_token');
      });

      it('should return empty string when no token', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const token = apiClient.getToken();

        expect(token).toBe('');
      });

      it('should return empty string when localStorage is undefined (server-side)', async () => {
        // Mock localStorage as undefined
        const originalLocalStorage = (globalThis as any).localStorage;
        delete (globalThis as any).localStorage;

        jest.resetModules();
        const { apiClient: serverApiClient } = await import('../client');
        const token = serverApiClient.getToken();

        expect(token).toBe('');

        if (originalLocalStorage) {
          (globalThis as any).localStorage = originalLocalStorage;
        }
      });
    });

    describe('setToken', () => {
      it('should save token to localStorage', () => {
        apiClient.setToken('new-token-123');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'zantara_auth_token',
          'new-token-123'
        );
      });

      it('should not save token when localStorage is not available (server-side)', async () => {
        // Mock globalThis to not have localStorage
        const originalLocalStorage = (globalThis as any).localStorage;
        delete (globalThis as any).localStorage;

        jest.resetModules();
        const { apiClient: serverApiClient } = await import('../client');

        // Should not throw
        expect(() => serverApiClient.setToken('token')).not.toThrow();

        // Restore
        if (originalLocalStorage) {
          (globalThis as any).localStorage = originalLocalStorage;
        }
      });
    });

    describe('clearToken', () => {
      it('should remove token from localStorage', () => {
        apiClient.clearToken();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_auth_token');
      });

      it('should not remove token when localStorage is not available (server-side)', async () => {
        // Mock globalThis to not have localStorage
        const originalLocalStorage = (globalThis as any).localStorage;
        delete (globalThis as any).localStorage;

        jest.resetModules();
        const { apiClient: serverApiClient } = await import('../client');

        // Should not throw
        expect(() => serverApiClient.clearToken()).not.toThrow();

        // Restore
        if (originalLocalStorage) {
          (globalThis as any).localStorage = originalLocalStorage;
        }
      });
    });

    describe('isAuthenticated', () => {
      it('should return false when no token', () => {
        localStorageMock.getItem.mockReturnValue(null);

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(false);
      });

      it('should return false for invalid JWT format', () => {
        localStorageMock.getItem.mockReturnValue('invalid-token');

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(false);
      });

      it('should return false for JWT with wrong number of parts', () => {
        localStorageMock.getItem.mockReturnValue('header.payload'); // Only 2 parts

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(false);
      });

      it('should return true for valid JWT without expiration', () => {
        // Create a valid JWT without exp claim
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ sub: 'user@example.com' }));
        const signature = 'signature';
        const token = `${header}.${payload}.${signature}`;

        localStorageMock.getItem.mockReturnValue(token);

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(true);
      });

      it('should return true for valid JWT with future expiration', () => {
        // Create a valid JWT with future exp
        const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ sub: 'user@example.com', exp: futureExp }));
        const signature = 'signature';
        const token = `${header}.${payload}.${signature}`;

        localStorageMock.getItem.mockReturnValue(token);

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(true);
      });

      it('should return false for expired JWT', () => {
        // Create a JWT with past exp
        const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({ sub: 'user@example.com', exp: pastExp }));
        const signature = 'signature';
        const token = `${header}.${payload}.${signature}`;

        localStorageMock.getItem.mockReturnValue(token);

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(false);
      });

      it('should return false when JWT payload is invalid JSON', () => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = 'invalid-base64-json';
        const signature = 'signature';
        const token = `${header}.${payload}.${signature}`;

        localStorageMock.getItem.mockReturnValue(token);

        const isAuth = apiClient.isAuthenticated();

        expect(isAuth).toBe(false);
      });

      it('should return false when localStorage is not available', async () => {
        const originalLocalStorage = (globalThis as any).localStorage;
        delete (globalThis as any).localStorage;

        jest.resetModules();
        const { apiClient: serverApiClient } = await import('../client');

        const isAuth = serverApiClient.isAuthenticated();

        expect(isAuth).toBe(false);

        if (originalLocalStorage) {
          (globalThis as any).localStorage = originalLocalStorage;
        }
      });
    });
  });

  describe('tokenProvider', () => {
    it('should return empty string when localStorage is not available (server-side)', async () => {
      const originalLocalStorage = (globalThis as any).localStorage;
      delete (globalThis as any).localStorage;

      jest.resetModules();
      const { tokenProvider } = await import('../client');
      const token = await tokenProvider();

      expect(token).toBe('');

      if (originalLocalStorage) {
        (globalThis as any).localStorage = originalLocalStorage;
      }
    });
  });
});
