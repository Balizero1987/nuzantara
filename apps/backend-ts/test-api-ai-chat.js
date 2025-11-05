#!/usr/bin/env node
/**
 * Test /api/ai/chat endpoint with conversation memory
 */

const BACKEND_URL = 'https://nuzantara-backend.fly.dev';
const sessionId = `test_api_chat_${Date.now()}`;

async function testChat(prompt, isFirstMessage = false) {
  console.log(`\n💬 User: ${prompt}`);

  const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      userId: 'test_user',
      prompt: prompt,
      message: prompt,
      mode: 'santai',
    }),
  });

  const data = await response.json();

  if (data.ok && data.data) {
    const answer = data.data.response || data.data.answer || 'No response';
    const hasHistory = data.data.hasHistory || false;

    console.log(`🤖 ZANTARA: ${answer.substring(0, 200)}${answer.length > 200 ? '...' : ''}`);
    console.log(`📊 Has History: ${hasHistory ? '✅ YES' : '❌ NO'} ${!isFirstMessage && !hasHistory ? '⚠️  SHOULD BE TRUE!' : ''}`);
    console.log(`📦 Session: ${data.data.sessionId || sessionId}`);

    return { answer, hasHistory };
  } else {
    console.error(`❌ Error:`, data);
    return null;
  }
}

async function runTest() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTING /api/ai/chat WITH MEMORY');
  console.log('🧪 ========================================\n');
  console.log(`Session ID: ${sessionId}\n`);

  // Turn 1
  console.log('📝 TURN 1: Initial question');
  const turn1 = await testChat('What is KBLI code 62010?', true);
  if (!turn1) {
    process.exit(1);
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Turn 2 - requires memory!
  console.log('\n📝 TURN 2: Follow-up (requires memory of Turn 1)');
  const turn2 = await testChat('What documents do I need for that?', false);
  if (!turn2) {
    process.exit(1);
  }

  if (!turn2.hasHistory) {
    console.log('\n❌ MEMORY NOT WORKING: Turn 2 should have hasHistory=true');
  } else {
    console.log('\n✅ MEMORY WORKING: Turn 2 has conversation history!');
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Turn 3 - requires even more context!
  console.log('\n📝 TURN 3: Another follow-up (requires Turn 1 & 2)');
  const turn3 = await testChat('And how long does it take?', false);
  if (!turn3) {
    process.exit(1);
  }

  if (!turn3.hasHistory) {
    console.log('\n❌ MEMORY NOT WORKING: Turn 3 should have hasHistory=true');
  } else {
    console.log('\n✅ MEMORY WORKING: Turn 3 has conversation history!');
  }

  console.log('\n🎉 ========================================');
  console.log('🎉 TEST COMPLETED');
  console.log('🎉 ========================================\n');
}

runTest().catch(console.error);
