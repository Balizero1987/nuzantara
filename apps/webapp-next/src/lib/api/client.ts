import { NuzantaraClient } from './generated/NuzantaraClient';
import { AUTH_TOKEN_KEY, API_BASE_URL } from '@/lib/constants';

/**
 * Global API Client Instance
 * Automatically configured with Base URL and Authentication
 */
export const client = new NuzantaraClient({
  BASE: API_BASE_URL,
  TOKEN: async () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    }
    return '';
  },
});

/**
 * Server-side Client Factory (Authenticated)
 * Use this in Next.js Route Handlers or Server Components
 * @param token - The JWT token extracted from cookies or headers
 */
export const createServerClient = (token: string) => {
  return new NuzantaraClient({
    BASE: process.env.NUZANTARA_API_URL || 'http://localhost:8000',
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
    BASE: process.env.NUZANTARA_API_URL || 'http://localhost:8000',
    HEADERS: {
      'X-API-Key': process.env.NUZANTARA_API_KEY || '',
    },
  });
};

/**
 * Legacy API Client Export (for backward compatibility)
 * @deprecated Use `client` instead
 */
export const apiClient = {
  getToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      return globalThis.localStorage.getItem(AUTH_TOKEN_KEY) || '';
    }
    return '';
  },
  setToken: (token: string) => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.setItem(AUTH_TOKEN_KEY, token);
      // Clean up legacy keys
      globalThis.localStorage.removeItem('token');
      globalThis.localStorage.removeItem('zantara_session_token');
    }
  },
  clearToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.removeItem(AUTH_TOKEN_KEY);
      // Clean up legacy keys
      globalThis.localStorage.removeItem('token');
      globalThis.localStorage.removeItem('zantara_session_token');
    }
  },
};
