"""
Unit tests for CRM Clients Router
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.crm_clients import (
    ClientCreate,
    ClientResponse,
    ClientUpdate,
    create_client,
    delete_client,
    get_client,
    get_client_by_email,
    get_client_summary,
    get_clients_stats,
    list_clients,
    update_client,
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


@pytest.fixture
def sample_client_data():
    """Sample client data"""
    return {
        "id": 1,
        "uuid": "test-uuid-123",
        "full_name": "Test Client",
        "email": "test@example.com",
        "phone": "+1234567890",
        "whatsapp": "+1234567890",
        "nationality": "Italian",
        "status": "active",
        "client_type": "individual",
        "assigned_to": "team@example.com",
        "first_contact_date": datetime.now(),
        "last_interaction_date": None,
        "tags": ["vip"],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }


# ============================================================================
# Tests for create_client
# ============================================================================


@pytest.mark.asyncio
async def test_create_client_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful client creation"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_client_data

    client_data = ClientCreate(
        full_name="Test Client",
        email="test@example.com",
        phone="+1234567890",
        tags=["vip"],
    )

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await create_client(client_data, created_by="admin@example.com")

            assert isinstance(result, ClientResponse)
            assert result.full_name == "Test Client"
            assert result.email == "test@example.com"
            cursor.execute.assert_called_once()
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_client_database_error(mock_db_connection, mock_settings):
    """Test client creation with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    client_data = ClientCreate(full_name="Test Client")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await create_client(client_data, created_by="admin@example.com")

            assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_create_client_no_database_url():
    """Test client creation without database URL"""
    mock_settings = MagicMock()
    mock_settings.database_url = None

    client_data = ClientCreate(full_name="Test Client")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", side_effect=Exception("No DB")):
            with pytest.raises(Exception):
                await create_client(client_data, created_by="admin@example.com")


# ============================================================================
# Tests for get_clients
# ============================================================================


@pytest.mark.asyncio
async def test_get_clients_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful clients retrieval"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_client_data]

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await list_clients(limit=10, offset=0)

            assert isinstance(result, list)
            assert len(result) == 1
            assert result[0].full_name == "Test Client"
            cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_clients_with_filters(mock_db_connection, mock_settings, sample_client_data):
    """Test clients retrieval with filters"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_client_data]

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await list_clients(
                limit=10,
                offset=0,
                status="active",
                assigned_to="team@example.com",
                search="Test",
            )

            assert isinstance(result, list)
            cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_clients_empty(mock_db_connection, mock_settings):
    """Test clients retrieval with no results"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await list_clients()

            assert isinstance(result, list)
            assert len(result) == 0


# ============================================================================
# Tests for get_client
# ============================================================================


@pytest.mark.asyncio
async def test_get_client_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful client retrieval by ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_client_data

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await get_client(client_id=1)

            assert isinstance(result, ClientResponse)
            assert result.id == 1
            assert result.full_name == "Test Client"


@pytest.mark.asyncio
async def test_get_client_not_found(mock_db_connection, mock_settings):
    """Test client retrieval with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_client(client_id=999)

            assert exc_info.value.status_code == 404


# ============================================================================
# Tests for update_client
# ============================================================================


@pytest.mark.asyncio
async def test_update_client_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful client update"""
    conn, cursor = mock_db_connection
    updated_data = {**sample_client_data, "name": "Updated Client"}
    cursor.fetchone.side_effect = [
        updated_data,  # First call for update
    ]

    # Use allowed field name instead of full_name
    update_data = ClientUpdate(status="active", notes="Updated notes")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await update_client(
                client_id=1, updates=update_data, updated_by="admin@example.com"
            )

            assert isinstance(result, ClientResponse)
            assert result.status == "active"
            assert cursor.execute.call_count >= 2  # Update + activity log
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_client_not_found(mock_db_connection, mock_settings):
    """Test client update with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    update_data = ClientUpdate(status="inactive")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_client(
                    client_id=999, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_client_partial(mock_db_connection, mock_settings, sample_client_data):
    """Test partial client update"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_client_data

    update_data = ClientUpdate(email="newemail@example.com")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await update_client(
                client_id=1, updates=update_data, updated_by="admin@example.com"
            )

            assert isinstance(result, ClientResponse)
            assert cursor.execute.call_count >= 1  # Update + optional activity log


# ============================================================================
# Additional tests for IntegrityError and exception handlers
# ============================================================================


@pytest.mark.asyncio
async def test_create_client_integrity_error(mock_db_connection, mock_settings):
    """Test client creation with IntegrityError (duplicate email)"""
    import psycopg2

    conn, cursor = mock_db_connection
    cursor.execute.side_effect = psycopg2.IntegrityError("Duplicate email")

    client_data = ClientCreate(full_name="Test Client", email="duplicate@example.com")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await create_client(client_data, created_by="admin@example.com")

            assert exc_info.value.status_code == 400
            assert "already exists" in exc_info.value.detail


@pytest.mark.asyncio
async def test_list_clients_exception(mock_db_connection, mock_settings):
    """Test list_clients with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database connection lost")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await list_clients()

            assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_client_exception(mock_db_connection, mock_settings):
    """Test get_client with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client(client_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_client_by_email
# ============================================================================


@pytest.mark.asyncio
async def test_get_client_by_email_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful client retrieval by email"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_client_data

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await get_client_by_email(email="test@example.com")

            assert isinstance(result, ClientResponse)
            assert result.email == "test@example.com"
            cursor.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_client_by_email_not_found(mock_db_connection, mock_settings):
    """Test client retrieval by email with non-existent email"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_by_email(email="nonexistent@example.com")

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_client_by_email_exception(mock_db_connection, mock_settings):
    """Test get_client_by_email with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_by_email(email="test@example.com")

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for update_client error cases
# ============================================================================


@pytest.mark.asyncio
async def test_update_client_invalid_field(mock_db_connection, mock_settings):
    """Test update_client with invalid field name"""
    conn, cursor = mock_db_connection

    # Create update with invalid field (not in allowed_fields)
    update_data = ClientUpdate(full_name="Test")  # full_name is not in allowed_fields

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_client(
                    client_id=1, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 400
            assert "Invalid field name" in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_client_no_fields(mock_db_connection, mock_settings):
    """Test update_client with no fields to update"""
    conn, cursor = mock_db_connection

    # Create empty update (all None values)
    update_data = ClientUpdate()

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_client(
                    client_id=1, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 400
            assert "No fields to update" in exc_info.value.detail


@pytest.mark.asyncio
async def test_update_client_json_fields(mock_db_connection, mock_settings, sample_client_data):
    """Test update_client with JSON fields (tags, custom_fields)"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_client_data

    # Update tags and custom_fields
    update_data = ClientUpdate(tags=["vip", "urgent"], custom_fields={"priority": "high"})

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await update_client(
                client_id=1, updates=update_data, updated_by="admin@example.com"
            )

            assert isinstance(result, ClientResponse)
            cursor.execute.assert_called()


@pytest.mark.asyncio
async def test_update_client_exception(mock_db_connection, mock_settings):
    """Test update_client with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    update_data = ClientUpdate(status="active")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_client(
                    client_id=1, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for delete_client
# ============================================================================


@pytest.mark.asyncio
async def test_delete_client_success(mock_db_connection, mock_settings):
    """Test successful client deletion (soft delete)"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = {"id": 1}

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await delete_client(client_id=1, deleted_by="admin@example.com")

            assert result["success"] is True
            assert "inactive" in result["message"]
            assert cursor.execute.call_count == 2  # Update + activity log
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_delete_client_not_found(mock_db_connection, mock_settings):
    """Test delete_client with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await delete_client(client_id=999, deleted_by="admin@example.com")

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_client_exception(mock_db_connection, mock_settings):
    """Test delete_client with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await delete_client(client_id=1, deleted_by="admin@example.com")

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_client_summary
# ============================================================================


@pytest.mark.asyncio
async def test_get_client_summary_success(mock_db_connection, mock_settings, sample_client_data):
    """Test successful client summary retrieval"""
    conn, cursor = mock_db_connection

    # Mock fetchone for client
    # Mock fetchall for practices, interactions, renewals
    cursor.fetchone.return_value = sample_client_data
    cursor.fetchall.side_effect = [
        [
            {
                "id": 1,
                "status": "in_progress",
                "practice_type_name": "Visa",
                "category": "immigration",
            }
        ],  # practices
        [{"id": 1, "type": "email", "interaction_date": datetime.now()}],  # interactions
        [{"id": 1, "status": "pending", "alert_date": datetime.now()}],  # renewals
    ]

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await get_client_summary(client_id=1)

            assert "client" in result
            assert "practices" in result
            assert "interactions" in result
            assert "renewals" in result
            assert result["practices"]["total"] == 1
            assert result["practices"]["active"] == 1


@pytest.mark.asyncio
async def test_get_client_summary_not_found(mock_db_connection, mock_settings):
    """Test get_client_summary with non-existent client"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_summary(client_id=999)

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_client_summary_exception(mock_db_connection, mock_settings):
    """Test get_client_summary with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_client_summary(client_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_clients_stats
# ============================================================================


@pytest.mark.asyncio
async def test_get_clients_stats_success(mock_db_connection, mock_settings):
    """Test successful clients stats retrieval"""
    conn, cursor = mock_db_connection

    # Mock fetchall for by_status and by_team_member
    # Mock fetchone for new_last_30_days
    cursor.fetchall.side_effect = [
        [{"status": "active", "count": 10}, {"status": "inactive", "count": 5}],  # by_status
        [
            {"assigned_to": "team1@example.com", "count": 8},
            {"assigned_to": "team2@example.com", "count": 7},
        ],  # by_team_member
    ]
    cursor.fetchone.return_value = {"count": 3}  # new_last_30_days

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            result = await get_clients_stats()

            assert "total" in result
            assert "by_status" in result
            assert "by_team_member" in result
            assert "new_last_30_days" in result
            assert result["total"] == 15  # 10 + 5
            assert result["by_status"]["active"] == 10
            assert result["new_last_30_days"] == 3


@pytest.mark.asyncio
async def test_get_clients_stats_exception(mock_db_connection, mock_settings):
    """Test get_clients_stats with database exception"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_clients.settings", mock_settings):
        with patch("app.routers.crm_clients.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_clients_stats()

            assert exc_info.value.status_code == 500
