/**
 * @nuzantara/config
 * Shared configuration constants and environment handling
 */

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

// Default ports
export const DEFAULT_BACKEND_PORT = 8080;
export const DEFAULT_RAG_PORT = 8000;

// API versions
export const API_VERSION = 'v1';

// Export all config
export * from './config/index.js';
