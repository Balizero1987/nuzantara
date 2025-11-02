# ZANTARA v3 Ω Integration Tests

Comprehensive integration test suite for the ZANTARA v3 Ω endpoints covering functionality, authentication, memory integration, and performance.

## Test Suites

### 1. Integration Tests (`integration.test.ts`)

**Coverage:**
- ✅ v3 Ω Unified Endpoint (all domains, single domain, error handling)
- ✅ v3 Ω Collective Endpoint (query, contribute, verify, stats, sync)
- ✅ v3 Ω Ecosystem Endpoint (business setup, expansion, compliance, optimization)
- ✅ Authentication & Authorization (JWT validation, role-based access, demo mode)
- ✅ Memory System Integration (save, retrieve, search, collective integration)
- ✅ Performance Under Load (concurrent requests, sequential load, mixed workload)
- ✅ End-to-End Scenarios (full workflows, error recovery)

**Key Tests:**
- All three v3 Ω endpoints with various query types
- JWT token validation and expiration handling
- Role-based permission checks
- Memory save/retrieve/search operations
- Concurrent request handling (20+ requests)
- Mixed workload performance

### 2. Performance Tests (`performance.test.ts`)

**Coverage:**
- 📊 Load Testing (10, 50, 100 concurrent requests)
- 📈 Throughput Analysis (requests/second metrics)
- 💾 Memory Usage Monitoring (leak detection, large payloads)
- 🔥 Stress Testing (sustained load, error recovery)
- ⏱️ Response Time Benchmarks (p95, p99 percentiles)
- 🔄 Mixed Workload Performance

**Performance Targets:**
- Quick queries: < 500ms (p95)
- Comprehensive queries: < 3s (p95)
- Minimum throughput: 5 requests/second
- Error rate: < 5% under stress
- Memory increase: < 50MB for 50 requests

## Running Tests

### Run All Integration Tests
```bash
cd apps/backend-ts
npm test -- handlers/zantara-v3/__tests__/integration.test.ts
```

### Run Performance Tests
```bash
npm test -- handlers/zantara-v3/__tests__/performance.test.ts
```

### Run Specific Test Suite
```bash
# Test unified endpoint only
npm test -- handlers/zantara-v3/__tests__/integration.test.ts -t "v3 Ω Unified Endpoint"

# Test authentication only
npm test -- handlers/zantara-v3/__tests__/integration.test.ts -t "Authentication"

# Test performance only
npm test -- handlers/zantara-v3/__tests__/performance.test.ts -t "Load Testing"
```

### Run with Coverage
```bash
npm test -- --coverage handlers/zantara-v3/__tests__/
```

## Test Structure

### Integration Test Structure
```
integration.test.ts
├── v3 Ω Unified Endpoint
│   ├── Comprehensive query across all domains
│   ├── Single domain queries (KBLI, pricing, team, memory)
│   ├── Error handling
│   └── Source inclusion
├── v3 Ω Collective Endpoint
│   ├── Query action
│   ├── Contribute action
│   ├── Verify action
│   ├── Stats action
│   ├── Sync action
│   └── Invalid action handling
├── v3 Ω Ecosystem Endpoint
│   ├── Restaurant business analysis
│   ├── Hotel expansion analysis
│   ├── Compliance analysis
│   ├── Optimization analysis
│   ├── Success probability calculation
│   └── Investment estimates
├── Authentication & Authorization
│   ├── Valid JWT token
│   ├── Invalid token rejection
│   ├── Expired token handling
│   ├── Role-based permissions
│   ├── Demo user authentication
│   └── v3 endpoint access control
├── Memory System Integration
│   ├── Save memory
│   ├── Retrieve memory
│   ├── Search memories
│   ├── Key-value format
│   ├── Collective intelligence integration
│   └── Empty result handling
├── Performance Under Load
│   ├── Concurrent unified queries (20 requests)
│   ├── Concurrent collective queries (20 requests)
│   ├── Concurrent ecosystem analyses (20 requests)
│   ├── Memory operations under load (50 operations)
│   └── Sequential load testing (10 requests)
└── End-to-End Scenarios
    ├── Full business setup workflow
    └── Error recovery
```

### Performance Test Structure
```
performance.test.ts
├── Load Testing
│   ├── 10 concurrent requests
│   ├── 50 concurrent requests
│   └── 100 sequential requests
├── Throughput Analysis
│   ├── Minimum throughput (5 req/s)
│   └── Burst traffic handling
├── Memory Usage Monitoring
│   ├── Memory leak detection
│   └── Large payload efficiency
├── Stress Testing
│   ├── Sustained load (30 seconds)
│   └── Error recovery after spikes
├── Response Time Benchmarks
│   ├── Quick queries (p95 < 500ms)
│   └── Comprehensive queries (p95 < 3s)
└── Mixed Workload Performance
    └── Unified + Collective + Ecosystem
```

## Test Data

### Test Users
- `test-user-{timestamp}` - Standard test user
- `demo@balizero.com` - Demo user for authentication tests
- `admin` role - Admin user for permission tests
- `member` role - Standard member user

### Test Scenarios
- **Business Setup**: Restaurant, hotel, retail, services, tech
- **Ownership Types**: Foreign, local, joint venture
- **Query Modes**: Quick, detailed, comprehensive
- **Domains**: KBLI, pricing, team, legal, tax, immigration, property, memory, all

## Mock Data

### Mock Request/Response Helpers
- `createMockRequest(body, headers)` - Creates Express request mock
- `createMockResponse()` - Creates Express response mock
- `generateTestToken(payload)` - Generates JWT token for tests

### Performance Metrics
- `calculateMetrics()` - Calculates performance metrics from response times

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Test data uses timestamps to avoid conflicts
3. **Timeouts**: Performance tests have extended timeouts (30-120 seconds)
4. **Error Handling**: Tests verify graceful error handling
5. **Assertions**: Comprehensive assertions for all response fields

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- Fast execution (< 5 minutes for all tests)
- Deterministic results
- No external dependencies required (mocked)
- Performance benchmarks for regression detection

## Troubleshooting

### Tests Failing Due to Timeouts
- Increase timeout values if running on slower machines
- Check for memory leaks or resource exhaustion
- Verify external service availability (if not mocked)

### Memory Test Failures
- Ensure sufficient memory available
- Run with `--detectOpenHandles` to find leaks
- Check for proper cleanup in test teardown

### Authentication Test Failures
- Verify JWT_SECRET matches between test and runtime
- Check token expiration times
- Ensure mock middleware is properly configured

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Add appropriate timeouts for async operations
3. Include both success and failure cases
4. Document test scenarios in this README
5. Update coverage thresholds if needed
