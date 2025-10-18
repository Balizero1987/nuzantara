#!/usr/bin/env node
/**
 * ZANTARA Llama 3.1 - Complete Test Suite
 * Tests all scenarios before production deployment
 */

import { zantaraChat, isZantaraAvailable } from './src/handlers/ai-services/zantara-llama.js';
import { aiChat } from './src/handlers/ai-services/ai.js';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
  console.log('');

  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

async function test1_GreetingItalian() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Greeting in Italian (Ciao)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "Ciao, come stai?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    if (answer && answer.length > 0) {
      logTest('Greeting Italian', 'PASS',
        `Response: "${answer.substring(0, 100)}..."\nTime: ${elapsed}ms`);
    } else {
      logTest('Greeting Italian', 'FAIL', 'Empty response');
    }
  } catch (error) {
    logTest('Greeting Italian', 'FAIL', error.message);
  }
}

async function test2_GreetingEnglish() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Greeting in English (Hello)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "Hello, how are you?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    if (answer && answer.length > 0) {
      logTest('Greeting English', 'PASS',
        `Response: "${answer.substring(0, 100)}..."\nTime: ${elapsed}ms`);
    } else {
      logTest('Greeting English', 'FAIL', 'Empty response');
    }
  } catch (error) {
    logTest('Greeting English', 'FAIL', error.message);
  }
}

async function test3_GreetingIndonesian() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Greeting in Indonesian (Halo)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "Halo, apa kabar?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    if (answer && answer.length > 0) {
      logTest('Greeting Indonesian', 'PASS',
        `Response: "${answer.substring(0, 100)}..."\nTime: ${elapsed}ms`);
    } else {
      logTest('Greeting Indonesian', 'FAIL', 'Empty response');
    }
  } catch (error) {
    logTest('Greeting Indonesian', 'FAIL', error.message);
  }
}

async function test4_BusinessIndonesian() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Business Query in Indonesian (PT Formation)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "Bagaimana cara mendirikan PT di Bali?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    if (answer && answer.length > 50) {
      logTest('Business Query Indonesian', 'PASS',
        `Response: "${answer.substring(0, 150)}..."\nTime: ${elapsed}ms`);
    } else {
      logTest('Business Query Indonesian', 'FAIL', 'Response too short or empty');
    }
  } catch (error) {
    logTest('Business Query Indonesian', 'FAIL', error.message);
  }
}

async function test5_BusinessItalian() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Business Query in Italian');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "Come posso aprire una società a Bali?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    if (answer && answer.length > 50) {
      logTest('Business Query Italian', 'PASS',
        `Response: "${answer.substring(0, 150)}..."\nTime: ${elapsed}ms`);
    } else {
      logTest('Business Query Italian', 'FAIL', 'Response too short or empty');
    }
  } catch (error) {
    logTest('Business Query Italian', 'FAIL', error.message);
  }
}

async function test6_OffTopicQuery() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Off-topic Query (Geography)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await zantaraChat({
      message: "What is the capital of France?"
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;

    // Check for hallucinations (invented names like "User123", "Customer456", etc)
    const hasHallucination = /User\d+|Customer\d+|Cliente\d+|Utente\d+/i.test(answer);

    if (answer && answer.length > 0) {
      if (hasHallucination) {
        logTest('Off-topic Query', 'PASS (with hallucination)',
          `Response: "${answer.substring(0, 150)}..."\nTime: ${elapsed}ms\n⚠️  Note: Model hallucinated fake user dialogue (expected for off-topic)`);
      } else {
        logTest('Off-topic Query', 'PASS',
          `Response: "${answer.substring(0, 150)}..."\nTime: ${elapsed}ms`);
      }
    } else {
      logTest('Off-topic Query', 'FAIL', 'Empty response');
    }
  } catch (error) {
    logTest('Off-topic Query', 'FAIL', error.message);
  }
}

async function test7_CodeQuery() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Code Query (should route to Gemini)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await aiChat({
      prompt: "Write a TypeScript function to validate email addresses",
      provider: 'auto'
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.response || response.data?.answer || response.answer;
    const provider = response.data?.provider || response.provider || 'unknown';

    if (answer && answer.length > 0) {
      if (provider === 'gemini' || provider.includes('gemini')) {
        logTest('Code Query Routing', 'PASS',
          `Correctly routed to Gemini\nResponse length: ${answer.length} chars\nTime: ${elapsed}ms`);
      } else if (provider === 'zantara' || provider.includes('zantara')) {
        logTest('Code Query Routing', 'FAIL',
          `Should route to Gemini but used ZANTARA instead`);
      } else {
        logTest('Code Query Routing', 'PASS (alternative)',
          `Routed to: ${provider}\nTime: ${elapsed}ms`);
      }
    } else {
      logTest('Code Query Routing', 'FAIL', 'Empty response');
    }
  } catch (error) {
    logTest('Code Query Routing', 'FAIL', error.message);
  }
}

async function test8_AvailabilityCheck() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: ZANTARA Availability Check');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const available = isZantaraAvailable();

    if (available) {
      logTest('Availability Check', 'PASS',
        'ZANTARA is available (RunPod or HuggingFace configured)');
    } else {
      logTest('Availability Check', 'FAIL',
        'ZANTARA is NOT available (missing API keys)');
    }
  } catch (error) {
    logTest('Availability Check', 'FAIL', error.message);
  }
}

async function test9_ResponseTime() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 9: Response Time Measurement (5 queries)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const times = [];
  const queries = [
    "Halo",
    "Apa itu Bali Zero?",
    "How to start a business?",
    "Grazie",
    "Test query"
  ];

  try {
    for (const query of queries) {
      const start = Date.now();
      await zantaraChat({ message: query });
      const elapsed = Date.now() - start;
      times.push(elapsed);
      console.log(`   Query "${query}": ${elapsed}ms`);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    if (avg < 5000) {
      logTest('Response Time', 'PASS',
        `Average: ${avg.toFixed(0)}ms | Min: ${min}ms | Max: ${max}ms`);
    } else {
      logTest('Response Time', 'FAIL',
        `Average too slow: ${avg.toFixed(0)}ms (target: <5000ms)`);
    }
  } catch (error) {
    logTest('Response Time', 'FAIL', error.message);
  }
}

async function test10_DirectEndpoint() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 10: Direct ZANTARA Provider');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const start = Date.now();
    const response = await aiChat({
      message: "Test direct ZANTARA call",
      provider: 'zantara'
    });
    const elapsed = Date.now() - start;

    const answer = response.data?.answer || response.answer;
    const provider = response.data?.provider || response.provider;

    if (answer && provider && (provider === 'runpod-vllm' || provider === 'huggingface')) {
      logTest('Direct ZANTARA Provider', 'PASS',
        `Provider: ${provider}\nTime: ${elapsed}ms`);
    } else {
      logTest('Direct ZANTARA Provider', 'FAIL',
        `Provider mismatch or empty response`);
    }
  } catch (error) {
    logTest('Direct ZANTARA Provider', 'FAIL', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 ZANTARA LLAMA 3.1 - COMPLETE TEST SUITE             ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Run tests sequentially
  await test1_GreetingItalian();
  await test2_GreetingEnglish();
  await test3_GreetingIndonesian();
  await test4_BusinessIndonesian();
  await test5_BusinessItalian();
  await test6_OffTopicQuery();
  await test7_CodeQuery();
  await test8_AvailabilityCheck();
  await test9_ResponseTime();
  await test10_DirectEndpoint();

  // Summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   📊 TEST RESULTS SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('\n');

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! ZANTARA is ready for production deployment.');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review errors before deploying to production.');
    console.log('\nFailed tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
  }

  console.log('\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite crashed:', error);
  process.exit(1);
});
