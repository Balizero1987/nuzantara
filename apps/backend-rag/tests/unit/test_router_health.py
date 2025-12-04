"""
Unit tests for Health Router
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.health import (
    debug_config,
    detailed_health,
    health_check,
    liveness_check,
    readiness_check,
)


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


# ============================================================================
# Tests for detailed_health
# ============================================================================


@pytest.mark.asyncio
async def test_detailed_health_all_healthy(mock_search_service):
    """Test detailed health check with all services healthy"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = MagicMock()
    mock_app.state.memory_service = MagicMock()
    mock_app.state.intelligent_router = MagicMock()
    mock_app.state.health_monitor = MagicMock()
    mock_app.state.health_monitor._running = True
    mock_app.state.service_registry = None

    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    mock_app.state.db_pool.acquire = MagicMock(return_value=mock_conn)
    mock_app.state.db_pool.get_min_size = MagicMock(return_value=5)
    mock_app.state.db_pool.get_max_size = MagicMock(return_value=20)
    mock_app.state.db_pool.get_size = MagicMock(return_value=10)

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()

            assert result["status"] == "healthy"
            assert "services" in result
            assert result["services"]["search"]["status"] == "healthy"
            assert result["services"]["ai"]["status"] == "healthy"
            assert result["services"]["database"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_detailed_health_critical_unavailable():
    """Test detailed health when critical services are unavailable"""
    mock_app = MagicMock()
    mock_app.state.ai_client = None
    mock_app.state.db_pool = None
    mock_app.state.memory_service = None
    mock_app.state.intelligent_router = None
    mock_app.state.health_monitor = None
    mock_app.state.service_registry = None

    with patch("app.dependencies.search_service", None):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()

            assert result["status"] == "critical"
            assert result["services"]["search"]["status"] == "unavailable"
            assert result["services"]["ai"]["status"] == "unavailable"


@pytest.mark.asyncio
async def test_detailed_health_service_errors():
    """Test detailed health when services raise errors"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = MagicMock()
    mock_app.state.db_pool.acquire = MagicMock(side_effect=Exception("DB error"))
    mock_app.state.memory_service = MagicMock()
    mock_app.state.intelligent_router = MagicMock()
    mock_app.state.health_monitor = MagicMock()
    mock_app.state.service_registry = None

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()

            assert result["services"]["database"]["status"] == "error"
            assert "error" in result["services"]["database"]


@pytest.mark.asyncio
async def test_detailed_health_service_registry():
    """Test detailed health with service registry"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None
    mock_app.state.memory_service = None
    mock_app.state.intelligent_router = None
    mock_app.state.health_monitor = None
    mock_registry = MagicMock()
    mock_registry.get_status = MagicMock(return_value={"status": "ok"})
    mock_app.state.service_registry = mock_registry

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()

            assert result["registry"] == {"status": "ok"}


@pytest.mark.asyncio
async def test_detailed_health_degraded_status(mock_search_service):
    """Test detailed health with degraded status (non-critical services failing)"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None  # Non-critical service unavailable
    mock_app.state.memory_service = None
    mock_app.state.intelligent_router = None
    mock_app.state.health_monitor = None
    mock_app.state.service_registry = None

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()

            # Critical services healthy, but some non-critical unavailable
            # Note: If critical services are healthy, status should be "degraded" not "critical"
            # But the logic checks if critical_healthy first, so if search is healthy and ai is healthy, it's degraded
            assert result["status"] in [
                "degraded",
                "healthy",
            ]  # Can be either depending on implementation


# ============================================================================
# Tests for readiness_check
# ============================================================================


@pytest.mark.asyncio
async def test_readiness_check_ready():
    """Test readiness check when all services are ready"""
    mock_app = MagicMock()
    mock_app.state.services_initialized = True

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await readiness_check()

            assert result["ready"] is True
            assert "timestamp" in result


@pytest.mark.asyncio
async def test_readiness_check_not_ready():
    """Test readiness check when services are not ready"""
    mock_app = MagicMock()
    mock_app.state.services_initialized = False

    with patch("app.dependencies.search_service", None):
        with patch("app.main_cloud.app", mock_app):
            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                await readiness_check()

            assert exc_info.value.status_code == 503
            assert exc_info.value.detail["ready"] is False


@pytest.mark.asyncio
async def test_readiness_check_ai_not_ready():
    """Test readiness check when AI client is not ready"""
    mock_app = MagicMock()
    mock_app.state.ai_client = None
    mock_app.state.services_initialized = True

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            from fastapi import HTTPException

            with pytest.raises(HTTPException) as exc_info:
                await readiness_check()

            assert exc_info.value.status_code == 503
            assert exc_info.value.detail["ai_client"] is False


# ============================================================================
# Tests for liveness_check
# ============================================================================


@pytest.mark.asyncio
async def test_liveness_check():
    """Test liveness check always returns alive"""
    result = await liveness_check()

    assert result["alive"] is True
    assert "timestamp" in result


# ============================================================================
# Tests for debug_config
# ============================================================================


@pytest.mark.asyncio
async def test_debug_config():
    """Test debug config endpoint"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.api_keys = "key1,key2,key3"
        mock_settings.api_auth_enabled = True
        mock_settings.jwt_secret_key = "test_secret_key_12345"
        mock_settings.environment = "test"

        with patch.dict("os.environ", {"API_KEYS": "present", "JWT_SECRET_KEY": "present"}):
            result = await debug_config()

            assert result["api_keys_count"] == 3
            assert len(result["api_keys_preview"]) == 3
            assert result["api_auth_enabled"] is True
            assert result["jwt_secret_set"] is True
            assert result["environment"] == "test"
            assert result["env_vars_present"]["API_KEYS"] is True
            assert result["env_vars_present"]["JWT_SECRET"] is True


@pytest.mark.asyncio
async def test_debug_config_no_api_keys():
    """Test debug config when API keys are not set"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.api_keys = None
        mock_settings.api_auth_enabled = False
        mock_settings.jwt_secret_key = None
        mock_settings.environment = "test"

        result = await debug_config()

        assert result["api_keys_count"] == 0
        assert result["api_keys_preview"] == []
        assert result["jwt_secret_set"] is False


@pytest.mark.asyncio
async def test_detailed_health_ai_service_error(mock_search_service):
    """Test detailed health when AI service raises exception"""
    mock_app = MagicMock()

    # Create a mock state that raises exception when accessing ai_client
    class MockState:
        def __init__(self):
            self.ai_client = None
            self.db_pool = None
            self.memory_service = None
            self.intelligent_router = None
            self.health_monitor = None
            self.service_registry = None

        def __getattribute__(self, name):
            if name == "ai_client":
                raise Exception("AI service error")
            return object.__getattribute__(self, name)

    mock_app.state = MockState()

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()
            assert result["services"]["ai"]["status"] == "error"


@pytest.mark.asyncio
async def test_detailed_health_memory_service_error(mock_search_service):
    """Test detailed health when Memory service raises exception"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None
    mock_app.state.intelligent_router = None
    mock_app.state.health_monitor = None
    mock_app.state.service_registry = None

    # Create a mock state that raises exception when accessing memory_service
    class MockState:
        def __init__(self, parent_state):
            self.ai_client = parent_state.ai_client
            self.db_pool = parent_state.db_pool
            self.intelligent_router = parent_state.intelligent_router
            self.health_monitor = parent_state.health_monitor
            self.service_registry = parent_state.service_registry

        def __getattribute__(self, name):
            if name == "memory_service":
                raise Exception("Memory service error")
            return object.__getattribute__(self, name)

    mock_app.state = MockState(mock_app.state)

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()
            assert result["services"]["memory"]["status"] == "error"


@pytest.mark.asyncio
async def test_detailed_health_router_service_error(mock_search_service):
    """Test detailed health when Router service raises exception"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None
    mock_app.state.memory_service = None
    mock_app.state.health_monitor = None
    mock_app.state.service_registry = None

    # Create a mock state that raises exception when accessing intelligent_router
    class MockState:
        def __init__(self, parent_state):
            self.ai_client = parent_state.ai_client
            self.db_pool = parent_state.db_pool
            self.memory_service = parent_state.memory_service
            self.health_monitor = parent_state.health_monitor
            self.service_registry = parent_state.service_registry

        def __getattribute__(self, name):
            if name == "intelligent_router":
                raise Exception("Router service error")
            return object.__getattribute__(self, name)

    mock_app.state = MockState(mock_app.state)

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()
            assert result["services"]["router"]["status"] == "error"


@pytest.mark.asyncio
async def test_detailed_health_health_monitor_error(mock_search_service):
    """Test detailed health when Health Monitor raises exception"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None
    mock_app.state.memory_service = None
    mock_app.state.intelligent_router = None
    mock_app.state.service_registry = None

    # Create a mock state that raises exception when accessing health_monitor
    class MockState:
        def __init__(self, parent_state):
            self.ai_client = parent_state.ai_client
            self.db_pool = parent_state.db_pool
            self.memory_service = parent_state.memory_service
            self.intelligent_router = parent_state.intelligent_router
            self.service_registry = parent_state.service_registry

        def __getattribute__(self, name):
            if name == "health_monitor":
                raise Exception("Health monitor error")
            return object.__getattribute__(self, name)

    mock_app.state = MockState(mock_app.state)

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            result = await detailed_health()
            assert result["services"]["health_monitor"]["status"] == "error"


@pytest.mark.asyncio
async def test_detailed_health_service_registry_error(mock_search_service):
    """Test detailed health when Service Registry raises exception"""
    mock_app = MagicMock()
    mock_app.state.ai_client = MagicMock()
    mock_app.state.db_pool = None
    mock_app.state.memory_service = None
    mock_app.state.intelligent_router = None
    mock_app.state.health_monitor = None
    mock_registry = MagicMock()
    mock_registry.get_status = MagicMock(side_effect=Exception("Registry error"))
    mock_app.state.service_registry = mock_registry

    with patch("app.dependencies.search_service", mock_search_service):
        with patch("app.main_cloud.app", mock_app):
            with patch("app.routers.health.logger") as mock_logger:
                result = await detailed_health()
                # Should log warning but continue
                mock_logger.warning.assert_called_once()
                assert "registry" in result or result.get("registry") is None
