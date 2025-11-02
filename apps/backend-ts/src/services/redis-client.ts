/**
 * Redis Client Wrapper for Enhanced Architecture
 *
 * Provides consistent Redis interface for enhanced JWT auth and services
 */

import { redis as mainRedisClient } from '../utils/pubsub.js';

// Wrapper class to provide the interface expected by enhanced services
export class RedisClientWrapper {
  private client: any;

  constructor() {
    this.client = mainRedisClient;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch (error) {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, value);
    } catch (error) {
      // Silently fail for cache operations
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, seconds, value);
    } catch (error) {
      // Silently fail for cache operations
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      // Silently fail for cache operations
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.hget(key, field);
    } catch (error) {
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.hset(key, field, value);
    } catch (error) {
      // Silently fail for cache operations
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    try {
      return await this.client.hgetall(key);
    } catch (error) {
      return {};
    }
  }

  // Backward compatibility with existing interface
  async quit(): Promise<void> {
    // Main Redis client handles its own lifecycle
  }
}

// Export singleton instance
export const redisClient = new RedisClientWrapper();