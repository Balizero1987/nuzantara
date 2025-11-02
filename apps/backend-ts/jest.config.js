export default {
  // Use SWC for fast TypeScript transformation with ESM support
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],

  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module name mapper for path aliases and .js extensions
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/index.ts',
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

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    // Temporarily skip tests with complex dependencies that cause timeouts
    'memory-firestore.test.ts',
    'alerts.test.ts',
    'handlers-introspection.test.ts',
    // Exclude Playwright E2E tests
    '\\.spec\\.js$',
    '/e2e/',
    '/tests/e2e/',
    '/apps/webapp/tests/',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Verbose output for better debugging
  verbose: true,
};
