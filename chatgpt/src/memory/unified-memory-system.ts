import { randomUUID } from 'node:crypto';
import {
  IMemoryStorage,
  UnifiedMemory,
  MemoryQuery,
  MemoryType,
  EpisodicMemory,
  SemanticMemory,
  VectorMemory,
  MemoryMetrics,
} from './types.js';
import { RedisMemoryStorage } from './redis-storage.js';
import { InMemoryStorage } from './in-memory-storage.js';
import { PerformanceMonitor } from './performance-monitor.js';

/**
 * Configuration for UnifiedMemorySystem
 */
export interface UnifiedMemoryConfig {
  redisUrl?: string;
  enableRedis?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxMetrics?: number;
}

/**
 * Unified Memory System - Consolidates episodic, semantic, and vector memory
 */
export class UnifiedMemorySystem {
  private storage: IMemoryStorage;
  private readonly performanceMonitor: PerformanceMonitor;
  private readonly redisStorage: RedisMemoryStorage | null = null;
  private readonly fallbackStorage: InMemoryStorage;
  private readonly config: UnifiedMemoryConfig;

  constructor(config: UnifiedMemoryConfig = {}) {
    this.config = {
      enableRedis: config.enableRedis ?? true,
      enablePerformanceMonitoring: config.enablePerformanceMonitoring ?? true,
      maxMetrics: config.maxMetrics ?? 1000,
      redisUrl: config.redisUrl,
    };

    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor(this.config.maxMetrics);

    // Initialize storages
    this.fallbackStorage = new InMemoryStorage();

    if (this.config.enableRedis) {
      this.redisStorage = new RedisMemoryStorage(this.config.redisUrl);
      this.storage = this.redisStorage;
    } else {
      this.storage = this.fallbackStorage;
    }
  }

  /**
   * Initialize the memory system (connect to Redis if enabled)
   */
  async initialize(): Promise<void> {
    if (this.redisStorage) {
      try {
        await this.redisStorage.connect();
        this.storage = this.redisStorage;
      } catch (error) {
        console.warn('Redis connection failed, falling back to in-memory storage:', error);
        this.storage = this.fallbackStorage;
      }
    }
  }

  /**
   * Shutdown the memory system
   */
  async shutdown(): Promise<void> {
    if (this.redisStorage) {
      await this.redisStorage.disconnect();
    }
  }

  /**
   * Create episodic memory
   */
  async createEpisodicMemory(
    content: string,
    context: string,
    metadata?: EpisodicMemory['metadata'],
    ttl?: number
  ): Promise<EpisodicMemory> {
    const memory: EpisodicMemory = {
      id: randomUUID(),
      type: MemoryType.EPISODIC,
      timestamp: Date.now(),
      context,
      content,
      metadata,
      ttl,
    };

    await this.recordOperation('createEpisodicMemory', async () => {
      await this.storage.set(memory);
    });

    return memory;
  }

  /**
   * Create semantic memory
   */
  async createSemanticMemory(
    concept: string,
    content: string,
    metadata?: SemanticMemory['metadata'],
    relations?: string[]
  ): Promise<SemanticMemory> {
    const memory: SemanticMemory = {
      id: randomUUID(),
      type: MemoryType.SEMANTIC,
      concept,
      content,
      metadata,
      relations,
      version: 1,
    };

    await this.recordOperation('createSemanticMemory', async () => {
      await this.storage.set(memory);
    });

    return memory;
  }

  /**
   * Create vector memory
   */
  async createVectorMemory(
    content: string,
    embedding: number[],
    metadata?: VectorMemory['metadata']
  ): Promise<VectorMemory> {
    const memory: VectorMemory = {
      id: randomUUID(),
      type: MemoryType.VECTOR,
      content,
      embedding,
      metadata,
      timestamp: Date.now(),
    };

    await this.recordOperation('createVectorMemory', async () => {
      await this.storage.set(memory);
    });

    return memory;
  }

  /**
   * Get memory by ID
   */
  async getMemory(id: string): Promise<UnifiedMemory | null> {
    return this.recordOperation('getMemory', async () => {
      return this.storage.get(id);
    });
  }

  /**
   * Update existing memory
   */
  async updateMemory(memory: UnifiedMemory): Promise<void> {
    await this.recordOperation('updateMemory', async () => {
      await this.storage.set(memory);
    });
  }

  /**
   * Delete memory by ID
   */
  async deleteMemory(id: string): Promise<boolean> {
    return this.recordOperation('deleteMemory', async () => {
      return this.storage.delete(id);
    });
  }

  /**
   * Query memories
   */
  async queryMemories(query: MemoryQuery): Promise<UnifiedMemory[]> {
    return this.recordOperation('queryMemories', async () => {
      return this.storage.query(query);
    });
  }

  /**
   * Get all memories
   */
  async getAllMemories(limit = 1000): Promise<UnifiedMemory[]> {
    return this.queryMemories({ query: '', limit });
  }

  /**
   * Search episodic memories by time range
   */
  async searchEpisodicByTime(
    startTime: number,
    endTime: number,
    limit = 10
  ): Promise<EpisodicMemory[]> {
    const results = await this.queryMemories({
      type: MemoryType.EPISODIC,
      query: '',
      limit,
      filters: { startTime, endTime },
    });

    return results.filter((m): m is EpisodicMemory => m.type === MemoryType.EPISODIC);
  }

  /**
   * Search semantic memories by concept
   */
  async searchSemanticByConcept(concept: string, limit = 10): Promise<SemanticMemory[]> {
    const results = await this.queryMemories({
      type: MemoryType.SEMANTIC,
      query: concept,
      limit: 100, // Get more to filter
    });

    // Filter by concept match and limit
    return results
      .filter((m): m is SemanticMemory => 
        m.type === MemoryType.SEMANTIC && 
        m.concept.toLowerCase().includes(concept.toLowerCase())
      )
      .slice(0, limit);
  }

  /**
   * Search vector memories by similarity (requires external embedding service)
   */
  async searchVectorBySimilarity(
    embedding: number[],
    threshold: number,
    limit = 10
  ): Promise<VectorMemory[]> {
    const results = await this.queryMemories({
      type: MemoryType.VECTOR,
      query: '',
      limit: 100, // Get more candidates for similarity calculation
      similarityThreshold: threshold,
    });

    const vectors = results.filter((m): m is VectorMemory => m.type === MemoryType.VECTOR);

    // Calculate cosine similarity
    const withScores = vectors.map((v) => ({
      memory: v,
      score: this.cosineSimilarity(embedding, v.embedding),
    }));

    // Filter by threshold and sort by score
    return withScores
      .filter((item) => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.memory);
  }

  /**
   * Clear memories by type
   */
  async clearMemories(type?: MemoryType): Promise<number> {
    return this.recordOperation('clearMemories', async () => {
      return this.storage.clear(type);
    });
  }

  /**
   * Count memories by type
   */
  async countMemories(type?: MemoryType): Promise<number> {
    return this.recordOperation('countMemories', async () => {
      return this.storage.count(type);
    });
  }

  /**
   * Get performance statistics
   */
  getPerformanceStatistics() {
    return this.performanceMonitor.getStatistics();
  }

  /**
   * Get all performance metrics
   */
  getPerformanceMetrics(operation?: string): MemoryMetrics[] {
    return this.performanceMonitor.getMetrics(operation);
  }

  /**
   * Clear performance metrics
   */
  clearPerformanceMetrics(): void {
    this.performanceMonitor.clearMetrics();
  }

  /**
   * Check if using Redis storage
   */
  isUsingRedis(): boolean {
    return this.storage instanceof RedisMemoryStorage && this.redisStorage?.isConnected() === true;
  }

  /**
   * Migrate data from fallback to Redis
   */
  async migrateToRedis(): Promise<number> {
    if (!this.redisStorage || this.isUsingRedis()) {
      throw new Error('Redis not available or already using Redis');
    }

    // Get all memories from fallback
    const allMemories = await this.fallbackStorage.query({
      query: '',
      limit: 10000,
    });

    // Connect to Redis if not connected
    if (!this.redisStorage.isConnected()) {
      await this.redisStorage.connect();
    }

    // Migrate each memory
    let migrated = 0;
    for (const memory of allMemories) {
      try {
        await this.redisStorage.set(memory);
        migrated++;
      } catch (error) {
        console.error(`Failed to migrate memory ${memory.id}:`, error);
      }
    }

    // Switch to Redis storage
    this.storage = this.redisStorage;

    return migrated;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) continue;

      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Record operation with performance monitoring
   */
  private async recordOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let result: T;

    try {
      result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      if (this.config.enablePerformanceMonitoring) {
        const duration = Date.now() - startTime;
        this.performanceMonitor.recordMetric({
          operation,
          duration,
          timestamp: Date.now(),
          success,
          cacheHit: this.isUsingRedis(),
        });
      }
    }
  }
}

/**
 * Factory function to create and initialize a UnifiedMemorySystem
 */
export async function createUnifiedMemorySystem(
  config?: UnifiedMemoryConfig
): Promise<UnifiedMemorySystem> {
  const system = new UnifiedMemorySystem(config);
  await system.initialize();
  return system;
}
