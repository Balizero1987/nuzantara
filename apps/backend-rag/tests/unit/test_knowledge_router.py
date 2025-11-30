"""
Unit tests for Knowledge Router
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.modules.knowledge.router import get_knowledge_service, router, semantic_search, search_health
from app.models import SearchQuery, TierLevel


@pytest.fixture
def mock_knowledge_service():
    """Mock KnowledgeService"""
    service = MagicMock()
    service.search = AsyncMock(
        return_value={
            "query": "test",
            "results": [
                {
                    "id": "id1",
                    "text": "test document",
                    "metadata": {
                        "book_title": "Test Book",
                        "book_author": "Test Author",
                        "tier": "C",
                        "min_level": 0,
                        "chunk_index": 0,
                        "page_number": 1,
                        "language": "en",
                        "topics": [],
                        "file_path": "/test.pdf",
                        "total_chunks": 10,
                    },
                    "score": 0.95,
                }
            ],
            "user_level": 0,
            "allowed_tiers": [],
            "collection_used": "visa_oracle",
        }
    )
    return service


@pytest.fixture
def mock_search_query():
    """Create SearchQuery fixture"""
    return SearchQuery(query="test query", level=0, limit=5)


# ============================================================================
# Tests for get_knowledge_service
# ============================================================================


def test_get_knowledge_service_singleton():
    """Test that get_knowledge_service returns singleton"""
    # Reset global
    import app.modules.knowledge.router as router_module
    router_module._knowledge_service = None

    with patch("app.modules.knowledge.router.KnowledgeService") as mock_service_class:
        service1 = get_knowledge_service()
        service2 = get_knowledge_service()
        assert service1 == service2
        assert mock_service_class.call_count == 1


# ============================================================================
# Tests for semantic_search
# ============================================================================


@pytest.mark.asyncio
async def test_semantic_search_success(mock_knowledge_service, mock_search_query):
    """Test successful semantic search"""
    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        response = await semantic_search(mock_search_query)

        assert response.query == "test query"
        assert response.user_level == 0
        assert response.total_found == 1
        assert len(response.results) == 1
        assert response.results[0].text == "test document"
        assert mock_knowledge_service.search.called


@pytest.mark.asyncio
async def test_semantic_search_invalid_level(mock_knowledge_service):
    """Test semantic search with invalid level - Pydantic validation prevents this"""
    # Pydantic will validate level before reaching the endpoint
    # So we test that Pydantic validation works
    with pytest.raises(Exception):  # Pydantic validation error
        invalid_query = SearchQuery(query="test", level=5, limit=5)  # level > 3


@pytest.mark.asyncio
async def test_semantic_search_with_tier_filter(mock_knowledge_service):
    """Test semantic search with tier filter"""
    query = SearchQuery(query="test", level=2, limit=5, tier_filter=[TierLevel.C])

    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        response = await semantic_search(query)

        assert response is not None
        call_args = mock_knowledge_service.search.call_args
        assert call_args[1]["tier_filter"] == [TierLevel.C]


@pytest.mark.asyncio
async def test_semantic_search_with_collection_override(mock_knowledge_service):
    """Test semantic search with collection override"""
    query = SearchQuery(query="test", level=0, limit=5, collection="kb_indonesian")

    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        response = await semantic_search(query)

        assert response is not None
        call_args = mock_knowledge_service.search.call_args
        assert call_args[1]["collection_override"] == "kb_indonesian"


@pytest.mark.asyncio
async def test_semantic_search_empty_results(mock_knowledge_service):
    """Test semantic search with empty results"""
    mock_knowledge_service.search.return_value = {
        "query": "test",
        "results": [],
        "user_level": 0,
        "allowed_tiers": [],
        "collection_used": "visa_oracle",
    }

    query = SearchQuery(query="test", level=0, limit=5)

    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        response = await semantic_search(query)

        assert response.total_found == 0
        assert len(response.results) == 0


@pytest.mark.asyncio
async def test_semantic_search_error_handling(mock_knowledge_service):
    """Test semantic search error handling"""
    mock_knowledge_service.search.side_effect = Exception("Search error")

    query = SearchQuery(query="test", level=0, limit=5)

    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        with pytest.raises(HTTPException) as exc_info:
            await semantic_search(query)

        assert exc_info.value.status_code == 500
        assert "Search failed" in exc_info.value.detail


# ============================================================================
# Tests for search_health
# ============================================================================


@pytest.mark.asyncio
async def test_search_health_success(mock_knowledge_service):
    """Test search health check success"""
    with patch("app.modules.knowledge.router.get_knowledge_service", return_value=mock_knowledge_service):
        response = await search_health()

        assert response["status"] == "operational"
        assert response["service"] == "knowledge"
        assert response["embeddings"] == "ready"
        assert response["vector_db"] == "connected"


@pytest.mark.asyncio
async def test_search_health_service_unavailable():
    """Test search health check when service unavailable"""
    with patch("app.modules.knowledge.router.get_knowledge_service", side_effect=Exception("Service error")):
        with pytest.raises(HTTPException) as exc_info:
            await search_health()

        assert exc_info.value.status_code == 503
        assert "Knowledge service unhealthy" in exc_info.value.detail

