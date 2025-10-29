import Redis from 'ioredis';
import { createHash } from 'crypto';

class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.on('connect', () => console.log('✅ Redis Connected Successfully'));
  }

  generateKey(prefix: string, params: any): string {
    const hash = createHash('md5').update(JSON.stringify(params)).digest('hex');
    return `${prefix}:${hash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl || this.defaultTTL) {
        await this.redis.setex(key, ttl || this.defaultTTL, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping error:', error);
      return false;
    }
  }
}

export const cacheService = new CacheService();
