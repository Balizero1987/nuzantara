#!/usr/bin/env node
/**
 * Test Conversation Memory in Production
 * Tests the memory feature on the live backend
 */

const BACKEND_URL = 'https://nuzantara-backend.fly.dev';
const sessionId = `prod_test_${Date.now()}`;

// Helper function for API calls
async function callAI(prompt, session = sessionId) {
  console.log(`\n💬 User: ${prompt}`);

  const response = await fetch(`${BACKEND_URL}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: session,
      userId: 'production_test_user',
      prompt: prompt,
      mode: 'santai',
    }),
  });

  const data = await response.json();

  if (data.ok && data.data) {
    const answer = data.data.response || data.data.answer || 'No response';
    const hasHistory = data.data.hasHistory || false;

    console.log(`🤖 ZANTARA: ${answer.substring(0, 200)}...`);
    console.log(`📊 Has conversation history: ${hasHistory ? '✅ YES' : '❌ NO'}`);
    console.log(`📦 Session ID: ${data.data.sessionId || session}`);

    return { answer, hasHistory, session: data.data.sessionId || session };
  } else {
    console.error(`❌ Error: ${data.error || 'Unknown error'}`);
    return null;
  }
}

async function testConversationMemory() {
  console.log('🧪 ========================================');
  console.log('🧪 TESTING CONVERSATION MEMORY');
  console.log('🧪 Backend: ' + BACKEND_URL);
  console.log('🧪 Session: ' + sessionId);
  console.log('🧪 ========================================\n');

  try {
    // Turn 1: Initial question
    console.log('📝 TURN 1: Ask about KBLI code');
    const turn1 = await callAI('What is KBLI code 62010?');

    if (!turn1) {
      throw new Error('Turn 1 failed');
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 2: Follow-up question (requires memory!)
    console.log('\n📝 TURN 2: Follow-up question (requires context from Turn 1)');
    const turn2 = await callAI('What documents do I need for that?');

    if (!turn2) {
      throw new Error('Turn 2 failed');
    }

    if (!turn2.hasHistory) {
      console.warn('\n⚠️  WARNING: Turn 2 should have conversation history but hasHistory=false');
    }

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Turn 3: Another follow-up (requires even more context!)
    console.log('\n📝 TURN 3: Another follow-up (requires context from Turn 1 & 2)');
    const turn3 = await callAI('And how long does the process take?');

    if (!turn3) {
      throw new Error('Turn 3 failed');
    }

    if (!turn3.hasHistory) {
      console.warn('\n⚠️  WARNING: Turn 3 should have conversation history but hasHistory=false');
    }

    // Check Memory Service stats
    console.log('\n\n📊 ========================================');
    console.log('📊 CHECKING MEMORY SERVICE STATS');
    console.log('📊 ========================================\n');

    const statsResponse = await fetch('https://nuzantara-memory.fly.dev/api/stats');
    const stats = await statsResponse.json();

    console.log('Memory Service Stats:');
    console.log(JSON.stringify(stats, null, 2));

    // Verify conversation was stored
    console.log('\n\n🔍 ========================================');
    console.log('🔍 VERIFYING CONVERSATION STORAGE');
    console.log('🔍 ========================================\n');

    const historyResponse = await fetch(`https://nuzantara-memory.fly.dev/api/conversation/${sessionId}`);
    const history = await historyResponse.json();

    if (history.success && history.messages) {
      console.log(`✅ Found ${history.messages.length} messages in conversation`);
      console.log(`📦 Storage source: ${history.source}`);

      if (history.messages.length >= 6) {
        console.log('\n✅ SUCCESS: All 3 turns (6 messages) were stored!');
      } else {
        console.log(`\n⚠️  WARNING: Expected 6 messages, found ${history.messages.length}`);
      }

      // Show conversation
      console.log('\n💬 Conversation History:');
      history.messages.reverse().forEach((msg, idx) => {
        const role = msg.message_type === 'user' ? '👤 User' : '🤖 Assistant';
        const preview = msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : '');
        console.log(`  [${idx + 1}] ${role}: ${preview}`);
      });

    } else {
      console.error('❌ ERROR: Could not retrieve conversation history');
    }

    console.log('\n\n🎉 ========================================');
    console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('🎉 ========================================\n');

  } catch (error) {
    console.error('\n\n❌ ========================================');
    console.error('❌ TEST FAILED');
    console.error('❌ ========================================');
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testConversationMemory().catch(console.error);
