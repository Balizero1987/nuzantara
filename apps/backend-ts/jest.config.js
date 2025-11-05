export default {
  // Root directories - only search in src, never in dist
  roots: ['<rootDir>/src'],

  // Use SWC for fast TypeScript transformation with ESM support
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],

  // Test environment
  testEnvironment: 'node',

  // Test file patterns - exclude dist explicitly
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
    '!**/dist/**',
    '!**/node_modules/**',
  ],

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module name mapper for path aliases and .js extensions
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Coverage configuration - only from src, never dist
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
    '!**/dist/**',
  ],

  // Coverage thresholds (optional - can adjust based on project needs)
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
  },

  // Ignore patterns - use regex patterns that match paths
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*/dist/.*',
    '.*dist.*',
    // Temporarily skip tests with complex dependencies that cause timeouts
    'memory-firestore.test.ts',
    'alerts.test.ts',
    'handlers-introspection.test.ts',
    // Exclude Playwright E2E tests
    '\\.spec\\.js$',
    // '/e2e/', // Allow E2E tests in __tests__/e2e/
    '/tests/e2e/',
    '/apps/webapp/tests/',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Verbose output for better debugging
  verbose: true,

  // Global test setup and teardown
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',

  // Setup files that run after Jest environment is installed
  setupFilesAfterEnv: ['<rootDir>/tests/setup/enhanced-test-setup.ts'],

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Max workers for parallel test execution
  maxWorkers: '50%',
};
