/**
 * TEST MEMORY ANALYTICS
 *
 * Quick test to verify analytics endpoints work
 */

/* eslint-disable no-undef */ // fetch, setTimeout are built-in in Node 18+
/* eslint-disable no-console */ // Console statements needed for test output

const MEMORY_SERVICE_URL = process.env.MEMORY_SERVICE_URL || 'http://localhost:8080';

async function testBasicStats() {
  console.log('\n📊 Testing basic stats endpoint...');
  try {
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/stats`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Basic stats:', data.stats);
      return true;
    } else {
      console.error('❌ Basic stats failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Basic stats error:', error.message);
    return false;
  }
}

async function testComprehensiveAnalytics() {
  console.log('\n📈 Testing comprehensive analytics endpoint...');
  try {
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/analytics/comprehensive?days=7`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Comprehensive analytics:', {
        totalSessions: data.analytics.totalSessions,
        totalMessages: data.analytics.totalMessages,
        uniqueUsers: data.analytics.uniqueUsers,
        cacheHitRate: `${(data.analytics.cacheHitRate * 100).toFixed(1)}%`,
        memoryHitRate: `${(data.analytics.memoryHitRate * 100).toFixed(1)}%`,
      });
      return true;
    } else {
      console.error('❌ Comprehensive analytics failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Comprehensive analytics error:', error.message);
    return false;
  }
}

async function testRealTimeMetrics() {
  console.log('\n⚡ Testing real-time metrics endpoint...');
  try {
    const response = await fetch(`${MEMORY_SERVICE_URL}/api/analytics/realtime`);
    const data = await response.json();

    if (data.success) {
      console.log('✅ Real-time metrics:', data.realtime);
      return true;
    } else {
      console.error('❌ Real-time metrics failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Real-time metrics error:', error.message);
    return false;
  }
}

async function generateTestData() {
  console.log('\n🔧 Generating test conversation data...');

  const sessionId = `test_analytics_${Date.now()}`;
  const userId = 'test_user_analytics';

  try {
    // Store 5 messages
    for (let i = 1; i <= 5; i++) {
      const messageType = i % 2 === 1 ? 'user' : 'assistant';
      const content = `Test message ${i} for analytics`;

      const response = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: userId,
          message_type: messageType,
          content: content,
          tokens_used: 50,
          model_used: 'gpt-4',
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.error(`❌ Failed to store message ${i}`);
        return false;
      }
    }

    console.log(`✅ Stored 5 test messages in session ${sessionId}`);

    // Retrieve messages to trigger analytics
    const retrieveResponse = await fetch(`${MEMORY_SERVICE_URL}/api/conversation/${sessionId}`);
    const retrieveData = await retrieveResponse.json();

    if (retrieveData.success) {
      console.log(
        `✅ Retrieved ${retrieveData.messages.length} messages (source: ${retrieveData.source})`
      );
    }

    return true;
  } catch (error) {
    console.error('❌ Test data generation failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧠 ========================================');
  console.log('🧠 MEMORY ANALYTICS TEST SUITE');
  console.log('🧠 ========================================');
  console.log(`🧠 Service: ${MEMORY_SERVICE_URL}`);
  console.log('🧠 ========================================');

  const results = [];

  // Test 1: Basic stats
  results.push(await testBasicStats());

  // Test 2: Generate test data
  results.push(await generateTestData());

  // Wait a bit for analytics to be recorded
  console.log('\n⏳ Waiting 2 seconds for analytics to be recorded...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 3: Comprehensive analytics
  results.push(await testComprehensiveAnalytics());

  // Test 4: Real-time metrics
  results.push(await testRealTimeMetrics());

  // Summary
  console.log('\n========================================');
  const passed = results.filter(Boolean).length;
  const total = results.length;

  if (passed === total) {
    console.log(`✅ ALL TESTS PASSED (${passed}/${total})`);
    console.log('🎉 Analytics system is working!');
  } else {
    console.log(`⚠️  SOME TESTS FAILED (${passed}/${total})`);
    console.log('Please check the errors above');
  }
  console.log('========================================\n');

  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
