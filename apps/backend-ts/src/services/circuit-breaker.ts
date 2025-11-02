/**
 * Circuit Breaker Pattern for Fault Tolerance
 * 
 * Implements circuit breaker pattern to prevent cascading failures
 * when external services (database, APIs) are down or slow.
 */

import logger from './logger.js';

export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject requests immediately
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      // Open circuit after N failures
  successThreshold: number;      // Close circuit after N successes in half-open
  timeout: number;               // Time before trying half-open (ms)
  resetTimeout: number;          // Time before resetting failure count (ms)
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private readonly options: CircuitBreakerOptions;
  private halfOpenTimer: NodeJS.Timeout | null = null;
  private resetTimer: NodeJS.Timeout | null = null;
  private readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 60000, // 1 minute
      resetTimeout: options.resetTimeout || 300000, // 5 minutes
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    this.totalRequests++;

    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should try half-open
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.options.timeout) {
        logger.info(`🔄 Circuit breaker ${this.name}: Moving to HALF_OPEN state`);
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
      } else {
        // Still in open state, use fallback or throw (don't call fn)
        if (fallback) {
          logger.warn(`⚡ Circuit breaker ${this.name}: OPEN, using fallback`);
          return fallback();
        }
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        logger.warn(`⚡ Circuit breaker ${this.name}: Using fallback after failure`);
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.options.successThreshold) {
        logger.info(`✅ Circuit breaker ${this.name}: Closing circuit after ${this.successes} successes`);
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
      }
    } else {
      // In CLOSED state, reset failure count periodically
      this.resetFailuresIfNeeded();
    }
  }

  private onFailure(): void {
    this.totalFailures++;
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed in half-open, go back to open
      logger.warn(`❌ Circuit breaker ${this.name}: Failure in HALF_OPEN, reopening circuit`);
      this.state = CircuitState.OPEN;
      this.successes = 0;
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.options.failureThreshold) {
      // Too many failures, open circuit
      logger.error(`🔴 Circuit breaker ${this.name}: Opening circuit after ${this.failures} failures`);
      this.state = CircuitState.OPEN;
      this.scheduleHalfOpenAttempt();
    }

    // Schedule failure count reset
    this.scheduleReset();
  }

  private scheduleHalfOpenAttempt(): void {
    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
    }
    
    this.halfOpenTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        logger.info(`🔄 Circuit breaker ${this.name}: Attempting to move to HALF_OPEN`);
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
        this.failures = 0;
      }
    }, this.options.timeout);
  }

  private scheduleReset(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.CLOSED) {
        logger.debug(`🔄 Circuit breaker ${this.name}: Resetting failure count`);
        this.failures = 0;
      }
    }, this.options.resetTimeout);
  }

  private resetFailuresIfNeeded(): void {
    // Reset failures if enough time has passed
    if (this.lastSuccessTime && Date.now() - this.lastSuccessTime > this.options.resetTimeout) {
      this.failures = 0;
    }
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
    };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    logger.info(`🔄 Circuit breaker ${this.name}: Manual reset`);
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    if (this.halfOpenTimer) {
      clearTimeout(this.halfOpenTimer);
      this.halfOpenTimer = null;
    }
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }
}

// Singleton instances for different services
export const dbCircuitBreaker = new CircuitBreaker('database', {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 30000, // 30 seconds
  resetTimeout: 120000, // 2 minutes
});

export const ragCircuitBreaker = new CircuitBreaker('rag-backend', {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 180000, // 3 minutes
});

export const externalApiCircuitBreaker = new CircuitBreaker('external-api', {
  failureThreshold: 10,
  successThreshold: 5,
  timeout: 30000,
  resetTimeout: 300000,
});

