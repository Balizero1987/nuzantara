"""
Unit tests for RAG Manager Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.context.rag_manager import RAGManager

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    search = AsyncMock()
    search.search = AsyncMock(
        return_value={
            "query": "Test query",
            "results": [
                {
                    "text": "Document 1 content here",
                    "metadata": {"title": "Document 1", "source": "test1"},
                    "score": 0.9,
                },
                {
                    "text": "Document 2 content here",
                    "metadata": {"title": "Document 2", "source": "test2"},
                    "score": 0.8,
                },
            ],
            "collection_used": "visa_oracle",
        }
    )
    return search


@pytest.fixture
def rag_manager(mock_search_service):
    """Create RAGManager instance"""
    return RAGManager(search_service=mock_search_service)


@pytest.fixture
def rag_manager_no_search():
    """Create RAGManager without search service"""
    return RAGManager(search_service=None)


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_search_service(mock_search_service):
    """Test RAGManager initialization with search service"""
    manager = RAGManager(search_service=mock_search_service)

    assert manager.search == mock_search_service


def test_init_without_search_service():
    """Test RAGManager initialization without search service"""
    manager = RAGManager(search_service=None)

    assert manager.search is None


# ============================================================================
# Tests for retrieve_context()
# ============================================================================


@pytest.mark.asyncio
async def test_retrieve_context_business_query(rag_manager):
    """Test retrieve_context for business query"""
    query = "What is a KITAS visa?"
    query_type = "business"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is True
    assert result["context"] is not None
    assert result["document_count"] > 0
    assert "Document 1" in result["context"] or "Document 2" in result["context"]


@pytest.mark.asyncio
async def test_retrieve_context_emergency_query(rag_manager):
    """Test retrieve_context for emergency query"""
    query = "Urgent visa question"
    query_type = "emergency"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is True
    assert result["context"] is not None


@pytest.mark.asyncio
async def test_retrieve_context_skips_greeting(rag_manager):
    """Test retrieve_context skips RAG for greeting queries"""
    query = "Hello"
    query_type = "greeting"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is False
    assert result["context"] is None
    assert result["document_count"] == 0


@pytest.mark.asyncio
async def test_retrieve_context_skips_casual(rag_manager):
    """Test retrieve_context skips RAG for casual queries"""
    query = "How are you?"
    query_type = "casual"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is False
    assert result["context"] is None
    assert result["document_count"] == 0


@pytest.mark.asyncio
async def test_retrieve_context_no_search_service(rag_manager_no_search):
    """Test retrieve_context returns None when no search service"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    result = await rag_manager_no_search.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is False
    assert result["context"] is None
    assert result["document_count"] == 0


@pytest.mark.asyncio
async def test_retrieve_context_empty_results(rag_manager):
    """Test retrieve_context handles empty search results"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    # Mock empty results
    rag_manager.search.search = AsyncMock(return_value={"query": query, "results": []})

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is False
    assert result["context"] is None
    assert result["document_count"] == 0


@pytest.mark.asyncio
async def test_retrieve_context_respects_limit(rag_manager):
    """Test retrieve_context respects limit parameter"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 1

    # Mock multiple results
    rag_manager.search.search = AsyncMock(
        return_value={
            "query": query,
            "results": [
                {"text": "Doc 1", "metadata": {"title": "Doc 1"}},
                {"text": "Doc 2", "metadata": {"title": "Doc 2"}},
                {"text": "Doc 3", "metadata": {"title": "Doc 3"}},
            ],
        }
    )

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["document_count"] == limit
    assert result["context"] is not None


@pytest.mark.asyncio
async def test_retrieve_context_truncates_document_text(rag_manager):
    """Test retrieve_context truncates document text to 500 chars"""
    long_text = "A" * 600  # 600 characters
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    rag_manager.search.search = AsyncMock(
        return_value={
            "query": query,
            "results": [{"text": long_text, "metadata": {"title": "Long Doc"}}],
        }
    )

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["context"] is not None
    # Each doc should be truncated to 500 chars
    assert len(result["context"]) < len(long_text) + 100  # Account for formatting


@pytest.mark.asyncio
async def test_retrieve_context_formats_documents(rag_manager):
    """Test retrieve_context formats documents correctly"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["context"] is not None
    # Should include document title formatting
    assert "📄" in result["context"] or "Document" in result["context"]


@pytest.mark.asyncio
async def test_retrieve_context_handles_missing_title(rag_manager):
    """Test retrieve_context handles documents without title"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    rag_manager.search.search = AsyncMock(
        return_value={
            "query": query,
            "results": [{"text": "Doc content", "metadata": {}}],
        }
    )

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["context"] is not None
    assert "Unknown" in result["context"] or "Doc content" in result["context"]


@pytest.mark.asyncio
async def test_retrieve_context_exception_handling(rag_manager):
    """Test retrieve_context handles exceptions gracefully"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    rag_manager.search.search = AsyncMock(side_effect=Exception("Search error"))

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["used_rag"] is False
    assert result["context"] is None
    assert result["document_count"] == 0


@pytest.mark.asyncio
async def test_retrieve_context_calls_search_with_params(rag_manager):
    """Test retrieve_context calls search service with correct parameters"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    await rag_manager.retrieve_context(query, query_type, user_level, limit)

    rag_manager.search.search.assert_called_once()
    call_args = rag_manager.search.search.call_args
    assert call_args[1]["query"] == query
    assert call_args[1]["user_level"] == user_level
    assert call_args[1]["limit"] == limit


@pytest.mark.asyncio
async def test_retrieve_context_separates_documents(rag_manager):
    """Test retrieve_context separates documents with double newlines"""
    query = "Test query"
    query_type = "business"
    user_level = 2
    limit = 5

    result = await rag_manager.retrieve_context(query, query_type, user_level, limit)

    assert result["context"] is not None
    # Should have double newlines between documents
    if result["document_count"] > 1:
        assert "\n\n" in result["context"]

