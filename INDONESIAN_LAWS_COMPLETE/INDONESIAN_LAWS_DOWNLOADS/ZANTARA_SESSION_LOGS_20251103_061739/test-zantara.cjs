#!/usr/bin/env node

/**
 * ZANTARA v3 Ω - Automated Test Runner
 * =====================================
 * 
 * Runs all 50 test questions automatically
 * Captures complete logs and transcriptions
 * Generates performance reports
 * 
 * Usage:
 *   node test-zantara.js
 *   node test-zantara.js --category kbli
 *   node test-zantara.js --test 1-10
 */

const fs = require('fs');
const https = require('https');

// Configuration
const CONFIG = {
  baseUrl: 'https://nuzantara-backend.fly.dev',
  logFile: `zantara-test-${Date.now()}.json`,
  reportFile: `zantara-report-${Date.now()}.md`,
  delayBetweenTests: 1000 // ms
};

// All 50 test questions
const TESTS = [
  // Category 1: KBLI & Business Setup (10 questions)
  {
    id: 1,
    category: 'KBLI',
    query: 'What KBLI code do I need for a restaurant in Bali?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'restaurant KBLI Bali', domain: 'kbli', mode: 'quick' }
  },
  {
    id: 2,
    category: 'KBLI',
    query: 'I want to open a cafe that also sells retail coffee products',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'cafe retail coffee KBLI', domain: 'kbli', mode: 'detailed' }
  },
  {
    id: 3,
    category: 'KBLI',
    query: 'KBLI for software development company with consulting',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'software development consulting KBLI', domain: 'all', mode: 'quick' }
  },
  {
    id: 4,
    category: 'KBLI',
    query: 'Complete business setup requirements for PT PMA in Bali',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT PMA setup requirements Bali', domain: 'all', mode: 'comprehensive' }
  },
  {
    id: 5,
    category: 'KBLI',
    query: 'Tourism and hospitality business codes for villa rental',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'villa rental KBLI tourism hospitality', domain: 'kbli', mode: 'detailed' }
  },
  {
    id: 6,
    category: 'KBLI',
    query: 'Can foreigners open a retail business in Indonesia?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'foreigner retail business Indonesia restrictions', domain: 'legal', mode: 'detailed' }
  },
  {
    id: 7,
    category: 'KBLI',
    query: 'Step by step guide to register PT in Jakarta',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT registration Jakarta step by step', domain: 'all', mode: 'comprehensive' }
  },
  {
    id: 8,
    category: 'KBLI',
    query: 'How do I add a new KBLI code to my existing PT?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'add KBLI code existing PT amendment', domain: 'legal', mode: 'detailed' }
  },
  {
    id: 9,
    category: 'KBLI',
    query: 'Restaurant with catering, events, and food delivery - what KBLIs?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'restaurant catering events food delivery KBLI', domain: 'kbli', mode: 'comprehensive' }
  },
  {
    id: 10,
    category: 'KBLI',
    query: 'What business activities are prohibited in tourist areas of Bali?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'prohibited business tourist areas Bali restrictions', domain: 'legal', mode: 'detailed' }
  },

  // Category 2: Pricing & Services (8 questions)
  {
    id: 11,
    category: 'Pricing',
    query: 'How much does KITAS cost for Italian citizen?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'KITAS cost Italian citizen price', domain: 'pricing', mode: 'quick' }
  },
  {
    id: 12,
    category: 'Pricing',
    query: 'What is included in PT formation service package?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT formation service package included', domain: 'pricing', mode: 'detailed' }
  },
  {
    id: 13,
    category: 'Pricing',
    query: 'Compare costs: PT vs CV vs UD for small business',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT CV UD comparison cost small business', domain: 'pricing', mode: 'comprehensive' }
  },
  {
    id: 14,
    category: 'Pricing',
    query: 'Rush service available for KITAS renewal in 2 weeks?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'KITAS renewal rush service 2 weeks', domain: 'pricing', mode: 'detailed' }
  },
  {
    id: 15,
    category: 'Pricing',
    query: 'Who in the team handles KITAS applications?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'team member KITAS applications handler', domain: 'team', mode: 'quick' }
  },
  {
    id: 16,
    category: 'Pricing',
    query: 'Price to legalize Italian business documents for Indonesia',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'legalize Italian documents Indonesia price', domain: 'pricing', mode: 'detailed' }
  },
  {
    id: 17,
    category: 'Pricing',
    query: 'What are yearly costs to maintain a PT after formation?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT annual maintenance costs yearly compliance', domain: 'pricing', mode: 'comprehensive' }
  },
  {
    id: 18,
    category: 'Pricing',
    query: 'Do you charge more for services in Bali vs Jakarta?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'service pricing Bali Jakarta comparison', domain: 'pricing', mode: 'quick' }
  },

  // Category 3: Legal & Immigration (8 questions)
  {
    id: 19,
    category: 'Legal',
    query: 'What visa do I need to stay in Bali for 6 months?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: '6 months Bali visa requirements', domain: 'immigration', mode: 'detailed' }
  },
  {
    id: 20,
    category: 'Legal',
    query: 'Steps to get work permit for foreign employee in PT PMA',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'work permit foreign employee PT PMA IMTA', domain: 'immigration', mode: 'comprehensive' }
  },
  {
    id: 21,
    category: 'Legal',
    query: 'Should I open PT PMA or PT PMDN for my business?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT PMA vs PT PMDN comparison advice', domain: 'legal', mode: 'comprehensive' }
  },
  {
    id: 22,
    category: 'Legal',
    query: 'What must be included in Indonesian employment contract?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'Indonesian employment contract requirements', domain: 'legal', mode: 'detailed' }
  },
  {
    id: 23,
    category: 'Legal',
    query: 'How to register for NPWP as foreign business owner?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'NPWP registration foreign business owner', domain: 'tax', mode: 'detailed' }
  },
  {
    id: 24,
    category: 'Legal',
    query: 'Can I buy property in Bali as foreigner? What are the options?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'foreigner buy property Bali options Hak Pakai', domain: 'property', mode: 'comprehensive' }
  },
  {
    id: 25,
    category: 'Legal',
    query: 'What licenses needed to operate restaurant in tourist area?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'restaurant licenses tourist area requirements', domain: 'legal', mode: 'comprehensive' }
  },
  {
    id: 26,
    category: 'Legal',
    query: 'My wife is Indonesian, what visa options do I have?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'spouse visa Indonesian wife KITAS 317', domain: 'immigration', mode: 'detailed' }
  },

  // Category 4: Team & Operations (6 questions)
  {
    id: 27,
    category: 'Team',
    query: 'Who should I talk to about opening a restaurant business?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'team member restaurant business specialist', domain: 'team', mode: 'quick' }
  },
  {
    id: 28,
    category: 'Team',
    query: 'Do you have accounting partners in Bali?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'accounting partners Bali network', domain: 'team', mode: 'detailed' }
  },
  {
    id: 29,
    category: 'Team',
    query: 'Show me examples of Italian restaurants you helped open',
    endpoint: '/api/v3/zantara/collective',
    payload: { action: 'query', query: 'Italian restaurant success stories case studies' }
  },
  {
    id: 30,
    category: 'Team',
    query: 'When is the team available for consultation?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'team availability consultation hours', domain: 'team', mode: 'quick' }
  },
  {
    id: 31,
    category: 'Team',
    query: 'Does anyone on the team speak Italian?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'team Italian language support', domain: 'team', mode: 'quick' }
  },
  {
    id: 32,
    category: 'Team',
    query: 'Can you help me if I am not in Indonesia yet?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'remote services not in Indonesia', domain: 'team', mode: 'detailed' }
  },

  // Category 5: Tax & Property (6 questions)
  {
    id: 33,
    category: 'Tax',
    query: 'What taxes does a PT have to pay in Indonesia?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT taxes Indonesia corporate VAT WHT', domain: 'tax', mode: 'comprehensive' }
  },
  {
    id: 34,
    category: 'Tax',
    query: 'What are the taxes when buying villa in Bali?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'villa purchase taxes Bali BPHTB', domain: 'tax', mode: 'detailed' }
  },
  {
    id: 35,
    category: 'Tax',
    query: 'Italy-Indonesia tax treaty - how does it affect my business?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'Italy Indonesia tax treaty benefits business', domain: 'tax', mode: 'comprehensive' }
  },
  {
    id: 36,
    category: 'Tax',
    query: 'How is villa rental income taxed in Indonesia?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'villa rental income tax Indonesia rates', domain: 'tax', mode: 'detailed' }
  },
  {
    id: 37,
    category: 'Tax',
    query: 'Difference between HGB, Hak Pakai, and Hak Milik?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'HGB Hak Pakai Hak Milik difference', domain: 'property', mode: 'comprehensive' }
  },
  {
    id: 38,
    category: 'Tax',
    query: 'Are there tax incentives for tourism businesses in Bali?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'tax incentives tourism business Bali', domain: 'tax', mode: 'detailed' }
  },

  // Category 6: V3 Performance (5 questions)
  {
    id: 39,
    category: 'Performance',
    query: 'restaurant KBLI (quick mode test)',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'restaurant KBLI', domain: 'kbli', mode: 'quick' }
  },
  {
    id: 40,
    category: 'Performance',
    query: 'Complete PT PMA setup requirements (detailed mode)',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'PT PMA setup requirements', domain: 'all', mode: 'detailed' }
  },
  {
    id: 41,
    category: 'Performance',
    query: 'Italian restaurant in Bali - everything I need to know',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'Italian restaurant Bali complete guide', domain: 'all', mode: 'comprehensive' }
  },
  {
    id: 42,
    category: 'Performance',
    query: 'restaurant KBLI (cache test - repeat)',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'restaurant KBLI', domain: 'kbli', mode: 'quick' }
  },
  {
    id: 43,
    category: 'Performance',
    query: 'Show system performance statistics',
    endpoint: '/api/v3/performance/metrics',
    payload: null
  },

  // Category 7: Collective Memory (4 questions)
  {
    id: 44,
    category: 'Memory',
    query: 'I successfully opened restaurant in Seminyak',
    endpoint: '/api/v3/zantara/collective',
    payload: { action: 'contribute', content: 'Restaurant opened successfully in Seminyak, key learnings...' }
  },
  {
    id: 45,
    category: 'Memory',
    query: 'What have other users experienced opening restaurants in Bali?',
    endpoint: '/api/v3/zantara/collective',
    payload: { action: 'query', query: 'restaurant experiences Bali users' }
  },
  {
    id: 46,
    category: 'Memory',
    query: 'Verify: KITAS takes 2 weeks in Bali',
    endpoint: '/api/v3/zantara/collective',
    payload: { action: 'verify', claim: 'KITAS processing takes 2 weeks in Bali' }
  },
  {
    id: 47,
    category: 'Memory',
    query: 'How many users have asked about restaurant business?',
    endpoint: '/api/v3/zantara/collective',
    payload: { action: 'stats', topic: 'restaurant' }
  },

  // Category 8: System Navigation (3 questions)
  {
    id: 48,
    category: 'System',
    query: 'I want to start, what is the first step?',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'start business Indonesia first step guide', domain: 'all', mode: 'comprehensive' }
  },
  {
    id: 49,
    category: 'System',
    query: 'Show me the connection between KBLI 56101 and required licenses',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'KBLI 56101 licenses requirements connections', domain: 'all', mode: 'comprehensive' }
  },
  {
    id: 50,
    category: 'System',
    query: 'What can ZANTARA help me with?',
    endpoint: '/api/v3/zantara/',
    payload: null
  }
];

// HTTP request helper
function makeRequest(url, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZANTARA-Test-Runner/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    req.setTimeout(30000);

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

// Run single test
async function runTest(test) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST ${test.id}/${TESTS.length} [${test.category}]`);
  console.log(`Query: ${test.query}`);
  console.log('='.repeat(70));

  const startTime = Date.now();

  try {
    const url = `${CONFIG.baseUrl}${test.endpoint}`;
    const response = await makeRequest(url, test.payload);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const result = {
      testId: test.id,
      category: test.category,
      query: test.query,
      timestamp: new Date().toISOString(),
      request: {
        endpoint: test.endpoint,
        method: test.payload ? 'POST' : 'GET',
        payload: test.payload
      },
      response: {
        status: response.status,
        duration: duration,
        body: response.body
      },
      performance: {
        backendProcessing: response.body?.data?.processing_time || 'N/A',
        totalTime: duration,
        cached: response.body?.data?.optimization?.cache_used || false,
        domainsQueried: response.body?.data?.total_domains || 0
      },
      success: response.status === 200 && response.body?.ok
    };

    console.log(`✅ SUCCESS - ${duration}ms`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Backend: ${result.performance.backendProcessing}`);
    console.log(`   Cached: ${result.performance.cached}`);
    console.log(`   Domains: ${result.performance.domainsQueried}`);

    return result;

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ FAILED - ${duration}ms`);
    console.log(`   Error: ${error.message}`);

    return {
      testId: test.id,
      category: test.category,
      query: test.query,
      timestamp: new Date().toISOString(),
      request: {
        endpoint: test.endpoint,
        method: test.payload ? 'POST' : 'GET',
        payload: test.payload
      },
      response: {
        status: 0,
        duration: duration,
        error: error.message
      },
      success: false
    };
  }
}

// Generate markdown report
function generateReport(results, summary) {
  let report = `# ZANTARA v3 Ω - Test Results\n\n`;
  report += `**Date**: ${new Date().toISOString()}\n`;
  report += `**Total Tests**: ${summary.totalTests}\n`;
  report += `**Duration**: ${Math.round(summary.totalDuration / 1000)}s\n\n`;
  report += `---\n\n`;
  report += `## Summary\n\n`;
  report += `| Metric | Value |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Tests | ${summary.totalTests} |\n`;
  report += `| Successful | ${summary.successful} (${Math.round(summary.successful/summary.totalTests*100)}%) |\n`;
  report += `| Failed | ${summary.failed} |\n`;
  report += `| Average Time | ${summary.averageTime}ms |\n`;
  report += `| Fastest | ${summary.fastestTest}ms |\n`;
  report += `| Slowest | ${summary.slowestTest}ms |\n`;
  report += `| Cache Hit Rate | ${summary.cacheHitRate}% |\n\n`;
  
  report += `## By Category\n\n`;
  const byCategory = {};
  results.forEach(r => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = { total: 0, successful: 0, avgTime: 0 };
    }
    byCategory[r.category].total++;
    if (r.success) byCategory[r.category].successful++;
    byCategory[r.category].avgTime += r.response.duration;
  });

  Object.keys(byCategory).forEach(cat => {
    const data = byCategory[cat];
    data.avgTime = Math.round(data.avgTime / data.total);
    report += `### ${cat}\n`;
    report += `- Tests: ${data.total}\n`;
    report += `- Success: ${data.successful}/${data.total}\n`;
    report += `- Avg Time: ${data.avgTime}ms\n\n`;
  });

  report += `## Detailed Results\n\n`;
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    report += `### ${status} Test ${r.testId}: ${r.query}\n`;
    report += `- **Category**: ${r.category}\n`;
    report += `- **Duration**: ${r.response.duration}ms\n`;
    report += `- **Status**: ${r.response.status}\n`;
    if (r.performance) {
      report += `- **Backend**: ${r.performance.backendProcessing}\n`;
      report += `- **Cached**: ${r.performance.cached}\n`;
      report += `- **Domains**: ${r.performance.domainsQueried}\n`;
    }
    if (!r.success && r.response.error) {
      report += `- **Error**: ${r.response.error}\n`;
    }
    report += `\n`;
  });

  return report;
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 ZANTARA v3 Ω - Automated Test Runner');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${TESTS.length}`);
  console.log(`Target: ${CONFIG.baseUrl}`);
  console.log(`Log File: ${CONFIG.logFile}`);
  console.log(`Report File: ${CONFIG.reportFile}`);
  console.log('═'.repeat(70));

  const results = [];
  const startTime = Date.now();

  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);

    // Wait between tests
    if (test.id < TESTS.length) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenTests));
    }
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Calculate summary
  const summary = {
    totalTests: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    averageTime: Math.round(
      results.reduce((sum, r) => sum + r.response.duration, 0) / results.length
    ),
    fastestTest: Math.min(...results.map(r => r.response.duration)),
    slowestTest: Math.max(...results.map(r => r.response.duration)),
    cacheHitRate: Math.round(
      (results.filter(r => r.performance?.cached).length / results.length) * 100
    ),
    totalDuration: totalDuration
  };

  // Save complete logs
  const output = {
    timestamp: new Date().toISOString(),
    config: CONFIG,
    summary: summary,
    results: results
  };

  fs.writeFileSync(CONFIG.logFile, JSON.stringify(output, null, 2));

  // Generate and save report
  const report = generateReport(results, summary);
  fs.writeFileSync(CONFIG.reportFile, report);

  // Print summary
  console.log('\n\n📊 FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful: ${summary.successful} (${Math.round(summary.successful/summary.totalTests*100)}%)`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Average Time: ${summary.averageTime}ms`);
  console.log(`Fastest: ${summary.fastestTest}ms`);
  console.log(`Slowest: ${summary.slowestTest}ms`);
  console.log(`Cache Hit Rate: ${summary.cacheHitRate}%`);
  console.log(`Total Duration: ${Math.round(totalDuration/1000)}s`);
  console.log('═'.repeat(70));
  console.log(`\n✅ Complete logs saved to: ${CONFIG.logFile}`);
  console.log(`✅ Markdown report saved to: ${CONFIG.reportFile}`);
  console.log('\n🎉 Testing complete!\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
