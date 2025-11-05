/**
 * Enhanced Router with Service Registry and Circuit Breaker
 *
 * Advanced routing system for v3 Ω endpoints with:
 * - Service discovery and load balancing
 * - Circuit breaker pattern for resilience
 * - Request/response transformation
 * - Monitoring and metrics
 * - Rate limiting per service
 *
 * @author GLM 4.6 - System Architect
 * @version 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger.js';
import { serviceRegistry } from './service-registry.js';
import { internalServiceRegistry } from './internal-service-registry.js';
import { CircuitBreakerFactory, CircuitBreakerConfig } from './circuit-breaker.js';
// Simple in-memory rate limiter (since rate-limiter-flexible is not installed)
class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();

  constructor(private config: { points: number; duration: number }) {}

  async consume(key: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.duration * 1000;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key)!;

    // Remove old requests outside the window
    const validRequests = timestamps.filter((time) => time > windowStart);

    if (validRequests.length >= this.config.points) {
      throw new Error('Rate limit exceeded');
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
  }
}

interface RouteConfig {
  path: string;
  method: string;
  service: string;
  timeout: number;
  retryAttempts: number;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  transformation?: {
    request?: (data: any) => any;
    response?: (data: any) => any;
  };
}

interface RequestMetrics {
  path: string;
  method: string;
  service: string;
  duration: number;
  status: number;
  success: boolean;
  error?: string;
}

class EnhancedRouter {
  private routes: Map<string, RouteConfig> = new Map();
  private rateLimiters: Map<string, SimpleRateLimiter> = new Map();
  private circuitBreakers: Map<string, any> = new Map();
  private metrics: RequestMetrics[] = [];
  private maxMetricsSize = 1000;

  constructor() {
    this.initializeDefaultCircuitBreakers();
    this.startMetricsCleanup();
  }

  /**
   * Register a new route
   */
  registerRoute(config: RouteConfig): void {
    const key = `${config.method}:${config.path}`;
    this.routes.set(key, config);

    // Initialize rate limiter if configured
    if (config.rateLimit) {
      this.rateLimiters.set(
        key,
        new SimpleRateLimiter({
          points: config.rateLimit.max,
          duration: config.rateLimit.windowMs / 1000,
        })
      );
    }

    // Initialize circuit breaker for service
    if (!this.circuitBreakers.has(config.service)) {
      const breaker = CircuitBreakerFactory.create({
        name: config.service,
        config: this.getDefaultCircuitBreakerConfig(),
        onStateChange: (from, to) => {
          logger.info(`Circuit breaker for ${config.service}: ${from} -> ${to}`);
        },
        onCallSuccess: (duration) => {
          logger.debug(`Service call success: ${config.service} (${duration}ms)`);
        },
        onCallFailure: (error, duration) => {
          logger.warn(`Service call failure: ${config.service} (${duration}ms)`, {
            error: error.message,
          });
        },
      });
      this.circuitBreakers.set(config.service, breaker);
    }

    logger.info(`Route registered: ${config.method} ${config.path} -> ${config.service}`);
  }

  /**
   * Get route middleware
   */
  getMiddleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const key = `${req.method}:${req.path}`;
      const routeConfig = this.routes.get(key);

      if (!routeConfig) {
        return next();
      }

      const startTime = Date.now();

      try {
        // Rate limiting check
        if (routeConfig.rateLimit) {
          const rateLimiter = this.rateLimiters.get(key);
          if (rateLimiter) {
            await rateLimiter.consume(req.ip || 'unknown');
          }
        }

        // Get service instance
        const serviceInstance = await serviceRegistry.getServiceInstance(routeConfig.service);
        if (!serviceInstance) {
          throw new Error(`No healthy instances available for service: ${routeConfig.service}`);
        }

        // Transform request if configured
        let transformedData = req.body;
        if (routeConfig.transformation?.request) {
          transformedData = routeConfig.transformation.request(req.body);
        }

        // Execute service call with circuit breaker
        const circuitBreaker = this.circuitBreakers.get(routeConfig.service);
        const result = await circuitBreaker.execute(
          async () => {
            return this.callService(serviceInstance, transformedData, routeConfig);
          },
          async () => {
            return this.getFallbackResponse(routeConfig);
          }
        );

        // Transform response if configured
        let finalResult = result;
        if (routeConfig.transformation?.response) {
          finalResult = routeConfig.transformation.response(result);
        }

        // Record metrics
        const duration = Date.now() - startTime;
        this.recordMetrics({
          path: req.path,
          method: req.method,
          service: routeConfig.service,
          duration,
          status: 200,
          success: true,
        });

        // Record success with service registry
        await serviceRegistry.recordSuccess(serviceInstance.id);

        res.status(200).json({
          ok: true,
          data: finalResult,
          meta: {
            service: routeConfig.service,
            duration: `${duration}ms`,
            instance: serviceInstance.id,
          },
        });
      } catch (error) {
        const duration = Date.now() - startTime;

        // Record failure metrics
        this.recordMetrics({
          path: req.path,
          method: req.method,
          service: routeConfig.service,
          duration,
          status: 500,
          success: false,
          error: error.message,
        });

        logger.error(`Route ${key} failed:`, error);

        res.status(500).json({
          ok: false,
          error: error.message,
          meta: {
            service: routeConfig.service,
            duration: `${duration}ms`,
          },
        });
      }
    };
  }

  /**
   * Call service -优先使用internal handlers消除self-recursion
   */
  private async callService(serviceInstance: any, data: any, config: RouteConfig): Promise<any> {
    const serviceName = config.service;

    // 🚀 FIX: Check for internal handler first (eliminates self-recursion)
    if (internalServiceRegistry.hasHandler(serviceName)) {
      logger.info(`🔧 Using internal handler for: ${serviceName}`);
      try {
        const result = await internalServiceRegistry.executeHandler(serviceName, data, {
          requestId: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        });
        return result;
      } catch (error) {
        logger.error(`❌ Internal handler failed: ${serviceName}`, error);
        throw error;
      }
    }

    // Fallback to external HTTP service (for truly external services)
    const url = `${serviceInstance.protocol}://${serviceInstance.host}:${serviceInstance.port}${config.path}`;

    // 🚨 WARNING: Detect potential self-recursion
    if (url.includes('localhost:8080') || url.includes('127.0.0.1:8080')) {
      logger.error(`🚨 SELF-RECURSION DETECTED: ${url} - This would cause infinite loop!`);
      throw new Error(
        `Self-recursion detected: Cannot call localhost:8080 from within the same service`
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      logger.info(`🌐 Calling external service: ${url}`);
      const response = await fetch(url, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'nuzantara-enhanced-router/1.0.0',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Service call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * Get fallback response
   */
  private async getFallbackResponse(config: RouteConfig): Promise<any> {
    return {
      error: 'Service temporarily unavailable',
      fallback: true,
      service: config.service,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Record request metrics
   */
  private recordMetrics(metrics: RequestMetrics): void {
    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    requestsByService: Record<string, number>;
    requestsByPath: Record<string, number>;
    recentErrors: RequestMetrics[];
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter((m) => m.success).length;
    const errors = this.metrics.filter((m) => !m.success).slice(-10); // Last 10 errors

    const responseTimes = this.metrics.map((m) => m.duration);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    const requestsByService: Record<string, number> = {};
    const requestsByPath: Record<string, number> = {};

    this.metrics.forEach((metric) => {
      requestsByService[metric.service] = (requestsByService[metric.service] || 0) + 1;
      const pathKey = `${metric.method} ${metric.path}`;
      requestsByPath[pathKey] = (requestsByPath[pathKey] || 0) + 1;
    });

    return {
      totalRequests: total,
      successRate: total > 0 ? (successful / total) * 100 : 100,
      averageResponseTime: Math.round(avgResponseTime),
      requestsByService,
      requestsByPath,
      recentErrors: errors,
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): Array<any> {
    return CircuitBreakerFactory.getHealthSummary();
  }

  /**
   * Get service registry status
   */
  getServiceRegistryStatus(): Record<string, any> {
    const allServices = serviceRegistry.getAllServices();
    const status: Record<string, any> = {};

    for (const [serviceName, _instances] of Object.entries(allServices)) {
      status[serviceName] = serviceRegistry.getServiceHealth(serviceName);
    }

    return status;
  }

  /**
   * Initialize default circuit breakers for v3 Ω services
   */
  private initializeDefaultCircuitBreakers(): void {
    const v3Services = [
      'unified',
      'collective',
      'ecosystem',
      'kbli',
      'pricing',
      'legal',
      'immigration',
      'tax',
      'property',
    ];

    v3Services.forEach((serviceName) => {
      CircuitBreakerFactory.create({
        name: serviceName,
        config: this.getDefaultCircuitBreakerConfig(),
        onStateChange: (from, to) => {
          logger.info(`Circuit breaker for ${serviceName}: ${from} -> ${to}`);
        },
      });
    });

    logger.info('Default circuit breakers initialized for v3 Ω services');
  }

  /**
   * Get default circuit breaker configuration
   */
  private getDefaultCircuitBreakerConfig(): CircuitBreakerConfig {
    return {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 30000, // 30 seconds
      expectedRecoveryTime: 120000, // 2 minutes
    };
  }

  /**
   * Start metrics cleanup task
   */
  private startMetricsCleanup(): void {
    setInterval(() => {
      // Keep only last hour of metrics
      const oneHourAgo = Date.now() - 3600000;
      this.metrics = this.metrics.filter(
        (m) => Date.now() - (Date.now() - m.duration) < oneHourAgo
      );
    }, 300000); // Run every 5 minutes
  }
}

// Singleton instance
const enhancedRouter = new EnhancedRouter();

export { enhancedRouter };
export type { RouteConfig, RequestMetrics };
