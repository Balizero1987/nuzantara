/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  // Module resolution for monorepo structure
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/apps/backend-ts/src/$1',
    '^@/services/(.*)$': '<rootDir>/apps/backend-ts/src/services/$1',
  },

  // Transform TypeScript files with ts-jest
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        isolatedModules: true,
        diagnostics: false,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  // Test file patterns - search in all apps
  testMatch: [
    '**/apps/**/__tests__/**/*.test.ts',
    '**/apps/**/tests/**/*.test.ts',
    '**/apps/**/*.test.ts',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/out/',
    'apps/archived/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'apps/backend-ts/src/**/*.ts',
    '!apps/backend-ts/src/**/*.d.ts',
    '!apps/backend-ts/src/**/*.test.ts',
    '!apps/backend-ts/src/**/__tests__/**',
  ],

  // Transform ignore patterns - allow ESM modules
  transformIgnorePatterns: ['node_modules/(?!(supertest|@jest)/)'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Timeouts and performance
  testTimeout: 30000,
  maxWorkers: '50%',

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};
