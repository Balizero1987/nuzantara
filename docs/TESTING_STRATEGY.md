# TESTING_STRATEGY: The Safety Net

**Objective:** Prevent broken deploys by validating code *before* it leaves the machine.

## 1. The "Pre-Flight" Check (Health Check Script)

Create a script `scripts/pre_flight_check.py` that runs fast checks.

**What it must check:**
1.  **Environment:** Are `OPENAI_API_KEY`, `QDRANT_URL` present?
2.  **Imports:** Can we `import backend.app.main_cloud` without crashing? (Catches syntax errors and circular imports).
3.  **Database:** Can we ping Qdrant? (Optional, but good).

**Usage:**
```bash
python scripts/pre_flight_check.py
# Exit code 0 = READY TO DEPLOY
# Exit code 1 = ABORT
```

## 2. Automated Testing (`pytest`)

We need a tiered testing approach.

### Tier 1: Unit Tests (Fast, Local)
- **Location:** `tests/unit/`
- **Scope:** Test individual functions in `services/` and `core/`.
- **Mocking:** Mock ALL external calls (OpenAI, Qdrant).
- **Command:** `pytest tests/unit`

### Tier 2: Integration Tests (Slower, requires DB)
- **Location:** `tests/integration/`
- **Scope:** Test API endpoints (`/chat`, `/health`).
- **Setup:** Spin up a local Qdrant docker container or use a dev instance.
- **Command:** `pytest tests/integration`

## 3. Smoke Test (Post-Deploy)

After `fly deploy`, run a curl command to verify the service is actually up.

```bash
curl -f https://nuzantara-rag.fly.dev/health
```

## 4. Implementation Plan for Tests

1.  **Install Test Deps:**
    ```bash
    pip install pytest pytest-asyncio httpx pytest-mock
    ```
2.  **Configure `pytest.ini`:**
    ```ini
    [pytest]
    pythonpath = .
    testpaths = tests
    asyncio_mode = auto
    ```
3.  **Write the first test (`tests/test_health.py`):**
    ```python
    from fastapi.testclient import TestClient
    from backend.app.main_cloud import app

    client = TestClient(app)

    def test_health_check():
        response = client.get("/health")
        assert response.status_code == 200
    ```
