"""
Unit tests for CRM Shared Memory Router
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.crm_shared_memory import (
    get_client_full_context,
    get_team_overview,
    get_upcoming_renewals,
    search_shared_memory,
)


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_db_connection():
    """Mock PostgreSQL connection"""
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value = cursor
    return conn, cursor


@pytest.fixture
def mock_settings():
    """Mock settings"""
    mock = MagicMock()
    mock.database_url = "postgresql://test:test@localhost/test"
    return mock


# ============================================================================
# Tests for search_shared_memory
# ============================================================================


@pytest.mark.asyncio
async def test_search_shared_memory_renewal_query(mock_db_connection, mock_settings):
    """Test search for renewal/expiry queries"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "client_name": "Test Client",
            "email": "test@example.com",
            "practice_type": "KITAS",
            "expiry_date": "2024-12-31",
            "days_until_expiry": 30,
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="clients with expiring KITAS", limit=20)

            assert "query" in result
            assert "practices" in result
            assert "interpretation" in result
            assert len(result["practices"]) == 1
            assert "expir" in result["interpretation"][0].lower() or "renewal" in result["interpretation"][0].lower()


@pytest.mark.asyncio
async def test_search_shared_memory_client_query(mock_db_connection, mock_settings):
    """Test search for client queries"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "id": 1,
            "full_name": "John Smith",
            "email": "john@example.com",
            "status": "active",
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="clients named John Smith", limit=20)

            assert "query" in result
            assert "clients" in result
            assert isinstance(result["clients"], list)


@pytest.mark.asyncio
async def test_search_shared_memory_practice_query(mock_db_connection, mock_settings):
    """Test search for practice queries"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "id": 1,
            "client_name": "Test Client",
            "practice_type": "PT PMA",
            "status": "in_progress",
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="PT PMA practices in progress", limit=20)

            assert "query" in result
            assert "practices" in result
            assert isinstance(result["practices"], list)


@pytest.mark.asyncio
async def test_search_shared_memory_interaction_query(mock_db_connection, mock_settings):
    """Test search for interaction queries"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "id": 1,
            "client_name": "Test Client",
            "interaction_type": "chat",
            "interaction_date": "2024-01-01",
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="recent interactions", limit=20)

            assert "query" in result
            assert "interactions" in result
            assert isinstance(result["interactions"], list)


@pytest.mark.asyncio
async def test_search_shared_memory_urgent_query(mock_db_connection, mock_settings):
    """Test search for urgent practices"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "id": 1,
            "client_name": "Test Client",
            "practice_type": "KITAS",
            "priority": "urgent",
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="urgent practices", limit=20)

            assert "query" in result
            assert "practices" in result
            assert isinstance(result["practices"], list)


@pytest.mark.asyncio
async def test_search_shared_memory_empty_results(mock_db_connection, mock_settings):
    """Test search with no results"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="nonexistent query", limit=20)

            assert "query" in result
            assert "clients" in result
            assert "practices" in result
            assert "interactions" in result
            assert len(result["clients"]) == 0
            assert len(result["practices"]) == 0
            assert len(result["interactions"]) == 0


@pytest.mark.asyncio
async def test_search_shared_memory_database_error(mock_db_connection, mock_settings):
    """Test search with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            # Use a query that will trigger a SQL execution (e.g., "urgent" triggers urgency search)
            with pytest.raises(HTTPException) as exc_info:
                await search_shared_memory(q="urgent practices", limit=20)

            assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_search_shared_memory_client_with_practices(mock_db_connection, mock_settings):
    """Test search for client with practices (branch coverage for lines 133-152)"""
    conn, cursor = mock_db_connection

    # Mock fetchall to return clients first, then practices
    cursor.fetchall.side_effect = [
        [{"id": 1, "full_name": "John Smith", "email": "john@example.com", "total_practices": 5, "active_practices": 2}],  # clients
        [{"id": 1, "client_name": "John Smith", "practice_type_name": "KITAS", "status": "in_progress"}],  # practices for clients
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="John Smith", limit=20)

            assert "clients" in result
            assert len(result["clients"]) > 0
            assert "practices" in result
            # Verify both SQL queries were executed (clients + practices for clients)
            assert cursor.execute.call_count >= 2


@pytest.mark.asyncio
async def test_search_shared_memory_recent_interactions_with_30_days(mock_db_connection, mock_settings):
    """Test recent interactions with 30 days keyword (line 252)"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [{"id": 1, "client_name": "Test", "interaction_date": "2024-01-01"}]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="recent interactions last 30 days", limit=20)

            assert "interactions" in result
            # Verify query with 30 days was executed
            cursor.execute.assert_called()


@pytest.mark.asyncio
async def test_search_shared_memory_recent_interactions_today(mock_db_connection, mock_settings):
    """Test recent interactions with today keyword (line 256)"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [{"id": 1, "client_name": "Test", "interaction_date": "2024-01-01"}]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="interactions today", limit=20)

            assert "interactions" in result


@pytest.mark.asyncio
async def test_search_shared_memory_recent_interactions_week(mock_db_connection, mock_settings):
    """Test recent interactions with week keyword (line 254)"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [{"id": 1, "client_name": "Test", "interaction_date": "2024-01-01"}]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await search_shared_memory(q="interactions last week", limit=20)

            assert "interactions" in result


# ============================================================================
# Tests for get_upcoming_renewals
# ============================================================================


@pytest.mark.asyncio
async def test_get_upcoming_renewals_success(mock_db_connection, mock_settings):
    """Test successful retrieval of upcoming renewals"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {
            "client_name": "Test Client",
            "email": "test@example.com",
            "practice_type": "KITAS",
            "expiry_date": "2024-12-31",
            "days_until_expiry": 30,
        }
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await get_upcoming_renewals(days=90)

            assert "total_renewals" in result
            assert "days_ahead" in result
            assert "renewals" in result
            assert result["total_renewals"] == 1
            assert result["days_ahead"] == 90


@pytest.mark.asyncio
async def test_get_upcoming_renewals_empty(mock_db_connection, mock_settings):
    """Test upcoming renewals with no results"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await get_upcoming_renewals(days=30)

            assert result["total_renewals"] == 0
            assert len(result["renewals"]) == 0


@pytest.mark.asyncio
async def test_get_upcoming_renewals_exception(mock_db_connection, mock_settings):
    """Test upcoming renewals with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_upcoming_renewals(days=90)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_client_full_context
# ============================================================================


@pytest.mark.asyncio
async def test_get_client_full_context_success(mock_db_connection, mock_settings):
    """Test successful retrieval of client full context"""
    from datetime import datetime

    conn, cursor = mock_db_connection

    # Mock fetchone for client, fetchall for practices, interactions, renewals
    cursor.fetchone.return_value = {
        "id": 1,
        "full_name": "Test Client",
        "email": "test@example.com",
        "first_contact_date": datetime.now(),
        "last_interaction_date": datetime.now(),
    }

    cursor.fetchall.side_effect = [
        [{"id": 1, "status": "in_progress", "practice_type_name": "KITAS"}],  # practices
        [{"id": 1, "interaction_date": datetime.now(), "action_items": ["Follow up"]}],  # interactions
        [{"id": 1, "practice_type_name": "KITAS", "days_until_expiry": 30}],  # renewals
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await get_client_full_context(client_id=1)

            assert "client" in result
            assert "practices" in result
            assert "interactions" in result
            assert "renewals" in result
            assert "action_items" in result
            assert "summary" in result
            assert result["practices"]["total"] == 1
            assert result["practices"]["active"] == 1


@pytest.mark.asyncio
async def test_get_client_full_context_not_found(mock_db_connection, mock_settings):
    """Test client full context with non-existent client"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_full_context(client_id=999)

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_client_full_context_exception(mock_db_connection, mock_settings):
    """Test client full context with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_full_context(client_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_team_overview
# ============================================================================


@pytest.mark.asyncio
async def test_get_team_overview_success(mock_db_connection, mock_settings):
    """Test successful retrieval of team overview"""
    conn, cursor = mock_db_connection

    # Mock fetchone for total clients, renewals, interactions
    # Mock fetchall for status, team members, practice types
    cursor.fetchone.side_effect = [
        {"count": 50},  # total_active_clients
        {"count": 10},  # renewals_next_30_days
        {"count": 25},  # interactions_last_7_days
    ]

    cursor.fetchall.side_effect = [
        [{"status": "in_progress", "count": 20}, {"status": "completed", "count": 30}],  # practices_by_status
        [{"assigned_to": "team1@example.com", "count": 15}],  # active_practices_by_team_member
        [{"code": "KITAS", "name": "KITAS", "count": 10}],  # active_practices_by_type
    ]

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            result = await get_team_overview()

            assert "total_active_clients" in result
            assert "practices_by_status" in result
            assert "active_practices_by_team_member" in result
            assert "renewals_next_30_days" in result
            assert "interactions_last_7_days" in result
            assert "active_practices_by_type" in result
            assert result["total_active_clients"] == 50
            assert result["renewals_next_30_days"] == 10


@pytest.mark.asyncio
async def test_get_team_overview_exception(mock_db_connection, mock_settings):
    """Test team overview with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_shared_memory.settings", mock_settings):
        with patch("app.routers.crm_shared_memory.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_team_overview()

            assert exc_info.value.status_code == 500
