# Unified Memory System - API Changes

## Overview
The Unified Memory System consolidates three previously fragmented memory implementations into a single cohesive API.

## Key Changes

### 1. Consolidated Entry Point
**Before:**
- `src/handlers/memory/episodic-memory.ts`
- `src/memory/collective-memory.ts`
- `src/services/memory/`

**After:**
- `src/memory/unified-memory-system.ts` (single entry point)

### 2. Type-Safe Interfaces

All memory types now use Zod schemas with TypeScript type inference:

```typescript
import { UnifiedMemorySystem, MemoryType } from './memory/index.js';

const system = await createUnifiedMemorySystem();

// Episodic (temporal, contextual)
await system.createEpisodicMemory(content, context, metadata, ttl);

// Semantic (conceptual, factual)
await system.createSemanticMemory(concept, content, metadata, relations);

// Vector (embedding-based)
await system.createVectorMemory(content, embedding, metadata);
```

### 3. Redis Integration

The system now supports Redis-backed caching with automatic fallback:

```typescript
const system = await createUnifiedMemorySystem({
  enableRedis: true,
  redisUrl: process.env.REDIS_URL,
});
```

### 4. Performance Monitoring

Built-in performance tracking:

```typescript
const stats = system.getPerformanceStatistics();
console.log(`Ops: ${stats.totalOperations}, Success: ${stats.successRate}`);
```

## Migration Path

### Step 1: Install Dependencies
```bash
npm install redis
```

### Step 2: Initialize System
```typescript
import { createUnifiedMemorySystem } from './memory/index.js';

const memorySystem = await createUnifiedMemorySystem({
  enableRedis: true,
  enablePerformanceMonitoring: true,
});
```

### Step 3: Migrate Existing Data
```bash
npm run migrate:memory
```

Or programmatically:
```typescript
import { migrateEpisodicMemories } from './scripts/migrate-memory-data.js';

const legacyData = [...]; // Load from old system
const count = await migrateEpisodicMemories(system, legacyData);
```

## Backward Compatibility

### Episodic Memory
**Old API:**
```typescript
// From episodic-memory.ts
const memory = {
  id, timestamp, context, content,
  userId, sessionId, tags, importance
};
```

**New API:**
```typescript
const memory = await system.createEpisodicMemory(
  content,
  context,
  { userId, sessionId, tags, importance },
  ttl
);
```

### Semantic Memory
**Old API:**
```typescript
// From collective-memory.ts
const memory = {
  id, concept, content,
  category, confidence, source, verified
};
```

**New API:**
```typescript
const memory = await system.createSemanticMemory(
  concept,
  content,
  { category, confidence, source, verified },
  relations
);
```

### Vector Memory
**Old API:**
```typescript
// From services/memory/
const memory = {
  id, content, embedding,
  model, dimensions, tags
};
```

**New API:**
```typescript
const memory = await system.createVectorMemory(
  content,
  embedding,
  { model, dimensions, tags }
);
```

## Breaking Changes

### 1. Import Paths
```typescript
// Old
import { EpisodicMemory } from './handlers/memory/episodic-memory.js';
import { CollectiveMemory } from './memory/collective-memory.ts';
import { VectorService } from './services/memory/index.js';

// New
import { UnifiedMemorySystem, MemoryType } from './memory/index.js';
```

### 2. Async Initialization
```typescript
// Required initialization step
const system = await createUnifiedMemorySystem();
```

### 3. Query Interface
```typescript
// Old - varied interfaces
episodicMemory.query({ startTime, endTime });
semanticMemory.search(concept);
vectorService.findSimilar(embedding);

// New - unified interface
await system.queryMemories({
  type: MemoryType.EPISODIC,
  query: '',
  limit: 10,
  filters: { startTime, endTime }
});

await system.searchSemanticByConcept(concept, limit);
await system.searchVectorBySimilarity(embedding, threshold, limit);
```

## Testing

```bash
# Run unit tests
npm test

# Run benchmarks
npm run bench:memory

# Type checking
npm run typecheck
```

## Performance Improvements

- **In-Memory**: 10,000+ ops/sec
- **Redis**: 1,000+ ops/sec (network dependent)
- **Indexing**: Tag-based and time-based indexes for fast queries
- **Monitoring**: Built-in performance tracking

## Environment Variables

```bash
REDIS_URL=redis://localhost:6379  # Optional, defaults to localhost
```

## Next Steps

1. **Deploy Redis** - Set up Redis instance for production
2. **Run Migration** - Execute `npm run migrate:memory`
3. **Update Handlers** - Replace old imports with new API
4. **Test Integration** - Run tests with `npm test`
5. **Monitor Performance** - Track metrics via `getPerformanceStatistics()`

## Support

See full documentation: `docs/unified-memory-system.md`
