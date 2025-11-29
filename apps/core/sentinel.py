#!/usr/bin/env python3
"""
SENTINEL: The Nuzantara Quality Control Guardian
Orchestrates linting, testing, and health checks.
"""

import os
import sys
import subprocess
import asyncio
import httpx
from datetime import datetime
from pathlib import Path

# --- Configuration ---
ROOT_DIR = Path(__file__).parent.parent.parent.resolve()
BACKEND_DIR = ROOT_DIR / "apps" / "backend-rag"
BACKEND_SRC_DIR = BACKEND_DIR / "backend"
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")


# --- Colors ---
class Colors:
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {text} ==={Colors.ENDC}")


def print_success(text):
    print(f"{Colors.OKGREEN}✔ {text}{Colors.ENDC}")


def print_fail(text):
    print(f"{Colors.FAIL}✘ {text}{Colors.ENDC}")


def print_info(text):
    print(f"{Colors.OKCYAN}ℹ {text}{Colors.ENDC}")


# --- Phase 1: Auto-Healing (The Clean Phase) ---
def run_auto_healing():
    print_header("PHASE 1: AUTO-HEALING")

    # Check if ruff is installed
    try:
        subprocess.run(["ruff", "--version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print_info("Ruff not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "ruff"], check=True)
        print_success("Ruff installed.")

    # Run Ruff Check
    print_info("Running Ruff Check & Fix...")
    try:
        subprocess.run(
            [sys.executable, "-m", "ruff", "check", ".", "--fix"],
            cwd=ROOT_DIR,
            check=True,
        )
        print_success("Code linted and fixed.")
    except subprocess.CalledProcessError:
        print_fail("Ruff check failed (some errors might require manual fix).")
        # Don't exit, continue to formatting

    # Run Ruff Format
    print_info("Running Ruff Format...")
    try:
        subprocess.run(
            [sys.executable, "-m", "ruff", "format", "."], cwd=ROOT_DIR, check=True
        )
        print_success("Code formatted.")
    except subprocess.CalledProcessError:
        print_fail("Ruff format failed.")


# --- Phase 2: Verification (The Test Phase) ---
def run_verification():
    print_header("PHASE 2: VERIFICATION")

    print_info("Running Tests...")
    try:
        # Prepare environment with correct PYTHONPATH
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{ROOT_DIR}:{BACKEND_SRC_DIR}:{env.get('PYTHONPATH', '')}"

        # Run pytest on backend tests directory
        # Using sys.executable to ensure we use the same python environment
        # Run tests with coverage
        # Point explicitly to the tests directory and the config file
        pytest_cmd = [
            sys.executable,
            "-m",
            "pytest",
            "-c",
            "apps/backend-rag/pytest.ini",
            "-vv",
            "apps/backend-rag/tests",
        ]
        result = subprocess.run(
            pytest_cmd,
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
            env=env,
        )

        if result.returncode == 0:
            print_success("All tests passed.")
            print(result.stdout)
        elif result.returncode == 5:  # No tests collected
            print_info("No tests found (yet).")
        else:
            print_fail("MISSION FAILED: Tests failed.")
            print(result.stdout)
            print(result.stderr)
            # We might want to exit here if strict mode is on, but for now we continue

    except Exception as e:
        print_fail(f"Test execution failed: {e}")


# --- Phase 3: Infrastructure Ping (The Health Phase) ---
async def check_qdrant():
    print_header("PHASE 3: INFRASTRUCTURE PING")

    print_info(f"Checking Qdrant at {QDRANT_URL}...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{QDRANT_URL}/collections")
            if response.status_code == 200:
                print_success("Database Connection: OK")
                return True
            else:
                print_fail(f"Database Connection: FAIL (Status {response.status_code})")
                return False
    except Exception as e:
        print_fail(f"Database Connection: FAIL ({e})")
        print_info("HINT: Is Docker running? Try 'docker compose up -d'")
        return False


# --- Phase 4: Documentation Generation (The Scribe) ---
def run_scribe():
    """Phase 4: Generate Documentation"""
    print_header("PHASE 4: DOCUMENTATION GENERATION")

    print_info("Running The Scribe...")
    try:
        scribe_path = ROOT_DIR / "apps" / "core" / "scribe.py"
        result = subprocess.run(
            [sys.executable, str(scribe_path)],
            cwd=ROOT_DIR,
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            print_success("Documentation generated.")
            if result.stdout:
                print(result.stdout)
        else:
            print_fail("Documentation generation failed.")
            if result.stderr:
                print(result.stderr)
    except Exception as e:
        print_fail(f"Scribe execution failed: {e}")


# --- Main Sentinel Loop ---
def main():
    print(f"{Colors.BOLD}{Colors.OKBLUE}")
    print("╔════════════════════════════════════════╗")
    print("║      SENTINEL: SYSTEM GUARDIAN         ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Root: {ROOT_DIR}")

    # Check for --scribe flag
    run_scribe_flag = "--scribe" in sys.argv

    # 0. Strict Environment Check
    if sys.version_info < (3, 10):
        print(
            f"{Colors.FAIL}{Colors.BOLD}❌ CRITICAL: Sentinel requires Python 3.10+. You are running {sys.version.split()[0]}{Colors.ENDC}"
        )
        print_info(
            "HINT: Try running: 'pyenv global 3.11.9' or check your virtual environment."
        )
        sys.exit(1)

    # 1. Clean
    run_auto_healing()

    # 2. Test
    run_verification()

    # 3. Health
    asyncio.run(check_qdrant())

    # 4. Documentation (if flag is set)
    if run_scribe_flag:
        run_scribe()

    print_header("SENTINEL SCAN COMPLETE")


if __name__ == "__main__":
    main()
