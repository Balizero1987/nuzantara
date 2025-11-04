# 🔍 ZANTARA v3 Ω - TEST LOGGING & TRANSCRIPTION SYSTEM

**Date**: 2025-11-02  
**Purpose**: Capture ALL test interactions, responses, and performance metrics  
**Output**: Complete transcriptions + detailed logs for analysis

---

## 📊 **LOGGING ARCHITECTURE**

### **3-Tier Logging System:**

```
┌─────────────────────────────────────────────┐
│  TIER 1: Frontend Interaction Logs          │
│  - User queries (natural language)          │
│  - UI interactions                          │
│  - Display rendering                        │
│  - Client-side timing                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  TIER 2: Network & API Logs                 │
│  - HTTP requests/responses                  │
│  - Endpoint routing                         │
│  - Request/response bodies                  │
│  - Status codes & headers                   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  TIER 3: Backend Processing Logs            │
│  - Handler invocations                      │
│  - Database queries                         │
│  - Cache hits/misses                        │
│  - Performance metrics                      │
└─────────────────────────────────────────────┘
```

---

## 🎯 **SETUP: AUTOMATED LOGGING**

### **Option 1: Browser Console Logging (Immediate)**

```javascript
// Paste this in browser console BEFORE starting tests
// ====================================================

(function() {
  window.ZANTARA_TEST_LOG = {
    startTime: Date.now(),
    queries: [],
    currentTest: null
  };

  // Intercept fetch/axios requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const startTime = performance.now();
    const url = args[0];
    
    console.log('🔵 [REQUEST]', {
      url: url,
      timestamp: new Date().toISOString(),
      testNumber: window.ZANTARA_TEST_LOG.currentTest
    });
    
    return originalFetch.apply(this, args).then(response => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      response.clone().json().then(data => {
        const logEntry = {
          testNumber: window.ZANTARA_TEST_LOG.currentTest,
          timestamp: new Date().toISOString(),
          url: url,
          duration: Math.round(duration),
          status: response.status,
          data: data
        };
        
        window.ZANTARA_TEST_LOG.queries.push(logEntry);
        
        console.log('🟢 [RESPONSE]', {
          duration: `${Math.round(duration)}ms`,
          status: response.status,
          cached: data.data?.optimization?.cache_used || false,
          domains: data.data?.total_domains || 'N/A'
        });
      }).catch(e => {
        console.log('⚠️ [PARSE ERROR]', e);
      });
      
      return response;
    });
  };

  // Helper to mark test number
  window.TEST = function(num, query) {
    window.ZANTARA_TEST_LOG.currentTest = num;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 TEST ${num}: ${query}`);
    console.log(`${'='.repeat(60)}\n`);
  };

  // Helper to export logs
  window.EXPORT_LOGS = function() {
    const logs = JSON.stringify(window.ZANTARA_TEST_LOG, null, 2);
    const blob = new Blob([logs], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zantara-test-logs-${Date.now()}.json`;
    a.click();
    console.log('✅ Logs exported!');
  };

  // Helper to generate summary
  window.TEST_SUMMARY = function() {
    const logs = window.ZANTARA_TEST_LOG.queries;
    const avgTime = logs.reduce((sum, q) => sum + q.duration, 0) / logs.length;
    const fastest = Math.min(...logs.map(q => q.duration));
    const slowest = Math.max(...logs.map(q => q.duration));
    
    console.log('\n📊 TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`Total Queries: ${logs.length}`);
    console.log(`Average Time: ${Math.round(avgTime)}ms`);
    console.log(`Fastest: ${fastest}ms`);
    console.log(`Slowest: ${slowest}ms`);
    console.log(`Success Rate: ${logs.filter(q => q.status === 200).length}/${logs.length}`);
    console.log('═'.repeat(60));
  };

  console.log('✅ ZANTARA Test Logger initialized!');
  console.log('📝 Use: TEST(1, "your query") before each test');
  console.log('💾 Use: EXPORT_LOGS() to download results');
  console.log('📊 Use: TEST_SUMMARY() for quick stats');
})();
```

### **Usage:**
```javascript
// Before Q1:
TEST(1, "What KBLI code do I need for a restaurant?");
// ... ask query in webapp ...

// Before Q2:
TEST(2, "I want to open a cafe that also sells retail coffee");
// ... ask query in webapp ...

// After all 50 tests:
TEST_SUMMARY();  // View stats
EXPORT_LOGS();   // Download full JSON
```

---

## 📝 **MANUAL LOGGING TEMPLATE**

### **For Each Test Question:**

```markdown
### TEST #[NUMBER] - [CATEGORY]
**Query**: "[Exact question asked]"
**Timestamp**: [HH:MM:SS]

#### Request:
- Endpoint: [URL called]
- Method: [POST/GET]
- Payload: [Request body if applicable]

#### Response:
- Status: [200/400/500]
- Duration: [XXXms]
- Size: [XX KB]

#### Results:
- Domains accessed: [kbli, pricing, legal, ...]
- Cache status: [HIT/MISS]
- Results count: [X results]
- Accuracy: [0-10]
- Completeness: [0-10]

#### Content Analysis:
✅ **Correct**: [What was right]
⚠️ **Issues**: [What needs improvement]
💡 **Notes**: [Any observations]

#### Performance:
- Backend processing: [Xms]
- Network latency: [Xms]
- Frontend render: [Xms]
- Total time: [Xms]

---
```

---

## 🖥️ **OPTION 2: Backend Logs Access**

### **Real-time Backend Logs:**

```bash
# Terminal window 1: Monitor all logs
cd /Users/antonellosiano/Desktop/NUZANTARA-FLY
fly logs --app nuzantara-backend --tail

# Terminal window 2: Monitor specific patterns
fly logs --app nuzantara-backend | grep -E "(v3|zantara|performance)"

# Terminal window 3: Performance metrics only
watch -n 5 'curl -s https://nuzantara-backend.fly.dev/api/v3/performance/metrics | jq ".data.performance"'
```

### **Save Backend Logs to File:**

```bash
# Capture logs during testing session
fly logs --app nuzantara-backend > zantara-backend-logs-$(date +%Y%m%d_%H%M%S).log

# Monitor and save simultaneously
fly logs --app nuzantara-backend | tee zantara-test-session.log
```

---

## 📊 **OPTION 3: Automated Test Script**

### **Node.js Test Runner with Full Logging:**

```javascript
// test-runner.js
// ==============

const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'https://nuzantara-backend.fly.dev';
const LOG_FILE = `test-results-${Date.now()}.json`;

const testQuestions = [
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
    query: 'I want to open a cafe that also sells retail coffee',
    endpoint: '/api/v3/zantara/unified',
    payload: { query: 'cafe retail coffee KBLI', domain: 'kbli', mode: 'detailed' }
  },
  // ... add all 50 questions ...
];

async function runTest(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST ${test.id}: ${test.query}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const response = await axios.post(
      `${BASE_URL}${test.endpoint}`,
      test.payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const result = {
      testId: test.id,
      category: test.category,
      query: test.query,
      timestamp: new Date().toISOString(),
      duration: duration,
      status: response.status,
      success: response.data.ok,
      data: response.data,
      performance: {
        backendProcessing: response.data.data?.processing_time || 'N/A',
        totalTime: duration,
        cached: response.data.data?.optimization?.cache_used || false,
        domainsQueried: response.data.data?.total_domains || 0
      }
    };
    
    console.log(`✅ SUCCESS - ${duration}ms`);
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
      duration: duration,
      status: error.response?.status || 0,
      success: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🚀 Starting ZANTARA v3 Ω Test Suite');
  console.log(`   Total tests: ${testQuestions.length}`);
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Log file: ${LOG_FILE}\n`);
  
  const results = [];
  
  for (const test of testQuestions) {
    const result = await runTest(test);
    results.push(result);
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary
  const summary = {
    totalTests: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    averageTime: Math.round(
      results.reduce((sum, r) => sum + r.duration, 0) / results.length
    ),
    fastestTest: Math.min(...results.map(r => r.duration)),
    slowestTest: Math.max(...results.map(r => r.duration)),
    cacheHitRate: Math.round(
      (results.filter(r => r.performance?.cached).length / results.length) * 100
    )
  };
  
  // Save to file
  const output = {
    timestamp: new Date().toISOString(),
    summary: summary,
    results: results
  };
  
  fs.writeFileSync(LOG_FILE, JSON.stringify(output, null, 2));
  
  console.log('\n📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Average Time: ${summary.averageTime}ms`);
  console.log(`Fastest: ${summary.fastestTest}ms`);
  console.log(`Slowest: ${summary.slowestTest}ms`);
  console.log(`Cache Hit Rate: ${summary.cacheHitRate}%`);
  console.log('═'.repeat(60));
  console.log(`\n✅ Results saved to: ${LOG_FILE}`);
}

runAllTests().catch(console.error);
```

### **Run:**
```bash
npm install axios
node test-runner.js
```

---

## 📋 **COMPLETE LOG STRUCTURE**

### **Final Output Should Include:**

```json
{
  "session": {
    "date": "2025-11-02",
    "tester": "Name",
    "duration": "45 minutes",
    "environment": "production",
    "version": "v38"
  },
  "summary": {
    "total_tests": 50,
    "successful": 48,
    "failed": 2,
    "average_time_ms": 127,
    "fastest_ms": 85,
    "slowest_ms": 2340,
    "cache_hit_rate_percent": 42
  },
  "tests": [
    {
      "test_number": 1,
      "category": "KBLI",
      "query": "What KBLI code for restaurant?",
      "timestamp": "2025-11-02T20:30:15.234Z",
      "request": {
        "endpoint": "/api/v3/zantara/unified",
        "method": "POST",
        "payload": { "query": "restaurant KBLI", "domain": "kbli" }
      },
      "response": {
        "status": 200,
        "duration_ms": 142,
        "size_kb": 5.2,
        "cached": false
      },
      "results": {
        "domains_accessed": ["kbli"],
        "results_count": 3,
        "accuracy_score": 9,
        "completeness_score": 9
      },
      "performance": {
        "backend_processing_ms": 2,
        "network_latency_ms": 87,
        "frontend_render_ms": 53,
        "total_ms": 142
      },
      "notes": "Perfect response, all info correct"
    }
    // ... 49 more tests ...
  ]
}
```

---

## 🎯 **EXPORT FORMATS**

### **1. JSON (Complete Data)**
```bash
zantara-test-logs-20251102.json
```

### **2. CSV (Spreadsheet Analysis)**
```bash
test_num,category,query,duration_ms,status,cached,accuracy,notes
1,KBLI,"restaurant code",142,200,false,9,"Perfect"
2,KBLI,"cafe retail",198,200,false,8,"Good"
...
```

### **3. Markdown Report**
```markdown
# ZANTARA Test Results - 2025-11-02

## Summary
- Total: 50 tests
- Success: 48 (96%)
- Avg time: 127ms
- Cache hit: 42%

## By Category
...
```

---

## 📊 **ANALYSIS TOOLS**

### **Generate Performance Chart:**

```bash
# Extract response times to CSV
cat test-logs.json | jq -r '.tests[] | [.test_number, .response.duration_ms] | @csv' > response-times.csv

# Import to Google Sheets or Excel for visualization
```

### **Identify Bottlenecks:**

```bash
# Find slowest queries
cat test-logs.json | jq -r '.tests[] | select(.response.duration_ms > 1000) | "\(.test_number): \(.query) - \(.response.duration_ms)ms"'

# Find failed tests
cat test-logs.json | jq -r '.tests[] | select(.response.status != 200) | "\(.test_number): \(.query) - Status \(.response.status)"'
```

---

## ✅ **READY-TO-USE COMMANDS**

### **Start Logging Everything:**

```bash
# Terminal 1: Backend logs
fly logs --app nuzantara-backend > backend-$(date +%Y%m%d_%H%M%S).log

# Terminal 2: Performance monitoring
watch -n 2 'curl -s https://nuzantara-backend.fly.dev/api/v3/performance/metrics | jq ".data.performance"'

# Browser: Run console logger script (see above)
```

### **After Testing:**

```bash
# Export from browser
EXPORT_LOGS()

# Analyze logs
cat zantara-test-logs-*.json | jq '.queries | length'
cat zantara-test-logs-*.json | jq '.queries[] | .duration' | sort -n | tail -10
```

---

## 🎯 **DELIVERABLES**

After testing, you'll have:

1. ✅ **Complete JSON log** with all 50 tests
2. ✅ **Backend logs** from Fly.io
3. ✅ **Performance metrics** timeline
4. ✅ **Summary statistics** (avg, min, max)
5. ✅ **Issue list** (failed/slow queries)
6. ✅ **Improvement recommendations**

---

## 🚀 **START LOGGING NOW**

1. **Copy** browser console script above
2. **Paste** in browser console (F12)
3. **Start** testing with `TEST(1, "query")`
4. **Export** logs with `EXPORT_LOGS()` when done

**All interactions will be captured and exportable!** 📊
