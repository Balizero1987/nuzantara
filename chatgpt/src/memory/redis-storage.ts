import { createClient, RedisClientType } from 'redis';
import {
  IMemoryStorage,
  UnifiedMemory,
  MemoryQuery,
  MemoryType,
  UnifiedMemorySchema,
} from './types.js';

/**
 * Redis-backed memory storage with automatic serialization/deserialization
 */
export class RedisMemoryStorage implements IMemoryStorage {
  private client: RedisClientType | null = null;
  private connected = false;
  private readonly keyPrefix = 'zantara:memory:';
  private readonly indexPrefix = 'zantara:index:';

  constructor(private readonly redisUrl?: string) {}

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      this.client = createClient({
        url: this.redisUrl || process.env['REDIS_URL'] || 'redis://localhost:6379',
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      await this.client.connect();
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      throw new Error('Redis connection failed');
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get memory by ID
   */
  async get(id: string): Promise<UnifiedMemory | null> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    const key = this.keyPrefix + id;
    const data = await this.client.get(key);

    if (!data) return null;

    try {
      const parsed = JSON.parse(data) as unknown;
      return UnifiedMemorySchema.parse(parsed);
    } catch (error) {
      console.error('Failed to parse memory from Redis:', error);
      return null;
    }
  }

  /**
   * Store memory with automatic indexing
   */
  async set(memory: UnifiedMemory): Promise<void> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    // Validate memory
    const validated = UnifiedMemorySchema.parse(memory);
    const key = this.keyPrefix + validated.id;
    const data = JSON.stringify(validated);

    // Store the memory
    if (validated.type === MemoryType.EPISODIC && validated.ttl) {
      await this.client.setEx(key, validated.ttl, data);
    } else {
      await this.client.set(key, data);
    }

    // Create indexes for efficient querying
    await this.createIndexes(validated);
  }

  /**
   * Delete memory by ID
   */
  async delete(id: string): Promise<boolean> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    const key = this.keyPrefix + id;
    const result = await this.client.del(key);

    // Clean up indexes
    await this.removeFromIndexes(id);

    return result > 0;
  }

  /**
   * Query memories with filters
   */
  async query(query: MemoryQuery): Promise<UnifiedMemory[]> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    const memories: UnifiedMemory[] = [];
    const keys = await this.getKeysByQuery(query);

    // Fetch memories in parallel
    const promises = keys.slice(0, query.limit).map((key) => this.client!.get(key));
    const results = await Promise.all(promises);

    for (const data of results) {
      if (data) {
        try {
          const parsed = JSON.parse(data) as unknown;
          const memory = UnifiedMemorySchema.parse(parsed);

          // Apply filters
          if (this.matchesFilters(memory, query)) {
            memories.push(memory);
          }
        } catch (error) {
          console.error('Failed to parse memory:', error);
        }
      }
    }

    return memories;
  }

  /**
   * Clear memories by type
   */
  async clear(type?: MemoryType): Promise<number> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    let pattern: string;
    if (type) {
      pattern = `${this.indexPrefix}type:${type}:*`;
    } else {
      pattern = `${this.keyPrefix}*`;
    }

    const keys = await this.scanKeys(pattern);
    if (keys.length === 0) return 0;

    const deleted = await this.client.del(keys);
    return deleted;
  }

  /**
   * Count memories by type
   */
  async count(type?: MemoryType): Promise<number> {
    if (!this.client || !this.connected) {
      throw new Error('Redis not connected');
    }

    let pattern: string;
    if (type) {
      pattern = `${this.indexPrefix}type:${type}:*`;
    } else {
      pattern = `${this.keyPrefix}*`;
    }

    const keys = await this.scanKeys(pattern);
    return keys.length;
  }

  /**
   * Create indexes for efficient querying
   */
  private async createIndexes(memory: UnifiedMemory): Promise<void> {
    if (!this.client) return;

    const typeIndex = `${this.indexPrefix}type:${memory.type}:${memory.id}`;
    await this.client.set(typeIndex, memory.id);

    // Index by timestamp for time-based queries
    if ('timestamp' in memory) {
      const timeIndex = `${this.indexPrefix}time:${memory.timestamp}:${memory.id}`;
      await this.client.set(timeIndex, memory.id);
    }

    // Index by tags if available
    if (memory.type === MemoryType.EPISODIC && memory.metadata?.tags) {
      for (const tag of memory.metadata.tags) {
        const tagIndex = `${this.indexPrefix}tag:${tag}:${memory.id}`;
        await this.client.set(tagIndex, memory.id);
      }
    }
  }

  /**
   * Remove memory from all indexes
   */
  private async removeFromIndexes(id: string): Promise<void> {
    if (!this.client) return;

    const pattern = `${this.indexPrefix}*:${id}`;
    const keys = await this.scanKeys(pattern);

    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }

  /**
   * Get keys matching query
   */
  private async getKeysByQuery(query: MemoryQuery): Promise<string[]> {
    if (!this.client) return [];

    const pattern = `${this.keyPrefix}*`;
    return this.scanKeys(pattern);
  }

  /**
   * Scan Redis keys with pattern
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    if (!this.client) return [];

    const keys: string[] = [];
    let cursor = 0;

    do {
      // Redis v4 scan returns an object with cursor and keys
      // The scan method accepts cursor as number in redis v4
      const scanResult = await this.client.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = scanResult.cursor;
      keys.push(...scanResult.keys);
    } while (cursor !== 0);

    return keys;
  }

  /**
   * Check if memory matches query filters
   */
  private matchesFilters(memory: UnifiedMemory, query: MemoryQuery): boolean {
    if (!query.filters) return true;

    const { startTime, endTime, tags, userId, category } = query.filters;

    // Time-based filtering
    if ('timestamp' in memory) {
      if (startTime && memory.timestamp < startTime) return false;
      if (endTime && memory.timestamp > endTime) return false;
    }

    // Tag filtering for episodic memories
    if (
      tags &&
      memory.type === MemoryType.EPISODIC &&
      memory.metadata?.tags &&
      !tags.some((tag) => memory.metadata?.tags?.includes(tag))
    ) {
      return false;
    }

    // User ID filtering
    if (userId && memory.type === MemoryType.EPISODIC && memory.metadata?.userId !== userId) {
      return false;
    }

    // Category filtering for semantic memories
    if (category && memory.type === MemoryType.SEMANTIC && memory.metadata?.category !== category) {
      return false;
    }

    return true;
  }
}
