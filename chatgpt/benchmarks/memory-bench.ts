import { UnifiedMemorySystem, MemoryType } from '../src/memory/index.js';

/**
 * Performance benchmark for UnifiedMemorySystem
 */

interface BenchmarkResult {
  operation: string;
  duration: number;
  opsPerSecond: number;
  avgLatency: number;
}

async function benchmarkInMemory(): Promise<BenchmarkResult[]> {
  console.log('📊 Benchmarking In-Memory Storage...\n');

  const system = new UnifiedMemorySystem({
    enableRedis: false,
    enablePerformanceMonitoring: true,
  });

  await system.initialize();

  const results: BenchmarkResult[] = [];

  // Benchmark: Create episodic memories
  console.log('  Testing createEpisodicMemory...');
  const episodicStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    await system.createEpisodicMemory(
      `Test content ${i}`,
      `Test context ${i}`,
      { userId: `user-${i % 10}`, tags: ['test', 'benchmark'] },
      3600
    );
  }
  const episodicDuration = Date.now() - episodicStart;
  results.push({
    operation: 'createEpisodicMemory',
    duration: episodicDuration,
    opsPerSecond: 1000 / (episodicDuration / 1000),
    avgLatency: episodicDuration / 1000,
  });

  // Benchmark: Create semantic memories
  console.log('  Testing createSemanticMemory...');
  const semanticStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    await system.createSemanticMemory(`Concept ${i}`, `Content for concept ${i}`, {
      category: 'test',
      confidence: 0.95,
    });
  }
  const semanticDuration = Date.now() - semanticStart;
  results.push({
    operation: 'createSemanticMemory',
    duration: semanticDuration,
    opsPerSecond: 1000 / (semanticDuration / 1000),
    avgLatency: semanticDuration / 1000,
  });

  // Benchmark: Create vector memories
  console.log('  Testing createVectorMemory...');
  const vectorStart = Date.now();
  for (let i = 0; i < 1000; i++) {
    const embedding = Array.from({ length: 128 }, () => Math.random());
    await system.createVectorMemory(`Vector content ${i}`, embedding, {
      model: 'test-model',
      dimensions: 128,
    });
  }
  const vectorDuration = Date.now() - vectorStart;
  results.push({
    operation: 'createVectorMemory',
    duration: vectorDuration,
    opsPerSecond: 1000 / (vectorDuration / 1000),
    avgLatency: vectorDuration / 1000,
  });

  // Benchmark: Query memories
  console.log('  Testing queryMemories...');
  const queryStart = Date.now();
  for (let i = 0; i < 100; i++) {
    await system.queryMemories({
      type: MemoryType.EPISODIC,
      query: 'test',
      limit: 10,
      filters: { tags: ['test'] },
    });
  }
  const queryDuration = Date.now() - queryStart;
  results.push({
    operation: 'queryMemories',
    duration: queryDuration,
    opsPerSecond: 100 / (queryDuration / 1000),
    avgLatency: queryDuration / 100,
  });

  // Benchmark: Get memory by ID
  console.log('  Testing getMemory...');
  const allMemories = await system.queryMemories({ query: '', limit: 1000 });
  const getStart = Date.now();
  for (let i = 0; i < 1000 && i < allMemories.length; i++) {
    const memory = allMemories[i];
    if (memory) {
      await system.getMemory(memory.id);
    }
  }
  const getDuration = Date.now() - getStart;
  results.push({
    operation: 'getMemory',
    duration: getDuration,
    opsPerSecond: 1000 / (getDuration / 1000),
    avgLatency: getDuration / 1000,
  });

  await system.shutdown();

  return results;
}

async function benchmarkRedis(): Promise<BenchmarkResult[]> {
  console.log('📊 Benchmarking Redis Storage...\n');

  const system = new UnifiedMemorySystem({
    enableRedis: true,
    enablePerformanceMonitoring: true,
  });

  try {
    await system.initialize();

    if (!system.isUsingRedis()) {
      console.log('⚠️  Redis not available, skipping Redis benchmarks\n');
      return [];
    }

    const results: BenchmarkResult[] = [];

    // Benchmark: Create episodic memories with Redis
    console.log('  Testing createEpisodicMemory (Redis)...');
    const episodicStart = Date.now();
    for (let i = 0; i < 1000; i++) {
      await system.createEpisodicMemory(
        `Test content ${i}`,
        `Test context ${i}`,
        { userId: `user-${i % 10}`, tags: ['test', 'benchmark'] },
        3600
      );
    }
    const episodicDuration = Date.now() - episodicStart;
    results.push({
      operation: 'createEpisodicMemory (Redis)',
      duration: episodicDuration,
      opsPerSecond: 1000 / (episodicDuration / 1000),
      avgLatency: episodicDuration / 1000,
    });

    // Benchmark: Query with Redis
    console.log('  Testing queryMemories (Redis)...');
    const queryStart = Date.now();
    for (let i = 0; i < 100; i++) {
      await system.queryMemories({
        type: MemoryType.EPISODIC,
        query: 'test',
        limit: 10,
      });
    }
    const queryDuration = Date.now() - queryStart;
    results.push({
      operation: 'queryMemories (Redis)',
      duration: queryDuration,
      opsPerSecond: 100 / (queryDuration / 1000),
      avgLatency: queryDuration / 100,
    });

    await system.shutdown();

    return results;
  } catch (error) {
    console.log('⚠️  Redis benchmark failed:', error);
    await system.shutdown();
    return [];
  }
}

function printResults(title: string, results: BenchmarkResult[]): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(80)}\n`);

  for (const result of results) {
    console.log(`${result.operation}:`);
    console.log(`  Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`  Ops/sec: ${result.opsPerSecond.toFixed(2)}`);
    console.log(`  Avg Latency: ${result.avgLatency.toFixed(2)}ms\n`);
  }
}

async function main() {
  console.log('\n🚀 UnifiedMemorySystem Performance Benchmarks\n');
  console.log('This benchmark will test the performance of memory operations');
  console.log('for both in-memory and Redis-backed storage.\n');

  // Run in-memory benchmarks
  const inMemoryResults = await benchmarkInMemory();
  printResults('In-Memory Storage Results', inMemoryResults);

  // Run Redis benchmarks
  const redisResults = await benchmarkRedis();
  if (redisResults.length > 0) {
    printResults('Redis Storage Results', redisResults);
  }

  // Comparison
  if (redisResults.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('Performance Comparison');
    console.log(`${'='.repeat(80)}\n`);

    const inMemoryCreate = inMemoryResults.find((r) => r.operation === 'createEpisodicMemory');
    const redisCreate = redisResults.find((r) => r.operation === 'createEpisodicMemory (Redis)');

    if (inMemoryCreate && redisCreate) {
      const speedup = inMemoryCreate.opsPerSecond / redisCreate.opsPerSecond;
      console.log(`In-Memory is ${speedup.toFixed(2)}x faster than Redis for createEpisodicMemory`);
    }

    const inMemoryQuery = inMemoryResults.find((r) => r.operation === 'queryMemories');
    const redisQuery = redisResults.find((r) => r.operation === 'queryMemories (Redis)');

    if (inMemoryQuery && redisQuery) {
      const speedup = inMemoryQuery.opsPerSecond / redisQuery.opsPerSecond;
      console.log(`In-Memory is ${speedup.toFixed(2)}x faster than Redis for queryMemories\n`);
    }
  }

  console.log('✅ Benchmarks completed!\n');
}

// Run benchmarks
await main();
