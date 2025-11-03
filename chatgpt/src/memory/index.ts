/**
 * Unified Memory System - Public API
 * Consolidates episodic, semantic, and vector memory systems
 */

export { UnifiedMemorySystem, createUnifiedMemorySystem } from './unified-memory-system.js';
export type { UnifiedMemoryConfig } from './unified-memory-system.js';

export { RedisMemoryStorage } from './redis-storage.js';
export { InMemoryStorage } from './in-memory-storage.js';
export { PerformanceMonitor } from './performance-monitor.js';

export {
  MemoryType,
  EpisodicMemorySchema,
  SemanticMemorySchema,
  VectorMemorySchema,
  UnifiedMemorySchema,
  MemoryQuerySchema,
  MemoryMetricsSchema,
} from './types.js';

export type {
  EpisodicMemory,
  SemanticMemory,
  VectorMemory,
  UnifiedMemory,
  MemoryQuery,
  MemoryMetrics,
  IMemoryStorage,
  IPerformanceMonitor,
} from './types.js';
