/**
 * Test coverage for constants.ts
 * Target: 100% coverage
 */

import { AUTH_TOKEN_KEY, API_BASE_URL, DIRECT_BACKEND_URL, USER_DATA_KEY } from '../constants';

describe('constants', () => {
  it('should export AUTH_TOKEN_KEY', () => {
    expect(AUTH_TOKEN_KEY).toBe('zantara_auth_token');
  });

  it('should export API_BASE_URL', () => {
    expect(API_BASE_URL).toBe('/api/backend');
  });

  it('should export DIRECT_BACKEND_URL', () => {
    // Should have a default value or use env var
    expect(DIRECT_BACKEND_URL).toBeDefined();
    expect(typeof DIRECT_BACKEND_URL).toBe('string');
  });

  it('should export USER_DATA_KEY', () => {
    expect(USER_DATA_KEY).toBe('zantara_user_data');
  });

  it('should use NUZANTARA_API_URL from environment if available', () => {
    const originalEnv = process.env.NUZANTARA_API_URL;
    process.env.NUZANTARA_API_URL = 'https://custom-backend.com';
    
    // Re-import to get fresh value
    jest.resetModules();
    const { DIRECT_BACKEND_URL: newUrl } = require('../constants');
    expect(newUrl).toBe('https://custom-backend.com');
    
    if (originalEnv) {
      process.env.NUZANTARA_API_URL = originalEnv;
    } else {
      delete process.env.NUZANTARA_API_URL;
    }
  });

  it('should use default URL when NUZANTARA_API_URL is not set', () => {
    const originalEnv = process.env.NUZANTARA_API_URL;
    delete process.env.NUZANTARA_API_URL;
    
    // Re-import to get fresh value
    jest.resetModules();
    const { DIRECT_BACKEND_URL: defaultUrl } = require('../constants');
    expect(defaultUrl).toBe('https://nuzantara-rag.fly.dev');
    
    if (originalEnv) {
      process.env.NUZANTARA_API_URL = originalEnv;
    }
  });
});

