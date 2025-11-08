/**
 * Plugin Executor
 *
 * Executes plugins with performance monitoring, caching, rate limiting, and error handling.
 */

import { Plugin, PluginOutput, PluginContext } from './Plugin';
import { registry } from './PluginRegistry';

interface MetricsData {
  calls: number;
  successes: number;
  failures: number;
  totalTime: number;
  lastError: string | null;
  lastSuccess: number | null;
  cacheHits: number;
  cacheMisses: number;
}

interface CircuitBreaker {
  failures: number;
  lastFailureTime: number;
}

export class PluginExecutor {
  private metrics: Map<string, MetricsData> = new Map();
  private rateLimits: Map<string, number[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  // Cache TTL in milliseconds (1 hour)
  private readonly CACHE_TTL = 3600 * 1000;

  constructor() {
    console.log('✅ PluginExecutor initialized');

    // Clean up cache periodically
    setInterval(() => this.cleanupCache(), 300000); // Every 5 minutes
  }

  /**
   * Execute a plugin with all enhancements
   *
   * @param pluginName - Plugin name to execute
   * @param inputData - Input data
   * @param options - Execution options
   * @returns Plugin output
   */
  async execute(
    pluginName: string,
    inputData: any,
    options: {
      useCache?: boolean;
      userId?: string;
      timeout?: number;
      retryCount?: number;
      context?: PluginContext;
    } = {}
  ): Promise<PluginOutput> {
    const {
      useCache = true,
      userId,
      timeout,
      retryCount = 0,
      context = {}
    } = options;

    // Get plugin
    const plugin = registry.get(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: `Plugin ${pluginName} not found`,
        ok: false
      };
    }

    // Check circuit breaker
    if (this.isCircuitBroken(pluginName)) {
      return {
        success: false,
        error: `Circuit breaker open for ${pluginName} (too many recent failures)`,
        ok: false
      };
    }

    // Check rate limit
    if (plugin.metadata.rateLimit) {
      if (!this.checkRateLimit(pluginName, plugin.metadata.rateLimit, userId)) {
        return {
          success: false,
          error: `Rate limit exceeded for ${pluginName}`,
          metadata: { rateLimit: plugin.metadata.rateLimit },
          ok: false
        };
      }
    }

    // Check auth requirements
    if (plugin.metadata.requiresAuth && !userId) {
      return {
        success: false,
        error: 'Authentication required',
        ok: false
      };
    }

    // Validate input
    const validation = plugin.validateInput(inputData);
    if (!validation.success) {
      return {
        success: false,
        error: validation.error,
        ok: false
      };
    }

    // Check cache
    if (useCache) {
      const cached = this.getCached(pluginName, inputData);
      if (cached) {
        this.recordCacheHit(pluginName);
        return cached;
      }
      this.recordCacheMiss(pluginName);
    }

    // Execute with retry
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const result = await this.executeWithMonitoring(
          plugin,
          validation.data,
          timeout,
          { ...context, userId }
        );

        // Cache if successful
        if (result.success && useCache) {
          this.cacheResult(pluginName, inputData, result);
        }

        // Reset circuit breaker on success
        this.circuitBreakers.delete(pluginName);

        return result;
      } catch (error: any) {
        console.error(
          `Plugin ${pluginName} execution failed (attempt ${attempt + 1}/${retryCount + 1}):`,
          error
        );

        if (attempt < retryCount) {
          // Wait before retry with exponential backoff
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`Retrying ${pluginName} in ${waitTime}ms...`);
          await this.sleep(waitTime);
        } else {
          // Final failure
          return {
            success: false,
            error: `Plugin execution failed after ${retryCount + 1} attempts: ${error.message}`,
            metadata: { attempts: retryCount + 1 },
            ok: false
          };
        }
      }
    }

    // Should never reach here
    return {
      success: false,
      error: 'Unexpected execution error',
      ok: false
    };
  }

  /**
   * Execute plugin with monitoring
   */
  private async executeWithMonitoring(
    plugin: Plugin,
    input: any,
    timeout: number | undefined,
    context: PluginContext
  ): Promise<PluginOutput> {
    const pluginName = plugin.metadata.name;
    const startTime = Date.now();

    try {
      // Validate (optional additional validation)
      const isValid = await plugin.validate(input);
      if (!isValid) {
        return {
          success: false,
          error: 'Input validation failed',
          ok: false
        };
      }

      // Execute with timeout
      const executionTimeout = timeout || plugin.metadata.estimatedTime * 2 * 1000;
      const output = await this.executeWithTimeout(
        plugin.execute(input, context),
        executionTimeout
      );

      // Record metrics
      const executionTime = Date.now() - startTime;
      this.recordSuccess(pluginName, executionTime);

      // Add metadata
      if (!output.metadata) {
        output.metadata = {};
      }
      output.metadata.executionTime = executionTime;
      output.metadata.pluginVersion = plugin.metadata.version;
      output.metadata.timestamp = Date.now();

      // Ensure ok field is set
      if (output.ok === undefined) {
        output.ok = output.success;
      }

      return output;
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error.message === 'Execution timeout') {
        this.recordFailure(pluginName, 'Timeout');
        return {
          success: false,
          error: `Plugin execution timeout`,
          metadata: { executionTime },
          ok: false
        };
      }

      this.recordFailure(pluginName, error.message);
      throw error;
    }
  }

  /**
   * Execute with timeout
   */
  private executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeoutMs)
      )
    ]);
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(
    pluginName: string,
    limit: number,
    userId?: string
  ): boolean {
    const key = userId ? `${pluginName}:${userId}` : pluginName;
    const now = Date.now();
    const minuteAgo = now - 60000;

    // Get and clean old timestamps
    const timestamps = this.rateLimits.get(key) || [];
    const recentTimestamps = timestamps.filter((ts) => ts > minuteAgo);

    // Check limit
    if (recentTimestamps.length >= limit) {
      console.warn(`Rate limit exceeded for ${key}`);
      return false;
    }

    // Record this call
    recentTimestamps.push(now);
    this.rateLimits.set(key, recentTimestamps);
    return true;
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBroken(pluginName: string): boolean {
    const breaker = this.circuitBreakers.get(pluginName);
    if (!breaker) return false;

    // Circuit breaker: open if 5+ failures in last 60 seconds
    if (breaker.failures >= 5) {
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      if (timeSinceFailure < 60000) {
        return true;
      } else {
        // Reset after cooldown
        this.circuitBreakers.delete(pluginName);
      }
    }

    return false;
  }

  /**
   * Get cached result
   */
  private getCached(pluginName: string, inputData: any): PluginOutput | null {
    const cacheKey = this.generateCacheKey(pluginName, inputData);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    return null;
  }

  /**
   * Cache result
   */
  private cacheResult(
    pluginName: string,
    inputData: any,
    output: PluginOutput
  ): void {
    const cacheKey = this.generateCacheKey(pluginName, inputData);
    this.cache.set(cacheKey, {
      data: output,
      timestamp: Date.now()
    });
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(pluginName: string, inputData: any): string {
    const inputStr = JSON.stringify(inputData);
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `plugin:${pluginName}:${hash}`;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Record successful execution
   */
  private recordSuccess(pluginName: string, executionTime: number): void {
    const metrics = this.getOrCreateMetrics(pluginName);
    metrics.calls++;
    metrics.successes++;
    metrics.totalTime += executionTime;
    metrics.lastSuccess = Date.now();
  }

  /**
   * Record failed execution
   */
  private recordFailure(pluginName: string, error: string): void {
    const metrics = this.getOrCreateMetrics(pluginName);
    metrics.calls++;
    metrics.failures++;
    metrics.lastError = error;

    // Update circuit breaker
    const breaker = this.circuitBreakers.get(pluginName) || {
      failures: 0,
      lastFailureTime: 0
    };
    breaker.failures++;
    breaker.lastFailureTime = Date.now();
    this.circuitBreakers.set(pluginName, breaker);
  }

  /**
   * Record cache hit
   */
  private recordCacheHit(pluginName: string): void {
    const metrics = this.getOrCreateMetrics(pluginName);
    metrics.cacheHits++;
  }

  /**
   * Record cache miss
   */
  private recordCacheMiss(pluginName: string): void {
    const metrics = this.getOrCreateMetrics(pluginName);
    metrics.cacheMisses++;
  }

  /**
   * Get or create metrics for plugin
   */
  private getOrCreateMetrics(pluginName: string): MetricsData {
    if (!this.metrics.has(pluginName)) {
      this.metrics.set(pluginName, {
        calls: 0,
        successes: 0,
        failures: 0,
        totalTime: 0,
        lastError: null,
        lastSuccess: null,
        cacheHits: 0,
        cacheMisses: 0
      });
    }
    return this.metrics.get(pluginName)!;
  }

  /**
   * Get plugin metrics
   */
  getMetrics(pluginName: string): any {
    const metrics = this.getOrCreateMetrics(pluginName);

    const result: any = { ...metrics };

    if (metrics.calls > 0) {
      result.avgTime = metrics.totalTime / metrics.calls;
      result.successRate = metrics.successes / metrics.calls;

      const totalCacheChecks = metrics.cacheHits + metrics.cacheMisses;
      if (totalCacheChecks > 0) {
        result.cacheHitRate = metrics.cacheHits / totalCacheChecks;
      } else {
        result.cacheHitRate = 0;
      }
    } else {
      result.avgTime = 0;
      result.successRate = 0;
      result.cacheHitRate = 0;
    }

    return result;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, any> {
    const allMetrics: Record<string, any> = {};
    for (const [name] of this.metrics) {
      allMetrics[name] = this.getMetrics(name);
    }
    return allMetrics;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Global executor instance
export const executor = new PluginExecutor();
