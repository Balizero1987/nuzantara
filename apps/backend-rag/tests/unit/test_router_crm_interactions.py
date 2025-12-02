"""
Unit tests for CRM Interactions Router
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.crm_interactions import (
    InteractionCreate,
    InteractionResponse,
    create_interaction,
    get_interaction,
    list_interactions,
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
def sample_interaction_data():
    """Sample interaction data"""
    return {
        "id": 1,
        "client_id": 1,
        "practice_id": None,
        "interaction_type": "chat",
        "channel": "web_chat",
        "subject": "Test interaction",
        "summary": "Test summary",
        "team_member": "team@example.com",
        "direction": "inbound",
        "sentiment": "positive",
        "interaction_date": datetime.now(),
        "created_at": datetime.now(),
    }


# ============================================================================
# Tests for create_interaction
# ============================================================================


@pytest.mark.asyncio
async def test_create_interaction_success(
    mock_db_connection, mock_settings, sample_interaction_data
):
    """Test successful interaction creation"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_interaction_data

    interaction_data = InteractionCreate(
        client_id=1,
        interaction_type="chat",
        channel="web_chat",
        team_member="team@example.com",
        summary="Test summary",
    )

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await create_interaction(interaction_data)

            assert isinstance(result, InteractionResponse)
            assert result.interaction_type == "chat"
            assert result.team_member == "team@example.com"
            assert cursor.execute.call_count >= 1
            conn.commit.assert_called_once()


@pytest.mark.asyncio
async def test_create_interaction_database_error(mock_db_connection, mock_settings):
    """Test interaction creation with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    interaction_data = InteractionCreate(interaction_type="chat", team_member="team@example.com")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await create_interaction(interaction_data)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_interactions
# ============================================================================


@pytest.mark.asyncio
async def test_get_interactions_success(mock_db_connection, mock_settings, sample_interaction_data):
    """Test successful interactions retrieval"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_interaction_data]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await list_interactions(limit=10, offset=0)

            assert isinstance(result, list)
            assert len(result) == 1
            # Result can be dict or object depending on implementation
            if isinstance(result[0], dict):
                assert result[0]["interaction_type"] == "chat"
            else:
                assert result[0].interaction_type == "chat"
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_get_interactions_with_filters(
    mock_db_connection, mock_settings, sample_interaction_data
):
    """Test interactions retrieval with filters"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_interaction_data]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await list_interactions(
                limit=10,
                offset=0,
                client_id=1,
                interaction_type="chat",
                team_member="team@example.com",
            )

            assert isinstance(result, list)
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_get_interactions_empty(mock_db_connection, mock_settings):
    """Test interactions retrieval with no results"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await list_interactions()

            assert isinstance(result, list)
            assert len(result) == 0


# ============================================================================
# Tests for get_interaction
# ============================================================================


@pytest.mark.asyncio
async def test_get_interaction_success(mock_db_connection, mock_settings, sample_interaction_data):
    """Test successful interaction retrieval by ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = sample_interaction_data

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_interaction(interaction_id=1)

            # Result can be dict or InteractionResponse depending on implementation
            if isinstance(result, dict):
                assert result["id"] == 1
                assert result["interaction_type"] == "chat"
            else:
                assert isinstance(result, InteractionResponse)
                assert result.id == 1
                assert result.interaction_type == "chat"


@pytest.mark.asyncio
async def test_get_interaction_not_found(mock_db_connection, mock_settings):
    """Test interaction retrieval with non-existent ID"""
    conn, cursor = mock_db_connection
    cursor.fetchone.return_value = None

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_interaction(interaction_id=999)

            assert exc_info.value.status_code == 404


# ============================================================================
# Tests for get_client_timeline
# ============================================================================


@pytest.mark.asyncio
async def test_get_client_timeline_success(mock_db_connection, mock_settings):
    """Test successful client timeline retrieval"""
    from app.routers.crm_interactions import get_client_timeline

    conn, cursor = mock_db_connection
    timeline_data = [
        {
            "id": 1,
            "client_id": 1,
            "interaction_type": "chat",
            "interaction_date": datetime.now(),
            "practice_id": 1,
            "practice_type_name": "KITAS",
            "practice_type_code": "kitas",
        }
    ]
    cursor.fetchall.return_value = timeline_data

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_client_timeline(client_id=1, limit=50)

            assert result["client_id"] == 1
            assert result["total_interactions"] == 1
            assert len(result["timeline"]) == 1


@pytest.mark.asyncio
async def test_get_client_timeline_empty(mock_db_connection, mock_settings):
    """Test client timeline with no interactions"""
    from app.routers.crm_interactions import get_client_timeline

    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_client_timeline(client_id=999, limit=50)

            assert result["client_id"] == 999
            assert result["total_interactions"] == 0
            assert len(result["timeline"]) == 0


@pytest.mark.asyncio
async def test_get_client_timeline_error(mock_db_connection, mock_settings):
    """Test client timeline with database error"""
    from app.routers.crm_interactions import get_client_timeline

    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_client_timeline(client_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_practice_history
# ============================================================================


@pytest.mark.asyncio
async def test_get_practice_history_success(mock_db_connection, mock_settings):
    """Test successful practice history retrieval"""
    from app.routers.crm_interactions import get_practice_history

    conn, cursor = mock_db_connection
    history_data = [
        {
            "id": 1,
            "practice_id": 1,
            "interaction_type": "email",
            "interaction_date": datetime.now(),
        }
    ]
    cursor.fetchall.return_value = history_data

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_practice_history(practice_id=1)

            assert result["practice_id"] == 1
            assert result["total_interactions"] == 1
            assert len(result["history"]) == 1


@pytest.mark.asyncio
async def test_get_practice_history_empty(mock_db_connection, mock_settings):
    """Test practice history with no interactions"""
    from app.routers.crm_interactions import get_practice_history

    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = []

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_practice_history(practice_id=999)

            assert result["practice_id"] == 999
            assert result["total_interactions"] == 0


@pytest.mark.asyncio
async def test_get_practice_history_error(mock_db_connection, mock_settings):
    """Test practice history with database error"""
    from app.routers.crm_interactions import get_practice_history

    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_practice_history(practice_id=1)

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for get_interactions_stats
# ============================================================================


@pytest.mark.asyncio
async def test_get_interactions_stats_success(mock_db_connection, mock_settings):
    """Test successful interaction stats retrieval"""
    from app.routers.crm_interactions import get_interactions_stats

    conn, cursor = mock_db_connection

    # Create mock row objects that support dict conversion
    class MockRow(dict):
        def __getitem__(self, key):
            return super().__getitem__(key)

    # Mock stats data
    by_type = [
        MockRow({"interaction_type": "chat", "count": 10}),
        MockRow({"interaction_type": "email", "count": 5}),
    ]
    by_sentiment = [
        MockRow({"sentiment": "positive", "count": 8}),
        MockRow({"sentiment": "neutral", "count": 7}),
    ]
    by_team_member = [
        MockRow({"team_member": "anton@balizero.com", "count": 12}),
        MockRow({"team_member": "amanda@balizero.com", "count": 3}),
    ]
    recent_count = {"count": 8}

    # Configure cursor to return different values for different queries
    cursor.fetchall.side_effect = [by_type, by_sentiment, by_team_member]
    cursor.fetchone.return_value = recent_count

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_interactions_stats(team_member=None)

            assert result["total_interactions"] == 15
            assert result["last_7_days"] == 8
            assert "by_type" in result
            assert "by_sentiment" in result
            assert len(result["by_team_member"]) == 2


@pytest.mark.asyncio
async def test_get_interactions_stats_with_team_member_filter(mock_db_connection, mock_settings):
    """Test interaction stats filtered by team member"""
    from app.routers.crm_interactions import get_interactions_stats

    conn, cursor = mock_db_connection

    by_type = [{"interaction_type": "chat", "count": 5}]
    by_sentiment = [{"sentiment": "positive", "count": 4}]
    recent_count = {"count": 3}

    cursor.fetchall.side_effect = [by_type, by_sentiment]
    cursor.fetchone.return_value = recent_count

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await get_interactions_stats(team_member="anton@balizero.com")

            assert result["total_interactions"] == 5
            assert result["by_team_member"] == []


@pytest.mark.asyncio
async def test_get_interactions_stats_error(mock_db_connection, mock_settings):
    """Test interaction stats with database error"""
    from app.routers.crm_interactions import get_interactions_stats

    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_interactions_stats()

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for create_interaction_from_conversation
# ============================================================================


@pytest.mark.asyncio
async def test_create_interaction_from_conversation_existing_client(
    mock_db_connection, mock_settings
):
    """Test creating interaction from conversation with existing client"""
    from app.routers.crm_interactions import create_interaction_from_conversation

    conn, cursor = mock_db_connection

    # Mock existing client
    cursor.fetchone.side_effect = [
        {"id": 1},  # Existing client
        {  # Conversation data
            "messages": [
                {"role": "user", "content": "Hello, I need help with KITAS"},
                {"role": "assistant", "content": "Sure, I can help!"},
            ]
        },
        {"id": 1, "client_id": 1},  # New interaction
    ]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await create_interaction_from_conversation(
                conversation_id=1, client_email="test@example.com", team_member="anton@balizero.com"
            )

            assert result["success"] is True
            assert result["client_id"] == 1
            assert result["interaction_id"] == 1


@pytest.mark.asyncio
async def test_create_interaction_from_conversation_new_client(mock_db_connection, mock_settings):
    """Test creating interaction from conversation with new client"""
    from app.routers.crm_interactions import create_interaction_from_conversation

    conn, cursor = mock_db_connection

    # Mock no existing client (creates new one)
    cursor.fetchone.side_effect = [
        None,  # No existing client
        {"id": 2},  # New client created
        {  # Conversation data
            "messages": [{"role": "user", "content": "Hello"}]
        },
        {"id": 1, "client_id": 2},  # New interaction
    ]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await create_interaction_from_conversation(
                conversation_id=1,
                client_email="newclient@example.com",
                team_member="anton@balizero.com",
            )

            assert result["success"] is True
            assert result["client_id"] == 2


@pytest.mark.asyncio
async def test_create_interaction_from_conversation_with_summary(mock_db_connection, mock_settings):
    """Test creating interaction from conversation with provided summary"""
    from app.routers.crm_interactions import create_interaction_from_conversation

    conn, cursor = mock_db_connection

    cursor.fetchone.side_effect = [
        {"id": 1},  # Existing client
        {"messages": []},  # Empty conversation
        {"id": 1, "client_id": 1},  # New interaction
    ]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await create_interaction_from_conversation(
                conversation_id=1,
                client_email="test@example.com",
                team_member="anton@balizero.com",
                summary="Custom summary",
            )

            assert result["success"] is True


@pytest.mark.asyncio
async def test_create_interaction_from_conversation_error(mock_db_connection, mock_settings):
    """Test creating interaction from conversation with error"""
    from app.routers.crm_interactions import create_interaction_from_conversation

    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await create_interaction_from_conversation(
                    conversation_id=1,
                    client_email="test@example.com",
                    team_member="anton@balizero.com",
                )

            assert exc_info.value.status_code == 500


# ============================================================================
# Tests for sync_gmail_interactions
# ============================================================================


@pytest.mark.asyncio
async def test_sync_gmail_interactions_success(mock_db_connection, mock_settings):
    """Test successful Gmail sync"""
    from app.routers.crm_interactions import sync_gmail_interactions

    # Mock Gmail service
    mock_gmail = MagicMock()
    mock_gmail.list_messages.return_value = [{"id": "msg1"}, {"id": "msg2"}]
    mock_gmail.get_message_details.return_value = {
        "id": "msg1",
        "subject": "Test email",
        "from": "client@example.com",
    }

    # Mock AutoCRM service
    from unittest.mock import AsyncMock

    mock_auto_crm = MagicMock()
    mock_auto_crm.process_email_interaction = AsyncMock(
        return_value={"success": True, "interaction_id": 1}
    )

    with patch("services.gmail_service.get_gmail_service", return_value=mock_gmail):
        with patch("services.auto_crm_service.get_auto_crm_service", return_value=mock_auto_crm):
            result = await sync_gmail_interactions(limit=5, team_member="system")

            assert result["success"] is True
            assert result["processed_count"] >= 0


@pytest.mark.asyncio
async def test_sync_gmail_interactions_no_messages(mock_db_connection, mock_settings):
    """Test Gmail sync with no messages"""
    from app.routers.crm_interactions import sync_gmail_interactions

    mock_gmail = MagicMock()
    mock_gmail.list_messages.return_value = []

    mock_auto_crm = MagicMock()

    with patch("services.gmail_service.get_gmail_service", return_value=mock_gmail):
        with patch("services.auto_crm_service.get_auto_crm_service", return_value=mock_auto_crm):
            result = await sync_gmail_interactions(limit=5)

            assert result["success"] is True
            assert result["processed_count"] == 0


@pytest.mark.asyncio
async def test_sync_gmail_interactions_error(mock_db_connection, mock_settings):
    """Test Gmail sync with error"""
    from app.routers.crm_interactions import sync_gmail_interactions

    with patch(
        "services.gmail_service.get_gmail_service", side_effect=Exception("Gmail API error")
    ):
        with pytest.raises(Exception) as exc_info:
            await sync_gmail_interactions()

        assert exc_info.value.status_code == 500


# ============================================================================
# Tests for database connection error
# ============================================================================


@pytest.mark.asyncio
async def test_get_db_connection_no_database_url():
    """Test database connection with missing DATABASE_URL"""
    from app.routers.crm_interactions import get_db_connection

    mock_settings_no_db = MagicMock()
    mock_settings_no_db.database_url = None

    with patch("app.routers.crm_interactions.settings", mock_settings_no_db):
        with pytest.raises(Exception) as exc_info:
            get_db_connection()

        assert "DATABASE_URL" in str(exc_info.value)


# ============================================================================
# Tests for additional list_interactions filters
# ============================================================================


@pytest.mark.asyncio
async def test_list_interactions_with_practice_id_filter(
    mock_db_connection, mock_settings, sample_interaction_data
):
    """Test interactions retrieval with practice_id filter"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_interaction_data]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await list_interactions(practice_id=1, limit=10)

            assert isinstance(result, list)
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_list_interactions_with_sentiment_filter(
    mock_db_connection, mock_settings, sample_interaction_data
):
    """Test interactions retrieval with sentiment filter"""
    conn, cursor = mock_db_connection
    cursor.fetchall.return_value = [sample_interaction_data]

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            result = await list_interactions(sentiment="positive", limit=10)

            assert isinstance(result, list)
            assert cursor.execute.call_count >= 1


@pytest.mark.asyncio
async def test_list_interactions_database_error(mock_db_connection, mock_settings):
    """Test interactions retrieval with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await list_interactions()

            assert exc_info.value.status_code == 500


@pytest.mark.asyncio
async def test_get_interaction_database_error(mock_db_connection, mock_settings):
    """Test interaction retrieval with database error"""
    conn, cursor = mock_db_connection
    cursor.execute.side_effect = Exception("Database error")

    with patch("app.routers.crm_interactions.settings", mock_settings):
        with patch("app.routers.crm_interactions.get_db_connection", return_value=conn):
            with pytest.raises(Exception) as exc_info:
                await get_interaction(interaction_id=1)

            assert exc_info.value.status_code == 500
