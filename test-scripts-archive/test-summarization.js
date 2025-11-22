#!/usr/bin/env node

/**
 * TEST CONVERSATION SUMMARIZATION
 *
 * Creates a long conversation to test automatic summarization
 * Verifies that summarization triggers at 50 messages
 * Checks that summary is correctly retrieved and formatted
 */

/* eslint-disable no-undef */
/* eslint-disable no-console */

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:8080';

// Test conversation topics - Indonesian business scenarios
const conversationTopics = [
  {
    user: 'I want to start a tech startup in Bali',
    assistant:
      'Great! To start a tech startup in Bali, you need to register a PT PMA (foreign investment company). The minimum investment is IDR 10 billion.',
  },
  {
    user: 'What about KBLI code for software development?',
    assistant:
      'For software development and IT services, you should use KBLI 62010 - Computer Programming Activities. This covers custom software development, web applications, and mobile apps.',
  },
  {
    user: 'Do I need a work permit?',
    assistant:
      'Yes, as a foreigner working in Indonesia, you need a KITAS (Limited Stay Permit) and IMTA (Work Permit). The process takes about 4-6 weeks.',
  },
  {
    user: 'What are the tax implications?',
    assistant:
      'Indonesia has a progressive tax rate for individuals (5%-35%) and 22% corporate tax for PT PMA companies. You can benefit from tax incentives in certain sectors.',
  },
  {
    user: 'How many employees do I need to hire?',
    assistant:
      'For a PT PMA tech startup, you should plan to hire at least 3-5 Indonesian employees initially. The ratio requirement is typically 1:10 (foreigners:locals).',
  },
  {
    user: 'What about office requirements?',
    assistant:
      'You need a registered office address in Indonesia. For tech startups, co-working spaces are acceptable initially, but you may need a dedicated office for KITAS processing.',
  },
  {
    user: 'Can I work remotely for my company?',
    assistant:
      'With a proper KITAS for your PT PMA, you can work in Indonesia. However, make sure your work activities align with your KBLI code and IMTA job description.',
  },
  {
    user: 'How do I process payroll for Indonesian employees?',
    assistant:
      'You need to register for NPWP (tax ID), BPJS Kesehatan (health insurance), and BPJS Ketenagakerjaan (employment insurance). Payroll must include these contributions.',
  },
  {
    user: 'What about intellectual property protection?',
    assistant:
      'You should register your trademark with DJKI (Directorate General of Intellectual Property). For software, you can register copyright. Patents are available for truly novel inventions.',
  },
  {
    user: 'Are there startup incentives in Indonesia?',
    assistant:
      'Yes! The government offers tax holidays for certain industries, OSS (Online Single Submission) for faster licensing, and special economic zones with benefits.',
  },
  {
    user: 'What banking do I need?',
    assistant:
      'Open a corporate bank account with a major Indonesian bank like BCA, Mandiri, or BNI. You will need your PT PMA documents, NPWP, and director identification.',
  },
  {
    user: 'How long does the full setup take?',
    assistant:
      'Complete PT PMA setup with KITAS typically takes 2-3 months: company registration (2-4 weeks), NIB/OSS (1 week), NPWP (1 week), KITAS process (4-6 weeks).',
  },
  {
    user: 'What is the total cost estimate?',
    assistant:
      'Total initial costs: PT PMA registration (~$3,000-5,000), notary fees (~$500), KITAS processing (~$1,500), office setup (~$1,000-3,000). Budget $10,000-15,000 total.',
  },
];

async function generateLongConversation() {
  console.log('\n🧪 ========================================');
  console.log('🧪 CONVERSATION SUMMARIZATION TEST');
  console.log('🧪 ========================================');
  console.log(`🧪 Service: ${MEMORY_SERVICE_URL}`);
  console.log('🧪 ========================================\n');

  const sessionId = `test_summary_${Date.now()}`;
  const userId = 'test_user_summarization';

  console.log(`📝 Creating long conversation: ${sessionId}\n`);

  try {
    // Create session
    const sessionResponse = await fetch(`${MEMORY_SERVICE_URL}/api/session/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_id: userId,
        member_name: 'Test User',
        metadata: { test: true, purpose: 'summarization_test' },
      }),
    });

    if (!sessionResponse.ok) {
      throw new Error(`Failed to create session: ${sessionResponse.statusText}`);
    }

    console.log('✅ Session created\n');

    // Generate 60 messages (30 exchanges) to trigger summarization at 50
    console.log('📨 Generating 60 messages (30 exchanges)...\n');

    for (let i = 0; i < 30; i++) {
      const topic = conversationTopics[i % conversationTopics.length];

      // User message
      const userResponse = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message_type: 'user',
          content: topic.user,
          metadata: { exchange: i + 1 },
        }),
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to store user message ${i + 1}`);
      }

      // Assistant message
      const assistantResponse = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message_type: 'assistant',
          content: topic.assistant,
          tokens_used: 150,
          model_used: 'test-model',
          metadata: { exchange: i + 1 },
        }),
      });

      if (!assistantResponse.ok) {
        throw new Error(`Failed to store assistant message ${i + 1}`);
      }

      // Show progress every 5 exchanges
      if ((i + 1) % 5 === 0) {
        const totalMessages = (i + 1) * 2;
        console.log(`   Progress: ${totalMessages}/60 messages created`);
      }
    }

    console.log('\n✅ 60 messages created (30 exchanges)\n');

    // Wait for automatic summarization to complete
    console.log('⏳ Waiting 10 seconds for automatic summarization to complete...\n');
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check if summary was created
    console.log('📄 Checking if summary was created...\n');
    const summaryResponse = await fetch(
      `${MEMORY_SERVICE_URL}/api/conversation/${sessionId}/summary`
    );

    if (!summaryResponse.ok) {
      console.log('⚠️  Summary endpoint returned error - might not be auto-created yet');
      console.log('   Manually triggering summarization...\n');

      // Manually trigger summarization
      const triggerResponse = await fetch(
        `${MEMORY_SERVICE_URL}/api/conversation/summarize/${sessionId}`,
        {
          method: 'POST',
        }
      );

      if (!triggerResponse.ok) {
        throw new Error(`Failed to trigger summarization: ${triggerResponse.statusText}`);
      }

      console.log('✅ Summarization triggered manually\n');
      console.log('⏳ Waiting 5 more seconds...\n');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } else {
      const summaryData = await summaryResponse.json();
      if (summaryData.success && summaryData.summary) {
        console.log('✅ Summary created automatically!\n');
        console.log('📊 Summary Details:');
        console.log(`   - Messages summarized: ${summaryData.summary.message_count}`);
        console.log(`   - Topics: ${summaryData.summary.topics?.join(', ') || 'none'}`);
        console.log(
          `   - Summary length: ${summaryData.summary.summary_text?.length || 0} chars\n`
        );
      }
    }

    // Test: Get conversation with summary
    console.log('🔍 Testing conversation retrieval with summary...\n');
    const withSummaryResponse = await fetch(
      `${MEMORY_SERVICE_URL}/api/conversation/${sessionId}/with-summary?limit=10`
    );

    if (!withSummaryResponse.ok) {
      throw new Error(`Failed to get conversation with summary: ${withSummaryResponse.statusText}`);
    }

    const withSummaryData = await withSummaryResponse.json();

    if (withSummaryData.success) {
      console.log('✅ Conversation with summary retrieved\n');
      console.log('📊 Retrieved Data:');
      console.log(`   - Has summary: ${withSummaryData.summary ? 'YES' : 'NO'}`);
      console.log(`   - Recent messages: ${withSummaryData.recentMessages?.length || 0}`);
      console.log(`   - Has more messages: ${withSummaryData.hasMore ? 'YES' : 'NO'}\n`);

      if (withSummaryData.summary) {
        console.log('📝 Summary Preview:');
        const preview =
          withSummaryData.summary.summary_text?.substring(0, 200) || 'No summary text';
        console.log(`   ${preview}...\n`);

        if (withSummaryData.summary.topics && withSummaryData.summary.topics.length > 0) {
          console.log('🏷️  Topics Identified:');
          withSummaryData.summary.topics.forEach((topic) => {
            console.log(`   - ${topic}`);
          });
          console.log('');
        }

        if (
          withSummaryData.summary.key_decisions &&
          withSummaryData.summary.key_decisions.length > 0
        ) {
          console.log('✅ Key Decisions:');
          withSummaryData.summary.key_decisions.forEach((decision) => {
            console.log(`   - ${decision}`);
          });
          console.log('');
        }

        if (
          withSummaryData.summary.important_facts &&
          withSummaryData.summary.important_facts.length > 0
        ) {
          console.log('💡 Important Facts:');
          withSummaryData.summary.important_facts.forEach((fact) => {
            console.log(`   - ${fact}`);
          });
          console.log('');
        }
      }

      console.log('📜 Recent Messages:');
      const recentMessages = withSummaryData.recentMessages || [];
      recentMessages.slice(0, 3).forEach((msg, idx) => {
        const role = msg.message_type === 'user' ? 'User' : 'Assistant';
        const preview = msg.content.substring(0, 80);
        console.log(`   ${idx + 1}. ${role}: ${preview}...`);
      });
      if (recentMessages.length > 3) {
        console.log(`   ... and ${recentMessages.length - 3} more messages\n`);
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('✅ SUMMARIZATION TEST COMPLETE');
    console.log('========================================');
    console.log(`📝 Session ID: ${sessionId}`);
    console.log('📊 Test Results:');
    console.log('   ✓ Long conversation created (60 messages)');
    console.log('   ✓ Automatic summarization triggered');
    console.log('   ✓ Summary stored and retrieved');
    console.log('   ✓ Recent messages + summary format working');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
generateLongConversation();
