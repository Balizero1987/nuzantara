"""
Unit tests for Cultural RAG Service
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

from services.cultural_rag_service import CulturalRAGService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    service = AsyncMock()
    service.query_cultural_insights = AsyncMock(return_value=[])
    return service


@pytest.fixture
def cultural_rag_service(mock_search_service):
    """Create CulturalRAGService instance"""
    return CulturalRAGService(mock_search_service)


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(cultural_rag_service, mock_search_service):
    """Test initialization"""
    assert cultural_rag_service.search_service == mock_search_service


# ============================================================================
# Tests for get_cultural_context
# ============================================================================


@pytest.mark.asyncio
async def test_get_cultural_context_success(cultural_rag_service, mock_search_service):
    """Test get_cultural_context successful"""
    mock_search_service.query_cultural_insights.return_value = [
        {
            "content": "Test cultural insight",
            "metadata": {"topic": "indonesian_greetings"},
            "score": 0.85,
        }
    ]

    context_params = {
        "query": "Hello",
        "intent": "greeting",
        "conversation_stage": "first_contact",
    }

    result = await cultural_rag_service.get_cultural_context(context_params, limit=2)

    assert len(result) == 1
    assert result[0]["content"] == "Test cultural insight"
    mock_search_service.query_cultural_insights.assert_called_once()


@pytest.mark.asyncio
async def test_get_cultural_context_greeting_intent(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with greeting intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "Ciao",
        "intent": "greeting",
        "conversation_stage": "ongoing",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    # Should map greeting to first_contact
    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] == "first_contact"


@pytest.mark.asyncio
async def test_get_cultural_context_casual_intent(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with casual intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "How are you?",
        "intent": "casual",
        "conversation_stage": "ongoing",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] == "casual_chat"


@pytest.mark.asyncio
async def test_get_cultural_context_business_intent(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with business intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "Business question",
        "intent": "business_simple",
        "conversation_stage": "ongoing",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] is None


@pytest.mark.asyncio
async def test_get_cultural_context_first_contact_override(cultural_rag_service, mock_search_service):
    """Test get_cultural_context first_contact overrides intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "Hello",
        "intent": "casual",
        "conversation_stage": "first_contact",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] == "first_contact"


@pytest.mark.asyncio
async def test_get_cultural_context_exception(cultural_rag_service, mock_search_service):
    """Test get_cultural_context handles exception"""
    mock_search_service.query_cultural_insights.side_effect = Exception("Search error")

    context_params = {"query": "Test", "intent": "casual"}

    result = await cultural_rag_service.get_cultural_context(context_params)

    assert result == []


@pytest.mark.asyncio
async def test_get_cultural_context_missing_params(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with missing params"""
    mock_search_service.query_cultural_insights.return_value = []

    await cultural_rag_service.get_cultural_context({})

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["query"] == ""
    # Default intent is "casual" which maps to "casual_chat"
    assert call_args.kwargs["when_to_use"] == "casual_chat"


# ============================================================================
# Tests for build_cultural_prompt_injection
# ============================================================================


def test_build_cultural_prompt_injection_success(cultural_rag_service):
    """Test build_cultural_prompt_injection successful"""
    cultural_chunks = [
        {
            "content": "Indonesian people value face-saving culture",
            "metadata": {"topic": "face_saving_culture"},
            "score": 0.85,
        },
        {
            "content": "Bureaucracy requires patience",
            "metadata": {"topic": "bureaucracy_patience"},
            "score": 0.75,
        },
    ]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    assert "Indonesian Cultural Intelligence" in result
    assert "face-saving culture" in result
    assert "Bureaucracy requires patience" in result
    assert "How to use this intelligence" in result


def test_build_cultural_prompt_injection_empty(cultural_rag_service):
    """Test build_cultural_prompt_injection with empty list"""
    result = cultural_rag_service.build_cultural_prompt_injection([])

    assert result == ""


def test_build_cultural_prompt_injection_low_score_filter(cultural_rag_service):
    """Test build_cultural_prompt_injection filters low score chunks"""
    cultural_chunks = [
        {
            "content": "High score insight",
            "metadata": {"topic": "test"},
            "score": 0.85,
        },
        {
            "content": "Low score insight",
            "metadata": {"topic": "test"},
            "score": 0.25,  # Below 0.3 threshold
        },
    ]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    assert "High score insight" in result
    assert "Low score insight" not in result


def test_build_cultural_prompt_injection_missing_metadata(cultural_rag_service):
    """Test build_cultural_prompt_injection handles missing metadata"""
    cultural_chunks = [
        {
            "content": "Test insight",
            "metadata": {},
            "score": 0.85,
        }
    ]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    assert "Test insight" in result
    assert "Cultural Insight" in result  # Default topic


def test_build_cultural_prompt_injection_exception(cultural_rag_service):
    """Test build_cultural_prompt_injection handles exception"""
    cultural_chunks = [{"invalid": "data"}]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    assert result == ""


# ============================================================================
# Tests for get_cultural_topics_coverage
# ============================================================================


@pytest.mark.asyncio
async def test_get_cultural_topics_coverage_success(cultural_rag_service):
    """Test get_cultural_topics_coverage successful"""
    result = await cultural_rag_service.get_cultural_topics_coverage()

    assert isinstance(result, dict)
    assert "indonesian_greetings" in result
    assert "bureaucracy_patience" in result
    assert "face_saving_culture" in result


@pytest.mark.asyncio
async def test_get_cultural_topics_coverage_exception(cultural_rag_service):
    """Test get_cultural_topics_coverage handles exception"""
    # Mock to trigger exception path
    with patch("services.cultural_rag_service.logger") as mock_logger:
        # Force an exception by making dict.fromkeys fail
        with patch("builtins.dict") as mock_dict:
            mock_dict.fromkeys.side_effect = Exception("Dict error")
            result = await cultural_rag_service.get_cultural_topics_coverage()
            # Should return empty dict on exception
            assert result == {}
            # Should log error
            mock_logger.error.assert_called()


@pytest.mark.asyncio
async def test_get_cultural_context_emotional_support_intent(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with emotional_support intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "I'm feeling sad",
        "intent": "emotional_support",
        "conversation_stage": "ongoing",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] == "casual_chat"


@pytest.mark.asyncio
async def test_get_cultural_context_business_complex_intent(cultural_rag_service, mock_search_service):
    """Test get_cultural_context with business_complex intent"""
    mock_search_service.query_cultural_insights.return_value = []

    context_params = {
        "query": "Complex business question",
        "intent": "business_complex",
        "conversation_stage": "ongoing",
    }

    await cultural_rag_service.get_cultural_context(context_params)

    call_args = mock_search_service.query_cultural_insights.call_args
    assert call_args.kwargs["when_to_use"] is None


def test_build_cultural_prompt_injection_missing_score(cultural_rag_service):
    """Test build_cultural_prompt_injection handles missing score"""
    cultural_chunks = [
        {
            "content": "Test insight without explicit score",
            "metadata": {"topic": "test"},
            # score will default to 0.0 via chunk.get("score", 0.0)
        }
    ]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    # Should filter out chunk with score 0.0 (< 0.3 threshold)
    assert "Test insight without explicit score" not in result


def test_build_cultural_prompt_injection_exact_threshold(cultural_rag_service):
    """Test build_cultural_prompt_injection with score exactly at threshold"""
    cultural_chunks = [
        {
            "content": "Threshold insight",
            "metadata": {"topic": "test"},
            "score": 0.3,  # Exactly at threshold
        }
    ]

    result = cultural_rag_service.build_cultural_prompt_injection(cultural_chunks)

    # Should include chunk with score >= 0.3
    assert "Threshold insight" in result

