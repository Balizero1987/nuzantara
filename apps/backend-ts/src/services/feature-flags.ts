/**
 * Feature Flags System for Zero-Downtime Deployment
 *
 * Enables gradual rollout of new features with backward compatibility
 */

import logger from './logger.js';

export enum FeatureFlag {
  // Load balancing features
  ENABLE_CIRCUIT_BREAKER = 'enable_circuit_breaker',
  ENABLE_ENHANCED_POOLING = 'enable_enhanced_pooling',
  ENABLE_PRIORITIZED_RATE_LIMIT = 'enable_prioritized_rate_limit',
  ENABLE_AUTO_SCALING = 'enable_auto_scaling',
  ENABLE_SESSION_AFFINITY = 'enable_session_affinity',

  // Monitoring features
  ENABLE_DETAILED_METRICS = 'enable_detailed_metrics',
  ENABLE_AUDIT_TRAIL = 'enable_audit_trail',
  ENABLE_PERFORMANCE_TRACKING = 'enable_performance_tracking',

  // Safety features
  ENABLE_GRADUAL_ROLLOUT = 'enable_gradual_rollout',
  ENABLE_AUTO_ROLLBACK = 'enable_auto_rollback',
}

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number; // 0-100 for gradual rollout
  enabledForUsers?: string[]; // Specific user IDs
  enabledForIPs?: string[]; // Specific IPs
  enabledAfter?: Date; // Enable after this date
  disabledAfter?: Date; // Disable after this date
}

class FeatureFlagsService {
  private flags: Map<FeatureFlag, FeatureFlagConfig> = new Map();
  private defaultConfig: FeatureFlagConfig = {
    enabled: false,
    rolloutPercentage: 0,
  };

  constructor() {
    this.loadFromEnvironment();
  }

  /**
   * Load feature flags from environment variables
   */
  private loadFromEnvironment(): void {
    Object.values(FeatureFlag).forEach((flag) => {
      const envKey = `FF_${flag.toUpperCase()}`;
      const envValue = process.env[envKey];

      if (envValue) {
        try {
          const config: FeatureFlagConfig = {
            enabled: envValue === 'true' || envValue === '1',
            rolloutPercentage: parseInt(process.env[`${envKey}_PERCENTAGE`] || '0', 10),
            enabledForUsers: process.env[`${envKey}_USERS`]?.split(',').filter(Boolean),
            enabledForIPs: process.env[`${envKey}_IPS`]?.split(',').filter(Boolean),
          };
          this.flags.set(flag, config);
        } catch (error) {
          logger.warn(`Failed to parse feature flag ${flag}: ${envValue}`);
        }
      } else {
        // Default: disabled
        this.flags.set(flag, { ...this.defaultConfig });
      }
    });

    logger.info(`✅ Feature flags loaded: ${this.flags.size} flags configured`);
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(
    flag: FeatureFlag,
    context?: {
      userId?: string;
      ip?: string;
    }
  ): boolean {
    const config = this.flags.get(flag) || this.defaultConfig;

    if (!config.enabled) {
      return false;
    }

    // Check date constraints
    if (config.enabledAfter && new Date() < config.enabledAfter) {
      return false;
    }

    if (config.disabledAfter && new Date() > config.disabledAfter) {
      return false;
    }

    // Check specific user/IP allowlist (even if globally disabled)
    if (context?.userId && config.enabledForUsers?.includes(context.userId)) {
      return true;
    }

    if (context?.ip && config.enabledForIPs?.includes(context.ip)) {
      return true;
    }

    // If globally disabled and not in allowlist, return false
    if (!config.enabled) {
      return false;
    }

    // Gradual rollout by percentage
    if (config.rolloutPercentage !== undefined && config.rolloutPercentage > 0) {
      if (context?.userId) {
        // Deterministic rollout based on user ID hash
        const hash = this.hashString(context.userId);
        const bucket = hash % 100;
        return bucket < config.rolloutPercentage;
      }

      if (context?.ip) {
        // Deterministic rollout based on IP hash
        const hash = this.hashString(context.ip);
        const bucket = hash % 100;
        return bucket < config.rolloutPercentage;
      }

      // If no context, use random rollout
      return Math.random() * 100 < config.rolloutPercentage;
    }

    return config.enabled;
  }

  /**
   * Hash string for deterministic rollout
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Set feature flag (for runtime updates)
   */
  setFlag(flag: FeatureFlag, config: FeatureFlagConfig): void {
    this.flags.set(flag, config);
    logger.info(
      `Feature flag ${flag} updated: enabled=${config.enabled}, rollout=${config.rolloutPercentage}%`
    );
  }

  /**
   * Get all feature flags status
   */
  getAllFlags(): Record<string, FeatureFlagConfig> {
    const result: Record<string, FeatureFlagConfig> = {};
    this.flags.forEach((config, flag) => {
      result[flag] = config;
    });
    return result;
  }

  /**
   * Reload flags from environment
   */
  reload(): void {
    this.loadFromEnvironment();
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsService();
