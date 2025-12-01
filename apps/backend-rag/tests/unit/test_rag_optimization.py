"""
Unit tests for RAG Optimization features
Tests for metadata filtering, query rewriting, and streaming improvements
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.search_service import SearchService
from services.intelligent_router import IntelligentRouter
from services.context.rag_manager import RAGManager


# ============================================================================
# Tests for Metadata Filtering (Repealed Laws Exclusion)
# ============================================================================


@pytest.fixture
def mock_search_service_with_filter():
    """Mock SearchService that supports filtering"""
    search = MagicMock()
    
    async def mock_search_with_conflict_resolution(query, user_level, limit, enable_fallbacks=True):
        # Simulate filtering out repealed laws
        all_results = [
            {
                "text": "Valid law content",
                "metadata": {"title": "Valid Law", "status_vigensi": "berlaku", "source_collection": "legal_unified"},
                "score": 0.9,
            },
            {
                "text": "Repealed law content",
                "metadata": {"title": "Repealed Law", "status_vigensi": "dicabut", "source_collection": "legal_unified"},
                "score": 0.8,
            },
            {
                "text": "Another valid law",
                "metadata": {"title": "Another Law", "status_vigensi": "berlaku", "source_collection": "legal_unified"},
                "score": 0.7,
            },
        ]
        
        # Filter out repealed laws (simulating Qdrant filter)
        filtered_results = [r for r in all_results if r["metadata"].get("status_vigensi") != "dicabut"]
        
        return {
            "query": query,
            "results": filtered_results,
            "collection_used": "legal_unified",
        }
    
    search.search_with_conflict_resolution = AsyncMock(wraps=mock_search_with_conflict_resolution)
    return search


@pytest.mark.asyncio
async def test_search_service_filters_repealed_laws(mock_search_service_with_filter):
    """Test that SearchService filters out repealed laws by default"""
    # This test verifies the _build_search_filter method excludes "dicabut"
    search_service = SearchService()
    
    # Mock the collections and embedder
    search_service.collections = {"legal_unified": MagicMock()}
    search_service.embedder = MagicMock()
    search_service.embedder.generate_query_embedding = MagicMock(return_value=[0.1] * 1536)
    search_service.router = MagicMock()
    search_service.router.route = MagicMock(return_value="legal_unified")
    
    # Mock QdrantClient search to return filtered results
    mock_qdrant = MagicMock()
    mock_qdrant.search = MagicMock(return_value={
        "ids": ["id1", "id2"],
        "documents": ["Valid law content", "Another valid law"],
        "metadatas": [
            {"title": "Valid Law", "status_vigensi": "berlaku"},
            {"title": "Another Law", "status_vigensi": "berlaku"},
        ],
        "distances": [0.1, 0.3],
    })
    search_service.collections["legal_unified"] = mock_qdrant
    
    # Test filter building
    filter_result = search_service._build_search_filter(exclude_repealed=True)
    
    assert filter_result is not None
    assert "status_vigensi" in filter_result
    assert filter_result["status_vigensi"] == {"$ne": "dicabut"}


@pytest.mark.asyncio
async def test_search_service_allows_explicit_status_filter(mock_search_service_with_filter):
    """Test that explicit status_vigensi filter works correctly"""
    search_service = SearchService()
    
    # Test with explicit filter that includes "berlaku"
    explicit_filter = {"status_vigensi": {"$in": ["berlaku", "perpanjangan"]}}
    filter_result = search_service._build_search_filter(
        tier_filter=explicit_filter, exclude_repealed=True
    )
    
    assert filter_result is not None
    assert "status_vigensi" in filter_result
    # Should not include "dicabut" even if explicitly requested
    if isinstance(filter_result["status_vigensi"], dict) and "$in" in filter_result["status_vigensi"]:
        assert "dicabut" not in filter_result["status_vigensi"]["$in"]


# ============================================================================
# Tests for Query Rewriting
# ============================================================================


@pytest.fixture
def mock_ai_client():
    """Mock ZantaraAIClient for query rewriting"""
    mock_ai = MagicMock()
    mock_ai.is_available = MagicMock(return_value=True)
    
    async def mock_chat_async(messages, max_tokens, temperature):
        # Simulate query rewriting
        prompt = messages[0]["content"]
        if "e per le tasse" in prompt.lower() or "what about taxes" in prompt.lower():
            return {
                "text": "Quali sono le aliquote fiscali per le aziende in Indonesia?",
                "model": "gemini-2.5-flash",
                "provider": "google_native",
                "tokens": {"input": 50, "output": 20},
            }
        return {
            "text": messages[0]["content"].split("Current user query: ")[1].split('"')[1] if "Current user query:" in messages[0]["content"] else "test query",
            "model": "gemini-2.5-flash",
            "provider": "google_native",
            "tokens": {"input": 50, "output": 20},
        }
    
    mock_ai.chat_async = AsyncMock(side_effect=mock_chat_async)
    return mock_ai


@pytest.mark.asyncio
async def test_query_rewriting_expands_followup_queries(mock_ai_client):
    """Test that query rewriting expands ambiguous follow-up queries"""
    router = IntelligentRouter(
        ai_client=mock_ai_client,
        search_service=None,
        tool_executor=None,
    )
    
    conversation_history = [
        {"role": "user", "content": "Tell me about visas"},
        {"role": "assistant", "content": "There are several visa types..."},
        {"role": "user", "content": "e per le tasse?"},
    ]
    
    rewritten = await router._rewrite_query_for_search(
        "e per le tasse?", conversation_history
    )
    
    assert rewritten != "e per le tasse?"
    assert len(rewritten) > len("e per le tasse?")
    assert "fiscali" in rewritten.lower() or "tax" in rewritten.lower()


@pytest.mark.asyncio
async def test_query_rewriting_skips_explicit_queries(mock_ai_client):
    """Test that explicit queries are not rewritten"""
    router = IntelligentRouter(
        ai_client=mock_ai_client,
        search_service=None,
        tool_executor=None,
    )
    
    explicit_query = "What are the tax rates for companies in Indonesia?"
    rewritten = await router._rewrite_query_for_search(explicit_query, None)
    
    # Should return as-is or very similar
    assert rewritten == explicit_query or len(rewritten) <= len(explicit_query) + 20


@pytest.mark.asyncio
async def test_query_rewriting_handles_no_history(mock_ai_client):
    """Test that query rewriting works without conversation history"""
    router = IntelligentRouter(
        ai_client=mock_ai_client,
        search_service=None,
        tool_executor=None,
    )
    
    query = "test query"
    rewritten = await router._rewrite_query_for_search(query, None)
    
    # Should return original query if no history
    assert rewritten == query


@pytest.mark.asyncio
async def test_query_rewriting_handles_ai_failure(mock_ai_client):
    """Test that query rewriting falls back to original on AI failure"""
    router = IntelligentRouter(
        ai_client=mock_ai_client,
        search_service=None,
        tool_executor=None,
    )
    
    # Make AI fail
    mock_ai_client.chat_async = AsyncMock(side_effect=Exception("AI error"))
    
    query = "test query"
    rewritten = await router._rewrite_query_for_search(query, [{"role": "user", "content": "previous"}])
    
    # Should return original query on failure
    assert rewritten == query


# ============================================================================
# Tests for Structured Streaming
# ============================================================================


@pytest.mark.asyncio
async def test_intelligent_router_yields_structured_chunks(mock_ai_client):
    """Test that IntelligentRouter yields structured dictionaries instead of raw strings"""
    router = IntelligentRouter(
        ai_client=mock_ai_client,
        search_service=None,
        tool_executor=None,
    )
    
    # Mock stream to yield text chunks
    async def mock_stream(message, user_id, conversation_history, memory_context, identity_context, max_tokens):
        yield "Hello"
        yield " world"
        yield "!"
    
    mock_ai_client.stream = mock_stream
    
    # Mock RAG manager
    router.rag_manager = MagicMock()
    router.rag_manager.retrieve_context = AsyncMock(return_value={
        "context": None,
        "used_rag": False,
        "document_count": 0,
        "docs": [],
        "collection_used": None,
    })
    
    # Mock context builder
    router.context_builder = MagicMock()
    router.context_builder.detect_identity_query = MagicMock(return_value=False)
    router.context_builder.detect_zantara_query = MagicMock(return_value=False)
    router.context_builder.detect_team_query = MagicMock(return_value=False)
    router.context_builder.build_identity_context = MagicMock(return_value=None)
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")
    
    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = []
    
    chunks = []
    async for chunk in router.stream_chat(
        message="test",
        user_id="test_user",
        conversation_history=None,
        memory=None,
        collaborator=None,
    ):
        chunks.append(chunk)
    
    # Should yield structured dictionaries
    assert len(chunks) > 0
    # First chunk should be metadata
    assert isinstance(chunks[0], dict)
    assert chunks[0].get("type") == "metadata"
    # Subsequent chunks should be tokens
    token_chunks = [c for c in chunks[1:] if isinstance(c, dict) and c.get("type") == "token"]
    assert len(token_chunks) > 0
    # Last chunk should be done
    assert chunks[-1].get("type") == "done"


@pytest.mark.asyncio
async def test_rag_manager_increased_truncation_limit():
    """Test that RAGManager uses increased truncation limits (2500 chars)"""
    mock_search = MagicMock()
    
    async def mock_search_func(query, user_level, limit, enable_fallbacks=True):
        long_text = "A" * 3000  # 3000 characters
        return {
            "query": query,
            "results": [{
                "text": long_text,
                "metadata": {"title": "Long Doc", "source_collection": "test"},
                "score": 0.9,
            }],
        }
    
    mock_search.search_with_conflict_resolution = AsyncMock(wraps=mock_search_func)
    
    rag_manager = RAGManager(search_service=mock_search)
    result = await rag_manager.retrieve_context(
        query="test",
        query_type="business",
        user_level=0,
        limit=5,
    )
    
    assert result["context"] is not None
    # Extract document text from context (after ": ")
    if ": " in result["context"]:
        doc_text = result["context"].split(": ", 1)[1]
        # Should be truncated to 2500 chars (not 500)
        assert len(doc_text) <= 2500
        assert len(doc_text) > 500  # Should be more than old limit

