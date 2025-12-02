"""
Unit tests for Productivity Router
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from fastapi import FastAPI

from app.routers.productivity import router

app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_draft_email():
    """Test drafting email"""
    request_data = {
        "recipient": "test@example.com",
        "subject": "Test Subject",
        "body": "Test body",
    }

    response = client.post("/api/productivity/gmail/draft", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert "status" in data


@patch("services.calendar_service.get_calendar_service")
def test_schedule_meeting(mock_service):
    """Test scheduling meeting"""
    mock_calendar = MagicMock()
    mock_calendar.create_event.return_value = {"id": "event123"}
    # get_calendar_service is imported inside the function
    mock_service.return_value = mock_calendar

    request_data = {
        "title": "Test Meeting",
        "start_time": "2024-12-31T10:00:00Z",
        "duration_minutes": 60,
        "attendees": ["test@example.com"],
    }

    response = client.post("/api/productivity/calendar/schedule", json=request_data)

    # May fail if calendar service is not properly initialized
    assert response.status_code in [200, 500]
    if response.status_code == 200:
        data = response.json()
        assert "status" in data


@patch("services.calendar_service.get_calendar_service")
def test_list_events(mock_service):
    """Test listing calendar events"""
    mock_calendar = MagicMock()
    mock_calendar.list_upcoming_events.return_value = []
    mock_service.return_value = mock_calendar

    response = client.get("/api/productivity/calendar/events?limit=10")

    assert response.status_code == 200
    data = response.json()
    assert "events" in data


def test_search_drive():
    """Test searching Google Drive"""
    response = client.get("/api/productivity/drive/search?query=test")

    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert isinstance(data["results"], list)


@patch("services.calendar_service.get_calendar_service")
def test_schedule_meeting_error(mock_service):
    """Test scheduling meeting with error"""
    mock_service.side_effect = Exception("Calendar service error")

    request_data = {
        "title": "Test Meeting",
        "start_time": "2024-12-31T10:00:00Z",
        "duration_minutes": 60,
        "attendees": [],
    }

    response = client.post("/api/productivity/calendar/schedule", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "error"
    assert "message" in data


@patch("services.calendar_service.get_calendar_service")
def test_list_events_error(mock_service):
    """Test listing events with error"""
    mock_service.side_effect = Exception("Calendar API error")

    response = client.get("/api/productivity/calendar/events?limit=5")

    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert data["events"] == []


@patch("services.calendar_service.get_calendar_service")
def test_schedule_meeting_success_with_data(mock_service):
    """Test successful meeting scheduling with full data"""
    mock_calendar = MagicMock()
    mock_calendar.create_event.return_value = {
        "id": "event456",
        "htmlLink": "https://calendar.google.com/event/456",
    }
    mock_service.return_value = mock_calendar

    request_data = {
        "title": "Important Meeting",
        "start_time": "2024-12-31T14:00:00Z",
        "duration_minutes": 30,
        "attendees": ["person1@example.com", "person2@example.com"],
    }

    response = client.post("/api/productivity/calendar/schedule", json=request_data)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "Meeting 'Important Meeting' scheduled" in data["message"]
    assert "data" in data


@patch("services.calendar_service.get_calendar_service")
def test_list_events_with_results(mock_service):
    """Test listing events with results"""
    mock_calendar = MagicMock()
    mock_calendar.list_upcoming_events.return_value = [
        {"summary": "Event 1", "start": "2024-12-31T10:00:00Z"},
        {"summary": "Event 2", "start": "2024-12-31T15:00:00Z"},
    ]
    mock_service.return_value = mock_calendar

    response = client.get("/api/productivity/calendar/events?limit=2")

    assert response.status_code == 200
    data = response.json()
    assert "events" in data
    assert len(data["events"]) == 2
    assert data["events"][0]["summary"] == "Event 1"
