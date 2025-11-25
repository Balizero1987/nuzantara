/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import { unifiedAuth } from '../js/auth/unified-auth.js';
import { getAuthHeaders, API_CONFIG } from '../js/api-config.js';

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    removeItem: function(key) {
      delete store[key];
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('Unified Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset singleton state if possible, or just rely on clearStorage
    unifiedAuth.clearStorage();
  });

  test('loginTeam should store token correctly', async () => {
    const mockResponse = {
      ok: true,
      data: {
        token: 'test-jwt-token',
        user: { name: 'Test User', email: 'test@zantara.com' },
        sessionId: 'session-123',
        permissions: ['read', 'write']
      }
    };

    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    await unifiedAuth.loginTeam('test@zantara.com', '1234');

    // Verify fetch called correctly
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/team/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@zantara.com', pin: '1234' })
      })
    );

    // Verify storage
    const storedToken = JSON.parse(localStorage.getItem('zantara-token'));
    expect(storedToken.token).toBe('test-jwt-token');
    expect(storedToken.expiresAt).toBeGreaterThan(Date.now());
    
    const storedUser = JSON.parse(localStorage.getItem('zantara-user'));
    expect(storedUser.name).toBe('Test User');
  });

  test('isAuthenticated should return true for valid token', () => {
    const validToken = {
      token: 'valid-token',
      expiresAt: Date.now() + 100000 // Future
    };
    localStorage.setItem('zantara-token', JSON.stringify(validToken));
    localStorage.setItem('zantara-user', JSON.stringify({ name: 'User' }));
    
    // Reload from storage to update instance
    unifiedAuth.loadFromStorage();
    
    expect(unifiedAuth.isAuthenticated()).toBe(true);
  });

  test('isAuthenticated should return false for expired token', () => {
    const expiredToken = {
      token: 'expired-token',
      expiresAt: Date.now() - 100000 // Past
    };
    localStorage.setItem('zantara-token', JSON.stringify(expiredToken));
    
    unifiedAuth.loadFromStorage();
    
    expect(unifiedAuth.isAuthenticated()).toBe(false);
  });

  test('getAuthHeaders should handle new JSON token format', () => {
    const validToken = {
      token: 'json-token-123',
      expiresAt: Date.now() + 100000
    };
    localStorage.setItem('zantara-token', JSON.stringify(validToken));
    
    const headers = getAuthHeaders();
    expect(headers['Authorization']).toBe('Bearer json-token-123');
  });

  test('getAuthHeaders should handle legacy string token', () => {
    localStorage.setItem('zantara-token', 'legacy-string-token');
    
    const headers = getAuthHeaders();
    expect(headers['Authorization']).toBe('Bearer legacy-string-token');
  });
});
