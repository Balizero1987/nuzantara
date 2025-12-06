import { NuzantaraClient } from './generated/NuzantaraClient';
import { AUTH_TOKEN_KEY, API_BASE_URL, DIRECT_BACKEND_URL } from '../constants';

// Token refresh configuration
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh if less than 5 minutes to expiry
const TOKEN_REFRESH_KEY = 'zantara_token_refresh_in_progress';
const TOKEN_EXPIRY_KEY = 'zantara_token_expiry';

/**
 * Parse JWT token and extract expiration time
 */
function parseTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

/**
 * Check if token needs refresh (expiring soon or already expired)
 */
export function tokenNeedsRefresh(token: string): boolean {
  const expiry = parseTokenExpiry(token);
  if (!expiry) return false;
  return Date.now() >= expiry - TOKEN_REFRESH_THRESHOLD_MS;
}

/**
 * Check if token is completely expired
 */
export function isTokenExpired(token: string): boolean {
  const expiry = parseTokenExpiry(token);
  if (!expiry) return false;
  return Date.now() >= expiry;
}

/**
 * Get token expiry timestamp
 */
export function getTokenExpiry(token: string): number | null {
  return parseTokenExpiry(token);
}

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
      // Also store expiry for quick checks
      const expiry = getTokenExpiry(token);
      if (expiry) {
        globalThis.localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
      }
    }
  },

  /**
   * Remove JWT token from localStorage
   */
  clearToken: () => {
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      globalThis.localStorage.removeItem(AUTH_TOKEN_KEY);
      globalThis.localStorage.removeItem(TOKEN_EXPIRY_KEY);
      globalThis.localStorage.removeItem(TOKEN_REFRESH_KEY);
    }
  },

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated: () => {
    const token = apiClient.getToken();
    if (!token) return false;
    return !isTokenExpired(token);
  },

  /**
   * Check if token needs refresh (will expire soon)
   */
  needsRefresh: () => {
    const token = apiClient.getToken();
    if (!token) return false;
    return tokenNeedsRefresh(token);
  },

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry: () => {
    const token = apiClient.getToken();
    if (!token) return 0;
    const expiry = getTokenExpiry(token);
    if (!expiry) return Infinity;
    return Math.max(0, expiry - Date.now());
  },

  /**
   * Refresh the authentication token
   * Returns true if refresh was successful, false otherwise
   */
  refreshToken: async (): Promise<boolean> => {
    // Prevent concurrent refresh attempts
    if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const refreshInProgress = globalThis.localStorage.getItem(TOKEN_REFRESH_KEY);
      if (refreshInProgress === 'true') {
        console.log('[ApiClient] Token refresh already in progress, skipping');
        return false;
      }
      globalThis.localStorage.setItem(TOKEN_REFRESH_KEY, 'true');
    }

    try {
      const currentToken = apiClient.getToken();
      if (!currentToken) {
        console.warn('[ApiClient] No token to refresh');
        return false;
      }

      console.log('[ApiClient] Attempting token refresh...');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        console.error('[ApiClient] Token refresh failed:', response.status);
        return false;
      }

      const data = await response.json();
      if (data.token) {
        apiClient.setToken(data.token);
        console.log('[ApiClient] Token refreshed successfully');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[ApiClient] Token refresh error:', error);
      return false;
    } finally {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        globalThis.localStorage.removeItem(TOKEN_REFRESH_KEY);
      }
    }
  },
};
