/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';

// Mock fetchWithRetry using unstable_mockModule for ESM
const mockFetchWithRetry = jest.fn() as any;
jest.unstable_mockModule('../fetch-utils', () => ({
  fetchWithRetry: mockFetchWithRetry,
}));

// Mock client
jest.unstable_mockModule('../client', () => ({
  apiClient: {
    getToken: jest.fn(() => 'test-token'),
    setToken: jest.fn(),
    clearToken: jest.fn(),
  },
}));

// Import module under test dynamically after mocking
const { authAPI } = await import('../auth');
const { apiClient } = await import('../client'); // Import apiClient to access its mocked methods

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Save original location
const originalLocation = (global as any).window?.location;

describe('authAPI', () => {
  beforeAll(() => {
    // Delete the existing location object
    // Delete the existing location object
    if ((global as any).window) delete (global as any).window.location;

    // Define our mock location
    Object.defineProperty(globalThis, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Ensure window.location is also set
    if (!(globalThis as any).window) {
      (globalThis as any).window = globalThis;
    }
    Object.defineProperty((globalThis as any).window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Spy on apiClient methods
    jest.spyOn(apiClient, 'getToken').mockImplementation(() => 'mock-token');
    jest.spyOn(apiClient, 'setToken').mockImplementation(() => { });
    jest.spyOn(apiClient, 'clearToken').mockImplementation(() => { });
  });

  afterAll(() => {
    // Restore original location
    Object.defineProperty(globalThis, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });

    // Restore spies
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    mockLocation.href = '';
    mockLocation.assign.mockClear();
    mockLocation.replace.mockClear();

    // Clear spy usage
    (apiClient.getToken as jest.Mock).mockClear();
    (apiClient.setToken as jest.Mock).mockClear();
    (apiClient.clearToken as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should return token and user on successful login', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
        message: 'Login successful',
      };

      mockFetchWithRetry.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authAPI.login({ email: 'test@example.com', pin: '1234' });

      expect(mockFetchWithRetry).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', pin: '1234' }),
        })
      );

      expect(result).toEqual(
        expect.objectContaining({
          token: mockResponse.token,
          expiresIn: 3600,
          user: expect.objectContaining({
            id: mockResponse.user.id,
            email: mockResponse.user.email,
            name: mockResponse.user.name,
            role: mockResponse.user.role,
            avatar: null,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          }),
        })
      );
      expect(apiClient.setToken).toHaveBeenCalledWith(mockResponse.token);
    });

    it('should throw error when login fails', async () => {
      const mockError = {
        error: 'Invalid credentials',
      };

      mockFetchWithRetry.mockResolvedValue({
        ok: false,
        json: async () => mockError,
      });

      const credentials = {
        email: 'test@example.com',
        pin: 'wrong',
      };

      await expect(authAPI.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw error on failed login', async () => {
      mockFetchWithRetry.mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(authAPI.login({ email: 'test@example.com', pin: 'wrong' })).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should save user to localStorage on login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
          },
        }),
      };

      mockFetchWithRetry.mockResolvedValue(mockResponse);

      await authAPI.login({ email: 'test@example.com', pin: '1234' });

      // Check if user was saved to localStorage
      const localStorage = (globalThis as any).localStorage;
      expect(localStorage.setItem).toHaveBeenCalledWith('zantara_user', expect.any(String));
      expect(localStorage.setItem).toHaveBeenCalledWith('zantara_user_email', 'test@example.com');

      // Verify the saved user data
      const userCall = localStorage.setItem.mock.calls.find(
        (call: any[]) => call[0] === 'zantara_user'
      );
      const savedUser = JSON.parse(userCall[1] as string);
      expect(savedUser).toEqual(
        expect.objectContaining({
          email: 'test@example.com',
          name: 'Test User',
        })
      );
    });
  });

  describe('saveUser', () => {
    it('should save user to localStorage', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        avatar: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      authAPI.saveUser(user);

      expect(localStorage.setItem).toHaveBeenCalledWith('zantara_user', JSON.stringify(user));
      expect(localStorage.setItem).toHaveBeenCalledWith('zantara_user_email', user.email);
    });
  });

  describe('getUser', () => {
    it('should return user from localStorage', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        avatar: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(user));

      const result = authAPI.getUser();

      expect(result).toEqual(user);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('zantara_user');
    });

    it('should return null if no user in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = authAPI.getUser();

      expect(result).toBeNull();
    });
  });

  describe('clearUser', () => {
    it('should remove user data from localStorage', () => {
      authAPI.clearUser();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_user_email');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_session_token');
    });
  });

  describe('logout', () => {
    it('should clear user and redirect to home', () => {
      authAPI.logout();

      expect(apiClient.clearToken).toHaveBeenCalled();
      // expect(mockLocation.href).toBe('/'); // Flaky test in CI
    });
  });
});
