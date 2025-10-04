/**
 * Global test setup for NUZANTARA project
 * Configures environment, mocks, and test utilities
 */

import { jest } from '@jest/globals';

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';
process.env.API_KEY = 'test-api-key-12345';
process.env.EXTERNAL_API_KEY = 'test-external-key-67890';

// Mock sensitive API keys (prevent real API calls in tests)
process.env.OPENAI_API_KEY = 'sk-test-openai-key-mock';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-mock';
process.env.GEMINI_API_KEY = 'test-gemini-key-mock';
process.env.COHERE_API_KEY = 'test-cohere-key-mock';

// Google Cloud / Firebase
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/mock-credentials.json';
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8081';

// Twilio
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
process.env.TWILIO_WHATSAPP_NUMBER = 'whatsapp:+15555551234';

// Meta WhatsApp
process.env.WHATSAPP_VERIFY_TOKEN = 'test-verify-token';
process.env.WHATSAPP_ACCESS_TOKEN = 'test-access-token';
process.env.WHATSAPP_PHONE_NUMBER_ID = '123456789';

// RAG Backend
process.env.RAG_BACKEND_URL = 'http://localhost:8000';

// Disable bridge proxy in tests
process.env.BRIDGE_ENABLED = 'false';

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests (optional)
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Keep error and warn for debugging
  error: originalConsole.error,
  warn: originalConsole.warn,
};

// Global beforeAll hook
beforeAll(() => {
  console.info('🧪 Starting NUZANTARA test suite...');
});

// Global afterAll hook
afterAll(() => {
  console.info('✅ NUZANTARA test suite completed');
});

// Global test helpers
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockRequest = (body: any = {}, headers: any = {}) => ({
  body,
  headers: {
    'x-api-key': process.env.API_KEY,
    ...headers,
  },
  get: (key: string) => headers[key],
  ip: '127.0.0.1',
  ctx: { role: 'member', apiKey: process.env.API_KEY },
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

// Export test utilities
export { jest };
