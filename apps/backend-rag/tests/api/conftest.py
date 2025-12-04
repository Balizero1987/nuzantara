"""
API/E2E Test Configuration

Sets up FastAPI TestClient for testing full request/response cycles.
These tests verify endpoints, middleware, and error handling.
"""

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Set required environment variables BEFORE any imports
# Set required environment variables BEFORE any imports
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_for_testing_only_min_32_chars"
os.environ["API_KEYS"] = "test_api_key_1,test_api_key_2"
os.environ["WHATSAPP_VERIFY_TOKEN"] = "test_whatsapp_verify_token"
os.environ["INSTAGRAM_VERIFY_TOKEN"] = "test_instagram_verify_token"
os.environ["OPENAI_API_KEY"] = "test_openai_api_key_for_testing"
os.environ["GOOGLE_API_KEY"] = "test_google_api_key_for_testing"
os.environ["QDRANT_URL"] = "http://localhost:6333"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="module")
def test_client():
    """
    Create FastAPI TestClient for API tests.

    This fixture creates a test client with mocked services to avoid
    requiring real database connections for API tests.

    Yields:
        TestClient: FastAPI test client
    """
    from unittest.mock import MagicMock, patch

    # Mock dependencies before importing app
    with patch("app.dependencies.search_service", MagicMock()):
        # Patch the settings to ensure the secret key matches what we use for token generation
        with patch("app.core.config.settings.jwt_secret_key", "test_jwt_secret_key_for_testing_only_min_32_chars"):
            from app.main_cloud import app

        # Override startup/shutdown events to skip heavy initialization
        @app.on_event("startup")
        async def startup():
            pass

        @app.on_event("shutdown")
        async def shutdown():
            pass

        # Manually set ai_client on app.state since startup is skipped
        app.state.ai_client = MagicMock()

        with TestClient(app) as client:
            yield client


@pytest.fixture(scope="function")
def authenticated_client(test_client):
    """
    Create authenticated test client with valid JWT token.

    Yields:
        TestClient: Test client with Authorization header set
    """
    from datetime import datetime, timedelta, timezone

    from jose import jwt

    # Generate test JWT token
    payload = {
        "sub": "test@example.com",
        "email": "test@example.com",
        "role": "member",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }

    secret = os.getenv("JWT_SECRET_KEY", "test_jwt_secret_key_for_testing_only_min_32_chars")
    token = jwt.encode(payload, secret, algorithm="HS256")

    # Set default headers
    test_client.headers.update({"Authorization": f"Bearer {token}"})

    yield test_client

    # Clean up headers
    test_client.headers.pop("Authorization", None)


@pytest.fixture(scope="function")
def api_key_client(test_client):
    """
    Create test client with API key authentication.

    Yields:
        TestClient: Test client with X-API-Key header set
    """
    # Use first test API key from environment
    api_keys = os.getenv("API_KEYS", "test_api_key_1,test_api_key_2")
    api_key = api_keys.split(",")[0]

    test_client.headers.update({"X-API-Key": api_key})

    yield test_client

    # Clean up headers
    test_client.headers.pop("X-API-Key", None)


@pytest.fixture(scope="function")
def mock_search_service():
    """
    Create mock SearchService for API tests.

    Yields:
        MagicMock: Mocked SearchService
    """
    from unittest.mock import MagicMock

    mock_service = MagicMock()
    mock_service.search = MagicMock(
        return_value={"results": [], "collection_used": "test_collection", "query": "test query"}
    )

    return mock_service


@pytest.fixture(scope="function")
def mock_ai_client():
    """
    Create mock AI client for API tests.

    Yields:
        MagicMock: Mocked AI client
    """
    from unittest.mock import AsyncMock, MagicMock

    mock_client = MagicMock()
    mock_client.generate_response = AsyncMock(return_value="Test AI response")
    mock_client.stream = AsyncMock()

    return mock_client
