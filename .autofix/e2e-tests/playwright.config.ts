import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential for metrics collection
  forbidOnly: !!process.env.CI,
  retries: 0, // No retries - we want to see real failures
  workers: 1, // Single worker for normal tests (10 for concurrent test)
  timeout: 120000, // 120s timeout (increased from 30s)
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'https://zantara.balizero.com',
    trace: 'on', // Always capture trace
    screenshot: 'on', // Always capture screenshots
    video: 'on', // Always capture video
    headless: false, // Headful mode - VISIBILE sul tuo schermo!

    // SLOW DOWN per rendere visibile l'automazione
    launchOptions: {
      slowMo: 100, // Rallenta di 100ms ogni azione (più veloce)
    },

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: false,

    // Collect HAR files
    recordHar: {
      mode: 'full',
      path: `har-files/test-${Date.now()}.har`
    }
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        // Performance monitoring
        contextOptions: {
          recordVideo: {
            dir: 'videos/',
            size: { width: 1280, height: 720 }
          }
        }
      },
    },

    // Concurrent users project (10 workers)
    {
      name: 'concurrent',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
      testMatch: /.*concurrent\.spec\.ts/,
      fullyParallel: true,
      workers: 10
    },

    // High latency project
    {
      name: 'high-latency',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
      testMatch: /.*latency\.spec\.ts/,
    },

    // Packet loss project
    {
      name: 'packet-loss',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
      testMatch: /.*packet-loss\.spec\.ts/,
    }
  ],

  // Output folders
  outputDir: 'test-results/',
});
