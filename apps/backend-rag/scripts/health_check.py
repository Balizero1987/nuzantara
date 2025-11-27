#!/usr/bin/env python3
"""
ZANTARA RAG - Environment Variables Health Check
Validates that all critical environment variables are set before starting the application.

This script should be run before starting the FastAPI server to ensure
all required configuration is present.

Usage:
    python scripts/health_check.py
    # or from project root:
    python -m scripts.health_check
"""

import os
import sys

# Add parent directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def check_env_var(name: str, required: bool = True, description: str = "") -> tuple[bool, str]:
    """
    Check if an environment variable is set.

    Args:
        name: Environment variable name
        required: Whether the variable is required (default: True)
        description: Human-readable description of what this variable is for

    Returns:
        Tuple of (is_valid, message)
    """
    value = os.getenv(name)

    if required and not value:
        return False, f"❌ {name} is REQUIRED but not set. {description}"
    elif not value:
        return True, f"⚠️  {name} is optional and not set. {description}"
    else:
        # Mask sensitive values
        masked_value = value[:8] + "..." if len(value) > 8 else "***"
        return True, f"✅ {name} is set ({masked_value}). {description}"


def check_port() -> tuple[bool, str]:
    """Check PORT environment variable and validate it's a valid port number."""
    port_str = os.getenv("PORT", "8080")
    try:
        port = int(port_str)
        if 1 <= port <= 65535:
            return True, f"✅ PORT is set to {port} (valid range)"
        else:
            return False, f"❌ PORT={port} is out of valid range (1-65535)"
    except ValueError:
        return False, f"❌ PORT='{port_str}' is not a valid integer"


def main() -> int:
    """
    Run health check on all critical environment variables.

    Returns:
        0 if all checks pass, 1 if any critical check fails
    """
    print("=" * 70)
    print("ZANTARA RAG - Environment Variables Health Check")
    print("=" * 70)
    print()

    checks: list[tuple[bool, str]] = []

    # Critical environment variables
    print("📋 Checking Critical Environment Variables:")
    print("-" * 70)

    # API Keys (required for production)
    checks.append(
        check_env_var(
            "OPENAI_API_KEY",
            required=True,
            description="Required for OpenAI embeddings (text-embedding-3-small)",
        )
    )

    checks.append(
        check_env_var(
            "OPENROUTER_API_KEY_LLAMA",
            required=False,  # NO LONGER REQUIRED - using local Jaksel model
            description="Optional for ZANTARA AI (Llama 4 Scout via OpenRouter) - using Jaksel instead",
        )
    )

    # JAKSEL ORACLE CONNECTION (CRITICAL)
    checks.append(
        check_env_var(
            "ZANTARA_ORACLE_URL",
            required=True,
            description="Required for JAKSEL model connection (Oracle Cloud via Ngrok)",
        )
    )

    # Service URLs
    checks.append(
        check_env_var(
            "QDRANT_URL",
            required=False,  # Has default in config.py
            description="Qdrant vector database URL (defaults to https://nuzantara-qdrant.fly.dev)",
        )
    )

    # Port configuration
    checks.append(check_port())

    # Optional but recommended
    print()
    print("📋 Checking Optional Environment Variables:")
    print("-" * 70)

    checks.append(
        check_env_var(
            "EMBEDDING_PROVIDER",
            required=False,
            description="Embedding provider (defaults to 'openai')",
        )
    )

    checks.append(
        check_env_var("LOG_LEVEL", required=False, description="Logging level (defaults to 'INFO')")
    )

    checks.append(
        check_env_var(
            "ZANTARA_AI_MODEL",
            required=False,
            description="ZANTARA AI model name (defaults to 'meta-llama/llama-4-scout')",
        )
    )

    # Database URL (if using PostgreSQL features)
    checks.append(
        check_env_var(
            "DATABASE_URL",
            required=False,
            description="PostgreSQL connection string (optional, only if using CRM/PostgreSQL features)",
        )
    )

    # Internal API configuration
    checks.append(
        check_env_var(
            "TS_BACKEND_URL",
            required=False,
            description="TypeScript backend URL for tool execution (defaults to https://nuzantara-backend.fly.dev)",
        )
    )

    checks.append(
        check_env_var(
            "TS_INTERNAL_API_KEY",
            required=False,
            description="Internal API key for TypeScript backend communication (optional)",
        )
    )

    # Print all results
    print()
    for is_valid, message in checks:
        print(message)

    # Summary
    print()
    print("=" * 70)
    failed_checks = [msg for valid, msg in checks if not valid]

    if failed_checks:
        print(f"❌ HEALTH CHECK FAILED: {len(failed_checks)} critical issue(s) found")
        print()
        print("Critical issues:")
        for msg in failed_checks:
            print(f"  - {msg}")
        print()
        print("Please set the required environment variables before starting the application.")
        print("On Fly.io, use: fly secrets set VARIABLE_NAME=value")
        return 1
    else:
        print("✅ HEALTH CHECK PASSED: All critical environment variables are set")
        print()
        print("The application is ready to start.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
