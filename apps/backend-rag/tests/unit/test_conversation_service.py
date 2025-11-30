"""
Unit tests for Conversation Service
100% coverage target with comprehensive mocking
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.conversation_service import ConversationService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def conversation_service():
    """Create ConversationService instance"""
    return ConversationService()


@pytest.fixture
def sample_messages():
    """Sample conversation messages"""
    return [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
        {"role": "user", "content": "How are you?"},
    ]


@pytest.fixture
def sample_metadata():
    """Sample conversation metadata"""
    return {
        "collaborator_name": "Test User",
        "model_used": "zantara-ai",
        "tokens": {"input": 100, "output": 50},
    }


# ============================================================================
# Tests: Initialization
# ============================================================================


def test_conversation_service_init(conversation_service):
    """Test ConversationService initialization"""
    assert conversation_service.conversations_cache == []
    assert isinstance(conversation_service.conversations_cache, list)


# ============================================================================
# Tests: save_conversation
# ============================================================================


@pytest.mark.asyncio
async def test_save_conversation_success(conversation_service, sample_messages, sample_metadata):
    """Test saving conversation successfully"""
    result = await conversation_service.save_conversation(
        user_id="user123", messages=sample_messages, metadata=sample_metadata
    )

    assert result is True
    assert len(conversation_service.conversations_cache) == 1

    saved = conversation_service.conversations_cache[0]
    assert saved["user_id"] == "user123"
    assert saved["messages"] == sample_messages
    assert saved["metadata"] == sample_metadata
    assert saved["message_count"] == 3
    assert "timestamp" in saved


@pytest.mark.asyncio
async def test_save_conversation_no_metadata(conversation_service, sample_messages):
    """Test saving conversation without metadata"""
    result = await conversation_service.save_conversation(
        user_id="user123", messages=sample_messages
    )

    assert result is True
    saved = conversation_service.conversations_cache[0]
    assert saved["metadata"] == {}


@pytest.mark.asyncio
async def test_save_conversation_multiple(conversation_service, sample_messages):
    """Test saving multiple conversations"""
    await conversation_service.save_conversation(user_id="user1", messages=sample_messages)
    await conversation_service.save_conversation(user_id="user2", messages=sample_messages)

    assert len(conversation_service.conversations_cache) == 2


@pytest.mark.asyncio
async def test_save_conversation_empty_messages(conversation_service):
    """Test saving conversation with empty messages"""
    result = await conversation_service.save_conversation(user_id="user123", messages=[])

    assert result is True
    saved = conversation_service.conversations_cache[0]
    assert saved["message_count"] == 0


# ============================================================================
# Tests: get_recent_conversations
# ============================================================================


@pytest.mark.asyncio
async def test_get_recent_conversations_existing_user(
    conversation_service, sample_messages, sample_metadata
):
    """Test getting recent conversations for existing user"""
    # Save multiple conversations
    await conversation_service.save_conversation(
        user_id="user123", messages=sample_messages, metadata=sample_metadata
    )
    await conversation_service.save_conversation(
        user_id="user123", messages=sample_messages[:2], metadata=sample_metadata
    )
    await conversation_service.save_conversation(
        user_id="other_user", messages=sample_messages, metadata=sample_metadata
    )

    conversations = await conversation_service.get_recent_conversations(user_id="user123", limit=10)

    assert len(conversations) == 2
    assert all(c["user_id"] == "user123" for c in conversations)


@pytest.mark.asyncio
async def test_get_recent_conversations_limit(conversation_service, sample_messages):
    """Test getting recent conversations with limit"""
    # Save 5 conversations
    for i in range(5):
        await conversation_service.save_conversation(
            user_id="user123", messages=sample_messages
        )

    conversations = await conversation_service.get_recent_conversations(user_id="user123", limit=3)

    assert len(conversations) == 3


@pytest.mark.asyncio
async def test_get_recent_conversations_sorted(conversation_service, sample_messages):
    """Test conversations are sorted by timestamp descending"""
    import asyncio

    await conversation_service.save_conversation(user_id="user123", messages=sample_messages)
    await asyncio.sleep(0.01)  # Small delay to ensure different timestamps
    await conversation_service.save_conversation(user_id="user123", messages=sample_messages)

    conversations = await conversation_service.get_recent_conversations(user_id="user123")

    assert len(conversations) == 2
    # Most recent should be first
    assert conversations[0]["timestamp"] >= conversations[1]["timestamp"]


@pytest.mark.asyncio
async def test_get_recent_conversations_nonexistent_user(conversation_service):
    """Test getting conversations for nonexistent user"""
    conversations = await conversation_service.get_recent_conversations(user_id="nonexistent")

    assert conversations == []


@pytest.mark.asyncio
async def test_get_recent_conversations_empty_cache(conversation_service):
    """Test getting conversations from empty cache"""
    conversations = await conversation_service.get_recent_conversations(user_id="user123")

    assert conversations == []


# ============================================================================
# Tests: get_stats
# ============================================================================


@pytest.mark.asyncio
async def test_get_stats_empty(conversation_service):
    """Test getting stats with empty cache"""
    stats = await conversation_service.get_stats()

    assert stats["total_conversations"] == 0
    assert stats["postgresql_enabled"] is False
    assert stats["cached_conversations"] == 0


@pytest.mark.asyncio
async def test_get_stats_with_conversations(conversation_service, sample_messages):
    """Test getting stats with conversations"""
    await conversation_service.save_conversation(user_id="user1", messages=sample_messages)
    await conversation_service.save_conversation(user_id="user2", messages=sample_messages)

    stats = await conversation_service.get_stats()

    assert stats["total_conversations"] == 2
    assert stats["cached_conversations"] == 2
    assert stats["postgresql_enabled"] is False

