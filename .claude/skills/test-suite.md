---
name: test-suite
description: Run comprehensive test suite including unit tests, integration tests, RAG validation, and Oracle agent tests with coverage reporting
---

# Test Suite Execution Protocol

Use this skill when running tests, validating changes, before deployment, or when user asks to "run tests" or "check if everything works".

## Complete Test Execution

### 1. TypeScript Unit Tests (Jest)
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- users.test.ts

# Watch mode for development
npm run test:watch

# CI mode (no watch, single run)
npm run test:ci
```

**Expected Results**:
- All tests pass ✅
- Coverage >= 70%
- No failing assertions
- Execution time < 30 seconds

### 2. TypeScript Integration Tests
```bash
# Run integration tests
npm run test:integration

# Or manually
cd tests/integration
./run-integration-tests.sh
```

Tests should cover:
- API endpoint integration
- Database operations
- External service calls (mocked)
- Auth flow end-to-end

### 3. Python RAG Backend Tests
```bash
cd apps/backend-rag/backend

# Run pytest
pytest tests/ -v

# With coverage
pytest tests/ --cov=app --cov-report=term-missing

# Specific test file
pytest tests/test_vector_db.py -v
```

Key test files to run:
- `tests/test_vector_db.py` - ChromaDB operations
- `tests/test_embeddings.py` - Embedding generation
- `tests/test_rag_service.py` - RAG query logic
- `tests/test_tier_access.py` - Access control

### 4. RAG System Validation
Test RAG system with real queries:

```python
# Test script
import requests

queries = [
    {"query": "How to get KITAS?", "tier": 0},
    {"query": "Tax rates for PT company?", "tier": 1},
    {"query": "Advanced legal strategies?", "tier": 2}
]

for test in queries:
    response = requests.post(
        'http://localhost:8000/api/rag/query',
        json=test
    )
    assert response.status_code == 200
    assert len(response.json()['results']) > 0
    print(f"✅ Query test passed: {test['query'][:30]}...")
```

### 5. Oracle Agent Tests
Test each Oracle agent:

```bash
# If test scripts exist
cd projects/oracle-system/tests
python test_visa_oracle.py
python test_kbli_eye.py
python test_tax_genius.py
python test_legal_architect.py
python test_morgana.py

# Multi-agent collaboration test
python test_multi_agent.py
```

**Manual Oracle Test Queries**:
```bash
# VISA Oracle
curl -X POST http://localhost:8080/api/oracle/visa-oracle \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "KITAS requirements for foreign developer"}'

# KBLI Eye
curl -X POST http://localhost:8080/api/oracle/kbli-eye \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "KBLI code for software consulting"}'

# Tax Genius
curl -X POST http://localhost:8080/api/oracle/tax-genius \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query": "Corporate tax rate 2025"}'
```

### 6. API Endpoint Health Tests
```bash
# Health check endpoints
curl http://localhost:8080/health
curl http://localhost:8000/health

# Database health
curl http://localhost:8080/api/health/db

# ChromaDB health
curl http://localhost:8000/api/rag/health
```

All should return 200 OK.

### 7. Frontend Tests
```bash
# If frontend tests exist
cd apps/webapp

# Run test pages manually
# Open test-*.html files in browser
python -m http.server 8081
```

Manual frontend checks:
- Login/logout flow
- Chat interface sends messages
- Dashboard loads data
- Service worker caches assets

### 8. Performance Tests
```bash
# Load testing (if configured)
cd tests/performance

# Example with Apache Bench
ab -n 1000 -c 10 http://localhost:8080/health

# Or with hey
hey -n 1000 -c 10 http://localhost:8080/api/rag/query
```

**Performance Targets**:
- Health endpoints: < 100ms
- RAG queries: < 2s
- API endpoints: < 500ms
- Throughput: 100+ req/s

### 9. Security Tests
```bash
# Check for common vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Python security check
cd apps/backend-rag/backend
pip install safety
safety check
```

### 10. Database Tests
```bash
# Prisma migrations check
npx prisma migrate status

# Test database connection
npx prisma db pull
```

## Test Categories

### Critical Path Tests (Must Pass)
- ✅ Authentication works
- ✅ RAG queries return results
- ✅ Database operations succeed
- ✅ Health endpoints respond

### Important Tests (Should Pass)
- ✅ All unit tests pass
- ✅ Integration tests pass
- ✅ Oracle agents respond correctly
- ✅ Rate limiting works

### Nice-to-Have Tests
- Performance benchmarks meet targets
- Frontend visual tests
- Load tests handle expected traffic
- Security scan shows no issues

## Test Execution Order

Run tests in this order for efficiency:

1. **Quick checks** (< 1 min):
   - Health endpoints
   - TypeScript typecheck
   - Linting

2. **Unit tests** (< 5 min):
   - Jest unit tests
   - Python unit tests

3. **Integration tests** (< 10 min):
   - API integration tests
   - Database tests

4. **System tests** (< 15 min):
   - RAG validation
   - Oracle agent tests
   - End-to-end flows

5. **Performance tests** (optional):
   - Load testing
   - Stress testing

## Coverage Requirements

### TypeScript Coverage
```bash
npm run test:coverage
```

**Targets**:
- Overall coverage: >= 70%
- Statements: >= 70%
- Branches: >= 60%
- Functions: >= 70%
- Lines: >= 70%

### Python Coverage
```bash
pytest --cov=app --cov-report=html
```

View report: `htmlcov/index.html`

**Targets**:
- Overall coverage: >= 80%
- Critical modules (vector_db, embeddings): >= 90%

## Test Failure Handling

If tests fail:

### 1. Identify Failing Tests
```bash
# Run failed tests only
npm test -- --onlyFailures

# Verbose output
npm test -- --verbose
```

### 2. Debug Failing Test
```bash
# Run single test with debugging
node --inspect-brk node_modules/.bin/jest --runInBand test-file.ts
```

### 3. Check Recent Changes
```bash
# What changed since last passing tests?
git diff HEAD~1

# Check commit history
git log --oneline -5
```

### 4. Common Failure Causes
- **Environment variables missing**: Check `.env` file
- **Database not running**: Start PostgreSQL
- **ChromaDB not loaded**: Verify vector database
- **Ports in use**: Check 8080, 8000 availability
- **Dependencies outdated**: Run `npm install`

## Continuous Integration

For CI/CD pipelines:

```bash
# CI test script
#!/bin/bash
set -e  # Exit on error

echo "Running TypeScript tests..."
npm run test:ci

echo "Running TypeScript build..."
npm run build

echo "Running Python tests..."
cd apps/backend-rag/backend
pytest tests/ --cov=app

echo "Running security audit..."
npm audit --audit-level=moderate

echo "All tests passed! ✅"
```

## Test Report Generation

Generate comprehensive test report:

```bash
# Jest HTML report
npm test -- --coverage --coverageReporters=html

# pytest HTML report
pytest --html=report.html --self-contained-html

# Combined report
./scripts/test/generate-test-report.sh
```

## Key Files
- `apps/backend-ts/**/*.test.ts` - TypeScript unit tests
- `apps/backend-rag/backend/tests/` - Python tests
- `tests/integration/` - Integration tests
- `jest.config.js` - Jest configuration
- `pytest.ini` - pytest configuration

## Test Data Setup

Before running tests, ensure test data is available:

```bash
# Seed test database
npm run db:seed:test

# Load test ChromaDB data
python scripts/test/load-test-data.py
```

## Success Criteria
✅ All unit tests pass
✅ Integration tests pass
✅ Code coverage meets thresholds (70%+)
✅ No critical security vulnerabilities
✅ Health checks respond correctly
✅ RAG system returns valid results
✅ Oracle agents respond appropriately
✅ Performance targets met
✅ No failing assertions or errors

## Test Report Template

```markdown
## 🧪 TEST EXECUTION REPORT
Generated: [timestamp]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### ✅ PASSED TESTS
- TypeScript Unit Tests: [X/Y passed]
- Python Unit Tests: [X/Y passed]
- Integration Tests: [X/Y passed]
- RAG Validation: ✅
- Oracle Agents: ✅

### ❌ FAILED TESTS
[List any failures]

### 📊 COVERAGE
- TypeScript: [X]%
- Python: [X]%
- Overall: [X]%

### ⚡ PERFORMANCE
- Health endpoint: [X]ms
- RAG query avg: [X]ms
- API response avg: [X]ms

### 🔒 SECURITY
- Vulnerabilities: [count]
- Severity: [level]

### 💡 RECOMMENDATIONS
[Any suggested fixes or improvements]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Automated Testing

Set up pre-commit hooks:

```bash
# .husky/pre-commit
npm run typecheck
npm test -- --onlyChanged
```

This ensures tests run before every commit.
