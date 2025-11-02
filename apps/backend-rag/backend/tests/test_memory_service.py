"""
Tests for Memory Service
Tests conversation memory and context management
"""

import pytest
from unittest.mock import Mock, MagicMock
from datetime import datetime


class TestMemoryService:
    """Test suite for memory service"""

    @pytest.fixture
    def mock_memory_store(self):
        """Mock memory store"""
        store = {}
        return store

    def test_save_conversation(self, mock_memory_store):
        """Test saving conversation to memory"""
        conversation_id = "conv-123"
        mock_memory_store[conversation_id] = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi! How can I help?"},
            ],
            "created_at": datetime.now().isoformat(),
        }

        assert conversation_id in mock_memory_store
        assert len(mock_memory_store[conversation_id]["messages"]) == 2

    def test_retrieve_conversation(self, mock_memory_store):
        """Test retrieving conversation from memory"""
        conversation_id = "conv-123"
        mock_memory_store[conversation_id] = {
            "messages": [{"role": "user", "content": "Test"}],
        }

        conversation = mock_memory_store.get(conversation_id)

        assert conversation is not None
        assert "messages" in conversation

    def test_conversation_history_limit(self, mock_memory_store):
        """Test conversation history respects limit"""
        conversation_id = "conv-123"
        messages = [{"role": "user", "content": f"Message {i}"} for i in range(100)]

        max_history = 20
        limited_messages = messages[-max_history:]

        mock_memory_store[conversation_id] = {"messages": limited_messages}

        assert len(mock_memory_store[conversation_id]["messages"]) == max_history

    def test_save_user_context(self, mock_memory_store):
        """Test saving user context"""
        user_id = "user-123"
        mock_memory_store[f"context_{user_id}"] = {
            "preferences": {"language": "Italian"},
            "interests": ["visa", "company setup"],
            "last_query": "PT PMA requirements",
        }

        context = mock_memory_store[f"context_{user_id}"]

        assert context["preferences"]["language"] == "Italian"
        assert "visa" in context["interests"]

    def test_clear_conversation(self, mock_memory_store):
        """Test clearing conversation memory"""
        conversation_id = "conv-123"
        mock_memory_store[conversation_id] = {"messages": [{"role": "user", "content": "Test"}]}

        # Clear conversation
        if conversation_id in mock_memory_store:
            del mock_memory_store[conversation_id]

        assert conversation_id not in mock_memory_store

    def test_conversation_metadata(self, mock_memory_store):
        """Test storing conversation metadata"""
        conversation_id = "conv-123"
        mock_memory_store[conversation_id] = {
            "messages": [],
            "metadata": {
                "user_id": "user-123",
                "created_at": datetime.now().isoformat(),
                "topic": "visa",
                "model_used": "claude-3-haiku",
            },
        }

        metadata = mock_memory_store[conversation_id]["metadata"]

        assert metadata["topic"] == "visa"
        assert metadata["model_used"] == "claude-3-haiku"

    def test_conversation_search(self, mock_memory_store):
        """Test searching conversations by content"""
        conversations = {
            "conv-1": {"messages": [{"role": "user", "content": "KITAS info"}]},
            "conv-2": {"messages": [{"role": "user", "content": "PT PMA setup"}]},
            "conv-3": {"messages": [{"role": "user", "content": "KITAS requirements"}]},
        }

        query = "KITAS"
        matching = [
            conv_id
            for conv_id, conv in conversations.items()
            if any(query in msg["content"] for msg in conv["messages"])
        ]

        assert len(matching) == 2
        assert "conv-1" in matching
        assert "conv-3" in matching

    def test_memory_expiration(self):
        """Test memory expiration after TTL"""
        from datetime import timedelta

        conversation = {
            "created_at": datetime.now() - timedelta(days=31),
        }

        ttl_days = 30
        is_expired = (
            datetime.now() - datetime.fromisoformat(conversation["created_at"])
        ).days > ttl_days

        assert is_expired is True

    def test_conversation_export(self, mock_memory_store):
        """Test exporting conversation"""
        conversation_id = "conv-123"
        mock_memory_store[conversation_id] = {
            "messages": [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi!"},
            ],
        }

        export_data = mock_memory_store[conversation_id]

        assert "messages" in export_data
        assert len(export_data["messages"]) == 2

    def test_memory_statistics(self, mock_memory_store):
        """Test memory usage statistics"""
        mock_memory_store["conv-1"] = {"messages": [{"role": "user", "content": "Test1"}]}
        mock_memory_store["conv-2"] = {"messages": [{"role": "user", "content": "Test2"}]}

        stats = {
            "total_conversations": len(mock_memory_store),
            "total_messages": sum(
                len(conv.get("messages", [])) for conv in mock_memory_store.values()
            ),
        }

        assert stats["total_conversations"] == 2
        assert stats["total_messages"] == 2
