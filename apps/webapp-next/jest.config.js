const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
      },
    },
  },
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    // Only include business logic files
    'src/lib/store/**/*.{js,jsx,ts,tsx}',
    'src/lib/api/auth.{js,jsx,ts,tsx}',
    'src/lib/api/chat.{js,jsx,ts,tsx}',
    'src/lib/api/client.{js,jsx,ts,tsx}',
    'src/lib/utils.{js,jsx,ts,tsx}',
    'src/hooks/use-mobile.{js,jsx,ts,tsx}', // Only test critical hooks
    // Exclude everything else
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/generated/**',
    '!src/**/*.config.{js,ts}',
    '!src/app/**',
    '!src/components/**', // Exclude UI components (shadcn/ui - already tested)
    '!src/lib/api/generated/**', // Exclude generated API client
    '!src/lib/api/calendar.{js,jsx,ts,tsx}', // Not critical for coverage
    '!src/lib/api/crm.{js,jsx,ts,tsx}', // Not critical for coverage
    '!src/lib/api/socket.{js,jsx,ts,tsx}', // Not critical for coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 80, // Realistic target - branches are harder to cover
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/e2e/', // Exclude E2E tests (run with Playwright)
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  // Transform ignore patterns for node_modules except specific packages
  transformIgnorePatterns: [
    '/node_modules/(?!(zustand|@testing-library)/)',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)

