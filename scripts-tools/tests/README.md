# NUZANTARA Tests

Cross-application integration tests.

## 🧪 Test Files

### cache-performance.test.cjs
Performance testing for cache layer (9.6 KB)

- LRU cache performance
- Redis cache performance
- Comparison metrics

### cache-simple.test.cjs
Simple cache functionality tests (8.6 KB)

- Basic cache operations
- Hit/miss ratios
- TTL handling

## 🏗️ Structure

Tests are organized at multiple levels:

**Root `/tests`** (this directory):
- Integration tests
- Cross-app tests
- Performance tests

**App-specific tests**:
- `apps/backend-api/tests/` - API tests
- `apps/backend-rag/backend/test_*.py` - RAG tests
- `apps/orchestrator/src/` - Orchestrator tests

## 🚀 Running Tests

### All integration tests
```bash
npm test
```

### Cache tests only
```bash
node tests/cache-simple.test.cjs
node tests/cache-performance.test.cjs
```

### App-specific tests
```bash
# Backend API
cd apps/backend-api && npm test

# RAG Backend
cd apps/backend-rag/backend && pytest

# Orchestrator
cd apps/orchestrator && npm test
```

---

**Last Updated**: 2025-10-04
