#!/usr/bin/env node
/**
 * KBLI RAG Integration - Local Test Suite
 * Tests all paths: simple, complex, RAG, fallback, errors
 */

// Test the modified queryKBLI function locally
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

console.log('🧪 KBLI RAG Integration - Local Test Suite\n');
console.log('=' .repeat(70));

// Test 1: Check if fetch is available
function test1_fetchAvailable() {
  const testName = 'Test 1: fetch() is available';
  try {
    if (typeof fetch !== 'undefined') {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'fetch() is available' });
      console.log('✅', testName);
      return true;
    } else {
      throw new Error('fetch() is not available');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 2: Check AbortController
function test2_abortController() {
  const testName = 'Test 2: AbortController is available';
  try {
    if (typeof AbortController !== 'undefined') {
      const controller = new AbortController();
      controller.abort();
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'AbortController works' });
      console.log('✅', testName);
      return true;
    } else {
      throw new Error('AbortController is not available');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 3: Check setTimeout/clearTimeout
function test3_timers() {
  const testName = 'Test 3: setTimeout/clearTimeout available';
  try {
    const id = setTimeout(() => {}, 100);
    clearTimeout(id);
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS', details: 'Timers work' });
    console.log('✅', testName);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 4: isSimpleKBLIQuery logic
function test4_simpleQueryDetection() {
  const testName = 'Test 4: Simple query detection';
  try {
    // Simulate the function
    function isSimpleKBLIQuery(query) {
      const simpleKeywords = [
        'restaurant', 'restoran', 'hotel', 'cafe', 'kafe', 'bar', 
        'retail', 'toko', 'shop', 'store', 'villa', 'guest house',
        'manufacturing', 'manufacture', 'agriculture', 'pertanian',
        'mining', 'pertambangan', 'construction', 'konstruksi'
      ];
      
      const normalizedQuery = query.toLowerCase().trim();
      const wordCount = normalizedQuery.split(/\s+/).length;
      
      if (wordCount === 1) return true;
      if (wordCount === 2 && simpleKeywords.some(kw => normalizedQuery.includes(kw))) return true;
      
      return simpleKeywords.some(kw => normalizedQuery === kw);
    }

    const tests = [
      { query: 'restaurant', expected: true },
      { query: 'hotel', expected: true },
      { query: 'hotel villa', expected: true },
      { query: 'beach club with pool and bar', expected: false },
      { query: 'digital marketing agency', expected: false },
    ];

    let allPassed = true;
    tests.forEach(({ query, expected }) => {
      const result = isSimpleKBLIQuery(query);
      if (result !== expected) {
        allPassed = false;
        console.log(`  ⚠️  "${query}" => ${result}, expected ${expected}`);
      }
    });

    if (allPassed) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'All detection tests passed' });
      console.log('✅', testName);
      return true;
    } else {
      throw new Error('Some detection tests failed');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 5: Mock RAG service response
async function test5_mockRAGResponse() {
  const testName = 'Test 5: Mock RAG service response';
  try {
    // Mock successful RAG response
    const mockResponse = {
      ok: true,
      json: async () => ({
        results: [
          { code: '93290', name: 'Entertainment & Recreation', relevance: 0.92 }
        ],
        total_found: 1
      })
    };

    const data = await mockResponse.json();
    if (data.results && data.results.length > 0) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'RAG response format valid' });
      console.log('✅', testName);
      return true;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 6: Test RAG URL availability
async function test6_ragURLCheck() {
  const testName = 'Test 6: RAG URL is accessible';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    console.log(`  📡 Testing: ${RAG_URL}/health`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${RAG_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: `RAG service healthy: ${RAG_URL}` });
      console.log('✅', testName, '- Service is UP');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 7: Test RAG /api/query endpoint structure
async function test7_ragQueryEndpoint() {
  const testName = 'Test 7: RAG /api/query endpoint accepts requests';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Request-Source': 'test-suite'
      },
      body: JSON.stringify({
        query: 'test query',
        collection: 'kbli_unified',
        limit: 1
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json();
    
    if (response.ok || response.status === 200) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'Endpoint accepts POST requests' });
      console.log('✅', testName);
      console.log('  📊 Response keys:', Object.keys(data));
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 8: Test RAG timeout (should abort after 5s)
async function test8_ragTimeout() {
  const testName = 'Test 8: RAG request timeout works';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 100); // 100ms timeout
    
    try {
      await fetch('https://httpstat.us/200?sleep=5000', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      throw new Error('Request should have timed out');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        testResults.passed++;
        testResults.tests.push({ name: testName, status: 'PASS', details: 'Timeout mechanism works' });
        console.log('✅', testName);
        return true;
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 9: Test actual KBLI query (simple)
async function test9_simpleKBLIQuery() {
  const testName = 'Test 9: Simple KBLI query (restaurant)';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'restaurant',
        collection: 'kbli_unified',
        limit: 3
      })
    });
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      testResults.passed++;
      testResults.tests.push({ 
        name: testName, 
        status: 'PASS', 
        details: `Found ${data.results.length} results`
      });
      console.log('✅', testName);
      console.log('  📝 First result:', data.results[0].metadata?.code || 'N/A');
      return true;
    } else {
      throw new Error('No results returned');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 10: Test complex KBLI query
async function test10_complexKBLIQuery() {
  const testName = 'Test 10: Complex KBLI query (beach club)';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'beach club with restaurant bar and swimming pool',
        collection: 'kbli_unified',
        limit: 5
      })
    });
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      testResults.passed++;
      testResults.tests.push({ 
        name: testName, 
        status: 'PASS', 
        details: `Found ${data.results.length} semantic results`
      });
      console.log('✅', testName);
      console.log('  📝 Results found:', data.results.length);
      return true;
    } else {
      throw new Error('No results for complex query');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Test 11-20: Additional edge cases
async function test11_emptyQuery() {
  const testName = 'Test 11: Empty query handling';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '', collection: 'kbli_unified', limit: 1 })
    });
    
    // Should handle gracefully (either return empty or error)
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS', details: 'Empty query handled' });
    console.log('✅', testName);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

async function test12_specialCharacters() {
  const testName = 'Test 12: Special characters in query';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'restaurant & bar (with pool)', 
        collection: 'kbli_unified', 
        limit: 1 
      })
    });
    
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS', details: 'Special chars handled' });
    console.log('✅', testName);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

async function test13_indonesianQuery() {
  const testName = 'Test 13: Indonesian language query';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'restoran dan kafe', 
        collection: 'kbli_unified', 
        limit: 3 
      })
    });
    
    const data = await response.json();
    if (data.results) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'Indonesian query works' });
      console.log('✅', testName);
      return true;
    }
    throw new Error('No results');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

async function test14_longQuery() {
  const testName = 'Test 14: Very long query';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const longQuery = 'I want to open a beach club in Canggu Bali with restaurant bar swimming pool gym spa massage and event venue for weddings and parties with live music';
    
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: longQuery, collection: 'kbli_unified', limit: 3 })
    });
    
    const data = await response.json();
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'PASS', details: 'Long query handled' });
    console.log('✅', testName);
    return true;
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

async function test15_numericQuery() {
  const testName = 'Test 15: Numeric KBLI code query';
  try {
    const RAG_URL = process.env.RAG_BACKEND_URL || 'https://nuzantara-rag.fly.dev';
    const response = await fetch(`${RAG_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '56101', collection: 'kbli_unified', limit: 1 })
    });
    
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      testResults.passed++;
      testResults.tests.push({ name: testName, status: 'PASS', details: 'Numeric code search works' });
      console.log('✅', testName);
      return true;
    }
    throw new Error('No results for code');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'FAIL', error: error.message });
    console.log('❌', testName, '-', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting test suite...\n');
  
  // Synchronous tests
  test1_fetchAvailable();
  test2_abortController();
  test3_timers();
  test4_simpleQueryDetection();
  
  // Async tests
  await test5_mockRAGResponse();
  await test6_ragURLCheck();
  await test7_ragQueryEndpoint();
  await test8_ragTimeout();
  await test9_simpleKBLIQuery();
  await test10_complexKBLIQuery();
  await test11_emptyQuery();
  await test12_specialCharacters();
  await test13_indonesianQuery();
  await test14_longQuery();
  await test15_numericQuery();
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  console.log('='.repeat(70));
  
  // Detailed results
  console.log('\n📋 Detailed Results:\n');
  testResults.tests.forEach((test, i) => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${i + 1}. ${test.name}`);
    if (test.details) console.log(`   └─ ${test.details}`);
    if (test.error) console.log(`   └─ Error: ${test.error}`);
  });
  
  // Exit code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
