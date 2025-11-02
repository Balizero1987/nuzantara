import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CircuitBreaker, CircuitState } from '../circuit-breaker.js';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000,
      resetTimeout: 5000,
    });
  });

  describe('Initial state', () => {
    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should have zero failures initially', () => {
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.totalFailures).toBe(0);
    });
  });

  describe('Success handling', () => {
    it('should execute function successfully in CLOSED state', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should not change state after success', async () => {
      const fn = jest.fn().mockResolvedValue('success');
      
      await circuitBreaker.execute(fn);
      await circuitBreaker.execute(fn);
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failures).toBe(0);
    });
  });

  describe('Failure handling', () => {
    it('should track failures in CLOSED state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      
      try {
        await circuitBreaker.execute(fn);
      } catch (error) {
        // Expected
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.totalFailures).toBe(1);
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after threshold failures', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Trigger 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {
          // Expected
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBeGreaterThanOrEqual(3);
    });

    it('should reject requests immediately when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {
          // Expected
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Try to execute when OPEN
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('Circuit breaker test is OPEN');
    });

    it('should use fallback when OPEN', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      const fallback = jest.fn().mockResolvedValue('fallback');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {
          // Expected
        }
      }
      
      // Clear the mock to track new calls
      fn.mockClear();
      
      const result = await circuitBreaker.execute(fn, fallback);
      
      expect(result).toBe('fallback');
      expect(fallback).toHaveBeenCalled();
      // When OPEN, execute should throw before calling fn, so fn should not be called
      // But we check if circuit is OPEN first, which happens before calling fn
      expect(fn).not.toHaveBeenCalled(); 
    });
  });

  describe('Half-open state', () => {
    it('should transition to HALF_OPEN after timeout', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {
          // Expected
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Try to execute - should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
    });

    it('should close circuit after success threshold in HALF_OPEN', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('test error'));
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch {
          // Expected
        }
      }
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Execute 2 successful calls (threshold)
      await circuitBreaker.execute(successFn);
      await circuitBreaker.execute(successFn);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failure in HALF_OPEN', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('test error'));
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failFn);
        } catch {
          // Expected
        }
      }
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Fail in HALF_OPEN
      try {
        await circuitBreaker.execute(failFn);
      } catch {
        // Expected
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Statistics', () => {
    it('should track total requests and failures', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const failFn = jest.fn().mockRejectedValue(new Error('error'));
      
      await circuitBreaker.execute(successFn);
      await circuitBreaker.execute(successFn);
      
      try {
        await circuitBreaker.execute(failFn);
      } catch {
        // Expected
      }
      
      const stats = circuitBreaker.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.totalFailures).toBe(1);
    });
  });

  describe('Manual reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('test error'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(fn);
        } catch {
          // Expected
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      const stats = circuitBreaker.getStats();
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
    });
  });
});

