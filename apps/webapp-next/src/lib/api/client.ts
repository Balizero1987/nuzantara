import { NuzantaraClient } from './generated/NuzantaraClient';

/**
 * Global API Client Instance
 * Automatically configured with Base URL and Authentication
 */
export const client = new NuzantaraClient({
  BASE: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  TOKEN: async () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      // Try to get token from localStorage
      // Note: The auth system might store it as 'token' or inside a JSON object
      // We'll need to align this with how auth.ts currently stores it.
      return globalThis.localStorage.getItem('token') || '';
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
      const storage = globalThis.localStorage;
      // Try multiple possible keys for backward compatibility
      return (
        storage.getItem('token') ||
        storage.getItem('zantara_token') ||
        storage.getItem('zantara_session_token') ||
        ''
      );
    }
    return '';
  },
  setToken: (token: string) => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const storage = globalThis.localStorage;
      // Save to primary key
      storage.setItem('token', token);
      // Also save to zantara_token for compatibility
      storage.setItem('zantara_token', token);
      // Force synchronous write by reading back immediately
      storage.getItem('token');
      storage.getItem('zantara_token');
    }
    // Also save to globalThis.localStorage if available (for browser environments)
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const browserStorage = globalThis.localStorage;
      browserStorage.setItem('token', token);
      browserStorage.setItem('zantara_token', token);
      browserStorage.getItem('token'); // Force sync
    }
  },
  clearToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const storage = globalThis.localStorage;
      // Clear all possible token keys
      storage.removeItem('token');
      storage.removeItem('zantara_token');
      storage.removeItem('zantara_session_token');
    }
  },
};
