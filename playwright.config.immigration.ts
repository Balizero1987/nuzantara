import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for NUZANTARA Immigration QA Suite
 * Optimized for parallel execution and long-running tests
 */
export default defineConfig({
  testDir: './tests',
  testMatch: 'playwright_immigration_suite.ts', // Only run immigration suite

  /* Run tests in files in parallel */
  fullyParallel: true, // Enable parallelism for faster execution

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Up to 5 parallel workers for immigration tests */
  workers: process.env.CI ? 3 : 5,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report-immigration' }],
    ['list'],
    ['json', { outputFile: 'tests/output/results.json' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'https://zantara.balizero.com',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* NO TIMEOUT - essential for long AI conversations */
    actionTimeout: 0,
    navigationTimeout: 0,

    /* Human-like viewport */
    viewport: { width: 1400, height: 900 },

    /* Headless mode for parallel execution (can be disabled for debugging) */
    headless: true, // Set to false for visual debugging
  },

  /* Configure projects for Chromium only (fast and reliable) */
  projects: [
    {
      name: 'chromium-immigration',
      use: {
        ...devices['Desktop Chrome'],
        /* Faster execution without slowMo */
        slowMo: 0,
      },
    },
  ],

  /* NO TEST TIMEOUT - essential for immigration multi-turn conversations */
  timeout: 0,
  expect: {
    timeout: 0
  }
});
