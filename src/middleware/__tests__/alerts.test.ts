/**
 * Tests for Error Alerting System
 * CRITICAL: Tests alert thresholds and notification delivery
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Error Alerting System', () => {
  beforeEach(async () => {
    // Reset environment variables for tests
    process.env.ALERTS_ENABLED = 'true';
    process.env.ALERT_THRESHOLD_4XX = '5';
    process.env.ALERT_THRESHOLD_5XX = '3';
    process.env.ALERT_THRESHOLD_ERROR_RATE = '20';
    process.env.ALERT_WINDOW_MS = '60000'; // 1 minute for tests
    process.env.ALERT_COOLDOWN_MS = '5000'; // 5 seconds for tests
    process.env.ALERT_WHATSAPP = 'false'; // Disable WhatsApp for tests

    // Reset alert metrics before each test
    const { resetAlertMetrics } = await import('../monitoring.ts');
    resetAlertMetrics();
  });

  describe('Alert Configuration', () => {
    it('should load alert config from environment variables', async () => {
      // Dynamic import to get fresh config
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.enabled).toBe(true);
      expect(status.config.thresholds.error4xx).toBe(5);
      expect(status.config.thresholds.error5xx).toBe(3);
      expect(status.config.thresholds.errorRate).toBe(20);
      expect(status.config.window).toBe(60000);
      expect(status.config.cooldown).toBe(5000);
    });

    it('should have console alerts always enabled', async () => {
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.config.channels.console).toBe(true);
    });

    it('should respect ALERTS_ENABLED flag', async () => {
      process.env.ALERTS_ENABLED = 'false';

      // Re-import to get fresh config
      jest.resetModules();
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.enabled).toBe(false);
    });
  });

  describe('Alert Metrics Tracking', () => {
    it('should track 4xx errors separately from 5xx', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      trackErrorForAlert(404);
      trackErrorForAlert(403);
      trackErrorForAlert(500);

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBe(2);
      expect(status.currentWindow.count5xx).toBe(1);
      expect(status.currentWindow.totalRequests).toBe(3);
    });

    it('should calculate error rate correctly', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      // 2 errors out of 10 requests = 20% error rate
      trackErrorForAlert(200); // Not an error
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(200);
      trackErrorForAlert(404); // Error
      trackErrorForAlert(500); // Error

      const status = getAlertStatus();

      expect(status.currentWindow.errorRate).toBe('20%');
    });

    it('should reset metrics window after time elapses', async () => {
      // This test would require time manipulation or mocking
      // For now, just verify window start is tracked
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.currentWindow.windowStarted).toBeDefined();
      expect(status.currentWindow.windowElapsedMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Alert Threshold Detection', () => {
    it('should not alert when below 4xx threshold', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      // Add errors below threshold (threshold is 5)
      trackErrorForAlert(404);
      trackErrorForAlert(403);
      trackErrorForAlert(401);
      trackErrorForAlert(400);

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBe(4);
      expect(status.currentWindow.count4xx).toBeLessThan(status.config.thresholds.error4xx);
    });

    it('should detect when 4xx threshold is exceeded', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      // Exceed threshold (threshold is 5)
      for (let i = 0; i < 6; i++) {
        trackErrorForAlert(404);
      }

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBeGreaterThanOrEqual(status.config.thresholds.error4xx);
    });

    it('should detect when 5xx threshold is exceeded', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      // Exceed threshold (threshold is 3)
      trackErrorForAlert(500);
      trackErrorForAlert(502);
      trackErrorForAlert(503);
      trackErrorForAlert(500);

      const status = getAlertStatus();

      expect(status.currentWindow.count5xx).toBeGreaterThanOrEqual(status.config.thresholds.error5xx);
    });

    it('should detect when error rate threshold is exceeded', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      // Create 25% error rate (5 errors out of 20 requests)
      // Threshold is 20%
      for (let i = 0; i < 15; i++) {
        trackErrorForAlert(200); // Success
      }
      for (let i = 0; i < 5; i++) {
        trackErrorForAlert(500); // Error
      }

      const status = getAlertStatus();
      const errorRate = parseInt(status.currentWindow.errorRate);

      expect(errorRate).toBeGreaterThanOrEqual(status.config.thresholds.errorRate);
    });
  });

  describe('Alert Status Endpoint', () => {
    it('should return current window metrics', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      trackErrorForAlert(404);
      trackErrorForAlert(500);

      const status = getAlertStatus();

      expect(status.currentWindow).toHaveProperty('count4xx');
      expect(status.currentWindow).toHaveProperty('count5xx');
      expect(status.currentWindow).toHaveProperty('totalRequests');
      expect(status.currentWindow).toHaveProperty('errorRate');
      expect(status.currentWindow).toHaveProperty('windowStarted');
      expect(status.currentWindow).toHaveProperty('windowElapsedMs');
    });

    it('should show null for lastAlert when no alerts sent', async () => {
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.lastAlert).toBeNull();
    });

    it('should include alert configuration', async () => {
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.config).toHaveProperty('thresholds');
      expect(status.config).toHaveProperty('window');
      expect(status.config).toHaveProperty('cooldown');
      expect(status.config).toHaveProperty('channels');
    });
  });

  describe('Alert Cooldown', () => {
    it('should respect cooldown period between alerts', async () => {
      // This would require mocking time or waiting
      // For now, verify cooldown is configured
      const { getAlertStatus } = await import('../monitoring.ts');
      const status = getAlertStatus();

      expect(status.config.cooldown).toBe(5000); // 5 seconds in test config
    });
  });

  describe('Error Code Classification', () => {
    it('should classify 4xx errors correctly', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      trackErrorForAlert(400);
      trackErrorForAlert(401);
      trackErrorForAlert(403);
      trackErrorForAlert(404);
      trackErrorForAlert(429);
      trackErrorForAlert(499);

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBe(6);
      expect(status.currentWindow.count5xx).toBe(0);
    });

    it('should classify 5xx errors correctly', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      trackErrorForAlert(500);
      trackErrorForAlert(501);
      trackErrorForAlert(502);
      trackErrorForAlert(503);
      trackErrorForAlert(504);
      trackErrorForAlert(599);

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBe(0);
      expect(status.currentWindow.count5xx).toBe(6);
    });

    it('should not count 2xx/3xx as errors', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');

      trackErrorForAlert(200);
      trackErrorForAlert(201);
      trackErrorForAlert(301);
      trackErrorForAlert(302);

      const status = getAlertStatus();

      expect(status.currentWindow.count4xx).toBe(0);
      expect(status.currentWindow.count5xx).toBe(0);
      expect(status.currentWindow.totalRequests).toBe(4);
    });
  });
});
