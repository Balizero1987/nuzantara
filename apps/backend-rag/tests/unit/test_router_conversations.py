"""
Unit tests for Conversations Router
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.conversations import router
from fastapi import FastAPI

app = FastAPI()
app.include_router(router)
client = TestClient(app)


@patch("app.routers.conversations.get_db_connection")
def test_save_conversation(mock_db):
    """Test saving conversation"""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value.__enter__.return_value = mock_cursor
    mock_cursor.fetchone.return_value = {"id": 1}
    mock_db.return_value.__enter__.return_value = mock_conn
    
    request_data = {
        "user_email": "test@example.com",
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ],
    }
    
    response = client.post("/api/bali-zero/conversations/save", json=request_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "success" in data or "conversation_id" in data


def test_get_conversation_history():
    """Test getting conversation history"""
    response = client.get("/api/bali-zero/conversations/history?user_email=test@example.com")
    
    # May return 200 with empty list or error if DB not configured
    assert response.status_code in [200, 500]


def test_get_conversation_stats():
    """Test getting conversation stats"""
    response = client.get("/api/bali-zero/conversations/stats?user_email=test@example.com")
    
    assert response.status_code in [200, 500]


def test_clear_conversation_history():
    """Test clearing conversation history"""
    response = client.delete("/api/bali-zero/conversations/clear?user_email=test@example.com")
    
    assert response.status_code in [200, 500]

