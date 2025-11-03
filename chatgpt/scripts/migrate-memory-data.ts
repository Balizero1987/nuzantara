import {
  UnifiedMemorySystem,
  MemoryType,
  type EpisodicMemory,
  type SemanticMemory,
  type VectorMemory,
} from '../memory/index.js'; // Restored .js extension for ESM compliance

/**
 * Migration script for existing memory data
 * Consolidates fragmented episodic, semantic, and vector memory into UnifiedMemorySystem
 */

interface LegacyEpisodicMemory {
  id: string;
  timestamp: number;
  context: string;
  content: string;
  userId?: string;
  sessionId?: string;
  tags?: string[];
  importance?: number;
  ttl?: number;
}

interface LegacySemanticMemory {
  id: string;
  concept: string;
  content: string;
  category?: string;
  confidence?: number;
  source?: string;
  verified?: boolean;
  relations?: string[];
}

interface LegacyVectorMemory {
  id: string;
  content: string;
  embedding: number[];
  model?: string;
  dimensions?: number;
  tags?: string[];
  timestamp: number;
}

/**
 * Migrate episodic memories from legacy system
 */
async function migrateEpisodicMemories(
  system: UnifiedMemorySystem,
  legacyMemories: LegacyEpisodicMemory[]
): Promise<number> {
  let migrated = 0;

  for (const legacy of legacyMemories) {
    try {
      const memory: EpisodicMemory = {
        id: legacy.id,
        type: MemoryType.EPISODIC,
        timestamp: legacy.timestamp,
        context: legacy.context,
        content: legacy.content,
        metadata: {
          userId: legacy.userId,
          sessionId: legacy.sessionId,
          tags: legacy.tags,
          importance: legacy.importance,
        },
        ttl: legacy.ttl,
      };

      await system.updateMemory(memory);
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate episodic memory ${legacy.id}:`, error);
    }
  }

  return migrated;
}

/**
 * Migrate semantic memories from legacy collective memory system
 */
async function migrateSemanticMemories(
  system: UnifiedMemorySystem,
  legacyMemories: LegacySemanticMemory[]
): Promise<number> {
  let migrated = 0;

  for (const legacy of legacyMemories) {
    try {
      const memory: SemanticMemory = {
        id: legacy.id,
        type: MemoryType.SEMANTIC,
        concept: legacy.concept,
        content: legacy.content,
        metadata: {
          category: legacy.category,
          confidence: legacy.confidence,
          source: legacy.source,
          verified: legacy.verified,
        },
        relations: legacy.relations,
        version: 1,
      };

      await system.updateMemory(memory);
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate semantic memory ${legacy.id}:`, error);
    }
  }

  return migrated;
}

/**
 * Migrate vector memories from legacy vector service
 */
async function migrateVectorMemories(
  system: UnifiedMemorySystem,
  legacyMemories: LegacyVectorMemory[]
): Promise<number> {
  let migrated = 0;

  for (const legacy of legacyMemories) {
    try {
      const memory: VectorMemory = {
        id: legacy.id,
        type: MemoryType.VECTOR,
        content: legacy.content,
        embedding: legacy.embedding,
        metadata: {
          model: legacy.model,
          dimensions: legacy.dimensions,
          tags: legacy.tags,
        },
        timestamp: legacy.timestamp,
      };

      await system.updateMemory(memory);
      migrated++;
    } catch (error) {
      console.error(`Failed to migrate vector memory ${legacy.id}:`, error);
    }
  }

  return migrated;
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting memory system migration...\n');

  // Initialize unified memory system
  const system = new UnifiedMemorySystem({
    enableRedis: true,
    enablePerformanceMonitoring: true,
  });

  await system.initialize();

  console.log(`✓ Unified memory system initialized`);
  console.log(`✓ Using storage: ${system.isUsingRedis() ? 'Redis' : 'In-Memory'}\n`);

  // Example: Load legacy data (replace with actual data loading logic)
  const legacyEpisodicData: LegacyEpisodicMemory[] = [
    // Load from /src/handlers/memory/episodic-memory.ts data store
  ];

  const legacySemanticData: LegacySemanticMemory[] = [
    // Load from /src/memory/collective-memory.ts data store
  ];

  const legacyVectorData: LegacyVectorMemory[] = [
    // Load from /src/services/memory/ data store
  ];

  // Perform migrations
  console.log('📦 Migrating episodic memories...');
  const episodicCount = await migrateEpisodicMemories(system, legacyEpisodicData);
  console.log(`✓ Migrated ${episodicCount} episodic memories\n`);

  console.log('📦 Migrating semantic memories...');
  const semanticCount = await migrateSemanticMemories(system, legacySemanticData);
  console.log(`✓ Migrated ${semanticCount} semantic memories\n`);

  console.log('📦 Migrating vector memories...');
  const vectorCount = await migrateVectorMemories(system, legacyVectorData);
  console.log(`✓ Migrated ${vectorCount} vector memories\n`);

  // Display statistics
  const stats = system.getPerformanceStatistics();
  console.log('📊 Migration Statistics:');
  console.log(`   Total operations: ${stats.totalOperations}`);
  console.log(`   Average duration: ${stats.averageDuration.toFixed(2)}ms`);
  console.log(`   Success rate: ${(stats.successRate * 100).toFixed(1)}%`);
  console.log(`   Cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%\n`);

  // Display memory counts
  const totalCount = await system.countMemories();
  const episodicCountFinal = await system.countMemories(MemoryType.EPISODIC);
  const semanticCountFinal = await system.countMemories(MemoryType.SEMANTIC);
  const vectorCountFinal = await system.countMemories(MemoryType.VECTOR);

  console.log('📈 Final Memory Counts:');
  console.log(`   Total memories: ${totalCount}`);
  console.log(`   Episodic: ${episodicCountFinal}`);
  console.log(`   Semantic: ${semanticCountFinal}`);
  console.log(`   Vector: ${vectorCountFinal}\n`);

  console.log('✅ Migration completed successfully!');

  await system.shutdown();
}

// Run migration if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  await main().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
}

export {
  migrateEpisodicMemories,
  migrateSemanticMemories,
  migrateVectorMemories,
  type LegacyEpisodicMemory,
  type LegacySemanticMemory,
  type LegacyVectorMemory,
};
