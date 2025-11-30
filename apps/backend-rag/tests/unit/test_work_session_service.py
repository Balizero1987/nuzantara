"""
Unit tests for Work Session Service
100% coverage target with comprehensive mocking
"""

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, mock_open, patch

import asyncpg
import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.work_session_service import WorkSessionService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings configuration"""
    with patch("app.core.config.settings") as mock:
        mock.database_url = "postgresql://test:test@localhost/test"
        yield mock


@pytest.fixture
def work_session_service(mock_settings):
    """Create WorkSessionService instance"""
    with patch("services.work_session_service.logger"), patch(
        "pathlib.Path.mkdir"
    ), patch("pathlib.Path.exists", return_value=True):
        service = WorkSessionService()
        service.pool = MagicMock(spec=asyncpg.Pool)
        return service


@pytest.fixture
def work_session_service_no_db():
    """Create WorkSessionService without database"""
    with patch("app.core.config.settings") as mock:
        mock.database_url = None
    with patch("services.work_session_service.logger"), patch("pathlib.Path.mkdir"):
        service = WorkSessionService()
        service.pool = None
        return service


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_work_session_service_init(work_session_service):
    """Test WorkSessionService initialization"""
    assert work_session_service.db_url == "postgresql://test:test@localhost/test"
    assert work_session_service.zero_email == "zero@balizero.com"
    assert work_session_service.pool is not None


# ============================================================================
# Tests: connect
# ============================================================================


@pytest.mark.asyncio
async def test_connect_success(work_session_service):
    """Test connecting to database successfully"""
    with patch("asyncpg.create_pool", new_callable=AsyncMock) as mock_pool:
        mock_pool.return_value = MagicMock()

        await work_session_service.connect()

        assert work_session_service.pool is not None
        mock_pool.assert_called_once()


@pytest.mark.asyncio
async def test_connect_no_database_url(work_session_service_no_db):
    """Test connecting without database URL"""
    await work_session_service_no_db.connect()

    assert work_session_service_no_db.pool is None


# ============================================================================
# Tests: start_session
# ============================================================================


@pytest.mark.asyncio
async def test_start_session_success(work_session_service):
    """Test starting session successfully"""
    mock_session = {
        "id": "session_123",
        "session_start": datetime.now(),
    }
    # First call: check for existing session (returns None)
    # Second call: fetch newly created session (returns mock_session)
    work_session_service.pool.fetchrow = AsyncMock(side_effect=[None, mock_session])
    work_session_service.pool.execute = AsyncMock()

    with patch.object(work_session_service, "_write_to_log"), patch.object(
        work_session_service, "_notify_zero", new_callable=AsyncMock
    ):
        result = await work_session_service.start_session(
            "user123", "User Name", "user@example.com"
        )

        assert result["status"] == "started"
        assert "session_id" in result
        assert result["user"] == "User Name"


@pytest.mark.asyncio
async def test_start_session_already_active(work_session_service):
    """Test starting session when already active"""
    existing_session = {
        "id": "existing_123",
        "session_start": datetime.now(),
    }
    work_session_service.pool.fetchrow = AsyncMock(return_value=existing_session)

    result = await work_session_service.start_session("user123", "User Name", "user@example.com")

    assert result["status"] == "already_active"
    assert result["session_id"] == "existing_123"


@pytest.mark.asyncio
async def test_start_session_no_database(work_session_service_no_db):
    """Test starting session without database"""
    result = await work_session_service_no_db.start_session(
        "user123", "User Name", "user@example.com"
    )

    assert "error" in result
    assert "not available" in result["error"].lower()


@pytest.mark.asyncio
async def test_start_session_exception(work_session_service):
    """Test starting session with exception"""
    work_session_service.pool.fetchrow = AsyncMock(side_effect=Exception("DB Error"))

    result = await work_session_service.start_session("user123", "User Name", "user@example.com")

    assert "error" in result


# ============================================================================
# Tests: update_activity
# ============================================================================


@pytest.mark.asyncio
async def test_update_activity_success(work_session_service):
    """Test updating activity successfully"""
    work_session_service.pool.execute = AsyncMock()

    await work_session_service.update_activity("user123")

    work_session_service.pool.execute.assert_called_once()


@pytest.mark.asyncio
async def test_update_activity_no_database(work_session_service_no_db):
    """Test updating activity without database"""
    await work_session_service_no_db.update_activity("user123")
    # Should not raise exception


# ============================================================================
# Tests: increment_conversations
# ============================================================================


@pytest.mark.asyncio
async def test_increment_conversations_success(work_session_service):
    """Test incrementing conversations successfully"""
    work_session_service.pool.execute = AsyncMock()

    await work_session_service.increment_conversations("user123")

    work_session_service.pool.execute.assert_called_once()


@pytest.mark.asyncio
async def test_increment_conversations_no_database(work_session_service_no_db):
    """Test incrementing conversations without database"""
    await work_session_service_no_db.increment_conversations("user123")
    # Should not raise exception


# ============================================================================
# Tests: end_session
# ============================================================================


@pytest.mark.asyncio
async def test_end_session_success(work_session_service):
    """Test ending session successfully"""
    mock_session = {
        "id": "session_123",
        "session_start": datetime.now() - timedelta(hours=8),
        "user_name": "User Name",
        "user_email": "user@example.com",
        "activities_count": 50,
        "conversations_count": 20,
    }
    work_session_service.pool.fetchrow = AsyncMock(return_value=mock_session)
    work_session_service.pool.execute = AsyncMock()

    with patch.object(work_session_service, "_write_to_log"), patch.object(
        work_session_service, "_notify_zero_session_end", new_callable=AsyncMock
    ):
        result = await work_session_service.end_session("user123", notes="Completed work")

        assert result["status"] == "completed"
        assert result["session_id"] == "session_123"
        assert result["duration_minutes"] > 0
        assert result["activities"] == 50
        assert result["conversations"] == 20


@pytest.mark.asyncio
async def test_end_session_no_active_session(work_session_service):
    """Test ending session with no active session"""
    work_session_service.pool.fetchrow = AsyncMock(return_value=None)

    result = await work_session_service.end_session("user123")

    assert result["status"] == "no_active_session"


@pytest.mark.asyncio
async def test_end_session_no_database(work_session_service_no_db):
    """Test ending session without database"""
    result = await work_session_service_no_db.end_session("user123")

    assert "error" in result
    assert "not available" in result["error"].lower()


# ============================================================================
# Tests: get_today_sessions
# ============================================================================


@pytest.mark.asyncio
async def test_get_today_sessions_success(work_session_service):
    """Test getting today's sessions successfully"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now(),
            "session_end": None,
            "duration_minutes": None,
            "activities_count": 10,
            "conversations_count": 5,
            "status": "active",
            "last_activity": datetime.now(),
            "notes": None,
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_today_sessions()

    assert len(result) == 1
    assert result[0]["user_name"] == "User 1"


@pytest.mark.asyncio
async def test_get_today_sessions_no_database(work_session_service_no_db):
    """Test getting today's sessions without database"""
    result = await work_session_service_no_db.get_today_sessions()

    assert result == []


# ============================================================================
# Tests: get_week_summary
# ============================================================================


@pytest.mark.asyncio
async def test_get_week_summary_success(work_session_service):
    """Test getting week summary successfully"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now() - timedelta(days=i),
            "duration_minutes": 480,
            "conversations_count": 10,
            "activities_count": 50,
        }
        for i in range(5)
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_week_summary()

    assert "week_start" in result
    assert "week_end" in result
    assert "team_stats" in result
    assert "total_team_hours" in result
    assert len(result["team_stats"]) > 0


@pytest.mark.asyncio
async def test_get_week_summary_no_database(work_session_service_no_db):
    """Test getting week summary without database"""
    result = await work_session_service_no_db.get_week_summary()

    assert result == {}


# ============================================================================
# Tests: generate_daily_report
# ============================================================================


@pytest.mark.asyncio
async def test_generate_daily_report_success(work_session_service):
    """Test generating daily report successfully"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now().replace(hour=9, minute=0),
            "session_end": datetime.now().replace(hour=17, minute=0),
            "duration_minutes": 480,
            "activities_count": 50,
            "conversations_count": 20,
            "status": "completed",
            "notes": None,
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert "date" in result
    assert "total_hours" in result
    assert "total_conversations" in result
    assert "team_members_active" in result
    assert "team_summary" in result
    assert result["total_hours"] > 0


@pytest.mark.asyncio
async def test_generate_daily_report_with_date(work_session_service):
    """Test generating daily report for specific date"""
    target_date = datetime.now() - timedelta(days=1)
    work_session_service.pool.fetch = AsyncMock(return_value=[])
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report(target_date)

    assert result["date"] == target_date.strftime("%Y-%m-%d")


@pytest.mark.asyncio
async def test_generate_daily_report_no_database(work_session_service_no_db):
    """Test generating daily report without database"""
    result = await work_session_service_no_db.generate_daily_report()

    assert "error" in result
    assert "not available" in result["error"].lower()


# ============================================================================
# Tests: _write_to_log
# ============================================================================


def test_write_to_log_success(work_session_service):
    """Test writing to log file successfully"""
    with patch("builtins.open", mock_open()) as mock_file:
        work_session_service._write_to_log("test_event", {"key": "value"})

        mock_file.assert_called_once()
        # Verify JSON was written
        write_calls = mock_file.return_value.write.call_args_list
        assert len(write_calls) > 0


def test_write_to_log_exception(work_session_service):
    """Test writing to log file with exception"""
    with patch("builtins.open", side_effect=Exception("File error")):
        # Should not raise exception
        work_session_service._write_to_log("test_event", {"key": "value"})


# ============================================================================
# Tests: _notify_zero
# ============================================================================


@pytest.mark.asyncio
async def test_notify_zero(work_session_service):
    """Test notifying ZERO"""
    with patch("services.work_session_service.logger") as mock_logger:
        await work_session_service._notify_zero("Test Subject", "Test Message")

        # Should log the notification
        assert mock_logger.info.called


# ============================================================================
# Tests: _notify_zero_session_end
# ============================================================================


@pytest.mark.asyncio
async def test_notify_zero_session_end_with_notes(work_session_service):
    """Test notifying ZERO about session end with notes"""
    start = datetime.now() - timedelta(hours=8, minutes=30)
    end = datetime.now()

    with patch.object(work_session_service, "_notify_zero", new_callable=AsyncMock) as mock_notify:
        await work_session_service._notify_zero_session_end(
            user_name="John Doe",
            user_email="john@example.com",
            start=start,
            end=end,
            duration_minutes=510,
            activities=100,
            conversations=25,
            notes="Finished all tasks for the day",
        )

        mock_notify.assert_called_once()
        call_args = mock_notify.call_args[0]
        assert "John Doe" in call_args[0]
        assert "8h 30m" in call_args[0]
        assert "25 conversations" in call_args[1]
        assert "100 total activities" in call_args[1]
        assert "Finished all tasks for the day" in call_args[1]


@pytest.mark.asyncio
async def test_notify_zero_session_end_without_notes(work_session_service):
    """Test notifying ZERO about session end without notes"""
    start = datetime.now() - timedelta(hours=4, minutes=15)
    end = datetime.now()

    with patch.object(work_session_service, "_notify_zero", new_callable=AsyncMock) as mock_notify:
        await work_session_service._notify_zero_session_end(
            user_name="Jane Smith",
            user_email="jane@example.com",
            start=start,
            end=end,
            duration_minutes=255,
            activities=50,
            conversations=10,
            notes=None,
        )

        mock_notify.assert_called_once()
        call_args = mock_notify.call_args[0]
        assert "Jane Smith" in call_args[0]
        assert "4h 15m" in call_args[0]
        # Should not contain notes section
        assert "NOTES FROM TEAM MEMBER" not in call_args[1]


@pytest.mark.asyncio
async def test_notify_zero_session_end_zero_hours(work_session_service):
    """Test notifying ZERO about session end with less than 1 hour"""
    start = datetime.now() - timedelta(minutes=45)
    end = datetime.now()

    with patch.object(work_session_service, "_notify_zero", new_callable=AsyncMock) as mock_notify:
        await work_session_service._notify_zero_session_end(
            user_name="Bob Wilson",
            user_email="bob@example.com",
            start=start,
            end=end,
            duration_minutes=45,
            activities=5,
            conversations=2,
            notes=None,
        )

        mock_notify.assert_called_once()
        call_args = mock_notify.call_args[0]
        assert "0h 45m" in call_args[0]


# ============================================================================
# Tests: _ensure_data_dir edge cases
# ============================================================================


def test_ensure_data_dir_success():
    """Test ensuring data directory succeeds"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.database_url = "postgresql://test"
        with patch("pathlib.Path.mkdir") as mock_mkdir, patch(
            "services.work_session_service.logger"
        ) as mock_logger:
            service = WorkSessionService()
            mock_mkdir.assert_called_once_with(parents=True, exist_ok=True)
            # Check that logger.info was called
            assert any("Work sessions log" in str(call) for call in mock_logger.info.call_args_list)


def test_ensure_data_dir_exception():
    """Test ensuring data directory with exception"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.database_url = "postgresql://test"
        with patch("pathlib.Path.mkdir", side_effect=PermissionError("No permission")), patch(
            "services.work_session_service.logger"
        ) as mock_logger:
            service = WorkSessionService()
            # Should catch exception and log warning
            assert any(
                "Could not create data directory" in str(call)
                for call in mock_logger.warning.call_args_list
            )


# ============================================================================
# Tests: update_activity exception handling
# ============================================================================


@pytest.mark.asyncio
async def test_update_activity_exception(work_session_service):
    """Test update_activity with database exception"""
    work_session_service.pool.execute = AsyncMock(side_effect=Exception("DB Error"))

    with patch("services.work_session_service.logger"):
        # Should not raise exception
        await work_session_service.update_activity("user123")


# ============================================================================
# Tests: increment_conversations exception handling
# ============================================================================


@pytest.mark.asyncio
async def test_increment_conversations_exception(work_session_service):
    """Test increment_conversations with database exception"""
    work_session_service.pool.execute = AsyncMock(side_effect=Exception("DB Error"))

    with patch("services.work_session_service.logger"):
        # Should not raise exception
        await work_session_service.increment_conversations("user123")


# ============================================================================
# Tests: end_session edge cases
# ============================================================================


@pytest.mark.asyncio
async def test_end_session_with_none_notes(work_session_service):
    """Test ending session with None notes"""
    mock_session = {
        "id": "session_456",
        "session_start": datetime.now() - timedelta(hours=5),
        "user_name": "Test User",
        "user_email": "test@example.com",
        "activities_count": 30,
        "conversations_count": 15,
    }
    work_session_service.pool.fetchrow = AsyncMock(return_value=mock_session)
    work_session_service.pool.execute = AsyncMock()

    with patch.object(work_session_service, "_write_to_log"), patch.object(
        work_session_service, "_notify_zero_session_end", new_callable=AsyncMock
    ) as mock_notify:
        result = await work_session_service.end_session("user123", notes=None)

        assert result["status"] == "completed"
        # Verify notification was called with None notes
        mock_notify.assert_called_once()
        assert mock_notify.call_args[1]["notes"] is None


@pytest.mark.asyncio
async def test_end_session_database_exception(work_session_service):
    """Test ending session with database exception"""
    work_session_service.pool.fetchrow = AsyncMock(side_effect=Exception("Connection lost"))

    result = await work_session_service.end_session("user123")

    assert "error" in result
    assert "Connection lost" in result["error"]


# ============================================================================
# Tests: get_week_summary edge cases
# ============================================================================


@pytest.mark.asyncio
async def test_get_week_summary_empty_sessions(work_session_service):
    """Test week summary with no sessions"""
    work_session_service.pool.fetch = AsyncMock(return_value=[])

    result = await work_session_service.get_week_summary()

    assert result["team_stats"] == []
    assert result["total_team_hours"] == 0


@pytest.mark.asyncio
async def test_get_week_summary_multiple_users(work_session_service):
    """Test week summary with multiple users"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now() - timedelta(days=1),
            "duration_minutes": 480,
            "conversations_count": 10,
            "activities_count": 50,
        },
        {
            "user_name": "User 2",
            "user_email": "user2@example.com",
            "session_start": datetime.now() - timedelta(days=1),
            "duration_minutes": 360,
            "conversations_count": 8,
            "activities_count": 40,
        },
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now() - timedelta(days=2),
            "duration_minutes": 420,
            "conversations_count": 12,
            "activities_count": 55,
        },
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_week_summary()

    assert len(result["team_stats"]) == 2  # Two unique users
    assert result["total_team_hours"] > 0

    # Check User 1 stats
    user1_stats = next(s for s in result["team_stats"] if s["email"] == "user1@example.com")
    assert user1_stats["days_worked"] == 2
    assert user1_stats["total_conversations"] == 22
    assert user1_stats["total_activities"] == 105


@pytest.mark.asyncio
async def test_get_week_summary_none_values(work_session_service):
    """Test week summary with None duration and counts"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now(),
            "duration_minutes": None,
            "conversations_count": None,
            "activities_count": None,
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_week_summary()

    assert len(result["team_stats"]) == 1
    user_stats = result["team_stats"][0]
    assert user_stats["total_hours"] == 0
    assert user_stats["total_conversations"] == 0
    assert user_stats["total_activities"] == 0


@pytest.mark.asyncio
async def test_get_week_summary_same_day_multiple_sessions(work_session_service):
    """Test week summary with multiple sessions on same day"""
    same_date = datetime.now() - timedelta(days=1)
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": same_date.replace(hour=9),
            "duration_minutes": 240,
            "conversations_count": 5,
            "activities_count": 25,
        },
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": same_date.replace(hour=14),
            "duration_minutes": 240,
            "conversations_count": 5,
            "activities_count": 25,
        },
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_week_summary()

    user_stats = result["team_stats"][0]
    assert user_stats["days_worked"] == 1  # Same day
    assert user_stats["total_hours"] == 8.0  # 4 + 4 hours
    assert user_stats["avg_hours_per_day"] == 8.0


@pytest.mark.asyncio
async def test_get_week_summary_zero_days_edge_case(work_session_service):
    """Test week summary calculation when days_worked is 0"""
    # This tests the edge case in line 352-354
    mock_sessions = []
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)

    result = await work_session_service.get_week_summary()

    # Should handle empty stats gracefully
    assert result["total_team_hours"] == 0


# ============================================================================
# Tests: generate_daily_report edge cases
# ============================================================================


@pytest.mark.asyncio
async def test_generate_daily_report_empty_sessions(work_session_service):
    """Test daily report with no sessions"""
    work_session_service.pool.fetch = AsyncMock(return_value=[])
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert result["total_hours"] == 0
    assert result["total_conversations"] == 0
    assert result["team_members_active"] == 0
    assert result["team_summary"] == []


@pytest.mark.asyncio
async def test_generate_daily_report_active_session(work_session_service):
    """Test daily report with active session (no end time)"""
    mock_sessions = [
        {
            "user_name": "Active User",
            "user_email": "active@example.com",
            "session_start": datetime.now().replace(hour=9, minute=0),
            "session_end": None,  # Still active
            "duration_minutes": None,
            "activities_count": 25,
            "conversations_count": 10,
            "status": "active",
            "notes": None,
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert result["team_members_active"] == 1
    assert result["team_summary"][0]["end"] == "In corso"
    assert result["team_summary"][0]["hours"] == 0


@pytest.mark.asyncio
async def test_generate_daily_report_none_values(work_session_service):
    """Test daily report with None duration and counts"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now(),
            "session_end": None,
            "duration_minutes": None,
            "activities_count": None,
            "conversations_count": None,
            "status": "active",
            "notes": None,
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert result["total_hours"] == 0
    assert result["total_conversations"] == 0
    assert result["team_summary"][0]["conversations"] == 0
    assert result["team_summary"][0]["activities"] == 0


@pytest.mark.asyncio
async def test_generate_daily_report_save_exception(work_session_service):
    """Test daily report when save to database fails"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now(),
            "session_end": datetime.now(),
            "duration_minutes": 480,
            "activities_count": 50,
            "conversations_count": 20,
            "status": "completed",
            "notes": "Test notes",
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock(side_effect=Exception("Save failed"))

    with patch("services.work_session_service.logger"):
        result = await work_session_service.generate_daily_report()

        # Should still return report even if save fails
        assert "date" in result
        assert result["total_hours"] > 0


@pytest.mark.asyncio
async def test_generate_daily_report_with_notes(work_session_service):
    """Test daily report includes notes from sessions"""
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": datetime.now().replace(hour=9),
            "session_end": datetime.now().replace(hour=17),
            "duration_minutes": 480,
            "activities_count": 50,
            "conversations_count": 20,
            "status": "completed",
            "notes": "Completed project milestone",
        }
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert result["team_summary"][0]["notes"] == "Completed project milestone"


@pytest.mark.asyncio
async def test_generate_daily_report_multiple_users(work_session_service):
    """Test daily report with multiple users"""
    now = datetime.now()
    mock_sessions = [
        {
            "user_name": "User 1",
            "user_email": "user1@example.com",
            "session_start": now.replace(hour=9),
            "session_end": now.replace(hour=17),
            "duration_minutes": 480,
            "activities_count": 50,
            "conversations_count": 20,
            "status": "completed",
            "notes": None,
        },
        {
            "user_name": "User 2",
            "user_email": "user2@example.com",
            "session_start": now.replace(hour=10),
            "session_end": now.replace(hour=18),
            "duration_minutes": 480,
            "activities_count": 60,
            "conversations_count": 25,
            "status": "completed",
            "notes": None,
        },
    ]
    work_session_service.pool.fetch = AsyncMock(return_value=mock_sessions)
    work_session_service.pool.execute = AsyncMock()

    result = await work_session_service.generate_daily_report()

    assert result["team_members_active"] == 2
    assert result["total_hours"] == 16.0
    assert result["total_conversations"] == 45


# ============================================================================
# Tests: start_session additional edge cases
# ============================================================================


@pytest.mark.asyncio
async def test_start_session_calls_write_to_log(work_session_service):
    """Test that start_session writes to log file"""
    mock_session = {
        "id": "session_789",
        "session_start": datetime.now(),
    }
    work_session_service.pool.fetchrow = AsyncMock(side_effect=[None, mock_session])

    with patch.object(work_session_service, "_write_to_log") as mock_log, patch.object(
        work_session_service, "_notify_zero", new_callable=AsyncMock
    ):
        await work_session_service.start_session("user123", "Test User", "test@example.com")

        mock_log.assert_called_once()
        # Check log event type
        assert mock_log.call_args[0][0] == "session_start"
        # Check log data
        log_data = mock_log.call_args[0][1]
        assert log_data["session_id"] == "session_789"
        assert log_data["user_id"] == "user123"


@pytest.mark.asyncio
async def test_start_session_calls_notify_zero(work_session_service):
    """Test that start_session notifies ZERO"""
    mock_session = {
        "id": "session_999",
        "session_start": datetime.now(),
    }
    work_session_service.pool.fetchrow = AsyncMock(side_effect=[None, mock_session])

    with patch.object(work_session_service, "_write_to_log"), patch.object(
        work_session_service, "_notify_zero", new_callable=AsyncMock
    ) as mock_notify:
        await work_session_service.start_session("user123", "Test User", "test@example.com")

        mock_notify.assert_called_once()
        # Check notification content
        assert "Test User" in mock_notify.call_args[1]["subject"]
        assert "started work" in mock_notify.call_args[1]["subject"]


# ============================================================================
# Tests: end_session write_to_log
# ============================================================================


@pytest.mark.asyncio
async def test_end_session_calls_write_to_log(work_session_service):
    """Test that end_session writes to log file"""
    mock_session = {
        "id": "session_123",
        "session_start": datetime.now() - timedelta(hours=8),
        "user_name": "Test User",
        "user_email": "test@example.com",
        "activities_count": 50,
        "conversations_count": 20,
    }
    work_session_service.pool.fetchrow = AsyncMock(return_value=mock_session)
    work_session_service.pool.execute = AsyncMock()

    with patch.object(work_session_service, "_write_to_log") as mock_log, patch.object(
        work_session_service, "_notify_zero_session_end", new_callable=AsyncMock
    ):
        await work_session_service.end_session("user123", notes="Test notes")

        mock_log.assert_called_once()
        # Check log event type
        assert mock_log.call_args[0][0] == "session_end"
        # Check log includes all expected fields
        log_data = mock_log.call_args[0][1]
        assert "session_id" in log_data
        assert "duration_minutes" in log_data
        assert "duration_hours" in log_data
        assert log_data["notes"] == "Test notes"


# ============================================================================
# Tests: Additional initialization scenarios
# ============================================================================


def test_work_session_service_init_no_db_url():
    """Test WorkSessionService initialization without database URL"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.database_url = None
        with patch("services.work_session_service.logger"), patch("pathlib.Path.mkdir"):
            service = WorkSessionService()
            assert service.db_url is None
            assert service.zero_email == "zero@balizero.com"


def test_work_session_service_log_file_path():
    """Test that log file path is correctly set"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.database_url = "postgresql://test"
        with patch("services.work_session_service.logger"), patch("pathlib.Path.mkdir"):
            service = WorkSessionService()
            assert service.log_file.name == "work_sessions_log.jsonl"
            assert "data" in str(service.log_file)

