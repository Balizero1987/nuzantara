"""
Unit tests for Conversations Router
Tests for persistent conversation history with PostgreSQL + Auto-CRM population

Coverage: save, history, clear, stats endpoints with JWT authentication
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

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
    settings.jwt_secret_key = "test-secret-key-minimum-32-characters-long"
    settings.jwt_algorithm = "HS256"
    settings.database_url = "postgresql://test:test@localhost:5432/test"
    return settings


@pytest.fixture
def valid_jwt_token(mock_settings):
    """Generate a valid JWT token for testing"""
    from datetime import datetime, timedelta, timezone

    from jose import jwt

    # Use timezone-aware datetime and ensure expiration is in the future
    exp = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {
        "sub": "test@example.com",  # sub should be the email/identifier
        "email": "test@example.com",
        "user_id": "test-user-id",
        "role": "member",
        "exp": int(exp.timestamp()),  # JWT expects integer timestamp
    }
    token = jwt.encode(payload, mock_settings.jwt_secret_key, algorithm="HS256")
    return token


@pytest.fixture
def expired_jwt_token(mock_settings):
    """Generate an expired JWT token for testing"""
    from jose import jwt

    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "exp": datetime.utcnow().timestamp() - 3600,
    }
    token = jwt.encode(payload, mock_settings.jwt_secret_key, algorithm="HS256")
    return token


@pytest.fixture
def mock_db_connection():
    """Mock database connection"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()

    mock_cursor.execute = MagicMock()
    mock_cursor.fetchone = MagicMock(return_value={"id": 1})
    mock_cursor.fetchall = MagicMock(return_value=[])
    mock_cursor.rowcount = 1
    mock_cursor.close = MagicMock()

    mock_conn.cursor = MagicMock(return_value=mock_cursor)
    mock_conn.commit = MagicMock()
    mock_conn.close = MagicMock()

    return mock_conn, mock_cursor


@pytest.fixture
def mock_auto_crm():
    """Mock Auto-CRM service"""
    auto_crm = AsyncMock()
    auto_crm.process_conversation = AsyncMock(
        return_value={
            "success": True,
            "client_id": 42,
            "client_created": False,
            "client_updated": True,
            "practice_id": 15,
            "practice_created": True,
            "interaction_id": 88,
        }
    )
    return auto_crm


# ============================================================================
# Authentication Tests
# ============================================================================


class TestGetCurrentUser:
    """Tests for JWT authentication helper"""

    @pytest.mark.asyncio
    async def test_no_credentials_raises_401(self):
        """Test that missing credentials raise 401"""
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.jwt_secret_key = "test-secret"
            mock_settings.jwt_algorithm = "HS256"

            from app.routers.conversations import get_current_user

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(credentials=None)

            assert exc_info.value.status_code == 401
            assert "Authentication required" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_valid_token_returns_user(self, mock_settings, valid_jwt_token):
        """Test that valid token returns user dict"""
        with patch("app.core.config.settings", mock_settings):
            from fastapi.security import HTTPAuthorizationCredentials

            from app.routers.conversations import get_current_user

            credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=valid_jwt_token)

            user = await get_current_user(credentials=credentials)

            assert user["email"] == "test@example.com"
            assert user["user_id"] == "test-user-id"
            assert user["role"] == "member"

    @pytest.mark.asyncio
    async def test_invalid_token_raises_401(self, mock_settings):
        """Test that invalid token raises 401"""
        with patch("app.core.config.settings", mock_settings):
            from fastapi.security import HTTPAuthorizationCredentials

            from app.routers.conversations import get_current_user

            credentials = HTTPAuthorizationCredentials(
                scheme="Bearer", credentials="invalid-token-not-jwt"
            )

            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(credentials=credentials)

            assert exc_info.value.status_code == 401


# ============================================================================
# Save Conversation Tests
# ============================================================================


class TestSaveConversation:
    """Tests for POST /api/bali-zero/conversations/save endpoint"""

    @pytest.mark.asyncio
    async def test_save_conversation_success(
        self, mock_settings, mock_db_connection, mock_auto_crm
    ):
        """Test successful conversation save"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 123}

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.get_auto_crm", return_value=mock_auto_crm),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import SaveConversationRequest, save_conversation

            request = SaveConversationRequest(
                messages=[
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi there!"},
                ],
                session_id="test-session-123",
                metadata={"team_member": "Anton"},
            )

            current_user = {"email": "test@example.com", "user_id": "test-user"}

            result = await save_conversation(request=request, current_user=current_user)

            assert result["success"] is True
            assert result["conversation_id"] == 123
            assert result["messages_saved"] == 2
            assert result["user_email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_save_uses_jwt_email_not_request(self, mock_settings, mock_db_connection):
        """Test that user email comes from JWT, not request body (security)"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 456}

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.get_auto_crm", return_value=None),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import SaveConversationRequest, save_conversation

            request = SaveConversationRequest(
                messages=[{"role": "user", "content": "Test"}],
            )

            current_user = {"email": "jwt-user@example.com", "user_id": "jwt-user"}

            result = await save_conversation(request=request, current_user=current_user)

            assert result["user_email"] == "jwt-user@example.com"

    @pytest.mark.asyncio
    async def test_save_db_error_raises_500(self, mock_settings, mock_db_connection):
        """Test that database errors raise 500"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.execute.side_effect = Exception("Database error")

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import SaveConversationRequest, save_conversation

            request = SaveConversationRequest(
                messages=[{"role": "user", "content": "Test"}],
            )

            current_user = {"email": "test@example.com", "user_id": "test"}

            with pytest.raises(HTTPException) as exc_info:
                await save_conversation(request=request, current_user=current_user)

            assert exc_info.value.status_code == 500


# ============================================================================
# Get History Tests
# ============================================================================


class TestGetConversationHistory:
    """Tests for GET /api/bali-zero/conversations/history endpoint"""

    @pytest.mark.asyncio
    async def test_get_history_success(self, mock_settings, mock_db_connection):
        """Test successful history retrieval"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi!"},
            ],
            "created_at": datetime.now(),
        }

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import get_conversation_history

            current_user = {"email": "test@example.com", "user_id": "test"}

            result = await get_conversation_history(
                limit=20, session_id=None, current_user=current_user
            )

            assert result.success is True
            assert len(result.messages) == 2
            assert result.total_messages == 2

    @pytest.mark.asyncio
    async def test_get_history_empty(self, mock_settings, mock_db_connection):
        """Test empty history returns success with empty list"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = None

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import get_conversation_history

            current_user = {"email": "test@example.com", "user_id": "test"}

            result = await get_conversation_history(
                limit=20, session_id=None, current_user=current_user
            )

            assert result.success is True
            assert result.messages == []
            assert result.total_messages == 0


# ============================================================================
# Clear History Tests
# ============================================================================


class TestClearConversationHistory:
    """Tests for DELETE /api/bali-zero/conversations/clear endpoint"""

    @pytest.mark.asyncio
    async def test_clear_history_success(self, mock_settings, mock_db_connection):
        """Test successful history clear"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.rowcount = 5

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import clear_conversation_history

            current_user = {"email": "test@example.com", "user_id": "test"}

            result = await clear_conversation_history(session_id=None, current_user=current_user)

            assert result["success"] is True
            assert result["deleted_count"] == 5
            mock_conn.commit.assert_called_once()


# ============================================================================
# Stats Tests
# ============================================================================


class TestGetConversationStats:
    """Tests for GET /api/bali-zero/conversations/stats endpoint"""

    @pytest.mark.asyncio
    async def test_get_stats_success(self, mock_settings, mock_db_connection):
        """Test successful stats retrieval"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "total_conversations": 10,
            "total_messages": 150,
            "last_conversation": datetime(2024, 1, 15, 12, 0, 0),
        }

        with (
            patch("app.routers.conversations.get_db_connection", return_value=mock_conn),
            patch("app.routers.conversations.logger"),
        ):
            from app.routers.conversations import get_conversation_stats

            current_user = {"email": "test@example.com", "user_id": "test"}

            result = await get_conversation_stats(current_user=current_user)

            assert result["success"] is True
            assert result["user_email"] == "test@example.com"
            assert result["total_conversations"] == 10
            assert result["total_messages"] == 150
            assert result["last_conversation"] is not None
