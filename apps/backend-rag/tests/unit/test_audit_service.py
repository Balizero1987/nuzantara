"""
Unit tests for AuditService
Tests for security logging and system audit trails

Coverage:
- Connection lifecycle (connect/close)
- Auth event logging (login, logout, failed attempts)
- System event logging
- Error handling and disabled states
- Global service singleton
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings configuration"""
    settings = MagicMock()
    settings.database_url = "postgresql://test:test@localhost:5432/test"
    return settings


@pytest.fixture
def mock_settings_no_db():
    """Mock settings with no database URL"""
    settings = MagicMock()
    settings.database_url = None
    return settings


@pytest.fixture
def mock_pool():
    """Mock asyncpg connection pool"""
    pool = AsyncMock()
    mock_conn = AsyncMock()
    mock_conn.execute = AsyncMock()
    pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=mock_conn)))
    pool.close = AsyncMock()
    return pool, mock_conn


# ============================================================================
# Initialization Tests
# ============================================================================


class TestAuditServiceInit:
    """Tests for AuditService initialization"""

    def test_init_with_database_url(self, mock_settings):
        """Test initialization with valid database URL"""
        with patch("backend.services.audit_service.settings", mock_settings):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)

            assert service.database_url == mock_settings.database_url
            assert service.enabled is True
            assert service.pool is None

    def test_init_without_database_url(self, mock_settings_no_db):
        """Test initialization without database URL"""
        with patch("backend.services.audit_service.settings", mock_settings_no_db):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=None)

            assert service.enabled is False

    def test_init_uses_settings_default(self, mock_settings):
        """Test initialization uses settings.database_url by default"""
        with patch("backend.services.audit_service.settings", mock_settings):
            from backend.services.audit_service import AuditService

            service = AuditService()

            assert service.database_url == mock_settings.database_url


# ============================================================================
# Connection Tests
# ============================================================================


class TestAuditServiceConnect:
    """Tests for connection lifecycle"""

    @pytest.mark.asyncio
    async def test_connect_success(self, mock_settings, mock_pool):
        """Test successful connection to database"""
        pool, _ = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.asyncpg.create_pool", AsyncMock(return_value=pool)
        ), patch("backend.services.audit_service.logger"):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            await service.connect()

            assert service.pool is not None
            assert service.enabled is True

    @pytest.mark.asyncio
    async def test_connect_disabled_no_database(self, mock_settings_no_db):
        """Test connect skips when disabled (no database URL)"""
        with patch("backend.services.audit_service.settings", mock_settings_no_db), patch(
            "backend.services.audit_service.logger"
        ) as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=None)
            await service.connect()

            assert service.pool is None
            mock_logger.warning.assert_called()

    @pytest.mark.asyncio
    async def test_connect_failure_disables_service(self, mock_settings):
        """Test that connection failure disables the service"""
        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.asyncpg.create_pool",
            AsyncMock(side_effect=Exception("Connection failed")),
        ), patch("backend.services.audit_service.logger") as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            await service.connect()

            assert service.enabled is False
            mock_logger.error.assert_called()

    @pytest.mark.asyncio
    async def test_close_pool(self, mock_settings, mock_pool):
        """Test closing the connection pool"""
        pool, _ = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool

            await service.close()

            pool.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_no_pool(self, mock_settings):
        """Test close when no pool exists"""
        with patch("backend.services.audit_service.settings", mock_settings):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = None

            # Should not raise an error
            await service.close()


# ============================================================================
# Auth Event Logging Tests
# ============================================================================


class TestLogAuthEvent:
    """Tests for log_auth_event method"""

    @pytest.mark.asyncio
    async def test_log_auth_event_success(self, mock_settings, mock_pool):
        """Test successful auth event logging"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
                ip_address="192.168.1.1",
                user_agent="Mozilla/5.0",
                user_id="user-123",
            )

            mock_conn.execute.assert_called_once()
            call_args = mock_conn.execute.call_args
            assert "INSERT INTO auth_audit_log" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_log_auth_event_with_failure_reason(self, mock_settings, mock_pool):
        """Test auth event logging with failure reason"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="failed_login",
                success=False,
                failure_reason="Invalid password",
            )

            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_auth_event_with_metadata(self, mock_settings, mock_pool):
        """Test auth event logging with metadata"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
                metadata={"source": "web", "session_id": "abc123"},
            )

            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_auth_event_disabled(self, mock_settings_no_db):
        """Test auth event logging when service is disabled"""
        with patch("backend.services.audit_service.settings", mock_settings_no_db), patch(
            "backend.services.audit_service.logger"
        ) as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=None)
            service.enabled = False

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
            )

            mock_logger.warning.assert_called()

    @pytest.mark.asyncio
    async def test_log_auth_event_no_pool(self, mock_settings):
        """Test auth event logging when pool is None"""
        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ) as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = None
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
            )

            mock_logger.warning.assert_called()

    @pytest.mark.asyncio
    async def test_log_auth_event_db_error(self, mock_settings, mock_pool):
        """Test auth event logging handles database errors gracefully"""
        pool, mock_conn = mock_pool
        mock_conn.execute.side_effect = Exception("Database error")

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ) as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            # Should not raise an error
            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
            )

            mock_logger.error.assert_called()


# ============================================================================
# System Event Logging Tests
# ============================================================================


class TestLogSystemEvent:
    """Tests for log_system_event method"""

    @pytest.mark.asyncio
    async def test_log_system_event_success(self, mock_settings, mock_pool):
        """Test successful system event logging"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_system_event(
                event_type="data_access",
                action="read",
                user_id="user-123",
                resource_id="document-456",
                ip_address="192.168.1.1",
            )

            mock_conn.execute.assert_called_once()
            call_args = mock_conn.execute.call_args
            assert "INSERT INTO audit_events" in call_args[0][0]

    @pytest.mark.asyncio
    async def test_log_system_event_with_details(self, mock_settings, mock_pool):
        """Test system event logging with details"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_system_event(
                event_type="security_alert",
                action="suspicious_activity",
                user_id="user-123",
                details={"attempts": 5, "blocked": True},
            )

            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_system_event_disabled(self, mock_settings_no_db):
        """Test system event logging when service is disabled"""
        with patch("backend.services.audit_service.settings", mock_settings_no_db):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=None)
            service.enabled = False

            # Should return silently without error
            await service.log_system_event(
                event_type="data_access",
                action="read",
            )

    @pytest.mark.asyncio
    async def test_log_system_event_db_error(self, mock_settings, mock_pool):
        """Test system event logging handles database errors gracefully"""
        pool, mock_conn = mock_pool
        mock_conn.execute.side_effect = Exception("Database error")

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ) as mock_logger:
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            # Should not raise an error
            await service.log_system_event(
                event_type="data_access",
                action="read",
            )

            mock_logger.error.assert_called()


# ============================================================================
# Global Service Singleton Tests
# ============================================================================


class TestGetAuditService:
    """Tests for get_audit_service function"""

    def test_get_audit_service_creates_instance(self, mock_settings):
        """Test that get_audit_service creates a singleton instance"""
        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service._audit_service", None
        ):
            from backend.services.audit_service import get_audit_service

            service = get_audit_service()

            assert service is not None

    def test_get_audit_service_returns_same_instance(self, mock_settings):
        """Test that get_audit_service returns the same instance"""
        with patch("backend.services.audit_service.settings", mock_settings):
            # Reset the global instance
            import backend.services.audit_service as audit_module
            from backend.services.audit_service import get_audit_service

            audit_module._audit_service = None

            service1 = get_audit_service()
            service2 = get_audit_service()

            assert service1 is service2


# ============================================================================
# Edge Cases Tests
# ============================================================================


class TestAuditServiceEdgeCases:
    """Tests for edge cases and boundary conditions"""

    @pytest.mark.asyncio
    async def test_log_auth_event_empty_metadata(self, mock_settings, mock_pool):
        """Test auth event logging with None metadata defaults to empty dict"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
                metadata=None,  # Explicitly None
            )

            mock_conn.execute.assert_called_once()
            # Verify the last argument (metadata) is {} not None
            call_args = mock_conn.execute.call_args[0]
            assert call_args[-1] == {}

    @pytest.mark.asyncio
    async def test_log_system_event_empty_details(self, mock_settings, mock_pool):
        """Test system event logging with None details defaults to empty dict"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_system_event(
                event_type="test",
                action="test",
                details=None,  # Explicitly None
            )

            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_auth_event_all_optional_params(self, mock_settings, mock_pool):
        """Test auth event logging with all optional parameters"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_auth_event(
                email="test@example.com",
                action="login",
                success=True,
                ip_address="10.0.0.1",
                user_agent="CustomAgent/1.0",
                user_id="custom-user-id",
                failure_reason=None,
                metadata={"custom": "data"},
            )

            mock_conn.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_log_system_event_all_optional_params(self, mock_settings, mock_pool):
        """Test system event logging with all optional parameters"""
        pool, mock_conn = mock_pool

        with patch("backend.services.audit_service.settings", mock_settings), patch(
            "backend.services.audit_service.logger"
        ):
            from backend.services.audit_service import AuditService

            service = AuditService(database_url=mock_settings.database_url)
            service.pool = pool
            service.enabled = True

            await service.log_system_event(
                event_type="full_test",
                action="complete",
                user_id="user-full",
                resource_id="resource-full",
                details={"full": "details"},
                ip_address="172.16.0.1",
                user_agent="TestAgent/2.0",
            )

            mock_conn.execute.assert_called_once()
