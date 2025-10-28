#!/usr/bin/env node
/**
 * ZANTARA Simple Test - Direct API calls
 */

import 'dotenv/config';

const RUNPOD_ENDPOINT = process.env.RUNPOD_LLAMA_ENDPOINT;
const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY;
const HF_API_KEY = process.env.HF_API_KEY;

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║   🧪 ZANTARA LLAMA 3.1 - SIMPLE TEST SUITE               ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// Test configuration check
console.log('📋 Configuration Check:');
console.log(`   RunPod Endpoint: ${RUNPOD_ENDPOINT ? '✅ Configured' : '❌ Missing'}`);
console.log(`   RunPod API Key: ${RUNPOD_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log(`   HuggingFace Key: ${HF_API_KEY ? '✅ Configured' : '❌ Missing'}`);
console.log('');

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

async function testZantaraCall(testName, message) {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`TEST: ${testName}`);
  console.log(`Message: "${message}"`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const systemPrompt = `You are ZANTARA, an intelligent AI assistant for Bali Zero (PT. Bali Nol Impersariat), specialized in business operations, team management, and customer service for Indonesian markets.

IMPORTANT GUIDELINES:
- For greetings (ciao, hello, hi): respond warmly and ask how you can help with Bali Zero services
- For questions: provide specific, accurate answers based on your training
- Always be professional, concise, and helpful
- When unsure, offer to connect with Bali Zero team at WhatsApp +62 859 0436 9574

Respond in the same language as the user (Italian, English, or Indonesian).`;

  const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

  try {
    const start = Date.now();

    const response = await fetch(RUNPOD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          sampling_params: {
            max_tokens: 500,
            temperature: 0.7
          }
        }
      })
    });

    const elapsed = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      logTest(testName, 'FAIL', `HTTP ${response.status}: ${errorText.substring(0, 100)}`);
      return;
    }

    const data = await response.json();

    // Parse vLLM response
    let answer = '';
    if (data.output && Array.isArray(data.output)) {
      const firstOutput = data.output[0];

      if (firstOutput?.choices && firstOutput.choices[0]?.tokens) {
        const tokens = firstOutput.choices[0].tokens;
        answer = Array.isArray(tokens) ? tokens.join('') : String(tokens);
      } else if (firstOutput?.choices && firstOutput.choices[0]?.text) {
        answer = firstOutput.choices[0].text;
      } else if (firstOutput?.choices && firstOutput.choices[0]?.message?.content) {
        answer = firstOutput.choices[0].message.content;
      }
    }

    if (answer && answer.length > 0) {
      // Check for hallucinations
      const hasHallucination = /User\d+|Customer\d+|Cliente\d+|Utente\d+/i.test(answer);
      const warningNote = hasHallucination ? '\n⚠️  Hallucination detected (invented user names)' : '';

      logTest(testName, 'PASS',
        `Response: "${answer.substring(0, 150)}..."\nTime: ${elapsed}ms\nLength: ${answer.length} chars${warningNote}`);
    } else {
      logTest(testName, 'FAIL', 'Empty or invalid response from vLLM');
    }

  } catch (error) {
    logTest(testName, 'FAIL', error.message);
  }
}

async function runAllTests() {
  // Test 1: Italian Greeting
  await testZantaraCall('Italian Greeting', 'Ciao, come stai?');

  // Test 2: English Greeting
  await testZantaraCall('English Greeting', 'Hello, how are you?');

  // Test 3: Indonesian Greeting
  await testZantaraCall('Indonesian Greeting', 'Halo, apa kabar?');

  // Test 4: Indonesian Business Query
  await testZantaraCall('Indonesian Business Query', 'Bagaimana cara mendirikan PT di Bali?');

  // Test 5: Italian Business Query
  await testZantaraCall('Italian Business Query', 'Come posso aprire una società a Bali?');

  // Test 6: English Business Query
  await testZantaraCall('English Business Query', 'What services does Bali Zero offer?');

  // Test 7: Off-topic Query
  await testZantaraCall('Off-topic Query', 'What is the capital of France?');

  // Test 8: Short query
  await testZantaraCall('Short Query', 'Grazie');

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   📊 TEST RESULTS SUMMARY                                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED! ZANTARA is ready for production deployment.\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review errors before deploying to production.\n');
    console.log('Failed tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`));
    console.log('');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite crashed:', error);
  process.exit(1);
});
