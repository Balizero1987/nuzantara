import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UnifiedMemorySystem, MemoryType } from './index.js';

describe('UnifiedMemorySystem', () => {
  let system: UnifiedMemorySystem;

  beforeEach(async () => {
    system = new UnifiedMemorySystem({
      enableRedis: false, // Use in-memory for tests
      enablePerformanceMonitoring: true,
    });
    await system.initialize();
  });

  afterEach(async () => {
    await system.clearMemories();
    await system.shutdown();
  });

  describe('Episodic Memory', () => {
    it('should create and retrieve episodic memory', async () => {
      const memory = await system.createEpisodicMemory(
        'Test content',
        'Test context',
        { userId: 'user-1', tags: ['test'] },
        3600
      );

      expect(memory.type).toBe(MemoryType.EPISODIC);
      expect(memory.content).toBe('Test content');
      expect(memory.context).toBe('Test context');

      const retrieved = await system.getMemory(memory.id);
      expect(retrieved).toEqual(memory);
    });

    it('should query episodic memories by time range', async () => {
      const startTime = Date.now();

      await system.createEpisodicMemory('Memory 1', 'Context 1');
      await system.createEpisodicMemory('Memory 2', 'Context 2');
      await system.createEpisodicMemory('Memory 3', 'Context 3');

      const endTime = Date.now();

      const results = await system.searchEpisodicByTime(startTime, endTime, 10);

      expect(results).toHaveLength(3);
      expect(results.every((m) => m.type === MemoryType.EPISODIC)).toBe(true);
    });

    it('should filter episodic memories by tags', async () => {
      await system.createEpisodicMemory('Memory 1', 'Context 1', { tags: ['important'] });
      await system.createEpisodicMemory('Memory 2', 'Context 2', { tags: ['casual'] });
      await system.createEpisodicMemory('Memory 3', 'Context 3', { tags: ['important'] });

      const results = await system.queryMemories({
        type: MemoryType.EPISODIC,
        query: '',
        limit: 10,
        filters: { tags: ['important'] },
      });

      expect(results).toHaveLength(2);
    });
  });

  describe('Semantic Memory', () => {
    it('should create and retrieve semantic memory', async () => {
      const memory = await system.createSemanticMemory('JavaScript', 'A programming language', {
        category: 'programming',
        confidence: 0.95,
      });

      expect(memory.type).toBe(MemoryType.SEMANTIC);
      expect(memory.concept).toBe('JavaScript');
      expect(memory.content).toBe('A programming language');

      const retrieved = await system.getMemory(memory.id);
      expect(retrieved).toEqual(memory);
    });

    it('should search semantic memories by concept', async () => {
      await system.createSemanticMemory('TypeScript', 'Typed JavaScript');
      await system.createSemanticMemory('JavaScript', 'Dynamic language');
      await system.createSemanticMemory('Python', 'Another language');

      const results = await system.searchSemanticByConcept('TypeScript', 10);

      expect(results).toHaveLength(1);
      expect(results[0]?.concept).toBe('TypeScript');
    });

    it('should update semantic memory version', async () => {
      const memory = await system.createSemanticMemory('Concept', 'Original content');

      expect(memory.version).toBe(1);

      const updated = { ...memory, content: 'Updated content', version: 2 };
      await system.updateMemory(updated);

      const retrieved = await system.getMemory(memory.id);
      expect(retrieved?.content).toBe('Updated content');
    });
  });

  describe('Vector Memory', () => {
    it('should create and retrieve vector memory', async () => {
      const embedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const memory = await system.createVectorMemory('Vector content', embedding, {
        model: 'test-model',
        dimensions: 5,
      });

      expect(memory.type).toBe(MemoryType.VECTOR);
      expect(memory.embedding).toEqual(embedding);
      expect(memory.metadata?.model).toBe('test-model');

      const retrieved = await system.getMemory(memory.id);
      expect(retrieved).toEqual(memory);
    });

    it('should search vector memories by similarity', async () => {
      // Create similar vectors
      await system.createVectorMemory('Content 1', [1, 0, 0, 0]);
      await system.createVectorMemory('Content 2', [0.9, 0.1, 0, 0]);
      await system.createVectorMemory('Content 3', [0, 0, 1, 0]);

      // Search with query vector similar to first two
      const queryVector = [1, 0, 0, 0];
      const results = await system.searchVectorBySimilarity(queryVector, 0.8, 10);

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Memory Management', () => {
    it('should delete memory', async () => {
      const memory = await system.createEpisodicMemory('Test', 'Context');

      const deleted = await system.deleteMemory(memory.id);
      expect(deleted).toBe(true);

      const retrieved = await system.getMemory(memory.id);
      expect(retrieved).toBeNull();
    });

    it('should count memories by type', async () => {
      await system.createEpisodicMemory('E1', 'C1');
      await system.createEpisodicMemory('E2', 'C2');
      await system.createSemanticMemory('S1', 'Content');

      const totalCount = await system.countMemories();
      const episodicCount = await system.countMemories(MemoryType.EPISODIC);
      const semanticCount = await system.countMemories(MemoryType.SEMANTIC);

      expect(totalCount).toBe(3);
      expect(episodicCount).toBe(2);
      expect(semanticCount).toBe(1);
    });

    it('should clear memories by type', async () => {
      await system.createEpisodicMemory('E1', 'C1');
      await system.createEpisodicMemory('E2', 'C2');
      await system.createSemanticMemory('S1', 'Content');

      const cleared = await system.clearMemories(MemoryType.EPISODIC);
      expect(cleared).toBe(2);

      const episodicCount = await system.countMemories(MemoryType.EPISODIC);
      const semanticCount = await system.countMemories(MemoryType.SEMANTIC);

      expect(episodicCount).toBe(0);
      expect(semanticCount).toBe(1);
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics', async () => {
      await system.createEpisodicMemory('Test', 'Context');
      await system.createSemanticMemory('Concept', 'Content');

      const stats = system.getPerformanceStatistics();

      expect(stats.totalOperations).toBeGreaterThan(0);
      expect(stats.averageDuration).toBeGreaterThanOrEqual(0);
      expect(stats.successRate).toBe(1);
    });

    it('should filter metrics by operation', async () => {
      await system.createEpisodicMemory('Test', 'Context');
      await system.queryMemories({ query: '', limit: 10 });

      const createMetrics = system.getPerformanceMetrics('createEpisodicMemory');
      const queryMetrics = system.getPerformanceMetrics('queryMemories');

      expect(createMetrics.length).toBeGreaterThan(0);
      expect(queryMetrics.length).toBeGreaterThan(0);
    });

    it('should clear performance metrics', async () => {
      await system.createEpisodicMemory('Test', 'Context');

      system.clearPerformanceMetrics();

      const stats = system.getPerformanceStatistics();
      expect(stats.totalOperations).toBe(0);
    });
  });
});
