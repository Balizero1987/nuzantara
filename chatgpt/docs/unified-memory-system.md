# Unified Memory System

## Overview

The **Unified Memory System** consolidates three previously fragmented memory implementations (episodic, semantic, and vector) into a single, cohesive API with Redis-backed caching, in-memory fallback, type-safe interfaces, and performance monitoring.

## Architecture

### Memory Types

1. **Episodic Memory** - Time-based, contextual memories
   - Temporal events with timestamps
   - User sessions and contexts
   - TTL support for automatic expiration
   - Tag-based filtering

2. **Semantic Memory** - Fact-based, general knowledge
   - Conceptual information
   - Relationship tracking between concepts
   - Version control
   - Category organization

3. **Vector Memory** - Embedding-based similarity search
   - High-dimensional vector embeddings
   - Cosine similarity search
   - Model metadata tracking
   - Configurable dimensions

## Installation

```bash
npm install
```

## Configuration

The system supports both Redis and in-memory storage:

```typescript
import { createUnifiedMemorySystem } from './memory/index.js';

// With Redis (recommended for production)
const system = await createUnifiedMemorySystem({
  enableRedis: true,
  redisUrl: 'redis://localhost:6379',
  enablePerformanceMonitoring: true,
  maxMetrics: 1000,
});

// In-memory only (for testing/development)
const system = await createUnifiedMemorySystem({
  enableRedis: false,
  enablePerformanceMonitoring: true,
});
```

### Environment Variables

- `REDIS_URL` - Redis connection URL (default: `redis://localhost:6379`)

## Usage

### Creating Memories

#### Episodic Memory

```typescript
const memory = await system.createEpisodicMemory(
  'User completed onboarding',
  'signup-flow',
  {
    userId: 'user-123',
    sessionId: 'session-456',
    tags: ['onboarding', 'milestone'],
    importance: 0.9,
  },
  3600 // TTL in seconds (optional)
);
```

#### Semantic Memory

```typescript
const memory = await system.createSemanticMemory(
  'TypeScript',
  'A typed superset of JavaScript that compiles to plain JavaScript',
  {
    category: 'programming-languages',
    confidence: 0.95,
    source: 'documentation',
    verified: true,
  },
  ['JavaScript', 'ECMAScript'] // Related concepts (optional)
);
```

#### Vector Memory

```typescript
const embedding = await getEmbedding('Some text to embed'); // Your embedding function

const memory = await system.createVectorMemory(
  'Document about machine learning',
  embedding,
  {
    model: 'text-embedding-ada-002',
    dimensions: 1536,
    tags: ['ml', 'ai'],
  }
);
```

### Querying Memories

#### Get by ID

```typescript
const memory = await system.getMemory('memory-id');
```

#### Query with Filters

```typescript
const results = await system.queryMemories({
  type: MemoryType.EPISODIC,
  query: 'user activity',
  limit: 10,
  filters: {
    startTime: Date.now() - 86400000, // Last 24 hours
    endTime: Date.now(),
    tags: ['important'],
    userId: 'user-123',
  },
});
```

#### Search Episodic by Time Range

```typescript
const memories = await system.searchEpisodicByTime(
  Date.now() - 3600000, // 1 hour ago
  Date.now(),
  20 // limit
);
```

#### Search Semantic by Concept

```typescript
const memories = await system.searchSemanticByConcept('JavaScript', 10);
```

#### Search Vector by Similarity

```typescript
const queryEmbedding = await getEmbedding('machine learning query');

const similarMemories = await system.searchVectorBySimilarity(
  queryEmbedding,
  0.8, // similarity threshold (0-1)
  10 // limit
);
```

### Memory Management

#### Update Memory

```typescript
const memory = await system.getMemory('memory-id');
if (memory) {
  memory.content = 'Updated content';
  await system.updateMemory(memory);
}
```

#### Delete Memory

```typescript
const deleted = await system.deleteMemory('memory-id');
console.log(`Deleted: ${deleted}`);
```

#### Count Memories

```typescript
const totalCount = await system.countMemories();
const episodicCount = await system.countMemories(MemoryType.EPISODIC);
const semanticCount = await system.countMemories(MemoryType.SEMANTIC);
const vectorCount = await system.countMemories(MemoryType.VECTOR);
```

#### Clear Memories

```typescript
// Clear all episodic memories
const clearedCount = await system.clearMemories(MemoryType.EPISODIC);

// Clear all memories
const allCleared = await system.clearMemories();
```

### Performance Monitoring

```typescript
// Get statistics
const stats = system.getPerformanceStatistics();
console.log(`Total operations: ${stats.totalOperations}`);
console.log(`Average duration: ${stats.averageDuration}ms`);
console.log(`Success rate: ${stats.successRate * 100}%`);
console.log(`Cache hit rate: ${stats.cacheHitRate * 100}%`);

// Get metrics for specific operation
const createMetrics = system.getPerformanceMetrics('createEpisodicMemory');

// Clear metrics
system.clearPerformanceMetrics();
```

### Migration

Migrate existing data from fragmented systems:

```bash
npm run migrate:memory
```

Or programmatically:

```typescript
// Migrate from in-memory to Redis
const migratedCount = await system.migrateToRedis();
console.log(`Migrated ${migratedCount} memories to Redis`);
```

## API Reference

### UnifiedMemorySystem

#### Methods

- `initialize()` - Connect to Redis (if enabled)
- `shutdown()` - Disconnect and cleanup
- `createEpisodicMemory(content, context, metadata?, ttl?)` - Create episodic memory
- `createSemanticMemory(concept, content, metadata?, relations?)` - Create semantic memory
- `createVectorMemory(content, embedding, metadata?)` - Create vector memory
- `getMemory(id)` - Get memory by ID
- `updateMemory(memory)` - Update existing memory
- `deleteMemory(id)` - Delete memory
- `queryMemories(query)` - Query with filters
- `searchEpisodicByTime(startTime, endTime, limit?)` - Time-based episodic search
- `searchSemanticByConcept(concept, limit?)` - Concept-based semantic search
- `searchVectorBySimilarity(embedding, threshold, limit?)` - Similarity-based vector search
- `countMemories(type?)` - Count memories
- `clearMemories(type?)` - Clear memories
- `isUsingRedis()` - Check if using Redis storage
- `migrateToRedis()` - Migrate from in-memory to Redis
- `getPerformanceStatistics()` - Get performance stats
- `getPerformanceMetrics(operation?)` - Get detailed metrics
- `clearPerformanceMetrics()` - Clear metrics

## Testing

```bash
# Run all tests
npm test

# Run type checking
npm run typecheck

# Run memory benchmarks
npm run bench:memory
```

## Performance Benchmarks

Run benchmarks to compare in-memory vs Redis performance:

```bash
npm run bench:memory
```

Expected performance characteristics:
- **In-Memory**: 10,000+ ops/sec for reads, 5,000+ ops/sec for writes
- **Redis**: 1,000+ ops/sec for reads/writes (network dependent)

## Backward Compatibility

The unified system maintains backward compatibility with existing v3 Ω handlers through:

1. **Type-safe interfaces** - All memory types implement the `UnifiedMemory` discriminated union
2. **Migration utilities** - Scripts to import existing data
3. **Flexible querying** - Supports legacy query patterns

### Migration from Legacy Systems

```typescript
import { migrateEpisodicMemories } from './scripts/migrate-memory-data.js';

// Example legacy data
const legacyData = [
  {
    id: 'old-id-1',
    timestamp: Date.now(),
    context: 'legacy-context',
    content: 'legacy content',
    userId: 'user-1',
  },
];

const count = await migrateEpisodicMemories(system, legacyData);
console.log(`Migrated ${count} memories`);
```

## Error Handling

```typescript
try {
  await system.initialize();
} catch (error) {
  console.error('Failed to initialize memory system:', error);
  // System automatically falls back to in-memory storage
}
```

## Best Practices

1. **Always initialize** - Call `initialize()` before using the system
2. **Use appropriate memory types** - Choose episodic, semantic, or vector based on data characteristics
3. **Set TTL for episodic memories** - Prevent memory bloat with automatic expiration
4. **Monitor performance** - Track metrics to identify bottlenecks
5. **Use Redis in production** - In-memory is for development/testing only
6. **Handle errors gracefully** - System falls back to in-memory if Redis fails
7. **Shutdown cleanly** - Call `shutdown()` on application exit

## Integration with v3 Ω Handlers

```typescript
import express from 'express';
import { createUnifiedMemorySystem } from './memory/index.js';

const app = express();
const memorySystem = await createUnifiedMemorySystem();

// Example handler
app.post('/api/memory/store', async (req, res) => {
  const { type, content, context } = req.body;

  try {
    let memory;
    if (type === 'episodic') {
      memory = await memorySystem.createEpisodicMemory(content, context);
    } else if (type === 'semantic') {
      memory = await memorySystem.createSemanticMemory(context, content);
    }

    res.json({ success: true, memory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

## License

MIT
