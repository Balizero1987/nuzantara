# AUTOMATION_BLUEPRINT: The Machine

**Goal:** Zero-config automation to protect the codebase from entropy.

## 1. The Janitor (Auto-Formatting)

We will use **Ruff**, an extremely fast Python linter and formatter (replaces Black, Isort, Flake8).

**Configuration (`pyproject.toml`):**
(Already present in your file, but we enforce it now).

**The Magic Command:**
Create a script `scripts/auto_fix.sh`:
```bash
#!/bin/bash
echo "🧹 The Janitor is cleaning up..."
pip install ruff
ruff format .
ruff check . --fix
echo "✨ Sparkly clean!"
```

**Pre-commit Hook:**
Create `.pre-commit-config.yaml`:
```yaml
repos:
-   repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.6
    hooks:
    -   id: ruff
        args: [ --fix ]
    -   id: ruff-format
```
*Run `pre-commit install` once to activate.*

## 2. The Doctor (Self-Healing Checks)

Create `apps/backend-rag/scripts/doctor.py`:

```python
import os
import sys
import importlib
from typing import List

def check_env_vars() -> List[str]:
    required = ["OPENAI_API_KEY", "QDRANT_URL"]
    missing = [v for v in required if not os.getenv(v)]
    return missing

def check_imports():
    try:
        # Try to import the main app to check for path/syntax errors
        sys.path.append(os.getcwd())
        importlib.import_module("backend.app.main_cloud")
        return True
    except Exception as e:
        return str(e)

def heal():
    print("🚑 The Doctor is scanning...")

    # 1. Check Env
    missing = check_env_vars()
    if missing:
        print(f"❌ CRITICAL: Missing env vars: {missing}")
        # Self-healing: Try to load from .env.example or alert
        print("   -> Tip: Check your .env file or Fly.io secrets.")
        sys.exit(1)

    # 2. Check Code Integrity
    import_status = check_imports()
    if import_status is not True:
        print(f"❌ CRITICAL: Import Error: {import_status}")
        print("   -> Tip: Check PYTHONPATH or circular imports.")
        sys.exit(1)

    print("✅ System Healthy. Ready for takeoff.")

if __name__ == "__main__":
    heal()
```

## 3. The Conveyor Belt (CI/CD Pipeline)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io
on:
  push:
    branches:
      - main
env:
  FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

jobs:
  test_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install Dependencies
        run: |
          cd apps/backend-rag
          pip install -r requirements.txt
          pip install pytest ruff

      - name: Run The Janitor (Lint)
        run: |
          cd apps/backend-rag
          ruff check .

      - name: Run The Doctor (Health Check)
        run: |
          cd apps/backend-rag
          python scripts/doctor.py

      - name: Deploy to Fly.io
        if: success()
        uses: superfly/flyctl-actions/setup-flyctl@master
        with:
          version: 'latest'
      - run: |
          cd apps/backend-rag
          flyctl deploy --remote-only
```

**How it works:**
1.  **Push to main** triggers the pipeline.
2.  **Linting & Health Checks** run first. If they fail, deployment STOPS.
3.  **Fly Deploy** happens only if checks pass.

---

## NEXT STEP SUGGESTION

**Run this command NOW to see the current health of your project:**

```bash
cd apps/backend-rag && pip install ruff && ruff check .
```
This will immediately show you the "mess" that needs cleaning.
