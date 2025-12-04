"""
Unit tests for Gmail Service
100% coverage target with comprehensive mocking
"""

import base64
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.gmail_service import GmailService, get_gmail_service

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def gmail_service_mock_mode():
    """Create GmailService in mock mode (no credentials)"""
    with patch("os.path.exists", return_value=False), patch("services.gmail_service.logger"):
        service = GmailService()
        assert service.service is None  # Mock mode
        return service


@pytest.fixture
def gmail_service_authenticated():
    """Create GmailService with authentication"""
    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_service = MagicMock()

    with (
        patch("os.path.exists", return_value=True),
        patch(
            "google.oauth2.credentials.Credentials.from_authorized_user_file",
            return_value=mock_creds,
        ),
        patch("googleapiclient.discovery.build", return_value=mock_service),
        patch("services.gmail_service.logger"),
    ):
        service = GmailService()
        service.service = mock_service
        return service


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_gmail_service_init_mock_mode(gmail_service_mock_mode):
    """Test GmailService initialization in mock mode"""
    assert gmail_service_mock_mode.service is None


def test_gmail_service_init_authenticated(gmail_service_authenticated):
    """Test GmailService initialization with authentication"""
    assert gmail_service_authenticated.service is not None


def test_gmail_service_init_with_expired_token():
    """Test GmailService initialization with expired token refresh"""
    mock_creds = MagicMock()
    mock_creds.valid = False
    mock_creds.expired = True
    mock_creds.refresh_token = "token123"
    mock_creds.refresh = MagicMock()

    with (
        patch("os.path.exists", return_value=True),
        patch(
            "google.oauth2.credentials.Credentials.from_authorized_user_file",
            return_value=mock_creds,
        ),
        patch("google.auth.transport.requests.Request"),
        patch("googleapiclient.discovery.build"),
        patch("services.gmail_service.logger"),
    ):
        service = GmailService()
        mock_creds.refresh.assert_called_once()


# ============================================================================
# Tests: list_messages
# ============================================================================


def test_list_messages_mock_mode(gmail_service_mock_mode):
    """Test listing messages in mock mode"""
    messages = gmail_service_mock_mode.list_messages(query="is:unread", max_results=5)

    assert messages == []


def test_list_messages_authenticated(gmail_service_authenticated):
    """Test listing messages with authenticated service"""
    mock_messages_result = {
        "messages": [
            {"id": "msg1", "threadId": "thread1"},
            {"id": "msg2", "threadId": "thread2"},
        ]
    }

    mock_list = MagicMock()
    mock_list.execute.return_value = mock_messages_result
    gmail_service_authenticated.service.users.return_value.messages.return_value.list.return_value = mock_list

    messages = gmail_service_authenticated.list_messages(query="is:unread", max_results=5)

    assert len(messages) == 2
    assert messages[0]["id"] == "msg1"
    mock_list.execute.assert_called_once()


def test_list_messages_empty_result(gmail_service_authenticated):
    """Test listing messages with empty result"""
    mock_messages_result = {"messages": []}

    mock_list = MagicMock()
    mock_list.execute.return_value = mock_messages_result
    gmail_service_authenticated.service.users.return_value.messages.return_value.list.return_value = mock_list

    messages = gmail_service_authenticated.list_messages()

    assert messages == []


def test_list_messages_exception(gmail_service_authenticated):
    """Test listing messages with exception"""
    gmail_service_authenticated.service.users.return_value.messages.return_value.list.return_value.execute.side_effect = Exception(
        "API Error"
    )

    messages = gmail_service_authenticated.list_messages()

    assert messages == []


def test_list_messages_max_results(gmail_service_authenticated):
    """Test listing messages with max_results parameter"""
    mock_messages_result = {"messages": [{"id": f"msg{i}"} for i in range(10)]}

    mock_list = MagicMock()
    mock_list.execute.return_value = mock_messages_result
    gmail_service_authenticated.service.users.return_value.messages.return_value.list.return_value = mock_list

    messages = gmail_service_authenticated.list_messages(max_results=5)

    # Verify maxResults was passed
    call_kwargs = (
        gmail_service_authenticated.service.users.return_value.messages.return_value.list.call_args[
            1
        ]
    )
    assert call_kwargs["maxResults"] == 5


# ============================================================================
# Tests: get_message_details
# ============================================================================


def test_get_message_details_mock_mode(gmail_service_mock_mode):
    """Test getting message details in mock mode"""
    details = gmail_service_mock_mode.get_message_details("msg123")

    assert details == {}


def test_get_message_details_authenticated(gmail_service_authenticated):
    """Test getting message details with authenticated service"""
    mock_message = {
        "id": "msg123",
        "snippet": "Test snippet",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Test Subject"},
                {"name": "From", "value": "sender@example.com"},
                {"name": "Date", "value": "Mon, 1 Jan 2024 10:00:00 +0000"},
            ],
            "body": {"data": base64.urlsafe_b64encode(b"Test body").decode()},
        },
    }

    mock_get = MagicMock()
    mock_get.execute.return_value = mock_message
    gmail_service_authenticated.service.users.return_value.messages.return_value.get.return_value = mock_get

    details = gmail_service_authenticated.get_message_details("msg123")

    assert details["id"] == "msg123"
    assert details["subject"] == "Test Subject"
    assert details["sender"] == "sender@example.com"
    assert details["body"] == "Test body"
    assert details["snippet"] == "Test snippet"
    mock_get.execute.assert_called_once()


def test_get_message_details_with_parts(gmail_service_authenticated):
    """Test getting message details with multipart body"""
    mock_message = {
        "id": "msg123",
        "snippet": "Test",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Test"},
                {"name": "From", "value": "test@example.com"},
                {"name": "Date", "value": "Mon, 1 Jan 2024"},
            ],
            "parts": [
                {
                    "mimeType": "text/plain",
                    "body": {"data": base64.urlsafe_b64encode(b"Plain text body").decode()},
                }
            ],
        },
    }

    mock_get = MagicMock()
    mock_get.execute.return_value = mock_message
    gmail_service_authenticated.service.users.return_value.messages.return_value.get.return_value = mock_get

    details = gmail_service_authenticated.get_message_details("msg123")

    assert details["body"] == "Plain text body"


def test_get_message_details_no_body(gmail_service_authenticated):
    """Test getting message details without body"""
    mock_message = {
        "id": "msg123",
        "snippet": "Test",
        "payload": {
            "headers": [
                {"name": "Subject", "value": "Test"},
                {"name": "From", "value": "test@example.com"},
                {"name": "Date", "value": "Mon, 1 Jan 2024"},
            ]
        },
    }

    mock_get = MagicMock()
    mock_get.execute.return_value = mock_message
    gmail_service_authenticated.service.users.return_value.messages.return_value.get.return_value = mock_get

    details = gmail_service_authenticated.get_message_details("msg123")

    assert details["body"] == "No content"


def test_get_message_details_exception(gmail_service_authenticated):
    """Test getting message details with exception"""
    gmail_service_authenticated.service.users.return_value.messages.return_value.get.return_value.execute.side_effect = Exception(
        "API Error"
    )

    details = gmail_service_authenticated.get_message_details("msg123")

    assert details == {}


# ============================================================================
# Tests: create_draft
# ============================================================================


def test_create_draft_mock_mode(gmail_service_mock_mode):
    """Test creating draft in mock mode"""
    result = gmail_service_mock_mode.create_draft(
        to="recipient@example.com", subject="Test Subject", body="Test body"
    )

    assert result["id"] == "mock_draft_id"
    assert "DRAFT" in result["labelIds"]


def test_create_draft_authenticated(gmail_service_authenticated):
    """Test creating draft with authenticated service"""
    mock_draft_result = {
        "id": "draft123",
        "labelIds": ["DRAFT"],
        "message": {"id": "msg123"},
    }

    mock_create = MagicMock()
    mock_create.execute.return_value = mock_draft_result
    gmail_service_authenticated.service.users.return_value.drafts.return_value.create.return_value = mock_create

    result = gmail_service_authenticated.create_draft(
        to="recipient@example.com", subject="Test Subject", body="Test body"
    )

    assert result["id"] == "draft123"
    mock_create.execute.assert_called_once()


def test_create_draft_exception(gmail_service_authenticated):
    """Test creating draft with exception"""
    gmail_service_authenticated.service.users.return_value.drafts.return_value.create.return_value.execute.side_effect = Exception(
        "API Error"
    )

    result = gmail_service_authenticated.create_draft(
        to="test@example.com", subject="Test", body="Test"
    )

    assert result == {}


# ============================================================================
# Tests: get_gmail_service (singleton)
# ============================================================================


def test_get_gmail_service_singleton():
    """Test get_gmail_service returns singleton"""
    with patch("os.path.exists", return_value=False), patch("services.gmail_service.logger"):
        # Clear singleton
        import services.gmail_service

        services.gmail_service._gmail_service = None

        service1 = get_gmail_service()
        service2 = get_gmail_service()

        assert service1 is service2
        assert isinstance(service1, GmailService)
