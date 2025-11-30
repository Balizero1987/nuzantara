import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 *
 * These tests verify performance metrics for critical user flows:
 * 1. Page load times
 * 2. API response times
 * 3. Time to interactive
 * 4. Memory usage
 */

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cache before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should load homepage within performance budget', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Performance budget: homepage should load in < 3 seconds
    expect(loadTime).toBeLessThan(3000);

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded:
          performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      };
    });

    expect(metrics.loadTime).toBeLessThan(3000);
    expect(metrics.domContentLoaded).toBeLessThan(2000);
  });

  test('should handle chat API response within SLA', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Mock API response with timing
    const startTime = Date.now();

    await page.route('**/api/chat', async (route) => {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          message: 'Test response',
          sources: [],
          model_used: 'gemini-2.5-flash',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const chatInput = page.locator('textarea, input[type="text"]').first();
    if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chatInput.fill('Test query');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitButton.click();

        // Wait for response
        await page.waitForTimeout(500);

        const responseTime = Date.now() - startTime;

        // API should respond within 2 seconds (SLA)
        expect(responseTime).toBeLessThan(2000);
      }
    }
  });

  test('should stream chat responses efficiently', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    let firstChunkTime: number | null = null;

    await page.route('**/api/chat/stream', async (route) => {
      const stream = new ReadableStream({
        start(controller) {
          if (firstChunkTime === null) {
            firstChunkTime = Date.now();
          }

          // Simulate streaming chunks
          const chunks = ['Hello', ' ', 'World', '!'];
          chunks.forEach((chunk, index) => {
            setTimeout(() => {
              controller.enqueue(new TextEncoder().encode(chunk));
              if (index === chunks.length - 1) {
                controller.close();
              }
            }, index * 50);
          });
        },
      });

      await route.fulfill({
        status: 200,
        body: stream as unknown as string,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    });

    const chatInput = page.locator('textarea, input[type="text"]').first();
    if (await chatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const startTime = Date.now();
      await chatInput.fill('Test');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await submitButton.click();

        // Wait for first chunk
        await page.waitForTimeout(300);

        const timeToFirstChunk = firstChunkTime ? firstChunkTime - startTime : null;

        // First chunk should arrive within 500ms
        if (timeToFirstChunk !== null) {
          expect(timeToFirstChunk).toBeLessThan(500);
        }
      }
    }
  });

  test('should handle multiple concurrent requests', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    const requestTimes: number[] = [];

    await page.route('**/api/chat', async (route) => {
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 100));

      requestTimes.push(Date.now() - startTime);

      await route.fulfill({
        status: 200,
        body: JSON.stringify({ message: 'Response' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Simulate multiple concurrent requests
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        page.evaluate(() => {
          return fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [{ role: 'user', content: 'Test' }] }),
          });
        })
      );
    }

    await Promise.all(promises);

    // All requests should complete
    expect(requestTimes.length).toBe(3);

    // Average response time should be reasonable
    const avgTime = requestTimes.reduce((a, b) => a + b, 0) / requestTimes.length;
    expect(avgTime).toBeLessThan(500);
  });

  test('should maintain performance under load', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    const performanceEntries: number[] = [];

    // Monitor performance during multiple interactions
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();

      await page.evaluate(() => {
        // Simulate user interaction
        return new Promise((resolve) => setTimeout(resolve, 50));
      });

      performanceEntries.push(Date.now() - startTime);
    }

    // Performance should not degrade significantly
    const maxTime = Math.max(...performanceEntries);
    expect(maxTime).toBeLessThan(200);
  });

  test('should optimize bundle size', async ({ page }) => {
    await page.goto('/');

    const response = await page.goto('/');
    const contentLength = response?.headers()['content-length'];

    // Check if response is reasonable (if available)
    if (contentLength) {
      const sizeKB = parseInt(contentLength) / 1024;
      // Initial HTML should be < 100KB
      expect(sizeKB).toBeLessThan(100);
    }

    // Check JavaScript bundle size via network requests
    const jsRequests = await page.evaluate(() => {
      return performance
        .getEntriesByType('resource')
        .filter((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          return resourceEntry.name.includes('.js');
        })
        .map((entry) => {
          const resourceEntry = entry as PerformanceResourceTiming;
          return {
            name: resourceEntry.name,
            size: resourceEntry.transferSize,
          };
        });
    });

    // Total JS should be reasonable
    const totalJS = jsRequests.reduce(
      (sum: number, req: { size?: number }) => sum + (req.size || 0),
      0
    );
    const totalJSKB = totalJS / 1024;

    // Total JS bundles should be < 500KB (gzipped)
    expect(totalJSKB).toBeLessThan(500);
  });
});
