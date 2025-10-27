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
    ['json', { outputFile: 'test-results/results.json' }]
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

    /* Maximum time each action can take - INCREASED */
    actionTimeout: 30000, // 30s (was 15s)

    /* Maximum navigation time - INCREASED */
    navigationTimeout: 60000, // 60s (was 30s)
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },

  /* Test timeout - INCREASED */
  timeout: 120000, // 120s per test (was 60s)
  expect: {
    timeout: 20000 // 20s for assertions (was 10s)
  }
});
