/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

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
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  collectCoverageFrom: [
    // ========================================
    // FULL COVERAGE (95% target)
    // ========================================

    // Core library files
    'src/lib/**/*.{js,jsx,ts,tsx}',

    // Custom components (business logic)
    'src/components/calendar/**/*.{js,jsx,ts,tsx}',
    'src/components/chat/**/*.{js,jsx,ts,tsx}',
    'src/components/crm/**/*.{js,jsx,ts,tsx}',
    'src/components/modern-sidebar/**/*.{js,jsx,ts,tsx}',
    'src/components/productivity/**/*.{js,jsx,ts,tsx}',
    'src/components/providers/**/*.{js,jsx,ts,tsx}',
    'src/components/theme-provider.{js,jsx,ts,tsx}',

    // Hooks
    'src/hooks/**/*.{js,jsx,ts,tsx}',

    // App pages
    'src/app/**/page.{js,jsx,ts,tsx}',
    'src/app/layout.{js,jsx,ts,tsx}',

    // API route handlers
    'src/app/api/**/route.{js,jsx,ts,tsx}',

    // ========================================
    // EXCLUSIONS
    // ========================================
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/lib/api/generated/**', // Auto-generated OpenAPI client
    '!src/**/*.config.{js,ts}',

    // Exclude shadcn/ui components (already well-tested by library)
    '!src/components/ui/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 85, // Realistic target given complex component logic
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/e2e/', // Exclude E2E tests (run with Playwright)
    'e2e/.*\\.spec\\.ts$', // Exclude all Playwright test files
    '.*\\.spec\\.ts$', // Exclude all spec files (Playwright)
  ],
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  // Transform ignore patterns for node_modules except specific packages
  transformIgnorePatterns: [
    '/node_modules/(?!(zustand|@testing-library|react-markdown|remark-.*|unified|bail|trough|vfile|unist-.*|hast-.*|mdast-.*|micromark.*|decode-named-character-reference|character-entities|property-information|space-separated-tokens|comma-separated-tokens|ccount|escape-string-regexp|markdown-table|trim-lines|devlop)/)',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
