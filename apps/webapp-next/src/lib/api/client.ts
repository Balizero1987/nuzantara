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
    }
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
            'X-API-Key': process.env.NUZANTARA_API_KEY || ''
        }
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
            'X-API-Key': process.env.NUZANTARA_API_KEY || ''
        }
    });
};

/**
 * Legacy API Client Export (for backward compatibility)
 * @deprecated Use `client` instead
 */
export const apiClient = {
    getToken: () => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            return globalThis.localStorage.getItem('token') || '';
        }
        return '';
    },
    setToken: (token: string) => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            globalThis.localStorage.setItem('token', token);
        }
    },
    clearToken: () => {
        if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
            globalThis.localStorage.removeItem('token');
        }
    }
};
