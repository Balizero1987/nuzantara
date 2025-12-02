"""
Unit tests for Calendar Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.calendar_service import CalendarService, get_calendar_service

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def calendar_service_mock_mode():
    """Create CalendarService in mock mode (no credentials)"""
    with patch("os.path.exists", return_value=False), patch("services.calendar_service.logger"):
        service = CalendarService()
        assert service.service is None  # Mock mode
        return service


@pytest.fixture
def calendar_service_authenticated():
    """Create CalendarService with authentication"""
    mock_creds = MagicMock()
    mock_creds.valid = True
    mock_service = MagicMock()

    with patch("os.path.exists", return_value=True), patch(
        "google.oauth2.credentials.Credentials.from_authorized_user_file", return_value=mock_creds
    ), patch("googleapiclient.discovery.build", return_value=mock_service), patch(
        "services.calendar_service.logger"
    ):
        service = CalendarService()
        service.service = mock_service
        return service


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_calendar_service_init_mock_mode(calendar_service_mock_mode):
    """Test CalendarService initialization in mock mode"""
    assert calendar_service_mock_mode.service is None


def test_calendar_service_init_authenticated(calendar_service_authenticated):
    """Test CalendarService initialization with authentication"""
    assert calendar_service_authenticated.service is not None


def test_calendar_service_init_with_expired_token():
    """Test CalendarService initialization with expired token refresh"""
    mock_creds = MagicMock()
    mock_creds.valid = False
    mock_creds.expired = True
    mock_creds.refresh_token = "token123"
    mock_creds.refresh = MagicMock()

    with patch("os.path.exists", return_value=True), patch(
        "google.oauth2.credentials.Credentials.from_authorized_user_file", return_value=mock_creds
    ), patch("google.auth.transport.requests.Request"), patch(
        "googleapiclient.discovery.build"
    ), patch("services.calendar_service.logger"):
        service = CalendarService()
        mock_creds.refresh.assert_called_once()


# ============================================================================
# Tests: list_upcoming_events
# ============================================================================


def test_list_upcoming_events_mock_mode(calendar_service_mock_mode):
    """Test listing events in mock mode"""
    events = calendar_service_mock_mode.list_upcoming_events(max_results=5)

    assert isinstance(events, list)
    assert len(events) == 2  # Mock returns 2 events
    assert events[0]["id"] == "mock_evt_1"
    assert "summary" in events[0]
    assert "start" in events[0]
    assert "end" in events[0]


def test_list_upcoming_events_authenticated(calendar_service_authenticated):
    """Test listing events with authenticated service"""
    mock_events_result = {
        "items": [
            {
                "id": "evt1",
                "summary": "Test Event",
                "start": {"dateTime": "2024-01-01T10:00:00Z"},
                "end": {"dateTime": "2024-01-01T11:00:00Z"},
            }
        ]
    }

    mock_events = MagicMock()
    mock_events.execute.return_value = mock_events_result
    calendar_service_authenticated.service.events.return_value.list.return_value = mock_events

    events = calendar_service_authenticated.list_upcoming_events(max_results=10)

    assert len(events) == 1
    assert events[0]["id"] == "evt1"
    assert events[0]["summary"] == "Test Event"
    mock_events.execute.assert_called_once()


def test_list_upcoming_events_empty_result(calendar_service_authenticated):
    """Test listing events with empty result"""
    mock_events_result = {"items": []}

    mock_events = MagicMock()
    mock_events.execute.return_value = mock_events_result
    calendar_service_authenticated.service.events.return_value.list.return_value = mock_events

    events = calendar_service_authenticated.list_upcoming_events()

    assert events == []


def test_list_upcoming_events_exception(calendar_service_authenticated):
    """Test listing events with exception"""
    calendar_service_authenticated.service.events.return_value.list.return_value.execute.side_effect = Exception(
        "API Error"
    )

    events = calendar_service_authenticated.list_upcoming_events()

    assert events == []


def test_list_upcoming_events_max_results(calendar_service_authenticated):
    """Test listing events with max_results parameter"""
    mock_events_result = {"items": [{"id": f"evt{i}"} for i in range(20)]}

    mock_events = MagicMock()
    mock_events.execute.return_value = mock_events_result
    calendar_service_authenticated.service.events.return_value.list.return_value = mock_events

    events = calendar_service_authenticated.list_upcoming_events(max_results=5)

    # Verify maxResults was passed
    call_kwargs = calendar_service_authenticated.service.events.return_value.list.call_args[1]
    assert call_kwargs["maxResults"] == 5


# ============================================================================
# Tests: create_event
# ============================================================================


def test_create_event_mock_mode(calendar_service_mock_mode):
    """Test creating event in mock mode"""
    result = calendar_service_mock_mode.create_event(
        summary="Test Event",
        start_time="2024-01-01T10:00:00",
        end_time="2024-01-01T11:00:00",
        description="Test description",
    )

    assert result["id"] == "mock_new_evt"
    assert result["summary"] == "Test Event"
    assert result["status"] == "confirmed"


def test_create_event_authenticated(calendar_service_authenticated):
    """Test creating event with authenticated service"""
    mock_event_result = {
        "id": "new_evt_123",
        "summary": "Test Event",
        "htmlLink": "https://calendar.google.com/event?eid=123",
        "status": "confirmed",
    }

    mock_insert = MagicMock()
    mock_insert.execute.return_value = mock_event_result
    calendar_service_authenticated.service.events.return_value.insert.return_value = mock_insert

    result = calendar_service_authenticated.create_event(
        summary="Test Event",
        start_time="2024-01-01T10:00:00",
        end_time="2024-01-01T11:00:00",
        description="Test description",
    )

    assert result["id"] == "new_evt_123"
    assert result["summary"] == "Test Event"
    mock_insert.execute.assert_called_once()


def test_create_event_timezone(calendar_service_authenticated):
    """Test creating event with timezone"""
    mock_event_result = {"id": "evt1", "status": "confirmed"}
    mock_insert = MagicMock()
    mock_insert.execute.return_value = mock_event_result
    calendar_service_authenticated.service.events.return_value.insert.return_value = mock_insert

    calendar_service_authenticated.create_event(
        summary="Test", start_time="2024-01-01T10:00:00", end_time="2024-01-01T11:00:00"
    )

    call_args = calendar_service_authenticated.service.events.return_value.insert.call_args
    event_body = call_args[1]["body"]
    assert event_body["start"]["timeZone"] == "Asia/Makassar"
    assert event_body["end"]["timeZone"] == "Asia/Makassar"


def test_create_event_exception(calendar_service_authenticated):
    """Test creating event with exception"""
    calendar_service_authenticated.service.events.return_value.insert.return_value.execute.side_effect = Exception(
        "API Error"
    )

    result = calendar_service_authenticated.create_event(
        summary="Test", start_time="2024-01-01T10:00:00", end_time="2024-01-01T11:00:00"
    )

    assert result == {}


# ============================================================================
# Tests: get_calendar_service (singleton)
# ============================================================================


def test_get_calendar_service_singleton():
    """Test get_calendar_service returns singleton"""
    with patch("os.path.exists", return_value=False), patch("services.calendar_service.logger"):
        # Clear singleton
        import services.calendar_service

        services.calendar_service._calendar_service = None

        service1 = get_calendar_service()
        service2 = get_calendar_service()

        assert service1 is service2
        assert isinstance(service1, CalendarService)
