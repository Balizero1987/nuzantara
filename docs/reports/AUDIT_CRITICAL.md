# AUDIT_CRITICAL: The Diagnosis

**Date:** 2025-11-26
**Auditor:** Antigravity (Principal SRE & Architect)
**Target:** `nuzantara` (AI-Generated Monorepo)

---

## 1. Security & Stability Analysis

### Dockerfile (`apps/backend-rag/Dockerfile`)
- **[CRITICAL] Root Execution:** The container runs as `root`. This is a major security risk. If the application is compromised, the attacker has root access to the container.
  - *Fix:* Create a non-root user (e.g., `nuzantara`) and switch to it.
- **[WARNING] Layer Caching Inefficiency:** `COPY *.py ./` invalidates the cache for the final layers whenever *any* script in the root changes, even if the main backend code hasn't.
- **[RISK] `curl` in Production:** You are installing `build-essential` and `curl`. While needed for healthchecks, `build-essential` should be removed in a multi-stage build to reduce attack surface and image size.

### Fly.io Configuration (`apps/backend-rag/fly.toml`)
- **[OK]** `auto_stop_machines = 'off'` prevents cold starts, which is good for stability.
- **[WARNING] Hardcoded URL:** `QDRANT_URL = 'https://nuzantara-qdrant.fly.dev'` is hardcoded. If you change the Qdrant app name, this breaks. Use Fly.io internal DNS `http://nuzantara-qdrant.internal:6333` if possible for lower latency and security (private network).
- **[MISSING] Secrets:** No secrets are defined in the file (good), but ensure `OPENAI_API_KEY` and others are set in Fly.io secrets.

## 2. Dependency Hell (`requirements.txt`)

- **[CONFLICT] Redundant DB Drivers:** You have both `psycopg2-binary` (sync) and `asyncpg` (async). Unless you have a specific legacy sync component, you should stick to `asyncpg` for FastAPI.
- **[BLOAT] LangChain Ecosystem:** `langchain`, `langgraph`, `langsmith`, `langchain-core`, `langchain-text-splitters`. This is heavy. Ensure you are actually using `langgraph` and `langsmith`. If not, remove them to speed up build times.
- **[VERSIONING]** `fastapi==0.104.1` is slightly old. `pydantic==2.5.0` is good.
- **[RISK] `python-multipart`:** Recent vulnerabilities found in older versions. Ensure you are on the latest or pinned to a secure version.

## 3. The Python Path Trap (Why `ImportError` happens)

**The Root Cause:**
Your `Dockerfile` sets:
```dockerfile
ENV PYTHONPATH=/app:/app/backend
WORKDIR /app/backend/app
```
But your local environment likely **DOES NOT** have this `PYTHONPATH` set.

1.  **In Docker:** When you run `uvicorn main_cloud:app`, it works because `main_cloud` is in the current directory (`/app/backend/app`). If `main_cloud` imports `core`, Python looks in `/app/backend` (via `PYTHONPATH`) and finds `core`.
2.  **Locally:** You probably open VS Code at `apps/backend-rag`. When you run `python backend/app/main_cloud.py`, `sys.path[0]` is `.../backend/app`. It cannot find `core` because `core` is in `.../backend`, which is *above* the current script and not in `sys.path`.

**The "Spaghetti" Structure:**
```
apps/backend-rag/
├── backend/          <-- Redundant nesting
│   ├── app/
│   ├── core/
│   └── services/
├── *.py              <-- Scripts mixed in root
```

**The Fix:**
Move everything into a `src` directory or flatten `backend`.
Standardize imports to be absolute from the service root: `from backend.core import config`.
But for now, the **immediate fix** is to run everything as a module from the root of the service:
`python -m backend.app.main_cloud`
And ensure `PYTHONPATH` includes the current directory.
