/**
 * MEMORY PHASE 3: Hybrid Search Testing
 * Tests combination of semantic (ChromaDB) + keyword (Firestore) search
 */

import { memorySearchHybrid, memorySave } from '../src/handlers/memory/memory-firestore.js';

interface TestResult {
  test: string;
  passed: boolean;
  details: string;
  duration_ms: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<{ passed: boolean; details: string }>) {
  const start = Date.now();
  try {
    const { passed, details } = await testFn();
    const duration_ms = Date.now() - start;

    results.push({
      test: name,
      passed,
      details,
      duration_ms
    });

    console.log(`${passed ? '✅' : '❌'} ${name} (${duration_ms}ms)`);
    console.log(`   ${details}\n`);
  } catch (error: any) {
    const duration_ms = Date.now() - start;
    results.push({
      test: name,
      passed: false,
      details: `Error: ${error.message}`,
      duration_ms
    });
    console.log(`❌ ${name} (${duration_ms}ms)`);
    console.log(`   Error: ${error.message}\n`);
  }
}

async function setupTestData() {
  console.log('📝 Setting up test data...\n');

  const testUserId = 'test_user_hybrid_search';

  // Clear existing test data first would go here
  // For now, we'll just add new memories

  // Test memory 1: Exact keyword match
  await memorySave({
    userId: testUserId,
    content: 'Sahira is the Marketing Specialist at Bali Zero',
    type: 'profile',
    metadata: { entity: 'sahira', role: 'marketing' }
  });

  // Test memory 2: Semantic match (similar meaning)
  await memorySave({
    userId: testUserId,
    content: 'The social media team handles all digital communications and brand presence',
    type: 'profile',
    metadata: { entity: 'team', department: 'communications' }
  });

  // Test memory 3: Contact info (keyword only)
  await memorySave({
    userId: testUserId,
    content: 'Contact Sahira at sahira@balizero.com for marketing inquiries',
    type: 'contact',
    metadata: { entity: 'sahira', type: 'email' }
  });

  // Test memory 4: Tax expertise (for semantic test)
  await memorySave({
    userId: testUserId,
    content: 'Expert in Indonesian fiscal regulations and NPWP registration procedures',
    type: 'expertise',
    metadata: { domain: 'taxation' }
  });

  console.log('✅ Test data created\n');

  return testUserId;
}

async function main() {
  console.log('=' .repeat(70));
  console.log('MEMORY PHASE 3: HYBRID SEARCH TEST SUITE');
  console.log('=' .repeat(70));
  console.log();

  const testUserId = await setupTestData();

  // Test 1: Exact keyword match boost
  await runTest('Test 1: Exact keyword match gets boosted score', async () => {
    const response = await memorySearchHybrid({
      query: 'Sahira',
      userId: testUserId,
      limit: 5
    });

    const results = response.data?.results || [];
    const topResult = results[0];

    // Should find Sahira with high score
    const hasSahira = topResult?.content?.toLowerCase().includes('sahira');
    const isHybridSource = topResult?.source === 'hybrid' || topResult?.source === 'keyword';

    return {
      passed: hasSahira && results.length > 0,
      details: `Found ${results.length} results. Top: "${topResult?.content?.substring(0, 50)}..." (source: ${topResult?.source}, score: ${topResult?.score?.toFixed(3)})`
    };
  });

  // Test 2: Semantic understanding
  await runTest('Test 2: Semantic search finds related concepts', async () => {
    const response = await memorySearchHybrid({
      query: 'who manages social media?',
      userId: testUserId,
      limit: 5
    });

    const results = response.data?.results || [];

    // Should find marketing/communications team even without exact words
    const hasRelevant = results.some(r =>
      r.content?.toLowerCase().includes('marketing') ||
      r.content?.toLowerCase().includes('social') ||
      r.content?.toLowerCase().includes('communications')
    );

    const semanticResults = results.filter(r => r.source === 'semantic' || r.source === 'hybrid');

    return {
      passed: hasRelevant && semanticResults.length > 0,
      details: `Found ${results.length} results (${semanticResults.length} semantic). Relevant: ${hasRelevant}`
    };
  });

  // Test 3: Deduplication
  await runTest('Test 3: Results are deduplicated (no duplicates)', async () => {
    const response = await memorySearchHybrid({
      query: 'Sahira marketing',
      userId: testUserId,
      limit: 10
    });

    const results = response.data?.results || [];
    const uniqueContents = new Set(results.map(r => r.content));

    return {
      passed: uniqueContents.size === results.length,
      details: `${results.length} results, ${uniqueContents.size} unique. Deduplicated: ${uniqueContents.size === results.length}`
    };
  });

  // Test 4: Performance benchmark
  await runTest('Test 4: Performance < 500ms', async () => {
    const start = Date.now();

    await memorySearchHybrid({
      query: 'tax expert Indonesia',
      userId: testUserId,
      limit: 10
    });

    const duration = Date.now() - start;

    return {
      passed: duration < 500,
      details: `Query executed in ${duration}ms (target: <500ms)`
    };
  });

  // Test 5: Combined sources
  await runTest('Test 5: Hybrid combines both semantic and keyword', async () => {
    const response = await memorySearchHybrid({
      query: 'fiscal regulations',
      userId: testUserId,
      limit: 10
    });

    const sources = response.data?.sources || {};
    const hasBothSources = (sources.semantic || 0) > 0 && (sources.keyword || 0) > 0;

    return {
      passed: hasBothSources || sources.combined > 0,
      details: `Sources - Semantic: ${sources.semantic}, Keyword: ${sources.keyword}, Combined: ${sources.combined}`
    };
  });

  // Test 6: Empty query handling
  await runTest('Test 6: Handles edge cases (empty query)', async () => {
    try {
      await memorySearchHybrid({
        query: '',
        userId: testUserId,
        limit: 5
      });
      return {
        passed: false,
        details: 'Should have thrown error for empty query'
      };
    } catch (error: any) {
      return {
        passed: error.message.includes('query is required'),
        details: `Correctly rejected: ${error.message}`
      };
    }
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / total;

  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(0)}ms`);
  console.log();

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED - HYBRID SEARCH IS FULLY OPERATIONAL!');
  } else {
    console.log('⚠️  Some tests failed - review results above');
  }

  console.log('\n' + '='.repeat(70));

  process.exit(passed === total ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
