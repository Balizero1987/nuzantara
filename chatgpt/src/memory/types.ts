import { z } from 'zod';

/**
 * Memory Types - Episodic, Semantic, and Vector
 */
export enum MemoryType {
  EPISODIC = 'episodic', // Time-based, context-specific memories
  SEMANTIC = 'semantic', // Fact-based, general knowledge
  VECTOR = 'vector', // Embedding-based similarity search
}

/**
 * Episodic Memory Schema - Temporal, contextual memories
 */
export const EpisodicMemorySchema = z.object({
  id: z.string().uuid(),
  type: z.literal(MemoryType.EPISODIC),
  timestamp: z.number(),
  context: z.string(),
  content: z.string(),
  metadata: z
    .object({
      userId: z.string().optional(),
      sessionId: z.string().optional(),
      tags: z.array(z.string()).optional(),
      importance: z.number().min(0).max(1).optional(),
    })
    .optional(),
  ttl: z.number().optional(), // Time to live in seconds
});

/**
 * Semantic Memory Schema - Factual, conceptual knowledge
 */
export const SemanticMemorySchema = z.object({
  id: z.string().uuid(),
  type: z.literal(MemoryType.SEMANTIC),
  concept: z.string(),
  content: z.string(),
  relations: z.array(z.string()).optional(), // Related concept IDs
  metadata: z
    .object({
      category: z.string().optional(),
      confidence: z.number().min(0).max(1).optional(),
      source: z.string().optional(),
      verified: z.boolean().optional(),
    })
    .optional(),
  version: z.number().default(1),
});

/**
 * Vector Memory Schema - Embedding-based memories
 */
export const VectorMemorySchema = z.object({
  id: z.string().uuid(),
  type: z.literal(MemoryType.VECTOR),
  content: z.string(),
  embedding: z.array(z.number()), // Vector embedding
  metadata: z
    .object({
      model: z.string().optional(),
      dimensions: z.number().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
  timestamp: z.number(),
});

/**
 * Unified Memory Schema - Union of all memory types
 */
export const UnifiedMemorySchema = z.discriminatedUnion('type', [
  EpisodicMemorySchema,
  SemanticMemorySchema,
  VectorMemorySchema,
]);

/**
 * Memory Query Schema
 */
export const MemoryQuerySchema = z.object({
  type: z.nativeEnum(MemoryType).optional(),
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
  filters: z
    .object({
      startTime: z.number().optional(),
      endTime: z.number().optional(),
      tags: z.array(z.string()).optional(),
      userId: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
  similarityThreshold: z.number().min(0).max(1).optional(), // For vector search
});

/**
 * Performance Metrics Schema
 */
export const MemoryMetricsSchema = z.object({
  operation: z.string(),
  duration: z.number(),
  timestamp: z.number(),
  success: z.boolean(),
  memoryType: z.nativeEnum(MemoryType).optional(),
  cacheHit: z.boolean().optional(),
  recordCount: z.number().optional(),
});

/**
 * TypeScript Types inferred from Zod schemas
 */
export type EpisodicMemory = z.infer<typeof EpisodicMemorySchema>;
export type SemanticMemory = z.infer<typeof SemanticMemorySchema>;
export type VectorMemory = z.infer<typeof VectorMemorySchema>;
export type UnifiedMemory = z.infer<typeof UnifiedMemorySchema>;
export type MemoryQuery = z.infer<typeof MemoryQuerySchema>;
export type MemoryMetrics = z.infer<typeof MemoryMetricsSchema>;

/**
 * Memory Storage Interface
 */
export interface IMemoryStorage {
  get(id: string): Promise<UnifiedMemory | null>;
  set(memory: UnifiedMemory): Promise<void>;
  delete(id: string): Promise<boolean>;
  query(query: MemoryQuery): Promise<UnifiedMemory[]>;
  clear(type?: MemoryType): Promise<number>;
  count(type?: MemoryType): Promise<number>;
}

/**
 * Performance Monitor Interface
 */
export interface IPerformanceMonitor {
  recordMetric(metric: MemoryMetrics): void;
  getMetrics(operation?: string): MemoryMetrics[];
  clearMetrics(): void;
}
