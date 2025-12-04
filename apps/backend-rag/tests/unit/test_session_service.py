"""
Unit tests for Session Service
100% coverage target with comprehensive mocking
"""

import json
import sys
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.session_service import SessionService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    redis_mock = AsyncMock()
    redis_mock.ping = AsyncMock(return_value=True)
    redis_mock.setex = AsyncMock()
    redis_mock.get = AsyncMock()
    redis_mock.delete = AsyncMock(return_value=1)
    redis_mock.expire = AsyncMock(return_value=True)
    redis_mock.ttl = AsyncMock(return_value=86400)
    redis_mock.scan_iter = AsyncMock()
    redis_mock.close = AsyncMock()
    return redis_mock


@pytest.fixture
def session_service(mock_redis):
    """Create SessionService instance with mocked Redis"""
    with patch("services.session_service.redis.from_url", return_value=mock_redis):
        service = SessionService("redis://localhost:6379", ttl_hours=24)
        service.redis = mock_redis
        return service


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(mock_redis):
    """Test initialization"""
    with patch("services.session_service.redis.from_url", return_value=mock_redis):
        service = SessionService("redis://localhost:6379", ttl_hours=24)

        assert service.redis is not None
        assert service.ttl.total_seconds() == 86400  # 24 hours


def test_init_exception():
    """Test initialization with exception"""
    with patch(
        "services.session_service.redis.from_url", side_effect=Exception("Connection error")
    ):
        with pytest.raises(Exception):
            SessionService("redis://localhost:6379")


# ============================================================================
# Tests for health_check
# ============================================================================


@pytest.mark.asyncio
async def test_health_check_success(session_service):
    """Test health_check successful"""
    result = await session_service.health_check()

    assert result is True
    session_service.redis.ping.assert_called_once()


@pytest.mark.asyncio
async def test_health_check_failure(session_service):
    """Test health_check failure"""
    session_service.redis.ping.side_effect = Exception("Connection failed")

    result = await session_service.health_check()

    assert result is False


# ============================================================================
# Tests for create_session
# ============================================================================


@pytest.mark.asyncio
async def test_create_session(session_service):
    """Test create_session"""
    session_id = await session_service.create_session()

    assert isinstance(session_id, str)
    assert len(session_id) == 36  # UUID length
    session_service.redis.setex.assert_called_once()


@pytest.mark.asyncio
async def test_create_session_exception(session_service):
    """Test create_session with exception"""
    session_service.redis.setex.side_effect = Exception("Redis error")

    with pytest.raises(Exception):
        await session_service.create_session()


# ============================================================================
# Tests for get_history
# ============================================================================


@pytest.mark.asyncio
async def test_get_history_success(session_service):
    """Test get_history successful"""
    session_id = str(uuid.uuid4())
    history_data = [{"role": "user", "content": "Hello"}]
    session_service.redis.get.return_value = json.dumps(history_data)

    result = await session_service.get_history(session_id)

    assert result == history_data
    session_service.redis.get.assert_called_once_with(f"session:{session_id}")


@pytest.mark.asyncio
async def test_get_history_not_found(session_service):
    """Test get_history when session not found"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.return_value = None

    result = await session_service.get_history(session_id)

    assert result is None


@pytest.mark.asyncio
async def test_get_history_json_error(session_service):
    """Test get_history with JSON decode error"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.return_value = "invalid json"

    result = await session_service.get_history(session_id)

    assert result is None


@pytest.mark.asyncio
async def test_get_history_exception(session_service):
    """Test get_history with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.side_effect = Exception("Redis error")

    result = await session_service.get_history(session_id)

    assert result is None


# ============================================================================
# Tests for update_history
# ============================================================================


@pytest.mark.asyncio
async def test_update_history_success(session_service):
    """Test update_history successful"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Hello"}]

    result = await session_service.update_history(session_id, history)

    assert result is True
    session_service.redis.setex.assert_called_once()


@pytest.mark.asyncio
async def test_update_history_invalid_format(session_service):
    """Test update_history with invalid format"""
    session_id = str(uuid.uuid4())

    result = await session_service.update_history(session_id, "not a list")

    assert result is False


@pytest.mark.asyncio
async def test_update_history_exception(session_service):
    """Test update_history with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.setex.side_effect = Exception("Redis error")

    result = await session_service.update_history(session_id, [])

    assert result is False


# ============================================================================
# Tests for delete_session
# ============================================================================


@pytest.mark.asyncio
async def test_delete_session_success(session_service):
    """Test delete_session successful"""
    session_id = str(uuid.uuid4())
    session_service.redis.delete.return_value = 1

    result = await session_service.delete_session(session_id)

    assert result is True
    session_service.redis.delete.assert_called_once_with(f"session:{session_id}")


@pytest.mark.asyncio
async def test_delete_session_not_found(session_service):
    """Test delete_session when session not found"""
    session_id = str(uuid.uuid4())
    session_service.redis.delete.return_value = 0

    result = await session_service.delete_session(session_id)

    assert result is False


@pytest.mark.asyncio
async def test_delete_session_exception(session_service):
    """Test delete_session with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.delete.side_effect = Exception("Redis error")

    result = await session_service.delete_session(session_id)

    assert result is False


# ============================================================================
# Tests for extend_ttl
# ============================================================================


@pytest.mark.asyncio
async def test_extend_ttl_success(session_service):
    """Test extend_ttl successful"""
    session_id = str(uuid.uuid4())

    result = await session_service.extend_ttl(session_id)

    assert result is True
    session_service.redis.expire.assert_called_once()


@pytest.mark.asyncio
async def test_extend_ttl_exception(session_service):
    """Test extend_ttl with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.expire.side_effect = Exception("Redis error")

    result = await session_service.extend_ttl(session_id)

    assert result is False


# ============================================================================
# Tests for get_session_info
# ============================================================================


@pytest.mark.asyncio
async def test_get_session_info_success(session_service):
    """Test get_session_info successful"""
    session_id = str(uuid.uuid4())
    history_data = [{"role": "user", "content": "Hello"}]
    session_service.redis.ttl.return_value = 86400
    session_service.redis.get.return_value = json.dumps(history_data)

    result = await session_service.get_session_info(session_id)

    assert result is not None
    assert result["session_id"] == session_id
    assert result["message_count"] == 1
    assert result["ttl_seconds"] == 86400


@pytest.mark.asyncio
async def test_get_session_info_not_found(session_service):
    """Test get_session_info when session not found"""
    session_id = str(uuid.uuid4())
    session_service.redis.ttl.return_value = -2

    result = await session_service.get_session_info(session_id)

    assert result is None


@pytest.mark.asyncio
async def test_get_session_info_exception(session_service):
    """Test get_session_info with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.ttl.side_effect = Exception("Redis error")

    result = await session_service.get_session_info(session_id)

    assert result is None


# ============================================================================
# Tests for cleanup_expired_sessions
# ============================================================================


@pytest.mark.asyncio
async def test_cleanup_expired_sessions(session_service):
    """Test cleanup_expired_sessions"""
    result = await session_service.cleanup_expired_sessions()

    assert result == 0


# ============================================================================
# Tests for get_analytics
# ============================================================================


@pytest.mark.asyncio
async def test_get_analytics_empty(session_service):
    """Test get_analytics with no sessions"""
    session_service.redis.scan_iter.return_value = iter([])

    result = await session_service.get_analytics()

    assert result["total_sessions"] == 0
    assert result["active_sessions"] == 0


@pytest.mark.asyncio
async def test_get_analytics_with_sessions(session_service):
    """Test get_analytics with sessions"""

    async def mock_scan_iter(pattern):
        for key in ["session:123", "session:456"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        json.dumps([{"role": "user", "content": "Hello"}]),
        json.dumps([{"role": "user", "content": "Hi"}]),
    ]

    result = await session_service.get_analytics()

    assert result["total_sessions"] == 2
    assert result["active_sessions"] == 2


@pytest.mark.asyncio
async def test_get_analytics_exception(session_service):
    """Test get_analytics with exception"""
    session_service.redis.scan_iter.side_effect = Exception("Redis error")

    result = await session_service.get_analytics()

    assert "error" in result
    assert result["total_sessions"] == 0


# ============================================================================
# Tests for update_history_with_ttl
# ============================================================================


@pytest.mark.asyncio
async def test_update_history_with_ttl_custom(session_service):
    """Test update_history_with_ttl with custom TTL"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Hello"}]

    result = await session_service.update_history_with_ttl(session_id, history, ttl_hours=48)

    assert result is True
    session_service.redis.setex.assert_called_once()


@pytest.mark.asyncio
async def test_update_history_with_ttl_default(session_service):
    """Test update_history_with_ttl with default TTL"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Hello"}]

    result = await session_service.update_history_with_ttl(session_id, history)

    assert result is True


@pytest.mark.asyncio
async def test_update_history_with_ttl_invalid_format(session_service):
    """Test update_history_with_ttl with invalid format"""
    session_id = str(uuid.uuid4())

    result = await session_service.update_history_with_ttl(session_id, "not a list")

    assert result is False


# ============================================================================
# Tests for extend_ttl_custom
# ============================================================================


@pytest.mark.asyncio
async def test_extend_ttl_custom(session_service):
    """Test extend_ttl_custom"""
    session_id = str(uuid.uuid4())

    result = await session_service.extend_ttl_custom(session_id, ttl_hours=48)

    assert result is True
    session_service.redis.expire.assert_called_once()


@pytest.mark.asyncio
async def test_extend_ttl_custom_exception(session_service):
    """Test extend_ttl_custom with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.expire.side_effect = Exception("Redis error")

    result = await session_service.extend_ttl_custom(session_id, ttl_hours=48)

    assert result is False


# ============================================================================
# Tests for export_session
# ============================================================================


@pytest.mark.asyncio
async def test_export_session_json(session_service):
    """Test export_session in JSON format"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Hello"}]
    session_service.redis.get.return_value = json.dumps(history)

    result = await session_service.export_session(session_id, format="json")

    assert result is not None
    assert session_id in result
    assert "Hello" in result


@pytest.mark.asyncio
async def test_export_session_markdown(session_service):
    """Test export_session in Markdown format"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Hello"}]
    session_service.redis.get.return_value = json.dumps(history)

    result = await session_service.export_session(session_id, format="markdown")

    assert result is not None
    assert "# Conversation Export" in result
    assert "Hello" in result


@pytest.mark.asyncio
async def test_export_session_not_found(session_service):
    """Test export_session when session not found"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.return_value = None

    result = await session_service.export_session(session_id)

    assert result is None


@pytest.mark.asyncio
async def test_export_session_exception(session_service):
    """Test export_session with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.side_effect = Exception("Redis error")

    result = await session_service.export_session(session_id)

    assert result is None


# ============================================================================
# Tests for close
# ============================================================================


@pytest.mark.asyncio
async def test_close(session_service):
    """Test close"""
    await session_service.close()

    session_service.redis.close.assert_called_once()


@pytest.mark.asyncio
async def test_close_exception(session_service):
    """Test close with exception"""
    session_service.redis.close.side_effect = Exception("Close error")

    # Should not raise exception
    await session_service.close()


@pytest.mark.asyncio
async def test_export_session_exception_during_json_dumps(session_service):
    """Test export_session handles exception during JSON serialization"""
    session_id = str(uuid.uuid4())

    # Mock get to return valid data
    history = [{"role": "user", "content": "test"}]
    session_service.redis.get = AsyncMock(return_value=json.dumps(history))

    # Mock json.dumps to raise exception
    with patch("services.session_service.json.dumps", side_effect=Exception("JSON error")):
        with patch("services.session_service.logger") as mock_logger:
            result = await session_service.export_session(session_id)

            assert result is None
            mock_logger.error.assert_called_once()


# ============================================================================
# Additional Tests - Edge Cases & Coverage
# ============================================================================


@pytest.mark.asyncio
async def test_get_session_info_data_none(session_service):
    """Test get_session_info when data is None"""
    session_id = str(uuid.uuid4())
    session_service.redis.ttl.return_value = 86400
    session_service.redis.get.return_value = None

    result = await session_service.get_session_info(session_id)

    assert result is None


@pytest.mark.asyncio
async def test_extend_ttl_false_return(session_service):
    """Test extend_ttl returns False when Redis returns False"""
    session_id = str(uuid.uuid4())
    session_service.redis.expire.return_value = False

    result = await session_service.extend_ttl(session_id)

    assert result is False


@pytest.mark.asyncio
async def test_extend_ttl_custom_false_return(session_service):
    """Test extend_ttl_custom returns False when Redis returns False"""
    session_id = str(uuid.uuid4())
    session_service.redis.expire.return_value = False

    result = await session_service.extend_ttl_custom(session_id, ttl_hours=48)

    assert result is False


@pytest.mark.asyncio
async def test_update_history_with_ttl_exception(session_service):
    """Test update_history_with_ttl with exception"""
    session_id = str(uuid.uuid4())
    session_service.redis.setex.side_effect = Exception("Redis error")

    result = await session_service.update_history_with_ttl(session_id, [])

    assert result is False


@pytest.mark.asyncio
async def test_get_analytics_with_message_ranges(session_service):
    """Test get_analytics with various message count ranges"""

    async def mock_scan_iter(pattern):
        for key in ["session:1", "session:2", "session:3", "session:4"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        json.dumps([{"role": "user"}] * 5),  # 0-10 range
        json.dumps([{"role": "user"}] * 15),  # 11-20 range
        json.dumps([{"role": "user"}] * 30),  # 21-50 range
        json.dumps([{"role": "user"}] * 60),  # 51+ range
    ]

    result = await session_service.get_analytics()

    assert result["total_sessions"] == 4
    assert result["sessions_by_range"]["0-10"] == 1
    assert result["sessions_by_range"]["11-20"] == 1
    assert result["sessions_by_range"]["21-50"] == 1
    assert result["sessions_by_range"]["51+"] == 1
    assert result["top_session"]["messages"] == 60


@pytest.mark.asyncio
async def test_get_analytics_with_json_error(session_service):
    """Test get_analytics with JSON decode error in session data"""

    async def mock_scan_iter(pattern):
        for key in ["session:1", "session:2"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        "invalid json",  # Should be skipped
        json.dumps([{"role": "user"}] * 5),
    ]

    result = await session_service.get_analytics()

    # Should skip the invalid JSON and process the valid one
    assert result["total_sessions"] == 2
    assert result["active_sessions"] == 1


@pytest.mark.asyncio
async def test_get_analytics_no_active_sessions(session_service):
    """Test get_analytics with sessions but no messages"""

    async def mock_scan_iter(pattern):
        for key in ["session:1", "session:2"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        json.dumps([]),  # Empty history
        json.dumps([]),  # Empty history
    ]

    result = await session_service.get_analytics()

    assert result["total_sessions"] == 2
    assert result["active_sessions"] == 0
    assert result["avg_messages_per_session"] == 0


@pytest.mark.asyncio
async def test_export_session_markdown_with_assistant(session_service):
    """Test export_session markdown with assistant messages"""
    session_id = str(uuid.uuid4())
    history = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
    ]
    session_service.redis.get.return_value = json.dumps(history)

    result = await session_service.export_session(session_id, format="markdown")

    assert result is not None
    assert "# Conversation Export" in result
    assert "👤 User" in result
    assert "🤖 Assistant" in result
    assert "Hello" in result
    assert "Hi there!" in result


@pytest.mark.asyncio
async def test_export_session_markdown_unknown_role(session_service):
    """Test export_session markdown with unknown role"""
    session_id = str(uuid.uuid4())
    history = [
        {"role": "system", "content": "System message"},
        {"content": "No role specified"},
    ]
    session_service.redis.get.return_value = json.dumps(history)

    result = await session_service.export_session(session_id, format="markdown")

    assert result is not None
    # Should handle unknown roles gracefully
    assert "System message" in result


@pytest.mark.asyncio
async def test_export_session_json_default(session_service):
    """Test export_session defaults to JSON format"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Test"}]
    session_service.redis.get.return_value = json.dumps(history)

    result = await session_service.export_session(session_id)  # No format specified

    assert result is not None
    parsed = json.loads(result)
    assert parsed["session_id"] == session_id
    assert parsed["message_count"] == 1


@pytest.mark.asyncio
async def test_get_history_empty_list(session_service):
    """Test get_history with empty history"""
    session_id = str(uuid.uuid4())
    session_service.redis.get.return_value = json.dumps([])

    result = await session_service.get_history(session_id)

    assert result == []
    assert len(result) == 0


@pytest.mark.asyncio
async def test_update_history_empty_list(session_service):
    """Test update_history with empty list"""
    session_id = str(uuid.uuid4())

    result = await session_service.update_history(session_id, [])

    assert result is True


@pytest.mark.asyncio
async def test_update_history_large_history(session_service):
    """Test update_history with large conversation history"""
    session_id = str(uuid.uuid4())
    # Create a large history with 100 messages
    history = [{"role": "user", "content": f"Message {i}"} for i in range(100)]

    result = await session_service.update_history(session_id, history)

    assert result is True
    session_service.redis.setex.assert_called_once()


@pytest.mark.asyncio
async def test_update_history_with_ttl_zero_hours(session_service):
    """Test update_history_with_ttl with 0 hours"""
    session_id = str(uuid.uuid4())
    history = [{"role": "user", "content": "Test"}]

    result = await session_service.update_history_with_ttl(session_id, history, ttl_hours=0)

    # Should use 0 hours TTL (immediate expiry)
    assert result is True


@pytest.mark.asyncio
async def test_extend_ttl_custom_zero_hours(session_service):
    """Test extend_ttl_custom with 0 hours"""
    session_id = str(uuid.uuid4())

    result = await session_service.extend_ttl_custom(session_id, ttl_hours=0)

    assert result is True


@pytest.mark.asyncio
async def test_create_session_uuid_format(session_service):
    """Test create_session generates valid UUID"""
    session_id = await session_service.create_session()

    # Should be valid UUID format
    try:
        uuid.UUID(session_id)
        valid_uuid = True
    except ValueError:
        valid_uuid = False

    assert valid_uuid is True


@pytest.mark.asyncio
async def test_get_session_info_with_ttl_hours(session_service):
    """Test get_session_info calculates ttl_hours correctly"""
    session_id = str(uuid.uuid4())
    history_data = [{"role": "user", "content": "Test"}]
    session_service.redis.ttl.return_value = 7200  # 2 hours
    session_service.redis.get.return_value = json.dumps(history_data)

    result = await session_service.get_session_info(session_id)

    assert result["ttl_hours"] == 2.0


@pytest.mark.asyncio
async def test_get_analytics_top_session_calculation(session_service):
    """Test get_analytics correctly identifies top session"""

    async def mock_scan_iter(pattern):
        for key in ["session:low", "session:high", "session:medium"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        json.dumps([{"role": "user"}] * 10),
        json.dumps([{"role": "user"}] * 50),  # This should be top
        json.dumps([{"role": "user"}] * 25),
    ]

    result = await session_service.get_analytics()

    assert result["top_session"]["id"] == "high"
    assert result["top_session"]["messages"] == 50


@pytest.mark.asyncio
async def test_get_analytics_avg_messages_calculation(session_service):
    """Test get_analytics calculates average messages correctly"""

    async def mock_scan_iter(pattern):
        for key in ["session:1", "session:2", "session:3"]:
            yield key

    session_service.redis.scan_iter = mock_scan_iter
    session_service.redis.get.side_effect = [
        json.dumps([{"role": "user"}] * 10),
        json.dumps([{"role": "user"}] * 20),
        json.dumps([{"role": "user"}] * 30),
    ]

    result = await session_service.get_analytics()

    assert result["avg_messages_per_session"] == 20.0  # (10+20+30)/3


@pytest.mark.asyncio
async def test_update_history_with_dict(session_service):
    """Test update_history rejects dict input"""
    session_id = str(uuid.uuid4())

    result = await session_service.update_history(session_id, {"not": "a list"})

    assert result is False


@pytest.mark.asyncio
async def test_update_history_with_ttl_with_dict(session_service):
    """Test update_history_with_ttl rejects dict input"""
    session_id = str(uuid.uuid4())

    result = await session_service.update_history_with_ttl(session_id, {"not": "a list"})

    assert result is False
