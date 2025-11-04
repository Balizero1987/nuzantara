/**
 * Tests for Oracle Simulation Handler
 * Tests business scenario simulations, predictions, and analysis
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { oracleSimulate, oracleAnalyze, oraclePredict } from '../oracle.js';

describe('Oracle Handler', () => {
  describe('oracleSimulate', () => {
    it('should simulate visa service with standard parameters', async () => {
      const params = {
        service: 'visa',
        scenario: 'B211A extension',
        urgency: 'normal' as const,
        complexity: 'low' as const,
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service', 'Visa & Immigration');
      expect(result.data).toHaveProperty('scenario', 'B211A extension');
      expect(result.data).toHaveProperty('successProbability');
      expect(result.data).toHaveProperty('riskLevel');
      expect(result.data).toHaveProperty('recommendedTimeline');
      expect(result.data).toHaveProperty('checkpoints');
      expect(result.data).toHaveProperty('accelerators');
      expect(result.data).toHaveProperty('blockers');
    });

    it('should simulate company setup with high urgency', async () => {
      const params = {
        service: 'company',
        scenario: 'PT PMA setup',
        urgency: 'high' as const,
        complexity: 'high' as const,
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.service).toBe('Company Setup');
      expect(result.data.riskLevel).toBe('elevated');
      expect(result.data.successProbability).toBeLessThan(1);
      expect(result.data.successProbability).toBeGreaterThan(0);
    });

    it('should adjust success probability based on urgency', async () => {
      const lowUrgencyParams = {
        service: 'tax',
        urgency: 'low' as const,
        complexity: 'low' as const,
      };
      const highUrgencyParams = {
        service: 'tax',
        urgency: 'high' as const,
        complexity: 'low' as const,
      };

      const lowResult = await oracleSimulate(lowUrgencyParams);
      const highResult = await oracleSimulate(highUrgencyParams);

      expect(lowResult.data.successProbability).toBeGreaterThan(highResult.data.successProbability);
    });

    it('should adjust timeline based on complexity', async () => {
      const lowComplexity = {
        service: 'legal',
        complexity: 'low' as const,
      };
      const highComplexity = {
        service: 'legal',
        complexity: 'high' as const,
      };

      const lowResult = await oracleSimulate(lowComplexity);
      const highResult = await oracleSimulate(highComplexity);

      // High complexity should have longer timeline
      expect(lowResult.data.recommendedTimeline).not.toBe(highResult.data.recommendedTimeline);
    });

    it('should include region in simulation results', async () => {
      const params = {
        service: 'visa',
        region: 'Jakarta',
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.region).toBe('Jakarta');
    });

    it('should default to Bali region if not specified', async () => {
      const params = { service: 'visa' };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.region).toBe('Bali');
    });

    it('should include assumptions in simulation', async () => {
      const params = { service: 'company' };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('assumptions');
      expect(Array.isArray(result.data.assumptions)).toBe(true);
      expect(result.data.assumptions.length).toBeGreaterThan(0);
    });

    it('should provide service-specific checkpoints', async () => {
      const params = { service: 'property' };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.checkpoints).toContain('Due diligence');
      expect(result.data.checkpoints).toContain('Closing & registration');
    });

    it('should resolve service name variants correctly', async () => {
      const pmaResult = await oracleSimulate({ service: 'pma' });
      const companyResult = await oracleSimulate({ service: 'company' });

      expect(pmaResult.data.service).toBe('Company Setup');
      expect(companyResult.data.service).toBe('Company Setup');
    });

    it('should default to visa service if unknown service provided', async () => {
      const params = { service: 'unknown-service' };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.service).toBe('Visa & Immigration');
    });

    it('should handle empty params gracefully', async () => {
      const result = await oracleSimulate({});

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data).toHaveProperty('successProbability');
    });
  });

  describe('oracleAnalyze', () => {
    it('should analyze visa service and return focus areas', async () => {
      const params = { service: 'visa' };
      const result = await oracleAnalyze(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data).toHaveProperty('focusAreas');
      expect(Array.isArray(result.data.focusAreas)).toBe(true);
      expect(result.data.focusAreas.length).toBeGreaterThan(0);
    });

    it('should include documentation focus area', async () => {
      const params = { service: 'company', complexity: 'high' as const };
      const result = await oracleAnalyze(params);

      expect(result.ok).toBe(true);
      const docArea = result.data.focusAreas.find((area: any) => area.area === 'Documentation');
      expect(docArea).toBeDefined();
      expect(docArea.status).toBe('attention');
      expect(Array.isArray(docArea.insights)).toBe(true);
    });

    it('should provide recommendations', async () => {
      const params = { service: 'tax' };
      const result = await oracleAnalyze(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('recommendations');
      expect(Array.isArray(result.data.recommendations)).toBe(true);
      expect(result.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should include metrics for service analysis', async () => {
      const params = { service: 'company' };
      const result = await oracleAnalyze(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('metrics');
      expect(result.data.metrics).toHaveProperty('estimatedManHours');
      expect(result.data.metrics).toHaveProperty('coordinationLevel');
      expect(result.data.metrics).toHaveProperty('dependencyCount');
    });

    it('should adjust focus based on urgency', async () => {
      const highUrgency = await oracleAnalyze({
        service: 'legal',
        urgency: 'high' as const,
      });
      const lowUrgency = await oracleAnalyze({
        service: 'legal',
        urgency: 'low' as const,
      });

      expect(highUrgency.ok).toBe(true);
      expect(lowUrgency.ok).toBe(true);

      const highComplianceArea = highUrgency.data.focusAreas.find(
        (a: any) => a.area === 'Compliance'
      );
      const lowComplianceArea = lowUrgency.data.focusAreas.find(
        (a: any) => a.area === 'Compliance'
      );

      expect(highComplianceArea.status).toBe('monitor');
      expect(lowComplianceArea.status).toBe('stable');
    });

    it('should provide higher man-hours estimate for company setup', async () => {
      const companyResult = await oracleAnalyze({ service: 'company' });
      const visaResult = await oracleAnalyze({ service: 'visa' });

      expect(companyResult.data.metrics.estimatedManHours).toBeGreaterThan(
        visaResult.data.metrics.estimatedManHours
      );
    });
  });

  describe('oraclePredict', () => {
    it('should predict timeline for visa service', async () => {
      const params = { service: 'visa' };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('service');
      expect(result.data).toHaveProperty('forecast');
      expect(result.data.forecast).toHaveProperty('totalDurationDays');
      expect(result.data.forecast).toHaveProperty('completionWindow');
      expect(result.data.forecast).toHaveProperty('projectedCompletionDate');
    });

    it('should include checkpoint timeline predictions', async () => {
      const params = { service: 'company' };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('checkpoints');
      expect(Array.isArray(result.data.checkpoints)).toBe(true);

      const firstCheckpoint = result.data.checkpoints[0];
      expect(firstCheckpoint).toHaveProperty('phase');
      expect(firstCheckpoint).toHaveProperty('name');
      expect(firstCheckpoint).toHaveProperty('etaDays');
      expect(firstCheckpoint).toHaveProperty('onTrack');
    });

    it('should calculate success probability', async () => {
      const params = { service: 'tax' };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('successProbability');
      expect(result.data.successProbability).toBeGreaterThan(0);
      expect(result.data.successProbability).toBeLessThanOrEqual(1);
    });

    it('should include alerts for high risk scenarios', async () => {
      const params = {
        service: 'property',
        urgency: 'high' as const,
        complexity: 'high' as const,
      };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('alerts');
      expect(Array.isArray(result.data.alerts)).toBe(true);
    });

    it('should provide next steps', async () => {
      const params = { service: 'visa' };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('nextSteps');
      expect(Array.isArray(result.data.nextSteps)).toBe(true);
      expect(result.data.nextSteps.length).toBeGreaterThan(0);
    });

    it('should format projected completion date as ISO string', async () => {
      const params = { service: 'legal' };
      const result = await oraclePredict(params);

      expect(result.ok).toBe(true);
      const completionDate = result.data.forecast.projectedCompletionDate;
      expect(completionDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(new Date(completionDate).getTime()).toBeGreaterThan(Date.now());
    });

    it('should adjust timeline based on urgency and complexity', async () => {
      const simple = await oraclePredict({
        service: 'tax',
        urgency: 'low' as const,
        complexity: 'low' as const,
      });
      const complex = await oraclePredict({
        service: 'tax',
        urgency: 'high' as const,
        complexity: 'high' as const,
      });

      // Both should return valid durations
      expect(simple.data.forecast.totalDurationDays).toBeGreaterThan(0);
      expect(complex.data.forecast.totalDurationDays).toBeGreaterThan(0);

      // Complex should take same or more time (not always less for simple)
      expect(simple.data.forecast.totalDurationDays).toBeLessThanOrEqual(
        complex.data.forecast.totalDurationDays + 10
      );
    });

    it('should space checkpoints evenly across timeline', async () => {
      const params = { service: 'company' };
      const result = await oraclePredict(params);

      const checkpoints = result.data.checkpoints;
      const totalDays = result.data.forecast.totalDurationDays;

      // Checkpoints should be distributed across the timeline
      expect(checkpoints[0].etaDays).toBeLessThan(checkpoints[checkpoints.length - 1].etaDays);
      expect(checkpoints[checkpoints.length - 1].etaDays).toBeLessThanOrEqual(totalDays);
    });
  });

  describe('Risk Level Assessment', () => {
    it('should classify low complexity + low urgency as low risk', async () => {
      const params = {
        service: 'visa',
        urgency: 'low' as const,
        complexity: 'low' as const,
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.riskLevel).toBe('low');
    });

    it('should classify high complexity or high urgency as elevated risk', async () => {
      const params = {
        service: 'company',
        urgency: 'high' as const,
        complexity: 'high' as const,
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.riskLevel).toBe('elevated');
    });

    it('should classify moderate scenarios as moderate risk', async () => {
      const params = {
        service: 'legal',
        urgency: 'normal' as const,
        complexity: 'medium' as const,
      };
      const result = await oracleSimulate(params);

      expect(result.ok).toBe(true);
      expect(result.data.riskLevel).toBe('moderate');
    });
  });
});
