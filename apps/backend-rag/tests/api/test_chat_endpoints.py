"""
API Tests for Chat/Conversation Endpoints
Tests the most used API surface for chat functionality

Coverage:
- POST /api/bali-zero/conversations/save - Save conversation
- GET /api/bali-zero/conversations/history - Get conversation history
- DELETE /api/bali-zero/conversations/clear - Clear conversation history
- GET /api/bali-zero/conversations/stats - Get conversation statistics
- Authentication requirements on all endpoints
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from jose import jwt

# Set required environment variables BEFORE any imports
os.environ["JWT_SECRET_KEY"] = "test_jwt_secret_key_for_testing_only_min_32_chars"
os.environ["API_KEYS"] = "test_api_key_1,test_api_key_2"
os.environ["OPENAI_API_KEY"] = "test_openai_api_key_for_testing"
os.environ["GOOGLE_API_KEY"] = "test_google_api_key_for_testing"
os.environ["QDRANT_URL"] = "http://localhost:6333"
os.environ["DATABASE_URL"] = "postgresql://test:test@localhost:5432/test"

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def valid_jwt_token():
    """Generate a valid JWT token for testing"""
    payload = {
        "sub": "test@example.com",
        "email": "test@example.com",
        "user_id": "test-user-123",
        "role": "member",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
    }
    secret = os.getenv("JWT_SECRET_KEY", "test_jwt_secret_key_for_testing_only_min_32_chars")
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def expired_jwt_token():
    """Generate an expired JWT token for testing"""
    payload = {
        "sub": "test@example.com",
        "email": "test@example.com",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1),
    }
    secret = os.getenv("JWT_SECRET_KEY", "test_jwt_secret_key_for_testing_only_min_32_chars")
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def mock_db_connection():
    """Mock database connection for tests"""
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
def test_client():
    """Create FastAPI TestClient for API tests."""
    from fastapi.testclient import TestClient

    # Mock dependencies before importing app
    with patch("app.dependencies.search_service", MagicMock()):
        with patch(
            "app.core.config.settings.jwt_secret_key",
            "test_jwt_secret_key_for_testing_only_min_32_chars",
        ):
            from app.main_cloud import app

        # Override startup/shutdown events
        @app.on_event("startup")
        async def startup():
            pass

        @app.on_event("shutdown")
        async def shutdown():
            pass

        app.state.ai_client = MagicMock()

        with TestClient(app) as client:
            yield client


# ============================================================================
# Authentication Tests
# ============================================================================


class TestConversationAuthentication:
    """Tests for authentication requirements on conversation endpoints"""

    def test_save_requires_authentication(self, test_client):
        """Test that save endpoint requires authentication"""
        response = test_client.post(
            "/api/bali-zero/conversations/save",
            json={"messages": [{"role": "user", "content": "Hello"}]},
        )

        assert response.status_code == 401

    def test_history_requires_authentication(self, test_client):
        """Test that history endpoint requires authentication"""
        response = test_client.get("/api/bali-zero/conversations/history")

        assert response.status_code == 401

    def test_clear_requires_authentication(self, test_client):
        """Test that clear endpoint requires authentication"""
        response = test_client.delete("/api/bali-zero/conversations/clear")

        assert response.status_code == 401

    def test_stats_requires_authentication(self, test_client):
        """Test that stats endpoint requires authentication"""
        response = test_client.get("/api/bali-zero/conversations/stats")

        assert response.status_code == 401

    def test_expired_token_rejected(self, test_client, expired_jwt_token):
        """Test that expired tokens are rejected"""
        response = test_client.get(
            "/api/bali-zero/conversations/history",
            headers={"Authorization": f"Bearer {expired_jwt_token}"},
        )

        assert response.status_code == 401

    def test_invalid_token_rejected(self, test_client):
        """Test that invalid tokens are rejected"""
        response = test_client.get(
            "/api/bali-zero/conversations/history",
            headers={"Authorization": "Bearer invalid-token-format"},
        )

        assert response.status_code == 401


# ============================================================================
# Save Conversation Tests
# ============================================================================


class TestSaveConversation:
    """Tests for POST /api/bali-zero/conversations/save endpoint"""

    def test_save_conversation_success(self, test_client, valid_jwt_token, mock_db_connection):
        """Test successful conversation save"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 123}

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.get_auto_crm", return_value=None
        ), patch("app.routers.conversations.logger"):
            response = test_client.post(
                "/api/bali-zero/conversations/save",
                json={
                    "messages": [
                        {"role": "user", "content": "Hello"},
                        {"role": "assistant", "content": "Hi there!"},
                    ],
                    "session_id": "test-session-123",
                },
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["conversation_id"] == 123
            assert data["messages_saved"] == 2

    def test_save_conversation_with_metadata(
        self, test_client, valid_jwt_token, mock_db_connection
    ):
        """Test conversation save with metadata"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 456}

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.get_auto_crm", return_value=None
        ), patch("app.routers.conversations.logger"):
            response = test_client.post(
                "/api/bali-zero/conversations/save",
                json={
                    "messages": [{"role": "user", "content": "Test"}],
                    "metadata": {"team_member": "Anton", "source": "web"},
                },
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_save_empty_messages_array(self, test_client, valid_jwt_token, mock_db_connection):
        """Test saving empty messages array"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 789}

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.get_auto_crm", return_value=None
        ), patch("app.routers.conversations.logger"):
            response = test_client.post(
                "/api/bali-zero/conversations/save",
                json={"messages": []},
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["messages_saved"] == 0

    def test_save_missing_messages_field(self, test_client, valid_jwt_token):
        """Test that missing messages field returns validation error"""
        response = test_client.post(
            "/api/bali-zero/conversations/save",
            json={},
            headers={"Authorization": f"Bearer {valid_jwt_token}"},
        )

        assert response.status_code == 422  # Validation error

    def test_save_db_error_returns_500(self, test_client, valid_jwt_token, mock_db_connection):
        """Test that database errors return 500"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.execute.side_effect = Exception("Database error")

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.post(
                "/api/bali-zero/conversations/save",
                json={"messages": [{"role": "user", "content": "Test"}]},
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 500


# ============================================================================
# Get History Tests
# ============================================================================


class TestGetConversationHistory:
    """Tests for GET /api/bali-zero/conversations/history endpoint"""

    def test_get_history_success(self, test_client, valid_jwt_token, mock_db_connection):
        """Test successful history retrieval"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi!"},
            ],
            "created_at": datetime.now(),
        }

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/history",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["messages"]) == 2

    def test_get_history_with_limit(self, test_client, valid_jwt_token, mock_db_connection):
        """Test history retrieval with limit parameter"""
        mock_conn, mock_cursor = mock_db_connection
        # Return more messages than limit
        mock_cursor.fetchone.return_value = {
            "messages": [{"role": "user", "content": f"Message {i}"} for i in range(30)],
            "created_at": datetime.now(),
        }

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/history?limit=10",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert len(data["messages"]) <= 10

    def test_get_history_with_session_id(self, test_client, valid_jwt_token, mock_db_connection):
        """Test history retrieval filtered by session_id"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "messages": [{"role": "user", "content": "Session specific"}],
            "created_at": datetime.now(),
        }

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/history?session_id=specific-session",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True

    def test_get_history_empty(self, test_client, valid_jwt_token, mock_db_connection):
        """Test empty history returns success with empty list"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = None

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/history",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["messages"] == []
            assert data["total_messages"] == 0


# ============================================================================
# Clear History Tests
# ============================================================================


class TestClearConversationHistory:
    """Tests for DELETE /api/bali-zero/conversations/clear endpoint"""

    def test_clear_all_history(self, test_client, valid_jwt_token, mock_db_connection):
        """Test clearing all conversation history"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.rowcount = 5

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.delete(
                "/api/bali-zero/conversations/clear",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["deleted_count"] == 5

    def test_clear_specific_session(self, test_client, valid_jwt_token, mock_db_connection):
        """Test clearing specific session history"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.rowcount = 2

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.delete(
                "/api/bali-zero/conversations/clear?session_id=specific-session",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["deleted_count"] == 2

    def test_clear_no_matching_records(self, test_client, valid_jwt_token, mock_db_connection):
        """Test clearing when no matching records exist"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.rowcount = 0

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.delete(
                "/api/bali-zero/conversations/clear",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["deleted_count"] == 0

    def test_clear_db_error_returns_500(self, test_client, valid_jwt_token, mock_db_connection):
        """Test that database errors return 500"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.execute.side_effect = Exception("Database error")

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.delete(
                "/api/bali-zero/conversations/clear",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 500


# ============================================================================
# Stats Tests
# ============================================================================


class TestGetConversationStats:
    """Tests for GET /api/bali-zero/conversations/stats endpoint"""

    def test_get_stats_success(self, test_client, valid_jwt_token, mock_db_connection):
        """Test successful stats retrieval"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "total_conversations": 10,
            "total_messages": 150,
            "last_conversation": datetime(2024, 1, 15, 12, 0, 0),
        }

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/stats",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_conversations"] == 10
            assert data["total_messages"] == 150
            assert data["last_conversation"] is not None

    def test_get_stats_empty(self, test_client, valid_jwt_token, mock_db_connection):
        """Test stats for user with no conversations"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {
            "total_conversations": 0,
            "total_messages": None,
            "last_conversation": None,
        }

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/stats",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["total_conversations"] == 0
            assert data["total_messages"] == 0
            assert data["last_conversation"] is None

    def test_get_stats_db_error_returns_500(self, test_client, valid_jwt_token, mock_db_connection):
        """Test that database errors return 500"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.execute.side_effect = Exception("Database error")

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.logger"
        ):
            response = test_client.get(
                "/api/bali-zero/conversations/stats",
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 500


# ============================================================================
# Security Tests
# ============================================================================


class TestConversationSecurity:
    """Security-focused tests for conversation endpoints"""

    def test_user_email_from_jwt_not_body(self, test_client, valid_jwt_token, mock_db_connection):
        """Test that user email is taken from JWT, not request body"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 100}

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.get_auto_crm", return_value=None
        ), patch("app.routers.conversations.logger"):
            response = test_client.post(
                "/api/bali-zero/conversations/save",
                json={
                    "messages": [{"role": "user", "content": "Test"}],
                    # Note: No user_email in body - it comes from JWT
                },
                headers={"Authorization": f"Bearer {valid_jwt_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            # Email should match JWT payload, not any body field
            assert data["user_email"] == "test@example.com"

    def test_different_user_tokens_are_isolated(self, test_client, mock_db_connection):
        """Test that different users have isolated data"""
        mock_conn, mock_cursor = mock_db_connection
        mock_cursor.fetchone.return_value = {"id": 1}

        # Create tokens for two different users
        secret = os.getenv("JWT_SECRET_KEY", "test_jwt_secret_key_for_testing_only_min_32_chars")

        user1_payload = {
            "sub": "user1@example.com",
            "email": "user1@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        user1_token = jwt.encode(user1_payload, secret, algorithm="HS256")

        user2_payload = {
            "sub": "user2@example.com",
            "email": "user2@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        user2_token = jwt.encode(user2_payload, secret, algorithm="HS256")

        with patch("app.routers.conversations.get_db_connection", return_value=mock_conn), patch(
            "app.routers.conversations.get_auto_crm", return_value=None
        ), patch("app.routers.conversations.logger"):
            # User 1 saves
            response1 = test_client.post(
                "/api/bali-zero/conversations/save",
                json={"messages": [{"role": "user", "content": "User 1 message"}]},
                headers={"Authorization": f"Bearer {user1_token}"},
            )

            assert response1.status_code == 200
            assert response1.json()["user_email"] == "user1@example.com"

            # User 2 saves
            response2 = test_client.post(
                "/api/bali-zero/conversations/save",
                json={"messages": [{"role": "user", "content": "User 2 message"}]},
                headers={"Authorization": f"Bearer {user2_token}"},
            )

            assert response2.status_code == 200
            assert response2.json()["user_email"] == "user2@example.com"
