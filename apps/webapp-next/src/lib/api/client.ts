import { NuzantaraClient } from './generated/NuzantaraClient';
import { AUTH_TOKEN_KEY, API_BASE_URL, DIRECT_BACKEND_URL } from '../constants';

/**
 * Token provider for API authentication
 * Retrieves JWT token from localStorage for authenticated requests
 */
export const tokenProvider = async () => {
  if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
    return globalThis.localStorage.getItem(AUTH_TOKEN_KEY) || '';
  }
  return '';
};

/**
 * Global API Client Instance (Browser-side)
 *
 * Uses the proxy route (/api/backend) to avoid CORS issues.
 * The proxy injects X-API-Key authentication server-side.
 * JWT token is also forwarded from localStorage.
 */
export const client = new NuzantaraClient({
  BASE: API_BASE_URL,
  TOKEN: tokenProvider,
});

/**
 * Server-side Client Factory (Authenticated)
 * Use this in Next.js Route Handlers or Server Components
 *
 * @param token - The JWT token extracted from cookies or headers
 */
export const createServerClient = (token: string) => {
  return new NuzantaraClient({
    BASE: DIRECT_BACKEND_URL,
    TOKEN: token,
    HEADERS: {
      'X-API-Key': process.env.NUZANTARA_API_KEY || '',
    },
  });
};

/**
 * Server-side Client Factory (Public)
 * Use this for public endpoints like Login
 */
export const createPublicClient = () => {
  return new NuzantaraClient({
    BASE: DIRECT_BACKEND_URL,
    HEADERS: {
      'X-API-Key': process.env.NUZANTARA_API_KEY || '',
    },
  });
};

/**
 * API Client utilities for token management
 */
export const apiClient = {
  /**
   * Get current JWT token from localStorage
   */
  getToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    }
    return '';
  },

  /**
   * Store JWT token in localStorage
   */
  setToken: (token: string) => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },

  /**
   * Remove JWT token from localStorage
   */
  clearToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: () => {
    const token = apiClient.getToken();
    if (!token) return false;

    // Basic JWT expiration check
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      if (!exp) return true; // No expiration, assume valid

      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  },
};
