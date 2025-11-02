/**
 * Service Registry Pattern Implementation
 * 
 * Centralized service registration and discovery for v3 Ω endpoints
 * with circuit breaker pattern and health monitoring.
 * 
 * Features:
 * - Dynamic service registration
 * - Health checking with circuit breakers
 * - Load balancing across service instances
 * - Service versioning
 * - Automatic failover
 * 
 * @author GLM 4.6 - System Architect
 * @version 1.0.0
 */

import { logger } from '../logger.js';
import { redisClient } from '../redis-client.js';

interface ServiceInstance {
  id: string;
  name: string;
  version: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  health: 'healthy' | 'unhealthy' | 'unknown';
  lastHealthCheck: number;
  metadata: Record<string, any>;
  circuitBreaker: {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
    timeout: number;
  };
}

interface ServiceRegistry {
  services: Map<string, ServiceInstance[]>;
  loadBalancer: 'round-robin' | 'random' | 'weighted';
  healthCheckInterval: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

class ServiceRegistryImpl {
  private registry: ServiceRegistry;
  private healthCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.registry = {
      services: new Map(),
      loadBalancer: 'round-robin',
      healthCheckInterval: 30000, // 30 seconds
      circuitBreakerThreshold: 5, // 5 failures before opening
      circuitBreakerTimeout: 60000 // 1 minute timeout
    };
  }

  /**
   * Register a new service instance
   */
  async registerService(service: Omit<ServiceInstance, 'circuitBreaker'>): Promise<void> {
    const serviceWithCircuitBreaker: ServiceInstance = {
      ...service,
      circuitBreaker: {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        timeout: this.registry.circuitBreakerTimeout
      }
    };

    const serviceName = service.name;
    
    if (!this.registry.services.has(serviceName)) {
      this.registry.services.set(serviceName, []);
    }

    const instances = this.registry.services.get(serviceName)!;
    
    // Remove existing instance with same ID
    const existingIndex = instances.findIndex(inst => inst.id === service.id);
    if (existingIndex >= 0) {
      instances[existingIndex] = serviceWithCircuitBreaker;
    } else {
      instances.push(serviceWithCircuitBreaker);
    }

    // Cache in Redis for persistence
    await this.cacheRegistry();

    logger.info(`Service registered: ${serviceName}@${service.version} (${service.id})`);
  }

  /**
   * Unregister a service instance
   */
  async unregisterService(serviceId: string): Promise<void> {
    for (const [serviceName, instances] of this.registry.services.entries()) {
      const index = instances.findIndex(inst => inst.id === serviceId);
      if (index >= 0) {
        instances.splice(index, 1);
        
        // Remove empty service entries
        if (instances.length === 0) {
          this.registry.services.delete(serviceName);
        }

        await this.cacheRegistry();
        logger.info(`Service unregistered: ${serviceId}`);
        return;
      }
    }
  }

  /**
   * Get a healthy service instance for load balancing
   */
  async getServiceInstance(serviceName: string): Promise<ServiceInstance | null> {
    const instances = this.registry.services.get(serviceName);
    if (!instances || instances.length === 0) {
      return null;
    }

    // Filter healthy instances with closed circuit breakers
    const healthyInstances = instances.filter(inst => 
      inst.health === 'healthy' && 
      inst.circuitBreaker.state === 'closed'
    );

    if (healthyInstances.length === 0) {
      logger.warn(`No healthy instances available for service: ${serviceName}`);
      return null;
    }

    // Load balancing strategy
    switch (this.registry.loadBalancer) {
      case 'round-robin':
        return this.getRoundRobinInstance(healthyInstances);
      case 'random':
        return this.getRandomInstance(healthyInstances);
      case 'weighted':
        return this.getWeightedInstance(healthyInstances);
      default:
        return healthyInstances[0];
    }
  }

  /**
   * Get service instance by ID (for specific targeting)
   */
  getServiceInstanceById(serviceId: string): ServiceInstance | null {
    for (const instances of this.registry.services.values()) {
      const instance = instances.find(inst => inst.id === serviceId);
      if (instance) {
        return instance;
      }
    }
    return null;
  }

  /**
   * Mark service call as successful (for circuit breaker)
   */
  async recordSuccess(serviceId: string): Promise<void> {
    const instance = this.getServiceInstanceById(serviceId);
    if (instance) {
      instance.circuitBreaker.failures = 0;
      instance.circuitBreaker.state = 'closed';
      await this.cacheRegistry();
    }
  }

  /**
   * Mark service call as failed (for circuit breaker)
   */
  async recordFailure(serviceId: string): Promise<void> {
    const instance = this.getServiceInstanceById(serviceId);
    if (instance) {
      instance.circuitBreaker.failures++;
      instance.circuitBreaker.lastFailure = Date.now();

      if (instance.circuitBreaker.failures >= this.registry.circuitBreakerThreshold) {
        instance.circuitBreaker.state = 'open';
        logger.warn(`Circuit breaker opened for service: ${instance.id}`);
      }

      await this.cacheRegistry();
    }
  }

  /**
   * Get all registered services
   */
  getAllServices(): Record<string, ServiceInstance[]> {
    const result: Record<string, ServiceInstance[]> = {};
    for (const [serviceName, instances] of this.registry.services.entries()) {
      result[serviceName] = [...instances];
    }
    return result;
  }

  /**
   * Get service health status
   */
  getServiceHealth(serviceName: string): {
    total: number;
    healthy: number;
    unhealthy: number;
    circuitsOpen: number;
  } {
    const instances = this.registry.services.get(serviceName) || [];
    
    return {
      total: instances.length,
      healthy: instances.filter(inst => inst.health === 'healthy').length,
      unhealthy: instances.filter(inst => inst.health === 'unhealthy').length,
      circuitsOpen: instances.filter(inst => inst.circuitBreaker.state === 'open').length
    };
  }

  /**
   * Start health checking for all services
   */
  startHealthChecking(): void {
    if (this.healthCheckTimer) {
      return; // Already running
    }

    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthChecks();
    }, this.registry.healthCheckInterval);

    logger.info('Service health checking started');
  }

  /**
   * Stop health checking
   */
  stopHealthChecking(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('Service health checking stopped');
    }
  }

  /**
   * Perform health check on all services
   */
  private async performHealthChecks(): Promise<void> {
    for (const [serviceName, instances] of this.registry.services.entries()) {
      await Promise.all(
        instances.map(async (instance) => {
          let timeoutId: NodeJS.Timeout | null = null;
          try {
            const controller = new AbortController();
            timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${instance.protocol}://${instance.host}:${instance.port}/health`, {
              method: 'GET',
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              instance.health = 'healthy';
              instance.lastHealthCheck = Date.now();
            } else {
              instance.health = 'unhealthy';
            }
          } catch (error) {
            clearTimeout(timeoutId);
            instance.health = 'unhealthy';
            await this.recordFailure(instance.id);
          }
        })
      );
    }

    await this.cacheRegistry();
  }

  /**
   * Round-robin load balancing
   */
  private getRoundRobinInstance(instances: ServiceInstance[]): ServiceInstance {
    // Simple implementation - in production would track indices
    return instances[Math.floor(Math.random() * instances.length)];
  }

  /**
   * Random load balancing
   */
  private getRandomInstance(instances: ServiceInstance[]): ServiceInstance {
    return instances[Math.floor(Math.random() * instances.length)];
  }

  /**
   * Weighted load balancing (based on metadata)
   */
  private getWeightedInstance(instances: ServiceInstance[]): ServiceInstance {
    // Simple weighted implementation
    const weights = instances.map(inst => inst.metadata.weight || 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < instances.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return instances[i];
      }
    }
    
    return instances[instances.length - 1];
  }

  /**
   * Cache registry in Redis
   */
  private async cacheRegistry(): Promise<void> {
    try {
      const registryData = JSON.stringify(this.getAllServices());
      await redisClient.setex('service_registry', 300, registryData); // 5 minutes TTL
    } catch (error) {
      logger.error('Failed to cache service registry:', error);
    }
  }

  /**
   * Load registry from Redis
   */
  async loadFromCache(): Promise<void> {
    try {
      const cached = await redisClient.get('service_registry');
      if (cached) {
        const data = JSON.parse(cached);
        this.registry.services.clear();
        
        for (const [serviceName, instances] of Object.entries(data)) {
          this.registry.services.set(serviceName, instances as ServiceInstance[]);
        }
        
        logger.info('Service registry loaded from cache');
      }
    } catch (error) {
      logger.error('Failed to load service registry from cache:', error);
    }
  }
}

// Singleton instance
const serviceRegistry = new ServiceRegistryImpl();

export { serviceRegistry };
export type { ServiceInstance, ServiceRegistry };