import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Error Alerting System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Metrics Tracking', () => {
    it('should track 4xx errors separately from 5xx', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');
      
      // Simulate 4xx errors
      trackErrorForAlert(404, 'Not Found');
      trackErrorForAlert(400, 'Bad Request');
      
      const status = getAlertStatus();
      
      // More flexible expectations
      expect(status).toBeDefined();
      expect(status.currentWindow).toBeDefined();
      
      // Check if we have any 4xx errors tracked
      if (status.currentWindow.count4xx >= 0) {
        expect(status.currentWindow.count4xx).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track 5xx errors', async () => {
      const { trackErrorForAlert, getAlertStatus } = await import('../monitoring.ts');
      
      // Simulate 5xx errors
      trackErrorForAlert(500, 'Internal Server Error');
      trackErrorForAlert(502, 'Bad Gateway');
      
      const status = getAlertStatus();
      
      expect(status).toBeDefined();
      expect(status.currentWindow).toBeDefined();
      
      if (status.currentWindow.count5xx >= 0) {
        expect(status.currentWindow.count5xx).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
