import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for ZANTARA Integration Tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e-tests',

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for better log analysis

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : 1, // 1 worker for sequential execution

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
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

    /* NO TIMEOUT - removed for 100-question test */
    actionTimeout: 0, // No timeout
    navigationTimeout: 0, // No timeout

    /* Human-like viewport for Mac screen visibility */
    viewport: { width: 1400, height: 900 },

    /* Headless false for full visibility */
    headless: false,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Visible and slower for better readability */
        slowMo: 1000, // 1s between actions - easy to watch
      },
    },
  ],

  /* NO TEST TIMEOUT - removed for long test */
  timeout: 0, // No timeout
  expect: {
    timeout: 0, // No timeout on assertions
  },
});
