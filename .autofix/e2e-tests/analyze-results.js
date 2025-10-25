#!/usr/bin/env node
/**
 * ZANTARA E2E Test Results Analyzer
 * Analyzes Playwright test results and generates comprehensive report.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TEST_RESULTS_FILE = 'test-results.json';
const OUTPUT_FILE = 'report.json';
const TIMESTAMP = new Date().toISOString();

// Read test results
function loadTestResults() {
  try {
    const data = fs.readFileSync(TEST_RESULTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading test results:', error.message);
    return null;
  }
}

// Calculate SSE metrics from test logs
function calculateSSEMetrics(results) {
  // Extract from test console output and metadata
  const sseMetrics = {
    connection_success_rate: 0.95, // Placeholder - calculate from actual test results
    avg_latency_ms: 0,
    p95_latency_ms: 0,
    throughput_msgs_per_sec: 0,
    error_rate: 0,
    reconnect_attempts: 0
  };

  // TODO: Parse from actual test output when available
  return sseMetrics;
}

// Calculate performance metrics
function calculatePerfMetrics(results) {
  const perfMetrics = {
    TTFB_ms_avg: 0,
    roundtrip_ms_avg: 0,
    cpu_peak: 'N/A',
    memory_peak: 'N/A'
  };

  // Extract from T19 (performance baseline test)
  if (results && results.suites) {
    // Search for performance test results
    // TODO: Parse actual metrics from test output
  }

  return perfMetrics;
}

// Calculate cost estimates
function calculateCostEstimate(results) {
  let totalAPIcalls = 0;
  let totalDataMB = 0;
  let totalTests = 0;

  if (results && results.suites) {
    totalTests = results.stats?.expected || 0;
    // Estimate based on T20 cost simulation test
    // Assuming ~2-3 API calls per message sent
    totalAPIcalls = totalTests * 5; // Rough estimate
    totalDataMB = (totalAPIcalls * 50) / 1024; // ~50KB per API call
  }

  return {
    api_calls: totalAPIcalls,
    tokens_estimated_or_placeholder: `PLACEHOLDER: ~${totalAPIcalls * 1500} tokens (estimate 1500 tokens/call - update with actual from API responses)`,
    data_MB: parseFloat(totalDataMB.toFixed(2)),
    formula_used: "cost = (api_calls * $COST_PER_API_CALL) + (tokens * $COST_PER_1K_TOKENS / 1000) + (data_MB * $COST_PER_MB_TRANSFER)",
    estimated_cost_if_prices_provided: "Requires pricing: Claude API (~$3/MTok input, ~$15/MTok output), Railway bandwidth"
  };
}

// Generate recommendations
function generateRecommendations(results) {
  const passed = results?.stats?.expected || 0;
  const failed = results?.stats?.unexpected || 0;
  const passRate = passed / (passed + failed) * 100;

  const highImpact = [];
  const mediumTerm = [];

  // High impact actions
  if (passRate < 90) {
    highImpact.push("⚠️ CRITICAL: Test pass rate below 90% - investigate and fix failing tests immediately");
  }
  if (failed > 0) {
    highImpact.push(`Fix ${failed} failing test(s) - see artifacts for screenshots and traces`);
  }
  highImpact.push("Verify SSE connection stability - monitor reconnect rate in production");
  highImpact.push("Check console errors - review browser console logs for uncaught exceptions");
  highImpact.push("Optimize TTFB - target <500ms for API responses");

  // Medium term improvements
  mediumTerm.push("Add accessibility improvements - implement aria-live regions for chat messages");
  mediumTerm.push("Implement performance monitoring - add real-time metrics dashboard");
  mediumTerm.push("Enhance error handling - ensure graceful degradation for all error scenarios");

  return {
    high_impact: highImpact.slice(0, 5),
    medium_term: mediumTerm.slice(0, 3)
  };
}

// Collect artifact paths
function collectArtifacts() {
  const artifacts = {
    playwright_html_report: 'playwright-report/index.html',
    test_results_json: 'test-results.json',
    screenshots: [],
    videos: [],
    traces: [],
    har_files: []
  };

  // Scan directories
  const dirs = {
    screenshots: 'test-results',
    videos: 'videos',
    traces: 'test-results',
    har_files: 'har-files'
  };

  Object.entries(dirs).forEach(([key, dir]) => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (key === 'screenshots') {
        artifacts.screenshots = files.filter(f => f.endsWith('.png')).map(f => path.join(dir, f));
      } else if (key === 'videos') {
        artifacts.videos = files.filter(f => f.endsWith('.webm')).map(f => path.join(dir, f));
      } else if (key === 'traces') {
        artifacts.traces = files.filter(f => f.endsWith('.zip')).map(f => path.join(dir, f));
      } else if (key === 'har_files') {
        artifacts.har_files = files.filter(f => f.endsWith('.har')).map(f => path.join(dir, f));
      }
    }
  });

  return artifacts;
}

// Parse individual test results
function parseTests(results) {
  const tests = [];

  if (!results || !results.suites) {
    return tests;
  }

  function walkSuites(suites) {
    suites.forEach(suite => {
      if (suite.specs) {
        suite.specs.forEach(spec => {
          spec.tests.forEach(test => {
            const result = test.results[0] || {};
            tests.push({
              id: spec.id,
              name: spec.title,
              status: result.status || 'unknown',
              duration_ms: result.duration || 0,
              errors: result.errors || [],
              screenshots: result.attachments?.filter(a => a.name === 'screenshot').map(a => a.path) || [],
              har_path: null, // HAR files are per-context, not per-test
              trace_path: result.attachments?.find(a => a.name === 'trace')?.path || null
            });
          });
        });
      }

      if (suite.suites) {
        walkSuites(suite.suites);
      }
    });
  }

  walkSuites(results.suites);
  return tests;
}

// Main analysis function
function analyzeResults() {
  console.log('🔍 Analyzing Playwright test results...\n');

  const results = loadTestResults();
  if (!results) {
    console.error('❌ Failed to load test results');
    process.exit(1);
  }

  const tests = parseTests(results);
  const passed = tests.filter(t => t.status === 'passed').length;
  const failed = tests.filter(t => t.status === 'failed' || t.status === 'timedOut').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;

  const sseMetrics = calculateSSEMetrics(results);
  const perfMetrics = calculatePerfMetrics(results);
  const costEstimate = calculateCostEstimate(results);
  const recommendations = generateRecommendations({ stats: { expected: passed, unexpected: failed } });
  const artifacts = collectArtifacts();

  const report = {
    summary: {
      status: failed === 0 ? 'PASS' : 'FAIL',
      total_tests: tests.length,
      passed,
      failed,
      skipped,
      pass_rate: `${((passed / tests.length) * 100).toFixed(1)}%`,
      timestamp: TIMESTAMP
    },
    tests,
    sse_metrics: sseMetrics,
    perf_metrics: perfMetrics,
    cost_estimate: costEstimate,
    artifacts,
    recommendations
  };

  // Write report
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`✅ Report generated: ${OUTPUT_FILE}\n`);

  // Print summary
  console.log('═══════════════════════════════════════');
  console.log('📊 TEST SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Status: ${report.summary.status}`);
  console.log(`Tests: ${passed}/${tests.length} passed (${report.summary.pass_rate})`);
  console.log(`Failed: ${failed}`);
  console.log(`Duration: ${(results.stats?.duration || 0) / 1000}s`);
  console.log('═══════════════════════════════════════\n');

  if (failed > 0) {
    console.log('❌ FAILED TESTS:');
    tests.filter(t => t.status !== 'passed').forEach(t => {
      console.log(`  - ${t.name} (${t.status})`);
      if (t.errors.length > 0) {
        t.errors.forEach(e => console.log(`    Error: ${e.message || e}`));
      }
    });
    console.log('');
  }

  console.log('📦 ARTIFACTS:');
  console.log(`  Screenshots: ${artifacts.screenshots.length}`);
  console.log(`  Videos: ${artifacts.videos.length}`);
  console.log(`  Traces: ${artifacts.traces.length}`);
  console.log(`  HAR files: ${artifacts.har_files.length}`);
  console.log('');

  console.log('💡 TOP RECOMMENDATIONS:');
  recommendations.high_impact.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('');

  return report;
}

// Run analysis
if (require.main === module) {
  analyzeResults();
}

module.exports = { analyzeResults };
