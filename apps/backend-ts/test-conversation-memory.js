#!/usr/bin/env node
/**
 * Test Conversation Memory Feature
 * Demonstrates how ZANTARA remembers previous conversation context
 */

const MEMORY_SERVICE_URL = 'https://nuzantara-memory.fly.dev';
const sessionId = `test_memory_${Date.now()}`;

// Helper function for API calls
async function storeMessage(type, content) {
  const response = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_id: 'test_user',
      message_type: type,
      content: content,
      model_used: type === 'assistant' ? 'zantara-llama' : undefined,
    }),
  });
  return response.json();
}

async function getHistory() {
  const response = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/${sessionId}`);
  return response.json();
}

async function runTest() {
  console.log('🧪 Testing Conversation Memory Feature\n');
  console.log(`Session ID: ${sessionId}\n`);

  // Simulate a multi-turn conversation
  console.log('📝 Turn 1: User asks about KBLI codes');
  await storeMessage('user', 'What is KBLI code 62010?');
  await storeMessage(
    'assistant',
    'KBLI code 62010 is for Computer Programming Activities. This includes writing, modifying, testing, and supporting software for creating and implementing IT applications.'
  );
  console.log('✅ Turn 1 stored\n');

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('📝 Turn 2: User asks a follow-up question (requires memory!)');
  await storeMessage('user', 'What documents do I need to register a company with that code?');
  await storeMessage(
    'assistant',
    'For registering a company with KBLI 62010 (Computer Programming), you will need: 1) Business registration (NIB), 2) Company deed from notary, 3) Tax registration (NPWP), 4) Business license specific to IT services. As a foreign investor, you will also need a PMA company structure.'
  );
  console.log('✅ Turn 2 stored\n');

  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('📝 Turn 3: User asks another follow-up (requires even more context!)');
  await storeMessage('user', 'And how long does the registration process take?');
  await storeMessage(
    'assistant',
    'The registration process for a PMA company with KBLI 62010 typically takes 2-4 weeks, including: 1-2 days for company name approval, 3-5 days for notary deed, 1-2 weeks for Ministry approval, and additional time for NIB and business licenses. Bali Zero can help expedite this process.'
  );
  console.log('✅ Turn 3 stored\n');

  // Retrieve and display the full conversation history
  console.log('📖 Retrieving Full Conversation History:\n');
  const history = await getHistory();

  if (history.success && history.messages.length > 0) {
    console.log(`Found ${history.messages.length} messages in conversation:`);
    console.log(`Source: ${history.source}\n`);

    // Reverse to show chronological order
    history.messages.reverse().forEach((msg, idx) => {
      const role = msg.message_type === 'user' ? '👤 User' : '🤖 Assistant';
      console.log(`[Turn ${Math.floor(idx / 2) + 1}] ${role}:`);
      console.log(`${msg.content}\n`);
    });

    // Show how this would be formatted for AI context
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Context Format for AI:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const formattedContext = history.messages
      .map((msg) => {
        const role = msg.message_type === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    console.log('=== Previous Conversation ===');
    console.log(formattedContext);
    console.log('=== End of Previous Conversation ===\n');

    console.log('✅ SUCCESS: Conversation memory is working!');
    console.log('   ZANTARA will now have full context of previous turns.');
    console.log('   This enables follow-up questions like "And how long does it take?"');
    console.log('   without needing to repeat the entire context.\n');
  } else {
    console.log('❌ No conversation history found');
  }

  // Check Memory Service stats
  console.log('📊 Memory Service Stats:');
  const statsResponse = await fetch(`${MEMORY_SERVICE_URL}/api/stats`);
  const stats = await statsResponse.json();
  console.log(JSON.stringify(stats, null, 2));
}

runTest().catch(console.error);
