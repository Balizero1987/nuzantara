"""
Unit tests for Health Router
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.health import health_check


@pytest.fixture
def mock_search_service():
    """Mock search service"""
    service = MagicMock()
    service.embedder = MagicMock()
    service.embedder.model = "text-embedding-3-small"
    service.embedder.dimensions = 1536
    service.embedder.provider = "openai"
    return service


# ============================================================================
# Tests for health_check
# ============================================================================


@pytest.mark.asyncio
async def test_health_check_service_ready(mock_search_service):
    """Test health check when service is ready"""
    # search_service is imported from dependencies inside the function
    with patch("app.dependencies.search_service", mock_search_service):
        response = await health_check()

        assert response.status == "healthy"
        assert response.version == "v100-qdrant"
        assert response.database["status"] == "connected"
        assert response.embeddings["status"] == "operational"


@pytest.mark.asyncio
async def test_health_check_service_initializing():
    """Test health check when service is initializing"""
    with patch("app.dependencies.search_service", None):
        response = await health_check()

        assert response.status == "initializing"
        assert response.version == "v100-qdrant"
        assert response.database["status"] == "initializing"
        assert response.embeddings["status"] == "initializing"


@pytest.mark.asyncio
async def test_health_check_partial_initialization(mock_search_service):
    """Test health check when embedder has missing attributes"""
    # Create a mock embedder with minimal attributes
    mock_embedder = MagicMock()
    mock_embedder.model = "text-embedding-3-small"
    mock_embedder.dimensions = 1536
    # provider will use default "unknown" from getattr
    del mock_embedder.provider  # Remove provider attribute
    mock_search_service.embedder = mock_embedder

    with patch("app.dependencies.search_service", mock_search_service):
        response = await health_check()

        # Should still return healthy since getattr has defaults
        assert response.status == "healthy"
        assert response.embeddings["provider"] == "unknown"


@pytest.mark.asyncio
async def test_health_check_attribute_error():
    """Test health check when embedder raises AttributeError"""

    # Create a class where accessing embedder raises AttributeError
    class MockServiceWithBrokenEmbedder:
        @property
        def embedder(self):
            raise AttributeError("Embedder not initialized")

    mock_service = MockServiceWithBrokenEmbedder()

    with patch("app.dependencies.search_service", mock_service):
        response = await health_check()

        assert response.status == "initializing"
        assert response.database["status"] == "partial"
        assert response.embeddings["status"] == "loading"


@pytest.mark.asyncio
async def test_health_check_general_exception():
    """Test health check when general exception occurs"""

    # Create a class where accessing embedder raises non-AttributeError exception
    class MockServiceWithError:
        @property
        def embedder(self):
            raise RuntimeError("Critical error")

    mock_service = MockServiceWithError()

    with patch("app.dependencies.search_service", mock_service):
        response = await health_check()

        assert response.status == "degraded"
        assert response.database["status"] == "error"
        assert response.embeddings["status"] == "error"
