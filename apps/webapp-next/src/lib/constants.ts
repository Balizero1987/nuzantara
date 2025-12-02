export const AUTH_TOKEN_KEY = 'zantara_auth_token';

/**
 * API Base URL for client-side requests
 *
 * Uses proxy route to avoid CORS issues and enable server-side authentication.
 * The proxy at /api/backend forwards requests to the actual backend with proper auth.
 *
 * For direct backend calls (server-side), use NUZANTARA_API_URL env var.
 */
export const API_BASE_URL = '/api/backend';

/**
 * Direct backend URL for server-side requests only
 * This should NOT be used in browser code
 */
export const DIRECT_BACKEND_URL = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';

export const USER_DATA_KEY = 'zantara_user_data';
