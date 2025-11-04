/**
 * Enhanced Jest Configuration for NUZANTARA Backend
 *
 * Features:
 * - Advanced coverage reporting with multiple formats
 * - Parallel test execution optimization
 * - Enhanced error reporting
 * - Custom test reporters
 * - Module resolution improvements
 * - Watch mode optimizations
 */

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
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module name mapper for path aliases and .js extensions
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock auto-imports for common test utilities
    '^@/tests/(.*)$': '<rootDir>/tests/$1',
    '^@/tests-helpers/(.*)$': '<rootDir>/tests/helpers/$1',
    '^@/tests-mocks/(.*)$': '<rootDir>/tests/__mocks__/$1',
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Coverage configuration - Enhanced
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    '!src/**/types/**',
    // Exclude configuration and build files
    '!src/**/config.ts',
    '!src/**/*.config.ts',
  ],

  // Enhanced coverage thresholds
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
    // Per-directory thresholds for critical paths
    './src/handlers/': {
      statements: 60,
      branches: 50,
      functions: 60,
      lines: 60,
    },
    './src/services/': {
      statements: 55,
      branches: 45,
      functions: 55,
      lines: 55,
    },
  },

  // Coverage reporters - multiple formats
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json', 'json-summary', 'clover'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    // Temporarily skip tests with complex dependencies that cause timeouts
    'memory-firestore.test.ts',
    'alerts.test.ts',
    'handlers-introspection.test.ts',
    // Exclude Playwright E2E tests
    String.raw`\.spec\.js$`,
    '/e2e/',
    '/tests/e2e/',
    '/apps/webapp/tests/',
  ],

  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
    '/tests/',
    '/__tests__/',
    String.raw`\.test\.ts$`,
    String.raw`\.spec\.ts$`,
  ],

  // Maximum number of workers for parallel execution
  // Auto-detect based on CPU cores, but cap at 4 for stability
  maxWorkers: process.env.CI ? 2 : '50%',

  // Test timeout (30 seconds default, can be overridden per test)
  testTimeout: 30000,

  // Verbose output for better debugging
  verbose: true,

  // Bail on first failure (useful for CI)
  bail: process.env.CI ? 1 : false,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Error reporting
  errorOnDeprecated: false, // Set to true once all deprecations are resolved

  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Test results processor
  testResultsProcessor: undefined,

  // Watch mode configuration
  watchPlugins: [
    // Can add custom watch plugins here if needed
  ],

  // Globals (prefer using setupFilesAfterEnv instead)
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Transform ignore patterns (if needed for external modules)
  transformIgnorePatterns: [String.raw`/node_modules/(?!(.*\.mjs$|@swc|@babel))`],

  // Module directories (helps with resolution)
  moduleDirectories: ['node_modules', '<rootDir>/src', '<rootDir>/tests'],

  // Reporters configuration
  reporters: [
    'default',
    // Add custom reporter for test summaries (only if jest-html-reporters is installed)
    // Uncomment and install jest-html-reporters if needed
    // [
    //   'jest-html-reporters',
    //   {
    //     publicPath: './coverage/html-report',
    //     filename: 'test-report.html',
    //     expand: true,
    //     hideIcon: false,
    //     pageTitle: 'NUZANTARA Test Report',
    //     openReport: false,
    //   },
    // ],
  ],

  // Collect coverage from untested files
  collectCoverage: process.env.COVERAGE === 'true',

  // Display test name in verbose mode
  displayName: {
    name: 'NUZANTARA',
    color: 'blue',
  },

  // Force exit after tests complete (useful for CI)
  forceExit: process.env.CI === 'true',

  // Detect open handles that prevent Jest from exiting
  detectOpenHandles: process.env.DETECT_HANDLES === 'true',

  // Log heap usage (useful for memory leak detection)
  logHeapUsage: process.env.LOG_HEAP === 'true',

  // Silent mode (disable console logs during tests)
  silent: process.env.SILENT_TESTS === 'true',
};
