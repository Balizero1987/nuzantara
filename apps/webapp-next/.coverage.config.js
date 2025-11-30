/**
 * Coverage configuration for frontend Next.js app
 * Target: 90% coverage (aligned with backend)
 */

module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/generated/**',
    '!src/**/*.config.{js,ts}',
    '!src/app/**', // Next.js app router pages (tested via E2E)
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Per-module thresholds for critical paths
    'src/lib/store/**': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'src/lib/api/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    'src/lib/utils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    'src/hooks/**': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
}

