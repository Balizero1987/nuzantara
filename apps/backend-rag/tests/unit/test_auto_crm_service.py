"""
Unit tests for Auto CRM Service
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.auto_crm_service import AutoCRMService, get_auto_crm_service


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_extractor():
    """Mock AI CRM Extractor"""
    mock = MagicMock()
    mock.extract_from_conversation = AsyncMock()
    mock.should_create_practice = AsyncMock(return_value=False)
    return mock


@pytest.fixture
def mock_db_connection():
    """Mock database connection"""
    conn = MagicMock()
    cursor = MagicMock()
    conn.cursor.return_value = cursor
    conn.commit = MagicMock()
    conn.close = MagicMock()
    cursor.close = MagicMock()
    cursor.fetchone = MagicMock(return_value=None)
    cursor.fetchall = MagicMock(return_value=[])
    cursor.execute = MagicMock()
    return conn, cursor


@pytest.fixture
def auto_crm_service(mock_extractor):
    """Create AutoCRMService instance"""
    with patch("services.auto_crm_service.get_extractor", return_value=mock_extractor):
        return AutoCRMService()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(auto_crm_service, mock_extractor):
    """Test AutoCRMService initialization"""
    assert auto_crm_service.extractor is mock_extractor


# ============================================================================
# Tests for get_db_connection
# ============================================================================


def test_get_db_connection_success(auto_crm_service):
    """Test getting database connection successfully"""
    mock_conn = MagicMock()
    with patch("services.auto_crm_service.psycopg2.connect", return_value=mock_conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            conn = auto_crm_service.get_db_connection()
            assert conn is mock_conn


def test_get_db_connection_no_url(auto_crm_service):
    """Test getting database connection without URL"""
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.database_url = None
        with pytest.raises(Exception, match="DATABASE_URL"):
            auto_crm_service.get_db_connection()


# ============================================================================
# Tests for process_conversation
# ============================================================================


@pytest.mark.asyncio
async def test_process_conversation_create_new_client(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation creates new client"""
    conn, cursor = mock_db_connection
    
    # Mock extraction result
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "test@example.com",
            "full_name": "Test User",
            "phone": "+62812345678",
            "whatsapp": "+62812345678",
            "nationality": "Italian",
            "confidence": 0.8,
        },
        "practice_intent": {"detected": False},
        "summary": "Test conversation",
        "sentiment": "positive",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    # Mock client creation
    # fetchone is called:
    # 1. Check existing client with user_email (line 72) - returns None
    # 2. Re-check with extracted email (line 98) - returns None (since user_email and extracted email are same, this still runs)
    # 3. INSERT client RETURNING id (line 155) - returns {"id": 1}  
    # 4. INSERT interaction RETURNING id (line 256) - returns {"id": 10}
    fetchone_results = [None, None, {"id": 1}, {"id": 10}]
    
    def fetchone_mock():
        if fetchone_results:
            return fetchone_results.pop(0)
        return None
    
    cursor.fetchone.side_effect = fetchone_mock
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "Hello"}],
                user_email="test@example.com",
            )
    
    assert result["success"] is True
    assert result["client_id"] == 1
    assert result["client_created"] is True
    assert result["interaction_id"] == 10
    assert conn.commit.called
    assert conn.close.called


@pytest.mark.asyncio
async def test_process_conversation_update_existing_client(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation updates existing client"""
    conn, cursor = mock_db_connection
    
    # Mock existing client
    existing_client = {
        "id": 1,
        "email": "test@example.com",
        "full_name": None,
        "phone": None,
    }
    
    # Mock extraction result
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "test@example.com",
            "full_name": "Updated Name",
            "phone": "+62812345678",
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.8,
        },
        "practice_intent": {"detected": False},
        "summary": "Test conversation",
        "sentiment": "positive",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    cursor.fetchone.side_effect = [
        existing_client,  # Existing client found
        {"id": 10},  # Interaction ID
    ]
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "Hello"}],
                user_email="test@example.com",
            )
    
    assert result["success"] is True
    assert result["client_id"] == 1
    assert result["client_updated"] is True
    assert cursor.execute.call_count >= 2  # Update client + insert interaction


@pytest.mark.asyncio
async def test_process_conversation_create_practice(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation creates practice"""
    conn, cursor = mock_db_connection
    
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "test@example.com",
            "full_name": "Test User",
            "phone": None,
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.8,
        },
        "practice_intent": {
            "detected": True,
            "practice_type_code": "PT_PMA",
            "details": "Setup PT PMA",
        },
        "summary": "Test conversation",
        "sentiment": "positive",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    mock_extractor.should_create_practice.return_value = True
    
    # Multiple fetchone calls: client check, client INSERT, practice type, practice check, practice INSERT, interaction INSERT
    fetchone_results = [
        None,  # No existing client
        {"id": 1},  # New client ID
        {"id": 5, "base_price": 10000000},  # Practice type
        None,  # No existing practice
        {"id": 2},  # New practice ID
        {"id": 10},  # Interaction ID
    ]
    cursor.fetchone.side_effect = lambda: fetchone_results.pop(0) if fetchone_results else None
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "I want to setup PT PMA"}],
                user_email="test@example.com",
            )
    
    assert result["success"] is True
    assert result["practice_id"] == 2
    assert result["practice_created"] is True


@pytest.mark.asyncio
async def test_process_conversation_low_confidence_no_client(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation with low confidence doesn't create client"""
    conn, cursor = mock_db_connection
    
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": None,
            "full_name": None,
            "phone": None,
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.3,  # Low confidence
        },
        "practice_intent": {"detected": False},
        "summary": "Test conversation",
        "sentiment": "neutral",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    # Even without client, interaction is still created
    # When no user_email and extracted email is None:
    # - No client check happens (line 70-72 skipped, line 96-98 skipped because extracted email is None)
    # - INSERT interaction RETURNING id (line 256) - returns {"id": 10}
    fetchone_results = [{"id": 10}]
    
    def fetchone_mock():
        if fetchone_results:
            return fetchone_results.pop(0)
        return None
    
    cursor.fetchone.side_effect = fetchone_mock
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "Hello"}],
            )
    
    assert result["success"] is True
    assert result["client_id"] is None
    assert result["client_created"] is False
    assert result["interaction_id"] == 10


@pytest.mark.asyncio
async def test_process_conversation_exception(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation handles exceptions"""
    conn, cursor = mock_db_connection
    
    mock_extractor.extract_from_conversation.side_effect = Exception("Database error")
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "Hello"}],
            )
    
    assert result["success"] is False
    assert "error" in result
    assert result["client_id"] is None


@pytest.mark.asyncio
async def test_process_conversation_uses_extracted_email(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing conversation uses extracted email if not provided"""
    conn, cursor = mock_db_connection
    
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "extracted@example.com",
            "full_name": "Test User",
            "phone": None,
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.8,
        },
        "practice_intent": {"detected": False},
        "summary": "Test conversation",
        "sentiment": "positive",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    # When no user_email provided but extracted email exists:
    # 1. Check with extracted email (line 98) - returns None
    # 2. INSERT client RETURNING id (line 155) - returns {"id": 1}
    # 3. INSERT interaction RETURNING id (line 256) - returns {"id": 10}
    fetchone_results = [None, {"id": 1}, {"id": 10}]
    
    def fetchone_mock():
        if fetchone_results:
            return fetchone_results.pop(0)
        return None
    
    cursor.fetchone.side_effect = fetchone_mock
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_conversation(
                conversation_id=1,
                messages=[{"role": "user", "content": "Hello"}],
                # No user_email provided
            )
    
    assert result["success"] is True
    assert result["client_id"] == 1
    # Verify that extracted email was used
    assert cursor.execute.call_count >= 2


# ============================================================================
# Tests for process_email_interaction
# ============================================================================


@pytest.mark.asyncio
async def test_process_email_interaction_success(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing email interaction successfully"""
    conn, cursor = mock_db_connection
    
    email_data = {
        "subject": "Test Email",
        "sender": "test@example.com",
        "body": "Hello, I need help",
        "date": datetime.now(),
        "id": "email-123",
    }
    
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "test@example.com",
            "full_name": "Test User",
            "phone": None,
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.8,
        },
        "practice_intent": {"detected": False},
        "summary": "Email conversation",
        "sentiment": "positive",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    # process_email_interaction creates conversation, then calls process_conversation
    fetchone_results = [{"id": 100}, None, None, {"id": 1}, {"id": 10}]
    
    def fetchone_mock():
        if fetchone_results:
            return fetchone_results.pop(0)
        return None
    
    cursor.fetchone.side_effect = fetchone_mock
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_email_interaction(email_data)
    
    assert result["success"] is True
    assert result["client_id"] == 1


@pytest.mark.asyncio
async def test_process_email_interaction_extract_email_from_format(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing email extracts email from 'Name <email@domain.com>' format"""
    conn, cursor = mock_db_connection
    
    email_data = {
        "subject": "Test",
        "sender": "John Doe <john@example.com>",
        "body": "Hello",
        "date": datetime.now(),
        "id": "email-123",
    }
    
    mock_extractor.extract_from_conversation.return_value = {
        "client": {
            "email": "john@example.com",
            "full_name": "John Doe",
            "phone": None,
            "whatsapp": None,
            "nationality": None,
            "confidence": 0.8,
        },
        "practice_intent": {"detected": False},
        "summary": "Email",
        "sentiment": "neutral",
        "extracted_entities": {},
        "action_items": [],
        "urgency": "normal",
    }
    
    fetchone_results = [{"id": 100}, None, None, {"id": 1}, {"id": 10}]
    
    def fetchone_mock():
        if fetchone_results:
            return fetchone_results.pop(0)
        return None
    
    cursor.fetchone.side_effect = fetchone_mock
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_email_interaction(email_data)
    
    assert result["success"] is True
    # Verify email extraction happened
    assert cursor.execute.called


@pytest.mark.asyncio
async def test_process_email_interaction_exception(
    auto_crm_service, mock_extractor, mock_db_connection
):
    """Test processing email interaction handles exceptions"""
    conn, cursor = mock_db_connection
    
    email_data = {
        "subject": "Test",
        "sender": "test@example.com",
        "body": "Hello",
        "date": datetime.now(),
        "id": "email-123",
    }
    
    cursor.execute.side_effect = Exception("Database error")
    
    with patch("services.auto_crm_service.psycopg2.connect", return_value=conn):
        with patch("app.core.config.settings") as mock_settings:
            mock_settings.database_url = "postgresql://test"
            result = await auto_crm_service.process_email_interaction(email_data)
    
    assert result["success"] is False
    assert "error" in result


# ============================================================================
# Tests for get_auto_crm_service
# ============================================================================


def test_get_auto_crm_service_singleton():
    """Test get_auto_crm_service returns singleton"""
    with patch("services.auto_crm_service._auto_crm_instance", None):
        with patch("services.auto_crm_service.AutoCRMService") as mock_service_class:
            mock_instance = MagicMock()
            mock_service_class.return_value = mock_instance
            
            service1 = get_auto_crm_service()
            service2 = get_auto_crm_service()
            
            # Should return same instance
            assert service1 is service2
            # Should only be initialized once
            assert mock_service_class.call_count == 1

