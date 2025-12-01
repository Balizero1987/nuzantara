import { authAPI } from '../auth';
import { apiClient } from '../client';

// Mock fetch globally
global.fetch = jest.fn();

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

// Mock window.location
const mockLocation = {
  href: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Save original location - window.location is available in Jest DOM environment
const originalLocation = window.location;

describe('authAPI', () => {
  beforeAll(() => {
    // Delete the existing location object
    // @ts-expect-error - intentionally deleting window.location for test mocking
    delete window.location;

    // Define our mock location
    Object.defineProperty(globalThis, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    // Spy on apiClient methods
    jest.spyOn(apiClient, 'getToken').mockImplementation(() => 'mock-token');
    jest.spyOn(apiClient, 'setToken').mockImplementation(() => {});
    jest.spyOn(apiClient, 'clearToken').mockImplementation(() => {});
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
    // Re-mock apiClient methods after clearAllMocks because it clears usage data AND implementations if not careful
    // But jest.clearAllMocks() only clears usage data for spies, not implementations.
    // However, let's be safe and ensure they are mocks.

    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
    mockLocation.href = '';
    mockLocation.assign.mockClear();
    mockLocation.replace.mockClear();
    (fetch as jest.Mock).mockClear();

    // Clear spy usage
    (apiClient.getToken as jest.Mock).mockClear();
    (apiClient.setToken as jest.Mock).mockClear();
    (apiClient.clearToken as jest.Mock).mockClear();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      const mockResponse = {
        token: 'test-token-123',
        user: mockUser,
        message: 'Login successful',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: 'test@example.com',
        pin: '1234',
      };

      const result = await authAPI.login(credentials);

      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            pin: credentials.pin,
          }),
          signal: expect.any(AbortSignal),
        })
      );

      expect(result.token).toBe(mockResponse.token);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.name).toBe(mockUser.name);
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.role).toBe(mockUser.role);
      expect(apiClient.setToken).toHaveBeenCalledWith(mockResponse.token);
    });

    it('should throw error when login fails', async () => {
      const mockError = {
        error: 'Invalid credentials',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      const credentials = {
        email: 'test@example.com',
        pin: 'wrong',
      };

      await expect(authAPI.login(credentials)).rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const credentials = {
        email: 'test@example.com',
        pin: '1234',
      };

      await expect(authAPI.login(credentials)).rejects.toThrow('Network error');
    });

    it('should save user to localStorage after successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      const mockResponse = {
        token: 'test-token-123',
        user: mockUser,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const credentials = {
        email: 'test@example.com',
        pin: '1234',
      };

      await authAPI.login(credentials);

      // authAPI.saveUser is called internally, which uses localStorage
      expect(localStorageMock.setItem).toHaveBeenCalled();
      // Verify it was called with user data
      const setItemCalls = localStorageMock.setItem.mock.calls;
      const userCall = setItemCalls.find((call) => call[0] === 'zantara_user');
      expect(userCall).toBeDefined();
      if (userCall) {
        const savedUser = JSON.parse(userCall[1]);
        expect(savedUser.email).toBe(mockUser.email);
      }
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
      expect(mockLocation.href).toBe('/');
    });
  });
});
