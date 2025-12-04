"""
Unit tests for Intelligent Router
Updated for Gemini Jaksel Native implementation
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.intelligent_router import IntelligentRouter

# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def mock_gemini_jaksel():
    """Mock GeminiJakselService"""
    service = AsyncMock()
    service.generate_response = AsyncMock(return_value="Gemini response")
    service.generate_response_stream = MagicMock()
    service.model_name = "gemini-1.5-flash"
    return service

@pytest.fixture
def mock_ai_client():
    """Mock ZantaraAIClient (Legacy)"""
    client = AsyncMock()
    return client

@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    service = AsyncMock()
    return service

@pytest.fixture
def mock_tool_executor():
    """Mock ToolExecutor"""
    executor = MagicMock()
    executor.get_available_tools = MagicMock(return_value=[{"name": "tool1"}])
    return executor

@pytest.fixture
def mock_cultural_rag_service():
    """Mock CulturalRAGService"""
    service = AsyncMock()
    service.get_cultural_context = AsyncMock(return_value=[])
    service.build_cultural_prompt_injection = MagicMock(return_value="Cultural context")
    return service

@pytest.fixture
def intelligent_router(
    mock_ai_client,
    mock_search_service,
    mock_tool_executor,
    mock_cultural_rag_service,
    mock_gemini_jaksel,
):
    """Create IntelligentRouter instance with properly mocked dependencies"""

    # Create mock instances for internal components
    mock_classifier = AsyncMock()
    mock_classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    mock_context_builder = MagicMock()
    mock_context_builder.build_memory_context = MagicMock(return_value="")
    mock_context_builder.build_team_context = MagicMock(return_value="")
    mock_context_builder.combine_contexts = MagicMock(return_value="")
    mock_context_builder.detect_identity_query = MagicMock(return_value=False)
    mock_context_builder.detect_zantara_query = MagicMock(return_value=False)
    mock_context_builder.detect_team_query = MagicMock(return_value=False)
    mock_context_builder.build_identity_context = MagicMock(return_value=None)

    mock_rag_manager = AsyncMock()
    mock_rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    mock_response_handler = MagicMock()
    mock_response_handler.classify_query = MagicMock(return_value="business")
    mock_response_handler.sanitize_response = MagicMock(return_value="Sanitized response")

    mock_specialized_router = MagicMock()

    with patch("services.intelligent_router.IntentClassifier", return_value=mock_classifier), \
         patch("services.intelligent_router.ContextBuilder", return_value=mock_context_builder), \
         patch("services.intelligent_router.RAGManager", return_value=mock_rag_manager), \
         patch("services.intelligent_router.SpecializedServiceRouter", return_value=mock_specialized_router), \
         patch("services.intelligent_router.ResponseHandler", return_value=mock_response_handler), \
         patch("services.intelligent_router.gemini_jaksel", mock_gemini_jaksel):

        router = IntelligentRouter(
            ai_client=mock_ai_client,
            search_service=mock_search_service,
            tool_executor=mock_tool_executor,
            cultural_rag_service=mock_cultural_rag_service,
        )

        # Manually assign mocked internal components to router instance
        router.classifier = mock_classifier
        router.context_builder = mock_context_builder
        router.rag_manager = mock_rag_manager
        router.response_handler = mock_response_handler
        router.specialized_router = mock_specialized_router

        yield router, {
            "ai": mock_ai_client,
            "gemini": mock_gemini_jaksel,
            "search": mock_search_service,
            "tool_executor": mock_tool_executor,
            "cultural_rag": mock_cultural_rag_service,
            "classifier": mock_classifier,
            "context_builder": mock_context_builder,
            "rag_manager": mock_rag_manager,
            "response_handler": mock_response_handler,
        }

# ============================================================================
# Tests for __init__
# ============================================================================

def test_init(intelligent_router):
    """Test initialization"""
    router, mocks = intelligent_router
    assert router.ai == mocks["ai"]
    assert router.cultural_rag == mocks["cultural_rag"]
    assert router.tool_executor == mocks["tool_executor"]

# ============================================================================
# Tests for route_chat
# ============================================================================

@pytest.mark.asyncio
async def test_route_chat_basic(intelligent_router):
    """Test route_chat basic flow"""
    router, mocks = intelligent_router

    result = await router.route_chat("How to get visa?", "user123")

    assert isinstance(result, dict)
    assert "response" in result
    assert result["ai_used"] == "gemini-jaksel"
    mocks["gemini"].generate_response.assert_called_once()

@pytest.mark.asyncio
async def test_route_chat_exception(intelligent_router):
    """Test route_chat handles exception"""
    router, mocks = intelligent_router

    router.classifier.classify_intent = AsyncMock(side_effect=Exception("Classification error"))

    with pytest.raises(Exception) as exc_info:
        await router.route_chat("Test", "user123")

    assert "Routing failed" in str(exc_info.value)

# ============================================================================
# Tests for stream_chat
# ============================================================================

@pytest.mark.asyncio
async def test_stream_chat_basic(intelligent_router):
    """Test stream_chat basic flow"""
    router, mocks = intelligent_router

    # Configure Gemini stream as async generator
    async def mock_stream(*args, **kwargs):
        yield "chunk1 "
        yield "chunk2 "

    mocks["gemini"].generate_response_stream = mock_stream

    chunks = []
    async for chunk in router.stream_chat("Test query", "user123"):
        chunks.append(chunk)

    assert len(chunks) > 0
    # Should contain metadata, ping, chunks, done
    types = [c["type"] for c in chunks]
    assert "metadata" in types
    assert "ping" in types
    assert "token" in types
    assert "done" in types

@pytest.mark.asyncio
async def test_stream_chat_exception(intelligent_router):
    """Test stream_chat handles exception"""
    router, mocks = intelligent_router

    router.classifier.classify_intent = AsyncMock(side_effect=Exception("Error"))

    with pytest.raises(Exception) as exc_info:
        async for _ in router.stream_chat("Test", "user123"):
            pass

    assert "Streaming failed" in str(exc_info.value)

# ============================================================================
# Tests for _handle_emotional_override
# ============================================================================

@pytest.mark.asyncio
async def test_handle_emotional_override(intelligent_router):
    """Test _handle_emotional_override returns None (placeholder)"""
    router, mocks = intelligent_router
    result = await router._handle_emotional_override("I'm sad", "user123")
    assert result is None

# ============================================================================
# Tests for _get_cultural_context
# ============================================================================

@pytest.mark.asyncio
async def test_get_cultural_context_success(intelligent_router):
    """Test _get_cultural_context successful"""
    router, mocks = intelligent_router

    mocks["cultural_rag"].get_cultural_context = AsyncMock(
        return_value=[{"content": "Cultural insight"}]
    )

    result = await router._get_cultural_context("Test query", [])

    assert result is not None
    mocks["cultural_rag"].build_cultural_prompt_injection.assert_called_once()

@pytest.mark.asyncio
async def test_get_cultural_context_no_service(intelligent_router):
    """Test _get_cultural_context without service"""
    router, mocks = intelligent_router
    router.cultural_rag = None

    result = await router._get_cultural_context("Test query", [])

    assert result is None

# ============================================================================
# Tests for get_stats
# ============================================================================

def test_get_stats(intelligent_router):
    """Test get_stats"""
    router, mocks = intelligent_router

    stats = router.get_stats()

    assert isinstance(stats, dict)
    assert "router" in stats
    assert stats["router"] == "gemini_jaksel_router"
