# Skipped Tests Documentation

This document describes tests that are conditionally skipped and the reasons for skipping them.

## Overview

The Nuzantara backend test suite uses `@pytest.mark.skipif` to conditionally skip tests that depend on optional dependencies or external services that may not be available in all environments.

---

## Skipped Test Categories

### 1. LangChain Dependency Tests

**Files affected:**
- `test_main_cloud.py`

**Skip condition:**
```python
@pytest.mark.skipif(not LANGCHAIN_AVAILABLE, reason="langchain not installed")
```

**Reason:** 
LangChain packages (`langchain`, `langchain-core`, `langgraph`) were removed from `requirements.txt` to resolve dependency conflicts. These tests are skipped when LangChain is not installed.

**Tests affected:**
- Tests related to LangGraph workflows
- Tests for collective memory integration that used LangChain

**Resolution:**
- These tests can be re-enabled if LangChain is reinstalled
- Alternative: Rewrite tests to use native implementation without LangChain

---

### 2. Memory Vector Router Tests

**Files affected:**
- `test_router_memory_vector.py`

**Skip condition:**
```python
@pytest.mark.skipif(
    not os.getenv("DATABASE_URL"),
    reason="DATABASE_URL not configured"
)
```

**Reason:**
Memory vector operations require a PostgreSQL database connection. Tests are skipped when `DATABASE_URL` environment variable is not set.

**Tests affected:**
- Memory storage and retrieval tests
- Vector similarity search tests
- Memory aggregation tests

**Resolution:**
- Set `DATABASE_URL` environment variable in CI/CD pipeline
- Use test database or mock PostgreSQL connection

---

### 3. External API Tests

**Files that may have skipped tests:**
- `test_calendar_service.py` - Google Calendar API
- `test_gmail_service.py` - Gmail API (excluded from coverage)
- `test_zantara_ai_client.py` - Google Gemini API

**Skip conditions:**
- Missing API keys (`GOOGLE_API_KEY`, `OPENAI_API_KEY`)
- Missing credentials files
- Network unavailable

**Reason:**
These tests make real API calls to external services. They are skipped in CI to avoid:
- Rate limiting
- API costs
- Flaky tests due to network issues

**Resolution:**
- Run these tests manually with proper credentials
- Use integration test environment with mock servers
- Add to separate "integration" test suite

---

### 4. Identity Recognition Tests

**Files affected:**
- `test_identity_recognition.py`

**Skip condition:**
Tests may be skipped if team member data file is missing.

**Reason:**
Identity recognition depends on `data/team_members.json` being present and valid.

**Resolution:**
- Ensure test fixtures include mock team member data
- Add fixture to create temporary test data file

---

### 5. Work Session Service Tests

**Files affected:**
- `test_work_session_service.py`

**Skip condition:**
Tests may be skipped when database pool is not available.

**Reason:**
Work session service requires asyncpg connection pool for PostgreSQL.

**Resolution:**
- Use AsyncMock for database operations
- Add `work_session_service_no_db` fixture for tests without DB

---

## CI/CD Coverage Exclusions

The following files are excluded from coverage reports in `.coveragerc`:

```ini
[run]
omit =
    # Entry points
    backend/app/main_cloud.py
    backend/app/main.py
    
    # Routers with external dependencies
    backend/app/routers/auth.py
    backend/app/routers/crm_*.py
    backend/app/routers/ingest.py
    backend/app/routers/instagram.py
    backend/app/routers/whatsapp.py
    backend/app/routers/websocket.py
    
    # Services with external APIs
    backend/services/calendar_service.py
    backend/services/gmail_service.py
    backend/llm/zantara_ai_client.py
    
    # Middleware
    backend/middleware/hybrid_auth.py
    backend/middleware/rate_limiter.py
```

**Reason:** These files require external services or credentials that are not available in CI.

---

## Running Skipped Tests Locally

To run all tests including those normally skipped:

```bash
# Set required environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/test_db"
export GOOGLE_API_KEY="your-api-key"
export OPENAI_API_KEY="your-api-key"

# Run all tests
pytest tests/unit/ -v --run-skipped
```

To see which tests are being skipped:

```bash
pytest tests/unit/ -v --collect-only | grep "skip"
```

---

## Adding New Skipped Tests

When adding a new test that depends on optional features:

1. Use `@pytest.mark.skipif` with clear reason:
   ```python
   @pytest.mark.skipif(
       not FEATURE_AVAILABLE,
       reason="Feature X not installed - pip install feature-x"
   )
   ```

2. Document the skip condition in this file

3. Add the dependency to `requirements-dev.txt` if optional

4. Update CI configuration if needed

---

## Test Markers Reference

| Marker | Description | Usage |
|--------|-------------|-------|
| `@pytest.mark.unit` | Unit tests (fast, no external deps) | Default |
| `@pytest.mark.integration` | Integration tests (may need DB) | `pytest -m integration` |
| `@pytest.mark.slow` | Long-running tests | `pytest -m "not slow"` |
| `@pytest.mark.api` | Tests requiring API keys | `pytest -m api` |
| `@pytest.mark.database` | Tests requiring PostgreSQL | `pytest -m database` |
| `@pytest.mark.security` | Security-focused tests | `pytest -m security` |

---

*Last updated: 2025-12-03*
