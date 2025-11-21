import { describe, it, expect, beforeEach } from '@jest/globals';
import { ZodError } from 'zod';

describe('Zantara Dashboard', () => {
  let handlers: any;

  beforeEach(async () => {
    handlers = await import('../zantara-dashboard.js');
  });

  describe('zantaraDashboardOverview', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraDashboardOverview({
        timeframe: 'day',
        metrics: ['response_time', 'error_rate'],
        team_members: ['user1', 'user2'],
        include_predictions: true,
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.dashboard).toBeDefined();
      expect(result.data.dashboard.real_time_metrics).toBeDefined();
    });

    it('should handle missing required params with defaults', async () => {
      // timeframe has default 'day', so empty object should work
      const result = await handlers.zantaraDashboardOverview({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.zantaraDashboardOverview({
          timeframe: 'invalid_timeframe',
          invalid: 'data',
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe('zantaraTeamHealthMonitor', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraTeamHealthMonitor({
        team_members: ['user1', 'user2'],
        deep_analysis: true,
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.team_health).toBeDefined();
      expect(result.data.team_health.team_health_score).toBeDefined();
    });

    it('should handle missing required params', async () => {
      // team_members is required (min 1), so empty should fail
      await expect(handlers.zantaraTeamHealthMonitor({})).rejects.toThrow(ZodError);
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.zantaraTeamHealthMonitor({
          team_members: [], // Empty array should fail (min 1)
          invalid: 'data',
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe('zantaraPerformanceAnalytics', () => {
    it('should handle success case with valid params', async () => {
      const result = await handlers.zantaraPerformanceAnalytics({
        analysis_type: 'team',
        target_id: 'team-123',
        metrics: ['productivity', 'collaboration'],
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.performance_analytics).toBeDefined();
      expect(result.data.performance_analytics.analysis_type).toBe('team');
    });

    it('should handle missing required params with defaults', async () => {
      // analysis_type has default 'team', so empty object should work
      const result = await handlers.zantaraPerformanceAnalytics({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle invalid params', async () => {
      await expect(
        handlers.zantaraPerformanceAnalytics({
          analysis_type: 'invalid_type',
          invalid: 'data',
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe('zantaraSystemDiagnostics', () => {
    it('should handle success case with valid params', async () => {
      // zantaraSystemDiagnostics doesn't use params, accepts any
      const result = await handlers.zantaraSystemDiagnostics({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.system_diagnostics).toBeDefined();
      expect(result.data.system_diagnostics.system_health).toBeDefined();
    });

    it('should handle missing required params', async () => {
      // No required params, should succeed
      const result = await handlers.zantaraSystemDiagnostics({});

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });

    it('should handle invalid params', async () => {
      // Accepts any params, should succeed
      const result = await handlers.zantaraSystemDiagnostics({
        invalid: 'data',
      });

      expect(result).toBeDefined();
      expect(result.ok).toBe(true);
    });
  });
});
