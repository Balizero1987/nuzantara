/**
 * 🌐 ZANTARA Browser Test Logger
 * ===============================
 *
 * COPY-PASTE THIS IN BROWSER CONSOLE (F12)
 * Then use: TEST(1, "your query") before asking each question
 *
 * QUICK SETUP:
 * 1. Open webapp (https://nuzantara.com or your URL)
 * 2. Press F12 → Console tab
 * 3. Copy-paste this entire script
 * 4. Press Enter
 * 5. You'll see: "✅ ZANTARA Test Logger initialized!"
 *
 * USAGE:
 *   TEST(1, "What KBLI code for restaurant?")
 *   // ... ask question in webapp ...
 *
 *   TEST(2, "How much is KITAS?")
 *   // ... ask question in webapp ...
 *
 *   // After all 50:
 *   TEST_SUMMARY()  // View statistics
 *   EXPORT_LOGS()   // Download JSON file
 */

(function () {
  // Initialize global test log object
  window.ZANTARA_TEST_LOG = {
    startTime: Date.now(),
    queries: [],
    currentTest: null,
    metadata: {
      browserAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
    },
  };

  // Intercept fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const requestStartTime = performance.now();
    const url = typeof args[0] === 'string' ? args[0] : args[0].url;
    const method = args[1]?.method || 'GET';

    // Log request
    console.log('🔵 [REQUEST]', {
      url: url,
      method: method,
      timestamp: new Date().toISOString(),
      testNumber: window.ZANTARA_TEST_LOG.currentTest,
    });

    return originalFetch
      .apply(this, args)
      .then((response) => {
        const requestEndTime = performance.now();
        const duration = Math.round(requestEndTime - requestStartTime);

        // Clone response to read body
        response
          .clone()
          .json()
          .then((data) => {
            const logEntry = {
              testNumber: window.ZANTARA_TEST_LOG.currentTest,
              timestamp: new Date().toISOString(),
              request: {
                url: url,
                method: method,
                body: args[1]?.body ? JSON.parse(args[1].body) : null,
              },
              response: {
                status: response.status,
                statusText: response.statusText,
                duration: duration,
                data: data,
              },
              performance: {
                networkLatency: duration,
                backendProcessing: data.data?.processing_time || 'N/A',
                cached: data.data?.optimization?.cache_used || false,
                domains: data.data?.total_domains || 0,
              },
            };

            window.ZANTARA_TEST_LOG.queries.push(logEntry);

            // Log response
            console.log('🟢 [RESPONSE]', {
              duration: `${duration}ms`,
              status: response.status,
              backend: logEntry.performance.backendProcessing,
              cached: logEntry.performance.cached,
              domains: logEntry.performance.domains,
            });

            // Visual indicator in console
            if (duration > 1000) {
              console.warn('⚠️ SLOW RESPONSE:', `${duration}ms`);
            } else if (duration < 200) {
              console.log('⚡ FAST RESPONSE:', `${duration}ms`);
            }
          })
          .catch((e) => {
            console.log('⚠️ [PARSE ERROR]', e.message);
          });

        return response;
      })
      .catch((error) => {
        console.error('❌ [REQUEST FAILED]', {
          url: url,
          error: error.message,
        });
        throw error;
      });
  };

  // Helper: Mark test number
  window.TEST = function (num, query) {
    window.ZANTARA_TEST_LOG.currentTest = num;
    const separator = '='.repeat(60);
    console.log(`\n${separator}`);
    console.log(`📝 TEST ${num}/50: ${query}`);
    console.log(separator);
    console.log('💡 Now ask this question in the webapp...\n');
  };

  // Helper: Export logs
  window.EXPORT_LOGS = function () {
    const logs = {
      session: {
        startTime: new Date(window.ZANTARA_TEST_LOG.startTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Math.round((Date.now() - window.ZANTARA_TEST_LOG.startTime) / 1000),
        totalTests: window.ZANTARA_TEST_LOG.queries.length,
        metadata: window.ZANTARA_TEST_LOG.metadata,
      },
      queries: window.ZANTARA_TEST_LOG.queries,
    };

    const json = JSON.stringify(logs, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zantara-browser-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('✅ Logs exported!');
    console.log(`📊 Total tests: ${logs.session.totalTests}`);
    console.log(`⏱️  Duration: ${logs.session.duration}s`);
  };

  // Helper: Generate summary
  window.TEST_SUMMARY = function () {
    const logs = window.ZANTARA_TEST_LOG.queries;

    if (logs.length === 0) {
      console.log('⚠️ No tests recorded yet!');
      return;
    }

    const durations = logs.map((q) => q.response.duration);
    const avgTime = Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);
    const fastest = Math.min(...durations);
    const slowest = Math.max(...durations);
    const successful = logs.filter((q) => q.response.status === 200).length;
    const cached = logs.filter((q) => q.performance.cached).length;
    const cacheRate = Math.round((cached / logs.length) * 100);

    console.log('\n📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Tests: ${logs.length}`);
    console.log(
      `Successful: ${successful}/${logs.length} (${Math.round((successful / logs.length) * 100)}%)`
    );
    console.log(`Failed: ${logs.length - successful}`);
    console.log('─'.repeat(60));
    console.log(`Average Time: ${avgTime}ms`);
    console.log(`Fastest: ${fastest}ms`);
    console.log(`Slowest: ${slowest}ms`);
    console.log('─'.repeat(60));
    console.log(`Cache Hits: ${cached}/${logs.length}`);
    console.log(`Cache Hit Rate: ${cacheRate}%`);
    console.log('═'.repeat(60));

    // Performance grade
    let grade = 'F';
    if (avgTime < 100) grade = 'A+';
    else if (avgTime < 200) grade = 'A';
    else if (avgTime < 500) grade = 'B';
    else if (avgTime < 1000) grade = 'C';
    else if (avgTime < 2000) grade = 'D';

    console.log(`\n🎯 Performance Grade: ${grade}`);

    if (avgTime > 1000) {
      console.warn('⚠️ Average response time over 1s - optimization recommended');
    } else if (avgTime < 200) {
      console.log('✨ Excellent performance!');
    }
  };

  // Helper: Show test list
  window.SHOW_TESTS = function () {
    console.log('\n📋 RECORDED TESTS:');
    console.log('─'.repeat(60));
    window.ZANTARA_TEST_LOG.queries.forEach((q, i) => {
      const status = q.response.status === 200 ? '✅' : '❌';
      console.log(`${status} Test ${q.testNumber}: ${q.response.duration}ms`);
    });
    console.log('─'.repeat(60));
  };

  // Helper: Clear logs
  window.CLEAR_LOGS = function () {
    if (confirm('Clear all test logs?')) {
      window.ZANTARA_TEST_LOG.queries = [];
      window.ZANTARA_TEST_LOG.startTime = Date.now();
      console.log('✅ Logs cleared!');
    }
  };

  // Helper: Get last test result
  window.LAST_TEST = function () {
    const last = window.ZANTARA_TEST_LOG.queries[window.ZANTARA_TEST_LOG.queries.length - 1];
    if (!last) {
      console.log('⚠️ No tests recorded yet!');
      return;
    }
    console.log('\n📊 LAST TEST RESULT:');
    console.log('─'.repeat(60));
    console.log(`Test Number: ${last.testNumber}`);
    console.log(`Status: ${last.response.status}`);
    console.log(`Duration: ${last.response.duration}ms`);
    console.log(`Backend: ${last.performance.backendProcessing}`);
    console.log(`Cached: ${last.performance.cached}`);
    console.log(`Domains: ${last.performance.domains}`);
    console.log('─'.repeat(60));
  };

  // Success message
  console.log('\n🎉 ZANTARA Test Logger Initialized!\n');
  console.log('═'.repeat(60));
  console.log('📝 USAGE:');
  console.log('  TEST(1, "your query") - Mark test before asking');
  console.log('  TEST_SUMMARY()        - View statistics');
  console.log('  EXPORT_LOGS()         - Download JSON file');
  console.log('  SHOW_TESTS()          - List all recorded tests');
  console.log('  LAST_TEST()           - Show last test result');
  console.log('  CLEAR_LOGS()          - Clear all logs');
  console.log('═'.repeat(60));
  console.log('\n💡 Example:');
  console.log('  TEST(1, "What KBLI code for restaurant?")');
  console.log('  // ... ask in webapp ...');
  console.log('  TEST(2, "How much is KITAS?")');
  console.log('  // ... ask in webapp ...');
  console.log('  EXPORT_LOGS()');
  console.log('\n✅ Ready to log your tests!\n');
})();
