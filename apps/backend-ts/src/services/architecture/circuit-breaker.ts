/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by monitoring service health
 * and automatically failing fast when services are down.
 * 
 * Features:
 * - Automatic failure detection
 * - Configurable thresholds
 * - State persistence
 * - Recovery mechanisms
 * - Metrics collection
 * 
 * @author GLM 4.6 - System Architect
 * @version 1.0.0
 */

import { logger } from '../../services/logger.js';
import { redisClient } from '../redis-client.js';

export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedRecoveryTime: number;
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  currentFailures: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  stateTransitions: {
    closedToOpen: number;
    openToHalfOpen: number;
    halfOpenToClosed: number;
    halfOpenToOpen: number;
  };
}

export interface CircuitBreakerOptions {
  name: string;
  config: CircuitBreakerConfig;
  onStateChange?: (from: CircuitBreakerState, to: CircuitBreakerState) => void;
  onCallSuccess?: (duration: number) => void;
  onCallFailure?: (error: Error, duration: number) => void;
}

class CircuitBreakerImpl {
  private name: string;
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private metrics: CircuitBreakerMetrics;
  private lastStateChange: number = Date.now();
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.name = options.name;
    this.config = options.config;
    this.options = options;
    
    this.metrics = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      currentFailures: 0,
      stateTransitions: {
        closedToOpen: 0,
        openToHalfOpen: 0,
        halfOpenToClosed: 0,
        halfOpenToOpen: 0
      }
    };

    // Load existing state from Redis if available
    this.loadState();
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    // Check if circuit is open
    if (this.state === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitBreakerState.HALF_OPEN);
      } else {
        const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
        this.metrics.failedCalls++;
        this.metrics.totalCalls++;
        
        if (fallback) {
          logger.warn(`Circuit breaker OPEN, using fallback for ${this.name}`);
          return await fallback();
        }
        
        throw error;
      }
    }

    try {
      this.metrics.totalCalls++;
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.onSuccess(duration);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      this.onFailure(error as Error, duration);
      
      if (fallback) {
        logger.warn(`Operation failed for ${this.name}, using fallback`, { error: error.message });
        return await fallback();
      }
      
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * Get circuit breaker configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.transitionTo(CircuitBreakerState.CLOSED);
    this.metrics.currentFailures = 0;
    logger.info(`Circuit breaker '${this.name}' manually reset`);
  }

  /**
   * Force circuit breaker to open state
   */
  forceOpen(): void {
    this.transitionTo(CircuitBreakerState.OPEN);
    logger.warn(`Circuit breaker '${this.name}' manually forced OPEN`);
  }

  /**
   * Handle successful operation
   */
  private onSuccess(duration: number): void {
    this.metrics.successfulCalls++;
    this.metrics.lastSuccessTime = Date.now();
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.CLOSED);
      this.metrics.currentFailures = 0;
    }

    if (this.options.onCallSuccess) {
      this.options.onCallSuccess(duration);
    }

    this.saveState();
  }

  /**
   * Handle failed operation
   */
  private onFailure(error: Error, duration: number): void {
    this.metrics.failedCalls++;
    this.metrics.currentFailures++;
    this.metrics.lastFailureTime = Date.now();

    if (this.options.onCallFailure) {
      this.options.onCallFailure(error, duration);
    }

    if (this.state === CircuitBreakerState.CLOSED) {
      if (this.metrics.currentFailures >= this.config.failureThreshold) {
        this.transitionTo(CircuitBreakerState.OPEN);
      }
    } else if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.transitionTo(CircuitBreakerState.OPEN);
    }

    this.saveState();
  }

  /**
   * Check if circuit breaker should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastStateChange >= this.config.resetTimeout;
  }

  /**
   * Transition to new state
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    // Record state transition
    const transitionKey = `${oldState}To${newState}` as keyof typeof this.metrics.stateTransitions;
    if (transitionKey in this.metrics.stateTransitions) {
      this.metrics.stateTransitions[transitionKey]++;
    }

    logger.info(`Circuit breaker '${this.name}' transitioned from ${oldState} to ${newState}`);

    if (this.options.onStateChange) {
      this.options.onStateChange(oldState, newState);
    }

    this.saveState();
  }

  /**
   * Save circuit breaker state to Redis
   */
  private async saveState(): Promise<void> {
    try {
      const stateData = {
        name: this.name,
        state: this.state,
        metrics: this.metrics,
        lastStateChange: this.lastStateChange,
        config: this.config
      };

      await redisClient.setex(
        `circuit_breaker:${this.name}`,
        3600, // 1 hour TTL
        JSON.stringify(stateData)
      );
    } catch (error) {
      logger.error(`Failed to save circuit breaker state for ${this.name}:`, error);
    }
  }

  /**
   * Load circuit breaker state from Redis
   */
  private async loadState(): Promise<void> {
    try {
      const cached = await redisClient.get(`circuit_breaker:${this.name}`);
      if (cached) {
        const stateData = JSON.parse(cached);
        
        this.state = stateData.state || CircuitBreakerState.CLOSED;
        this.metrics = { ...this.metrics, ...stateData.metrics };
        this.lastStateChange = stateData.lastStateChange || Date.now();
        
        logger.info(`Circuit breaker '${this.name}' state loaded from cache`);
      }
    } catch (error) {
      logger.error(`Failed to load circuit breaker state for ${this.name}:`, error);
    }
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.metrics.totalCalls === 0) return 100;
    return (this.metrics.successfulCalls / this.metrics.totalCalls) * 100;
  }

  /**
   * Get failure rate
   */
  getFailureRate(): number {
    if (this.metrics.totalCalls === 0) return 0;
    return (this.metrics.failedCalls / this.metrics.totalCalls) * 100;
  }

  /**
   * Check if circuit breaker is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitBreakerState.CLOSED && 
           this.getSuccessRate() > 80; // Consider healthy if success rate > 80%
  }

  /**
   * Get circuit breaker health summary
   */
  getHealthSummary(): {
    name: string;
    state: CircuitBreakerState;
    successRate: number;
    failureRate: number;
    totalCalls: number;
    currentFailures: number;
    isHealthy: boolean;
    lastStateChange: number;
    timeInCurrentState: number;
  } {
    return {
      name: this.name,
      state: this.state,
      successRate: this.getSuccessRate(),
      failureRate: this.getFailureRate(),
      totalCalls: this.metrics.totalCalls,
      currentFailures: this.metrics.currentFailures,
      isHealthy: this.isHealthy(),
      lastStateChange: this.lastStateChange,
      timeInCurrentState: Date.now() - this.lastStateChange
    };
  }
}

// Circuit Breaker Factory
class CircuitBreakerFactory {
  private static instances: Map<string, CircuitBreakerImpl> = new Map();

  static create(options: CircuitBreakerOptions): CircuitBreakerImpl {
    const breaker = new CircuitBreakerImpl(options);
    this.instances.set(options.name, breaker);
    return breaker;
  }

  static get(name: string): CircuitBreakerImpl | undefined {
    return this.instances.get(name);
  }

  static getAll(): CircuitBreakerImpl[] {
    return Array.from(this.instances.values());
  }

  static resetAll(): void {
    this.instances.forEach(breaker => breaker.reset());
  }

  static getHealthSummary(): Array<ReturnType<CircuitBreakerImpl['getHealthSummary']>> {
    return Array.from(this.instances.values()).map(breaker => breaker.getHealthSummary());
  }
}

export { CircuitBreakerImpl, CircuitBreakerFactory };