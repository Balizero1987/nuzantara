# REFACTORING_ROADMAP: The Action Plan

**Objective:** Stabilize `nuzantara` and prepare it for autonomous AI development.

## Phase 1: Stop the Bleeding (Immediate Fixes)

1.  **Fix Docker Security & Path:**
    - [ ] Modify `Dockerfile` to use a multi-stage build.
    - [ ] Add a non-root user in Docker.
    - [ ] Change `WORKDIR` to `/app` (root of the service).
    - [ ] Update `CMD` to run from root: `uvicorn backend.app.main_cloud:app ...`.
    - [ ] **Why:** This aligns Docker behavior with standard Python module usage and fixes path issues.

2.  **Prune Dependencies:**
    - [ ] Remove `psycopg2-binary` if `asyncpg` is sufficient.
    - [ ] Audit `langchain` usage. If we only need `langchain-core`, remove the rest.
    - [ ] Run `pip freeze > requirements.lock` to pin exact working versions (reproducibility).

3.  **Unify Configuration:**
    - [ ] Ensure all config is read from Environment Variables (Pydantic `BaseSettings`).
    - [ ] Remove any hardcoded paths or URLs in `.py` files.

## Phase 2: Structural Hygiene (The "Clean Up")

4.  **Standardize Directory Structure:**
    - [ ] Rename `apps/backend-rag/backend` to `apps/backend-rag/src`.
    - [ ] Move root scripts (`check_env.py`, etc.) into `apps/backend-rag/scripts/`.
    - [ ] Create a `__init__.py` in `src` to make it a proper package.

5.  **Type Hinting & Linting:**
    - [ ] Enforce `mypy` strict mode on `core` module first.
    - [ ] Add type hints to all function signatures in `services`.
    - [ ] **Why:** AIs hallucinate less when they see explicit types (`def process(data: Dict[str, Any]) -> Result:`).

## Phase 3: Automation (The "Autopilot")

6.  **Pre-commit Hooks:**
    - [ ] Install `pre-commit`.
    - [ ] Configure it to run `ruff format` and `ruff check` on every commit.

7.  **CI/CD Pipeline:**
    - [ ] Create `.github/workflows/ci.yml` for testing.
    - [ ] Create `.github/workflows/deploy.yml` for Fly.io deployment.

---

## PRIORITIZED TASK LIST (Copy/Paste this to your Task Manager)

1. [ ] **[URGENT]** Update `Dockerfile` to fix `WORKDIR` and `PYTHONPATH`.
2. [ ] **[URGENT]** Create `scripts/health_check.py` to validate env vars before start.
3. [ ] **[HIGH]** Run `ruff format .` to standardize code style.
4. [ ] **[HIGH]** Consolidate `requirements.txt`.
5. [ ] **[MEDIUM]** Refactor folder structure (Move `backend` to `src`).
