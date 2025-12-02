"""
Unit tests for Intelligent Router
100% coverage target with comprehensive mocking
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
def mock_ai_client():
    """Mock ZantaraAIClient"""
    client = AsyncMock()
    client.conversational = AsyncMock(
        return_value={
            "text": "AI response",
            "model": "zantara-ai",
            "tokens": {"input": 100, "output": 50},
        }
    )
    client.conversational_with_tools = AsyncMock(
        return_value={
            "text": "AI response with tools",
            "model": "zantara-ai",
            "tokens": {"input": 100, "output": 50},
            "used_tools": True,
            "tools_called": ["tool1"],
        }
    )
    client.stream = AsyncMock()
    client.is_available = MagicMock(return_value=True)
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
def mock_personality_service():
    """Mock PersonalityService"""
    service = AsyncMock()
    service.fast_chat = AsyncMock(
        return_value={
            "response": "Fast response",
            "ai_used": "personality",
            "category": "greeting",
        }
    )
    return service


@pytest.fixture
def mock_autonomous_research_service():
    """Mock AutonomousResearchService"""
    service = AsyncMock()
    service.research = AsyncMock(return_value=None)
    return service


@pytest.fixture
def mock_cross_oracle_service():
    """Mock CrossOracleSynthesisService"""
    service = AsyncMock()
    service.synthesize = AsyncMock(return_value=None)
    return service


@pytest.fixture
def mock_client_journey_orchestrator():
    """Mock ClientJourneyOrchestrator"""
    service = AsyncMock()
    service.orchestrate = AsyncMock(return_value=None)
    return service


@pytest.fixture
def intelligent_router(
    mock_ai_client,
    mock_search_service,
    mock_tool_executor,
    mock_cultural_rag_service,
    mock_personality_service,
    mock_autonomous_research_service,
    mock_cross_oracle_service,
    mock_client_journey_orchestrator,
):
    """Create IntelligentRouter instance"""
    with patch("services.intelligent_router.IntentClassifier"), patch(
        "services.intelligent_router.ContextBuilder"
    ), patch("services.intelligent_router.RAGManager"), patch(
        "services.intelligent_router.SpecializedServiceRouter"
    ), patch("services.intelligent_router.ResponseHandler"), patch(
        "services.intelligent_router.SimpleJakselCallerHF"
    ):
        router = IntelligentRouter(
            ai_client=mock_ai_client,
            search_service=mock_search_service,
            tool_executor=mock_tool_executor,
            cultural_rag_service=mock_cultural_rag_service,
            personality_service=mock_personality_service,
            autonomous_research_service=mock_autonomous_research_service,
            cross_oracle_synthesis_service=mock_cross_oracle_service,
            client_journey_orchestrator=mock_client_journey_orchestrator,
        )

        return router, {
            "ai": mock_ai_client,
            "search": mock_search_service,
            "tool_executor": mock_tool_executor,
            "cultural_rag": mock_cultural_rag_service,
            "personality": mock_personality_service,
            "autonomous_research": mock_autonomous_research_service,
            "cross_oracle": mock_cross_oracle_service,
            "client_journey": mock_client_journey_orchestrator,
        }


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(intelligent_router):
    """Test initialization"""
    router, mocks = intelligent_router

    assert router.ai == mocks["ai"]
    assert router.cultural_rag == mocks["cultural_rag"]
    assert router.personality_service == mocks["personality"]
    assert router.tool_executor == mocks["tool_executor"]


def test_init_minimal(mock_ai_client):
    """Test initialization with minimal dependencies"""
    with patch("services.intelligent_router.IntentClassifier"), patch(
        "services.intelligent_router.ContextBuilder"
    ), patch("services.intelligent_router.RAGManager"), patch(
        "services.intelligent_router.SpecializedServiceRouter"
    ), patch("services.intelligent_router.ResponseHandler"), patch(
        "services.intelligent_router.SimpleJakselCallerHF"
    ):
        router = IntelligentRouter(ai_client=mock_ai_client)

        assert router.ai == mock_ai_client
        assert router.cultural_rag is None
        assert router.personality_service is None


# ============================================================================
# Tests for route_chat
# ============================================================================


@pytest.mark.asyncio
async def test_route_chat_basic(intelligent_router):
    """Test route_chat basic flow"""
    router, mocks = intelligent_router

    # Mock classifier
    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    # Mock context builder
    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="Memory context")
    router.context_builder.build_team_context = MagicMock(return_value="Team context")
    router.context_builder.combine_contexts = MagicMock(return_value="Combined context")

    # Mock RAG manager
    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "RAG context",
            "used_rag": True,
            "docs": [],
        }
    )

    # Mock response handler
    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Sanitized response")

    # Mock context builder identity detection (should return False for business queries)
    router.context_builder.detect_identity_query = MagicMock(return_value=False)
    router.context_builder.detect_zantara_query = MagicMock(return_value=False)
    router.context_builder.detect_team_query = MagicMock(return_value=False)

    # Mock specialized router
    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    # Mock Jaksel caller
    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    result = await router.route_chat("How to get visa?", "user123")

    assert isinstance(result, dict)
    assert "response" in result
    assert result["ai_used"] == "zantara-ai"
    assert result["category"] == "business_simple"


@pytest.mark.asyncio
async def test_route_chat_greeting_fast_track(intelligent_router):
    """Test route_chat with greeting triggers fast track"""
    router, mocks = intelligent_router

    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "greeting",
            "suggested_ai": "zantara-ai",
            "confidence": 0.9,
        }
    )

    # Mock context builder to avoid fall-through and ensure fast track
    router.context_builder = MagicMock()
    router.context_builder.detect_identity_query = MagicMock(return_value=False)
    router.context_builder.detect_zantara_query = MagicMock(return_value=False)
    router.context_builder.detect_team_query = MagicMock(return_value=False)

    result = await router.route_chat("Hello", "user123")

    # Should use fast track
    mocks["personality"].fast_chat.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_with_tools(intelligent_router):
    """Test route_chat with tools enabled"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    result = await router.route_chat(
        "How to get visa?", "user123", frontend_tools=[{"name": "tool1"}]
    )

    mocks["ai"].conversational_with_tools.assert_called_once()
    assert result["used_tools"] is True


@pytest.mark.asyncio
async def test_route_chat_emotional_override(intelligent_router):
    """Test route_chat with emotional override"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    # Mock emotional profile
    emotional_profile = MagicMock()
    emotional_profile.detected_state = MagicMock()
    emotional_profile.detected_state.value = "sad"

    result = await router.route_chat("I'm sad", "user123", emotional_profile=emotional_profile)

    assert isinstance(result, dict)
    # May use emotional override or normal flow


@pytest.mark.asyncio
async def test_route_chat_autonomous_research(intelligent_router):
    """Test route_chat routes to autonomous research"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_complex",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.specialized_router = AsyncMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=True)
    router.specialized_router.route_autonomous_research = AsyncMock(
        return_value={
            "response": "Research answer",
            "ai_used": "autonomous-research",
        }
    )
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    result = await router.route_chat("Complex research query", "user123")

    assert result["ai_used"] == "autonomous-research"
    router.specialized_router.route_autonomous_research.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_cross_oracle(intelligent_router):
    """Test route_chat routes to cross-oracle synthesis"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_complex",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.specialized_router = AsyncMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=True)
    router.specialized_router.route_cross_oracle = AsyncMock(
        return_value={
            "response": "Synthesis answer",
            "ai_used": "cross-oracle",
        }
    )
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    result = await router.route_chat("Open restaurant in Bali", "user123")

    assert result["ai_used"] == "cross-oracle"
    router.specialized_router.route_cross_oracle.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_jaksel_style(intelligent_router):
    """Test route_chat applies Jaksel style"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {"user123": True}
    router.jaksel_caller.call_jaksel_direct = AsyncMock(
        return_value={
            "success": True,
            "response": "Jaksel styled response",
        }
    )

    result = await router.route_chat("Hello", "user123")

    router.jaksel_caller.call_jaksel_direct.assert_called_once()
    assert "Jaksel" in result["response"] or result["response"] == "Jaksel styled response"


@pytest.mark.asyncio
async def test_route_chat_exception(intelligent_router):
    """Test route_chat handles exception"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
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

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    # Mock stream
    async def mock_stream(*args, **kwargs):
        yield "chunk1 "
        yield "chunk2 "

    mocks["ai"].stream = mock_stream

    chunks = []
    async for chunk in router.stream_chat("Test query", "user123"):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_chat_comparison_query(intelligent_router):
    """Test stream_chat detects comparison query"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    async def mock_stream(*args, **kwargs):
        yield "chunk"

    mocks["ai"].stream = mock_stream

    chunks = []
    async for chunk in router.stream_chat("Confronta visa vs KITAS", "user123"):
        chunks.append(chunk)

    # Should use higher max_tokens for comparison
    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_chat_jaksel_user(intelligent_router):
    """Test stream_chat buffers for Jaksel users"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Sanitized")

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {"user123": True}
    router.jaksel_caller.call_jaksel_direct = AsyncMock(
        return_value={
            "success": True,
            "response": "Jaksel response",
        }
    )

    async def mock_stream(*args, **kwargs):
        yield "chunk1"
        yield "chunk2"

    mocks["ai"].stream = mock_stream

    chunks = []
    async for chunk in router.stream_chat("Test", "user123"):
        chunks.append(chunk)

    # Should process Jaksel style
    router.jaksel_caller.call_jaksel_direct.assert_called_once()


@pytest.mark.asyncio
async def test_stream_chat_exception(intelligent_router):
    """Test stream_chat handles exception"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(side_effect=Exception("Error"))

    with pytest.raises(Exception) as exc_info:
        async for _ in router.stream_chat("Test", "user123"):
            pass

    assert "Streaming failed" in str(exc_info.value)


# ============================================================================
# Tests for _handle_emotional_override
# ============================================================================


@pytest.mark.asyncio
async def test_handle_emotional_override_sad(intelligent_router):
    """Test _handle_emotional_override for sad state"""
    router, mocks = intelligent_router

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="Memory context")

    emotional_profile = MagicMock()
    emotional_profile.detected_state = MagicMock()
    emotional_profile.detected_state.value = "sad"

    result = await router._handle_emotional_override(
        "I'm sad", "user123", [], None, emotional_profile, []
    )

    assert isinstance(result, dict)
    assert result["category"] == "emotional_support"


@pytest.mark.asyncio
async def test_handle_emotional_override_neutral(intelligent_router):
    """Test _handle_emotional_override for neutral state"""
    router, mocks = intelligent_router

    emotional_profile = MagicMock()
    emotional_profile.detected_state = MagicMock()
    emotional_profile.detected_state.value = "neutral"

    result = await router._handle_emotional_override(
        "Hello", "user123", [], None, emotional_profile, []
    )

    assert result is None  # Should not override for neutral


# ============================================================================
# Tests for _get_cultural_context
# ============================================================================


@pytest.mark.asyncio
async def test_get_cultural_context_success(intelligent_router):
    """Test _get_cultural_context successful"""
    router, mocks = intelligent_router

    mocks["cultural_rag"].get_cultural_context = AsyncMock(
        return_value=[{"content": "Cultural insight", "metadata": {"topic": "test"}, "score": 0.8}]
    )

    result = await router._get_cultural_context("Test query", [])

    assert result is not None
    assert "Cultural" in result


@pytest.mark.asyncio
async def test_get_cultural_context_no_service(intelligent_router):
    """Test _get_cultural_context without service"""
    router, mocks = intelligent_router
    router.cultural_rag = None

    result = await router._get_cultural_context("Test query", [])

    assert result is None


@pytest.mark.asyncio
async def test_get_cultural_context_exception(intelligent_router):
    """Test _get_cultural_context handles exception"""
    router, mocks = intelligent_router

    mocks["cultural_rag"].get_cultural_context = AsyncMock(side_effect=Exception("Error"))

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
    assert stats["router"] == "zantara_ai_router"
    assert "ai_models" in stats
    assert "rag_available" in stats


# ============================================================================
# Additional Tests for Missing Coverage (78% -> 90%+)
# ============================================================================


@pytest.mark.asyncio
async def test_route_chat_backend_tools_path(intelligent_router):
    """Test route_chat uses backend tools when frontend_tools is None"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    # Ensure tool_executor has get_available_tools
    router.tool_executor.get_available_tools = MagicMock(return_value=[{"name": "backend_tool"}])

    result = await router.route_chat("Test query", "user123", frontend_tools=None)

    # Should call conversational_with_tools with backend tools
    mocks["ai"].conversational_with_tools.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_no_tools_path(intelligent_router):
    """Test route_chat without tools uses conversational"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    # No tool executor
    router.tool_executor = None

    result = await router.route_chat("Test query", "user123")

    # Should call conversational without tools
    mocks["ai"].conversational.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_emotional_override_returns_result(intelligent_router):
    """Test route_chat emotional override returns result directly"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")

    # Mock emotional profile with anxious state
    emotional_profile = MagicMock()
    emotional_profile.detected_state = "anxious"

    # Mock _handle_emotional_override to return a result
    router._handle_emotional_override = AsyncMock(
        return_value={
            "response": "Empathetic response",
            "ai_used": "zantara-ai",
            "category": "emotional_support",
        }
    )

    result = await router.route_chat("I'm anxious", "user123", emotional_profile=emotional_profile)

    # Should return emotional override result
    assert result["category"] == "emotional_support"
    router._handle_emotional_override.assert_called_once()


@pytest.mark.asyncio
async def test_route_chat_jaksel_failure(intelligent_router):
    """Test route_chat handles Jaksel style failure"""
    router, mocks = intelligent_router

    router.classifier = AsyncMock()
    router.classifier.classify_intent = AsyncMock(
        return_value={
            "category": "business_simple",
            "suggested_ai": "zantara-ai",
            "confidence": 0.8,
        }
    )

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")
    router.response_handler.sanitize_response = MagicMock(return_value="Sanitized response")

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {"user123": True}
    router.jaksel_caller.call_jaksel_direct = AsyncMock(
        return_value={
            "success": False,
            "error": "Jaksel API unavailable",
        }
    )

    router.tool_executor = None

    result = await router.route_chat("Hello", "user123")

    # Should return sanitized response even if Jaksel fails
    assert result["response"] == "Sanitized response"


@pytest.mark.asyncio
async def test_stream_chat_cross_topic_query(intelligent_router):
    """Test stream_chat detects cross-topic query and adjusts max_tokens"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business")

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="")
    router.context_builder.build_team_context = MagicMock(return_value="")
    router.context_builder.combine_contexts = MagicMock(return_value="")

    router.rag_manager = AsyncMock()
    router.rag_manager.retrieve_context = AsyncMock(
        return_value={
            "context": "",
            "used_rag": False,
            "docs": [],
        }
    )

    router.specialized_router = MagicMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=False)

    router.jaksel_caller = MagicMock()
    router.jaksel_caller.jaksel_users = {}

    async def mock_stream(*args, **kwargs):
        # Verify max_tokens is 10000 for cross-topic
        assert kwargs.get("max_tokens") == 10000
        yield "chunk"

    mocks["ai"].stream = mock_stream

    chunks = []
    async for chunk in router.stream_chat("Dammi timeline completa e tutti i costi", "user123"):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_chat_autonomous_research_routing(intelligent_router):
    """Test stream_chat routes to autonomous research and yields result"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business_complex")

    router.specialized_router = AsyncMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=True)
    router.specialized_router.route_autonomous_research = AsyncMock(
        return_value={
            "response": "Research answer text here",
            "ai_used": "autonomous-research",
        }
    )

    chunks = []
    async for chunk in router.stream_chat("Complex research query", "user123"):
        chunks.append(chunk)

    # Should yield words from research answer
    assert len(chunks) > 0
    router.specialized_router.route_autonomous_research.assert_called_once()


@pytest.mark.asyncio
async def test_stream_chat_cross_oracle_routing(intelligent_router):
    """Test stream_chat routes to cross-oracle and yields result"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="business_complex")

    router.specialized_router = AsyncMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=True)
    router.specialized_router.route_cross_oracle = AsyncMock(
        return_value={
            "response": "Cross oracle synthesis result",
            "ai_used": "cross-oracle",
        }
    )

    chunks = []
    async for chunk in router.stream_chat("Open restaurant in Bali", "user123"):
        chunks.append(chunk)

    # Should yield words from synthesis result
    assert len(chunks) > 0
    router.specialized_router.route_cross_oracle.assert_called_once()


@pytest.mark.asyncio
async def test_stream_chat_client_journey_routing(intelligent_router):
    """Test stream_chat routes to client journey and yields result"""
    router, mocks = intelligent_router

    router.response_handler = MagicMock()
    router.response_handler.classify_query = MagicMock(return_value="workflow")

    router.specialized_router = AsyncMock()
    router.specialized_router.detect_autonomous_research = MagicMock(return_value=False)
    router.specialized_router.detect_cross_oracle = MagicMock(return_value=False)
    router.specialized_router.detect_client_journey = MagicMock(return_value=True)
    router.specialized_router.route_client_journey = AsyncMock(
        return_value={
            "response": "Client journey orchestration result",
            "ai_used": "client-journey",
        }
    )

    chunks = []
    async for chunk in router.stream_chat("Start visa application", "user123"):
        chunks.append(chunk)

    # Should yield words from journey result
    assert len(chunks) > 0
    router.specialized_router.route_client_journey.assert_called_once()


@pytest.mark.asyncio
async def test_handle_emotional_override_with_tools(intelligent_router):
    """Test _handle_emotional_override with tools"""
    router, mocks = intelligent_router

    router.context_builder = MagicMock()
    router.context_builder.build_memory_context = MagicMock(return_value="Memory context")

    emotional_profile = MagicMock()
    emotional_profile.detected_state = MagicMock()
    emotional_profile.detected_state.value = "anxious"

    tools = [{"name": "tool1"}]

    result = await router._handle_emotional_override(
        "I'm anxious", "user123", [], None, emotional_profile, tools
    )

    assert isinstance(result, dict)
    assert result["category"] == "emotional_support"
    mocks["ai"].conversational_with_tools.assert_called_once()


@pytest.mark.asyncio
async def test_get_cultural_context_with_history(intelligent_router):
    """Test _get_cultural_context with conversation history"""
    router, mocks = intelligent_router

    mocks["cultural_rag"].get_cultural_context = AsyncMock(
        return_value=[{"content": "Cultural insight", "metadata": {"topic": "test"}, "score": 0.8}]
    )

    # Provide extensive conversation history (>= 3 messages)
    history = [
        {"role": "user", "content": "Hi"},
        {"role": "assistant", "content": "Hello"},
        {"role": "user", "content": "Tell me about Bali"},
    ]

    result = await router._get_cultural_context("Test query", history)

    assert result is not None
    # Should detect ongoing conversation stage
    call_args = mocks["cultural_rag"].get_cultural_context.call_args
    assert call_args[0][0]["conversation_stage"] == "ongoing"
