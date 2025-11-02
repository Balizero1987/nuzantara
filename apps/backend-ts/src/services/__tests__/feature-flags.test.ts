import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { featureFlags, FeatureFlag } from '../feature-flags.js';

describe('FeatureFlags', () => {
  beforeEach(() => {
    // Reset environment
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('FF_')) {
        delete process.env[key];
      }
    });
    featureFlags.reload();
  });

  describe('Environment-based configuration', () => {
    it('should be disabled by default', () => {
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(false);
    });

    it('should be enabled when environment variable is set', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'true';
      featureFlags.reload();
      
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(true);
    });

    it('should handle numeric values', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = '1';
      featureFlags.reload();
      
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(true);
    });
  });

  describe('Gradual rollout', () => {
    it('should enable for percentage of users', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'true';
      process.env.FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE = '50';
      featureFlags.reload();
      
      // Test multiple users - some should be enabled, some not
      let enabledCount = 0;
      for (let i = 0; i < 100; i++) {
        if (featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId: `user-${i}` })) {
          enabledCount++;
        }
      }
      
      // Should be roughly 50% (allowing some variance)
      expect(enabledCount).toBeGreaterThan(30);
      expect(enabledCount).toBeLessThan(70);
    });

    it('should be deterministic for same user', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'true';
      process.env.FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE = '50';
      featureFlags.reload();
      
      const userId = 'test-user-123';
      const result1 = featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId });
      const result2 = featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId });
      
      expect(result1).toBe(result2); // Same user should always get same result
    });

    it('should work with IP addresses', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'true';
      process.env.FF_ENABLE_CIRCUIT_BREAKER_PERCENTAGE = '50';
      featureFlags.reload();
      
      const ip = '192.168.1.1';
      const result1 = featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { ip });
      const result2 = featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { ip });
      
      expect(result1).toBe(result2);
    });
  });

  describe('Allowlist', () => {
    it('should enable for specific users even when globally disabled', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'false';
      process.env.FF_ENABLE_CIRCUIT_BREAKER_USERS = 'user1,user2,user3';
      featureFlags.reload();
      
      // Allowlist should work even if globally disabled
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId: 'user1' })).toBe(true);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId: 'user2' })).toBe(true);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { userId: 'user4' })).toBe(false);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(false); // No context, should be false
    });

    it('should enable for specific IPs even when globally disabled', () => {
      process.env.FF_ENABLE_CIRCUIT_BREAKER = 'false';
      process.env.FF_ENABLE_CIRCUIT_BREAKER_IPS = '192.168.1.1,10.0.0.1';
      featureFlags.reload();
      
      // Allowlist should work even if globally disabled
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { ip: '192.168.1.1' })).toBe(true);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { ip: '10.0.0.1' })).toBe(true);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { ip: '192.168.1.2' })).toBe(false);
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(false); // No context, should be false
    });
  });

  describe('Runtime updates', () => {
    it('should allow runtime flag updates', () => {
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(false);
      
      featureFlags.setFlag(FeatureFlag.ENABLE_CIRCUIT_BREAKER, { enabled: true });
      
      expect(featureFlags.isEnabled(FeatureFlag.ENABLE_CIRCUIT_BREAKER)).toBe(true);
    });

    it('should get all flags status', () => {
      const allFlags = featureFlags.getAllFlags();
      
      expect(allFlags).toBeDefined();
      expect(typeof allFlags).toBe('object');
      expect(allFlags[FeatureFlag.ENABLE_CIRCUIT_BREAKER]).toBeDefined();
    });
  });
});

