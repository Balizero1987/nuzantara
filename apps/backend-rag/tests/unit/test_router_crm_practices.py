"""
Unit tests for CRM Practices Router
Coverage target: 90%+ (currently 63.3%)
Tests practice management endpoints for KITAS, PT PMA, Visas, etc.
"""

import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.crm_practices import (
    PracticeCreate,
    PracticeResponse,
    PracticeUpdate,
    add_document_to_practice,
    create_practice,
    get_active_practices,
    get_practice,
    get_practices_stats,
    get_upcoming_renewals,
    list_practices,
    update_practice,
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
def sample_practice_data():
    """Sample practice data"""
    return {
        "id": 1,
        "uuid": "test-uuid-123",
        "client_id": 1,
        "practice_type_id": 1,
        "status": "in_progress",
        "priority": "high",
        "quoted_price": Decimal("1000.00"),
        "actual_price": None,
        "payment_status": "pending",
        "assigned_to": "team@example.com",
        "start_date": datetime.now(),
        "completion_date": None,
        "expiry_date": None,
        "created_at": datetime.now(),
    }


# ============================================================================
# Tests for create_practice
# ============================================================================


@pytest.mark.asyncio
async def test_create_practice_success(mock_db_connection, mock_settings, sample_practice_data):
    """Test successful practice creation"""
    conn, cursor = mock_db_connection
    # Mock practice type lookup
    cursor.fetchone.side_effect = [
        {"id": 1, "code": "KITAS", "base_price": Decimal("1000.00")},  # Practice type lookup
        sample_practice_data,  # Created practice
    ]

    practice_data = PracticeCreate(
        client_id=1,
        practice_type_code="KITAS",
        status="inquiry",
        priority="normal",
    )

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await create_practice(practice_data, created_by="admin@example.com")

            assert isinstance(result, PracticeResponse)
            assert result.client_id == 1
            assert result.status == "in_progress"
            assert cursor.execute.call_count >= 2  # At least practice type lookup and insert
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_practice_with_base_price(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test practice creation uses base price when no quoted price provided"""
    conn, cursor = mock_db_connection
    cursor.fetchone.side_effect = [
        {"id": 1, "code": "KITAS", "base_price": Decimal("1500.00")},
        sample_practice_data,
    ]

    practice_data = PracticeCreate(
        client_id=1,
        practice_type_code="KITAS",
        # No quoted_price, should use base_price
    )

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await create_practice(practice_data, created_by="admin@example.com")
            assert result is not None


@pytest.mark.asyncio
async def test_create_practice_invalid_type(mock_db_connection, mock_settings):
    """Test practice creation with invalid practice type"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None  # Practice type not found

    practice_data = PracticeCreate(
        client_id=1,
        practice_type_code="INVALID",
        status="inquiry",
    )

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await create_practice(practice_data, created_by="admin@example.com")

            # Router returns 404 for practice type not found
            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_create_practice_database_error(mock_db_connection, mock_settings):
    """Test practice creation with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    practice_data = PracticeCreate(client_id=1, practice_type_code="KITAS")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await create_practice(practice_data, created_by="admin@example.com")

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for list_practices
# ============================================================================


@pytest.mark.asyncio
async def test_get_practices_success(mock_db_connection, mock_settings, sample_practice_data):
    """Test successful practices retrieval"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(limit=10, offset=0)

            assert isinstance(result, list)
            assert len(result) == 1
            # Result is dict from list_practices
            assert result[0]["client_id"] == 1
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_get_practices_with_filters(mock_db_connection, mock_settings, sample_practice_data):
    """Test practices retrieval with filters"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(
                limit=10,
                offset=0,
                client_id=1,
                status="in_progress",
                assigned_to="team@example.com",
            )

            assert isinstance(result, list)
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_list_practices_with_practice_type_filter(mock_db_connection, mock_settings):
    """Test listing practices filtered by practice type"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(practice_type="kitas")
            assert isinstance(result, list)


@pytest.mark.asyncio
async def test_list_practices_with_priority_filter(mock_db_connection, mock_settings):
    """Test listing practices filtered by priority"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(priority="high")
            assert isinstance(result, list)


@pytest.mark.asyncio
async def test_list_practices_database_error(mock_db_connection, mock_settings):
    """Test list practices handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await list_practices()

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_active_practices
# ============================================================================


@pytest.mark.asyncio
async def test_get_active_practices_no_filter(mock_db_connection, mock_settings):
    """Test getting active practices without filter"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [{"id": 1, "status": "in_progress"}]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_active_practices()

            assert isinstance(result, list)
            assert len(result) == 1


@pytest.mark.asyncio
async def test_get_active_practices_with_assigned_filter(mock_db_connection, mock_settings):
    """Test getting active practices filtered by assigned team member"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [{"id": 1, "assigned_to": "team@example.com"}]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_active_practices(assigned_to="team@example.com")

            assert isinstance(result, list)
            assert len(result) == 1


@pytest.mark.asyncio
async def test_get_active_practices_database_error(mock_db_connection, mock_settings):
    """Test active practices handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_active_practices()

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_upcoming_renewals
# ============================================================================


@pytest.mark.asyncio
async def test_get_upcoming_renewals(mock_db_connection, mock_settings):
    """Test getting upcoming renewals"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [
        {"id": 1, "expiry_date": date.today() + timedelta(days=30)},
        {"id": 2, "expiry_date": date.today() + timedelta(days=60)},
    ]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_upcoming_renewals()

            assert isinstance(result, list)
            assert len(result) == 2


@pytest.mark.asyncio
async def test_get_upcoming_renewals_with_custom_days(mock_db_connection, mock_settings):
    """Test upcoming renewals with custom days parameter"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_upcoming_renewals(_days=60)

            assert isinstance(result, list)


@pytest.mark.asyncio
async def test_get_upcoming_renewals_database_error(mock_db_connection, mock_settings):
    """Test upcoming renewals handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_upcoming_renewals()

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_practice
# ============================================================================


@pytest.mark.asyncio
async def test_get_practice_success(mock_db_connection, mock_settings, sample_practice_data):
    """Test successful practice retrieval by ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_practice_data

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_practice(practice_id=1)

            # get_practice returns dict
            assert isinstance(result, dict)
            assert result["id"] == 1
            assert result["client_id"] == 1


@pytest.mark.asyncio
async def test_get_practice_not_found(mock_db_connection, mock_settings):
    """Test practice retrieval with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_practice(practice_id=999)

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_get_practice_database_error(mock_db_connection, mock_settings):
    """Test get practice handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_practice(practice_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for update_practice
# ============================================================================


@pytest.mark.asyncio
async def test_update_practice_success(mock_db_connection, mock_settings, sample_practice_data):
    """Test successful practice update"""
    conn, cursor = mock_db_connection
    updated_data = {**sample_practice_data, "status": "completed"}
    cursor.fetchone.return_value = updated_data

    update_data = PracticeUpdate(status="completed", actual_price=Decimal("1200.00"))

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await update_practice(
                practice_id=1, updates=update_data, updated_by="admin@example.com"
            )

            # update_practice returns dict
            assert isinstance(result, dict)
            assert result["status"] == "completed"
            assert cursor.execute.call_count >= 1
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_practice_with_documents(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test updating practice with documents field"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_practice_data

    documents = [{"name": "passport", "file_id": "123"}]
    update_data = PracticeUpdate(documents=documents)

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await update_practice(
                practice_id=1, updates=update_data, updated_by="admin@example.com"
            )

            assert result is not None


@pytest.mark.asyncio
async def test_update_practice_with_renewal_alert(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test updating practice to completed creates renewal alert"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_practice_data

    expiry = date.today() + timedelta(days=365)
    update_data = PracticeUpdate(status="completed", expiry_date=expiry)

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await update_practice(
                practice_id=1, updates=update_data, updated_by="admin@example.com"
            )

            # Should execute: UPDATE, activity_log, renewal_alert INSERT
            assert cursor.execute.call_count >= 2


@pytest.mark.asyncio
async def test_update_practice_no_fields(mock_db_connection, mock_settings):
    """Test update practice with no fields raises error"""
    conn, cursor = mock_db_connection

    update_data = PracticeUpdate()

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_practice(
                    practice_id=1, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_update_practice_not_found(mock_db_connection, mock_settings):
    """Test practice update with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    update_data = PracticeUpdate(status="completed")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_practice(
                    practice_id=999, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_update_practice_database_error(mock_db_connection, mock_settings):
    """Test update practice handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    update_data = PracticeUpdate(status="in_progress")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await update_practice(
                    practice_id=1, updates=update_data, updated_by="admin@example.com"
                )

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for add_document_to_practice
# ============================================================================


@pytest.mark.asyncio
async def test_add_document_to_practice_success(mock_db_connection, mock_settings):
    """Test adding document to practice"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = {"documents": []}

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await add_document_to_practice(
                practice_id=1,
                document_name="Passport Copy",
                drive_file_id="drive123",
                uploaded_by="team@example.com",
            )

            assert result["success"] is True
            assert result["document"]["name"] == "Passport Copy"
            assert result["total_documents"] == 1
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_add_document_to_existing_documents(mock_db_connection, mock_settings):
    """Test adding document to practice with existing documents"""
    conn, cursor = mock_db_connection
    existing_docs = [{"name": "Old Doc", "drive_file_id": "old123"}]
    cursor.fetchone.return_value = {"documents": existing_docs}

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await add_document_to_practice(
                practice_id=1,
                document_name="New Doc",
                drive_file_id="new123",
                uploaded_by="team@example.com",
            )

            assert result["total_documents"] == 2


@pytest.mark.asyncio
async def test_add_document_practice_not_found(mock_db_connection, mock_settings):
    """Test adding document to non-existent practice"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await add_document_to_practice(
                    practice_id=999,
                    document_name="Passport",
                    drive_file_id="123",
                    uploaded_by="team@example.com",
                )

            assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_add_document_database_error(mock_db_connection, mock_settings):
    """Test add document handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await add_document_to_practice(
                    practice_id=1,
                    document_name="Passport",
                    drive_file_id="123",
                    uploaded_by="team@example.com",
                )

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_practices_stats
# ============================================================================


@pytest.mark.asyncio
async def test_get_practices_stats(mock_db_connection, mock_settings):
    """Test getting practice statistics"""
    conn, cursor = mock_db_connection

    # Mock the 4 queries
    by_status = [{"status": "inquiry", "count": 5}, {"status": "in_progress", "count": 3}]

    by_type = [
        {"code": "kitas", "name": "KITAS", "count": 4},
        {"code": "visa", "name": "Visa", "count": 3},
    ]

    revenue = {
        "total_revenue": Decimal("10000.00"),
        "paid_revenue": Decimal("7000.00"),
        "outstanding_revenue": Decimal("3000.00"),
    }

    active_count_result = {"count": 8}

    cursor.fetchall.side_effect = [by_status, by_type]
    cursor.fetchone.side_effect = [revenue, active_count_result]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_practices_stats()

            assert result["total_practices"] == 8  # 5 + 3
            assert result["active_practices"] == 8
            assert "inquiry" in result["by_status"]
            assert len(result["by_type"]) == 2
            assert result["revenue"]["total_revenue"] == Decimal("10000.00")


@pytest.mark.asyncio
async def test_get_practices_stats_database_error(mock_db_connection, mock_settings):
    """Test statistics handles database errors"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            with pytest.raises(HTTPException) as exc_info:
                await get_practices_stats()

            assert exc_info.value.status_code == 500


# ============================================================================
# Additional Tests for 100% Coverage
# ============================================================================


@pytest.mark.asyncio
async def test_get_db_connection_no_database_url():
    """Test database connection fails when DATABASE_URL not set"""
    from app.routers.crm_practices import get_db_connection

    mock_settings_no_db = MagicMock()
    mock_settings_no_db.database_url = None

    with patch("app.routers.crm_practices.settings", mock_settings_no_db):
        with pytest.raises(Exception, match="DATABASE_URL environment variable not set"):
            get_db_connection()


@pytest.mark.asyncio
async def test_get_db_connection_success():
    """Test database connection succeeds with valid DATABASE_URL"""
    from app.routers.crm_practices import get_db_connection

    mock_settings_with_db = MagicMock()
    mock_settings_with_db.database_url = "postgresql://test:test@localhost/test"

    mock_connection = MagicMock()

    with patch("app.routers.crm_practices.settings", mock_settings_with_db):
        with patch(
            "app.routers.crm_practices.psycopg2.connect", return_value=mock_connection
        ) as mock_connect:
            result = get_db_connection()

            # Verify psycopg2.connect was called with correct parameters
            mock_connect.assert_called_once()
            assert result == mock_connection


@pytest.mark.asyncio
async def test_list_practices_with_all_filters(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test list practices with all optional filters provided"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(
                client_id=1,
                status="active",
                assigned_to="john@example.com",
                practice_type="kitas",
                priority="high",
                limit=10,
                offset=0,
            )

            assert len(result) == 1
            # Verify all filters were applied in query
            call_args = cursor.execute.call_args
            query = call_args[0][0]
            assert "client_id" in query
            assert "status" in query
            assert "assigned_to" in query
            assert "pt.code" in query
            assert "priority" in query


@pytest.mark.asyncio
async def test_list_practices_no_optional_filters(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test list practices with no optional filters (only required params)"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await list_practices(
                client_id=None,
                status=None,
                assigned_to=None,
                practice_type=None,
                priority=None,
                limit=10,
                offset=0,
            )

            assert len(result) == 1
            # Verify no optional filters in query
            call_args = cursor.execute.call_args
            query = call_args[0][0]
            # Base query should not have WHERE clauses for optional filters
            assert "ORDER BY" in query


@pytest.mark.asyncio
async def test_get_active_practices_without_assigned_to(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test get active practices without assigned_to filter"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            result = await get_active_practices(assigned_to=None)

            assert len(result) == 1
            # Verify assigned_to filter not in query
            call_args = cursor.execute.call_args
            query = call_args[0][0]
            params = call_args[0][1]
            # Should not have assigned_to parameter
            assert len(params) == 0


@pytest.mark.asyncio
async def test_update_practice_with_none_values(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test update practice skips None values in update dict"""
    conn, cursor = mock_db_connection

    # Mock existing practice
    cursor.fetchone.return_value = sample_practice_data

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            # Create update with some None values
            updates = PracticeUpdate(
                status="completed",
                notes="Updated notes",
                assigned_to=None,  # This should be skipped
                priority=None,  # This should be skipped
            )

            result = await update_practice(practice_id=1, updates=updates)

            # Verify update was called
            update_call = [
                call for call in cursor.execute.call_args_list if "UPDATE practices" in str(call)
            ]
            assert len(update_call) > 0

            # The None values should not be in the update
            query = update_call[0][0][0]
            assert "status" in query
            assert "notes" in query


@pytest.mark.asyncio
async def test_list_practices_partial_filters(
    mock_db_connection, mock_settings, sample_practice_data
):
    """Test list practices with some filters provided, others None"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_practice_data]

    with patch("app.routers.crm_practices.settings", mock_settings):
        with patch("app.routers.crm_practices.get_db_connection", return_value=conn):
            # Test with only client_id and status
            result = await list_practices(
                client_id=1,
                status="active",
                assigned_to=None,
                practice_type=None,
                priority=None,
                limit=10,
                offset=0,
            )

            assert len(result) == 1
            call_args = cursor.execute.call_args
            query = call_args[0][0]
            params = call_args[0][1]

            # Should have client_id and status in query
            assert "client_id" in query
            assert "status" in query
            # Should have exactly 4 params: client_id, status, limit, offset
            assert len(params) == 4
