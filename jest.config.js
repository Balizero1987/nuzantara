/**
 * Root Jest Configuration for NUZANTARA Monorepo
 * 
 * This config ensures that:
 * - dist directories are excluded from test discovery
 * - Only source files are tested
 * - Workspaces use their own jest.config.js when running tests from their directory
 */

export default {
  // Root directories - only search in src, never in dist
  roots: ['<rootDir>/apps/backend-ts/src'],

  // Test file patterns - only in src, exclude dist explicitly
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts',
  ],

  // Module paths
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Module name mapper for path aliases and .js extensions
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/apps/backend-ts/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // Global ignore patterns - exclude dist everywhere (as fallback)
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '.*dist.*',
    '.*/dist/.*',
    '<rootDir>/.*/dist/',
  ],

  // Coverage should only come from src, never dist
  collectCoverageFrom: [
    'apps/backend-ts/src/**/*.ts',
    '!apps/backend-ts/src/**/__tests__/**',
    '!apps/backend-ts/src/**/*.test.ts',
    '!apps/backend-ts/src/**/index.ts',
    '!**/dist/**',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Test environment
  testEnvironment: 'node',

  // Use SWC for fast TypeScript transformation with ESM support
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },

  // ESM support
  extensionsToTreatAsEsm: ['.ts'],

  // Verbose output for better debugging
  verbose: true,

  // Test timeout (30 seconds for integration tests)
  testTimeout: 30000,

  // Max workers for parallel test execution
  maxWorkers: '50%',
};

