# Integration Testing Guide

This document explains how to run integration and API tests for the Nuzantara backend.

## Test Structure

The test suite follows the Testing Pyramid:

```
tests/
├── unit/              # Fast unit tests with mocks (existing)
├── integration/       # Integration tests with real databases
└── api/              # E2E tests with FastAPI TestClient
```

## Prerequisites

### Option 1: Using Docker Compose (Recommended)

1. Install Docker and Docker Compose
2. Start test containers:
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

3. Set environment variables:
   ```bash
   export DATABASE_URL="postgresql://test:test@localhost:5433/test"
   export QDRANT_URL="http://localhost:6334"
   ```

### Option 2: Using Testcontainers (Automatic)

1. Install test dependencies:
   ```bash
   pip install -r requirements-test.txt
   ```

2. Testcontainers will automatically start containers for you.

### Option 3: Using Existing Services

If you have PostgreSQL and Qdrant running locally:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
export QDRANT_URL="http://localhost:6333"
```

## Running Tests

### Run All Tests

```bash
# Unit tests only (fast)
pytest tests/unit -v

# Integration tests only
pytest tests/integration -v -m integration

# API tests only
pytest tests/api -v -m api

# All tests
pytest tests/ -v
```

### Run Specific Test Categories

```bash
# Skip slow tests
pytest tests/ -v -m "not slow"

# Only database tests
pytest tests/ -v -m database

# Only API tests
pytest tests/ -v -m api
```

### Run with Coverage

```bash
pytest tests/ --cov=backend --cov-report=html --cov-report=term
```

## Test Markers

| Marker | Description | Usage |
|--------|-------------|-------|
| `@pytest.mark.unit` | Unit tests (fast, mocked) | Default |
| `@pytest.mark.integration` | Integration tests (real DB) | `pytest -m integration` |
| `@pytest.mark.api` | API/E2E tests | `pytest -m api` |
| `@pytest.mark.database` | Tests requiring PostgreSQL | `pytest -m database` |
| `@pytest.mark.slow` | Long-running tests | `pytest -m "not slow"` |

## CI/CD Configuration

### GitHub Actions

Add these services to your GitHub Actions workflow:

```yaml
services:
  postgres:
    image: postgres:15-alpine
    env:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - 6333:6333
      - 6334:6334
    options: >-
      --health-cmd "curl -f http://localhost:6333/health || exit 1"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

Set environment variables:

```yaml
env:
  DATABASE_URL: postgresql://test:test@localhost:5432/test
  QDRANT_URL: http://localhost:6333
```

## Troubleshooting

### Tests Fail with "Connection Refused"

- Ensure Docker containers are running: `docker-compose -f docker-compose.test.yml ps`
- Check ports are not in use: `lsof -i :5433` and `lsof -i :6334`
- Verify environment variables are set correctly

### Tests Fail with "testcontainers not available"

- Install test dependencies: `pip install -r requirements-test.txt`
- Or use Docker Compose instead: `docker-compose -f docker-compose.test.yml up -d`

### Integration Tests Timeout

- Increase timeout in `pytest.ini`: `--timeout=300`
- Check database connection pool settings
- Verify containers have enough resources

## Best Practices

1. **Unit Tests**: Fast, isolated, use mocks - run frequently during development
2. **Integration Tests**: Test service-database interactions - run before commits
3. **API Tests**: Test full request/response cycle - run in CI/CD pipeline

4. **Test Data**: Always use test prefixes (`test_*`) for test data
5. **Cleanup**: Tests should clean up after themselves (handled by fixtures)
6. **Isolation**: Each test should be independent and runnable in any order

## Coverage Goals

- **Unit Tests**: Cover business logic, edge cases, error handling
- **Integration Tests**: Cover database operations, service interactions
- **API Tests**: Cover endpoints, middleware, authentication, error responses

Target: **95% overall coverage** with all three test types combined.

