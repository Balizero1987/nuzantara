"""
Unit tests for Health Monitor Service
100% coverage target with comprehensive mocking
"""

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, PropertyMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.alert_service import AlertLevel, AlertService
from services.health_monitor import HealthMonitor, get_health_monitor, init_health_monitor

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_alert_service():
    """Create mock AlertService"""
    service = MagicMock(spec=AlertService)
    service.send_alert = AsyncMock()
    return service


@pytest.fixture
def health_monitor(mock_alert_service):
    """Create HealthMonitor instance"""
    return HealthMonitor(mock_alert_service, check_interval=1)


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_health_monitor_init(health_monitor, mock_alert_service):
    """Test HealthMonitor initialization"""
    assert health_monitor.alert_service is mock_alert_service
    assert health_monitor.check_interval == 1
    assert health_monitor.last_status == {}
    assert health_monitor.last_alert_time == {}
    assert health_monitor.alert_cooldown == timedelta(minutes=5)
    assert health_monitor.running is False
    assert health_monitor.task is None


# ============================================================================
# Tests: start/stop
# ============================================================================


@pytest.mark.asyncio
async def test_start_monitoring(health_monitor):
    """Test starting monitoring loop"""
    await health_monitor.start()

    assert health_monitor.running is True
    assert health_monitor.task is not None

    await health_monitor.stop()


@pytest.mark.asyncio
async def test_start_already_running(health_monitor):
    """Test starting when already running"""
    await health_monitor.start()

    # Try to start again
    await health_monitor.start()

    assert health_monitor.running is True

    await health_monitor.stop()


@pytest.mark.asyncio
async def test_stop_monitoring(health_monitor):
    """Test stopping monitoring loop"""
    await health_monitor.start()
    assert health_monitor.running is True

    await health_monitor.stop()

    assert health_monitor.running is False


@pytest.mark.asyncio
async def test_stop_not_running(health_monitor):
    """Test stopping when not running"""
    await health_monitor.stop()  # Should not raise error
    assert health_monitor.running is False


# ============================================================================
# Tests: _check_health
# ============================================================================


@pytest.mark.asyncio
async def test_check_health_all_healthy(health_monitor):
    """Test health check when all services are healthy"""
    mock_search_service = MagicMock()
    mock_search_service.client = MagicMock()
    mock_search_service.client.list_collections = MagicMock(return_value=[])

    with patch("app.dependencies.get_search_service", return_value=mock_search_service):
        await health_monitor._check_health()

        # All services should be healthy
        assert health_monitor.last_status.get("qdrant") is True


@pytest.mark.asyncio
async def test_check_health_qdrant_down(health_monitor):
    """Test health check when Qdrant is down"""
    mock_search_service = MagicMock()
    mock_search_service.client = MagicMock()
    mock_search_service.client.list_collections = MagicMock(side_effect=Exception("Connection failed"))

    with patch("app.dependencies.get_search_service", return_value=mock_search_service):
        await health_monitor._check_health()

        assert health_monitor.last_status.get("qdrant") is False


@pytest.mark.asyncio
async def test_check_health_no_search_service(health_monitor):
    """Test health check when search service is None"""
    with patch("app.dependencies.get_search_service", return_value=None):
        await health_monitor._check_health()

        assert health_monitor.last_status.get("qdrant") is False


@pytest.mark.asyncio
async def test_check_health_service_recovery(health_monitor, mock_alert_service):
    """Test alert when service recovers"""
    # First check: service down
    with patch("app.dependencies.get_search_service", return_value=None):
        await health_monitor._check_health()
        assert health_monitor.last_status.get("qdrant") is False

    # Second check: service up
    mock_search_service = MagicMock()
    mock_search_service.client = MagicMock()
    mock_search_service.client.list_collections = MagicMock(return_value=[])

    with patch("app.dependencies.get_search_service", return_value=mock_search_service):
        await health_monitor._check_health()

        # Should send recovery alert
        assert mock_alert_service.send_alert.called


# ============================================================================
# Tests: _send_downtime_alert
# ============================================================================


@pytest.mark.asyncio
async def test_send_downtime_alert(health_monitor, mock_alert_service):
    """Test sending downtime alert"""
    await health_monitor._send_downtime_alert("test_service")

    mock_alert_service.send_alert.assert_called_once()
    call_kwargs = mock_alert_service.send_alert.call_args[1]
    assert call_kwargs["level"] == AlertLevel.CRITICAL
    assert "test_service" in call_kwargs["title"]
    assert "down_test_service" in health_monitor.last_alert_time


@pytest.mark.asyncio
async def test_send_downtime_alert_cooldown(health_monitor, mock_alert_service):
    """Test downtime alert cooldown"""
    # First alert
    health_monitor.last_alert_time["down_test_service"] = datetime.now()
    await health_monitor._send_downtime_alert("test_service")

    # Should not send again immediately
    mock_alert_service.send_alert.reset_mock()
    await health_monitor._send_downtime_alert("test_service")

    # Should not be called due to cooldown
    assert not mock_alert_service.send_alert.called


@pytest.mark.asyncio
async def test_send_downtime_alert_cooldown_expired(health_monitor, mock_alert_service):
    """Test downtime alert after cooldown expires"""
    # Set old alert time
    health_monitor.last_alert_time["down_test_service"] = datetime.now() - timedelta(minutes=10)

    await health_monitor._send_downtime_alert("test_service")

    # Should send alert
    assert mock_alert_service.send_alert.called


# ============================================================================
# Tests: _send_recovery_alert
# ============================================================================


@pytest.mark.asyncio
async def test_send_recovery_alert(health_monitor, mock_alert_service):
    """Test sending recovery alert"""
    await health_monitor._send_recovery_alert("test_service")

    mock_alert_service.send_alert.assert_called_once()
    call_kwargs = mock_alert_service.send_alert.call_args[1]
    assert call_kwargs["level"] == AlertLevel.INFO
    assert "test_service" in call_kwargs["title"]
    assert "recovered" in call_kwargs["message"].lower()


# ============================================================================
# Tests: _check_qdrant
# ============================================================================


@pytest.mark.asyncio
async def test_check_qdrant_healthy(health_monitor):
    """Test Qdrant health check - healthy"""
    mock_search_service = MagicMock()
    mock_search_service.client = MagicMock()
    mock_search_service.client.list_collections = MagicMock(return_value=["collection1"])

    result = await health_monitor._check_qdrant(mock_search_service)

    assert result is True


@pytest.mark.asyncio
async def test_check_qdrant_no_client(health_monitor):
    """Test Qdrant health check - no client"""
    mock_search_service = MagicMock()
    mock_search_service.client = None

    result = await health_monitor._check_qdrant(mock_search_service)

    assert result is True  # Service exists


@pytest.mark.asyncio
async def test_check_qdrant_exception(health_monitor):
    """Test Qdrant health check - exception"""
    mock_search_service = MagicMock()
    mock_search_service.client = MagicMock()
    mock_search_service.client.list_collections = MagicMock(side_effect=Exception("Error"))

    result = await health_monitor._check_qdrant(mock_search_service)

    assert result is False


@pytest.mark.asyncio
async def test_check_qdrant_none(health_monitor):
    """Test Qdrant health check - None service"""
    result = await health_monitor._check_qdrant(None)

    assert result is False


# ============================================================================
# Tests: _check_postgresql
# ============================================================================


@pytest.mark.asyncio
async def test_check_postgresql_healthy(health_monitor):
    """Test PostgreSQL health check - healthy"""
    mock_memory_service = MagicMock()
    mock_memory_service.use_postgres = True
    mock_memory_service.pool = MagicMock()

    result = await health_monitor._check_postgresql(mock_memory_service)

    assert result is True


@pytest.mark.asyncio
async def test_check_postgresql_not_using_postgres(health_monitor):
    """Test PostgreSQL health check - not using postgres"""
    mock_memory_service = MagicMock()
    mock_memory_service.use_postgres = False

    result = await health_monitor._check_postgresql(mock_memory_service)

    assert result is False


@pytest.mark.asyncio
async def test_check_postgresql_no_pool(health_monitor):
    """Test PostgreSQL health check - no pool"""
    mock_memory_service = MagicMock()
    mock_memory_service.use_postgres = True
    mock_memory_service.pool = None

    result = await health_monitor._check_postgresql(mock_memory_service)

    assert result is False


@pytest.mark.asyncio
async def test_check_postgresql_none(health_monitor):
    """Test PostgreSQL health check - None service"""
    result = await health_monitor._check_postgresql(None)

    assert result is False


@pytest.mark.asyncio
async def test_check_postgresql_exception(health_monitor):
    """Test PostgreSQL health check - exception"""
    mock_memory_service = MagicMock()
    # Simulate exception when accessing use_postgres
    type(mock_memory_service).use_postgres = PropertyMock(side_effect=Exception("Error"))

    result = await health_monitor._check_postgresql(mock_memory_service)

    assert result is False


# ============================================================================
# Tests: _check_ai_router
# ============================================================================


@pytest.mark.asyncio
async def test_check_ai_router_healthy_llama(health_monitor):
    """Test AI Router health check - has llama"""
    mock_router = MagicMock()
    mock_router.llama_client = MagicMock()
    mock_router.haiku_client = None

    result = await health_monitor._check_ai_router(mock_router)

    assert result is True


@pytest.mark.asyncio
async def test_check_ai_router_healthy_haiku(health_monitor):
    """Test AI Router health check - has haiku"""
    mock_router = MagicMock()
    mock_router.llama_client = None
    mock_router.haiku_client = MagicMock()

    result = await health_monitor._check_ai_router(mock_router)

    assert result is True


@pytest.mark.asyncio
async def test_check_ai_router_no_clients(health_monitor):
    """Test AI Router health check - no clients"""
    mock_router = MagicMock()
    mock_router.llama_client = None
    mock_router.haiku_client = None

    result = await health_monitor._check_ai_router(mock_router)

    assert result is False


@pytest.mark.asyncio
async def test_check_ai_router_none(health_monitor):
    """Test AI Router health check - None service"""
    result = await health_monitor._check_ai_router(None)

    assert result is False


@pytest.mark.asyncio
async def test_check_ai_router_exception(health_monitor):
    """Test AI Router health check - exception"""
    mock_router = MagicMock()
    # Simulate exception when accessing llama_client
    type(mock_router).llama_client = PropertyMock(side_effect=Exception("Error"))
    type(mock_router).haiku_client = PropertyMock(return_value=None)

    result = await health_monitor._check_ai_router(mock_router)

    assert result is False


# ============================================================================
# Tests: get_status
# ============================================================================


def test_get_status(health_monitor):
    """Test getting monitoring status"""
    health_monitor.running = True
    health_monitor.last_status = {"qdrant": True, "postgresql": False}

    status = health_monitor.get_status()

    assert status["running"] is True
    assert status["check_interval"] == 1
    assert status["last_status"] == {"qdrant": True, "postgresql": False}
    assert "next_check_in" in status


# ============================================================================
# Tests: Singleton functions
# ============================================================================


def test_get_health_monitor_none():
    """Test get_health_monitor when not initialized"""
    import services.health_monitor

    services.health_monitor._health_monitor = None
    result = get_health_monitor()

    assert result is None


def test_init_health_monitor(mock_alert_service):
    """Test initializing health monitor"""
    monitor = init_health_monitor(mock_alert_service, check_interval=60)

    assert isinstance(monitor, HealthMonitor)
    assert monitor.check_interval == 60
    assert get_health_monitor() is monitor

