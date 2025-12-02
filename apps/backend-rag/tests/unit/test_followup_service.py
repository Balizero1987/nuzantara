"""
Unit tests for Follow-up Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.followup_service import FollowupService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_zantara_client():
    """Mock ZantaraAIClient"""
    client = AsyncMock()
    client.chat_async = AsyncMock()
    return client


@pytest.fixture
def followup_service(mock_zantara_client):
    """Create FollowupService instance with mocked client"""
    with patch("services.followup_service.ZantaraAIClient", return_value=mock_zantara_client):
        return FollowupService()


@pytest.fixture
def followup_service_no_ai():
    """Create FollowupService instance without AI client"""
    with patch("services.followup_service.ZantaraAIClient", side_effect=Exception("No AI")):
        return FollowupService()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_ai(mock_zantara_client):
    """Test initialization with AI client"""
    with patch("services.followup_service.ZantaraAIClient", return_value=mock_zantara_client):
        service = FollowupService()

        assert service.zantara_client == mock_zantara_client


def test_init_without_ai():
    """Test initialization without AI client"""
    with patch("services.followup_service.ZantaraAIClient", side_effect=Exception("No AI")):
        service = FollowupService()

        assert service.zantara_client is None


# ============================================================================
# Tests for get_topic_based_followups
# ============================================================================


def test_get_topic_based_followups_business_en(followup_service):
    """Test get_topic_based_followups for business topic in English"""
    result = followup_service.get_topic_based_followups("test", "response", "business", "en")

    assert isinstance(result, list)
    assert len(result) == 3
    assert all(isinstance(q, str) for q in result)


def test_get_topic_based_followups_business_it(followup_service):
    """Test get_topic_based_followups for business topic in Italian"""
    result = followup_service.get_topic_based_followups("test", "response", "business", "it")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_business_id(followup_service):
    """Test get_topic_based_followups for business topic in Indonesian"""
    result = followup_service.get_topic_based_followups("test", "response", "business", "id")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_immigration(followup_service):
    """Test get_topic_based_followups for immigration topic"""
    result = followup_service.get_topic_based_followups("test", "response", "immigration", "en")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_tax(followup_service):
    """Test get_topic_based_followups for tax topic"""
    result = followup_service.get_topic_based_followups("test", "response", "tax", "en")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_casual(followup_service):
    """Test get_topic_based_followups for casual topic"""
    result = followup_service.get_topic_based_followups("test", "response", "casual", "en")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_technical(followup_service):
    """Test get_topic_based_followups for technical topic"""
    result = followup_service.get_topic_based_followups("test", "response", "technical", "en")

    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_unknown_topic(followup_service):
    """Test get_topic_based_followups with unknown topic"""
    result = followup_service.get_topic_based_followups("test", "response", "unknown", "en")

    # Should fallback to business
    assert isinstance(result, list)
    assert len(result) == 3


def test_get_topic_based_followups_unknown_language(followup_service):
    """Test get_topic_based_followups with unknown language"""
    result = followup_service.get_topic_based_followups("test", "response", "business", "fr")

    # Should fallback to English
    assert isinstance(result, list)
    assert len(result) == 3


# ============================================================================
# Tests for generate_dynamic_followups
# ============================================================================


@pytest.mark.asyncio
async def test_generate_dynamic_followups_success(followup_service, mock_zantara_client):
    """Test generate_dynamic_followups successful"""
    mock_zantara_client.chat_async.return_value = {
        "text": "1. First question?\n2. Second question?\n3. Third question?"
    }

    result = await followup_service.generate_dynamic_followups(
        "What is a KITAS?", "A KITAS is...", language="en"
    )

    assert isinstance(result, list)
    assert len(result) <= 4
    mock_zantara_client.chat_async.assert_called_once()


@pytest.mark.asyncio
async def test_generate_dynamic_followups_no_ai(followup_service_no_ai):
    """Test generate_dynamic_followups without AI client"""
    result = await followup_service_no_ai.generate_dynamic_followups(
        "test", "response", language="en"
    )

    # Should fallback to topic-based
    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_generate_dynamic_followups_parse_error(followup_service, mock_zantara_client):
    """Test generate_dynamic_followups with parse error"""
    mock_zantara_client.chat_async.return_value = {"text": "Invalid format"}

    result = await followup_service.generate_dynamic_followups("test", "response", language="en")

    # Should fallback to topic-based
    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_generate_dynamic_followups_exception(followup_service, mock_zantara_client):
    """Test generate_dynamic_followups with exception"""
    mock_zantara_client.chat_async.side_effect = Exception("AI error")

    result = await followup_service.generate_dynamic_followups("test", "response", language="en")

    # Should fallback to topic-based
    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_generate_dynamic_followups_with_context(followup_service, mock_zantara_client):
    """Test generate_dynamic_followups with conversation context"""
    mock_zantara_client.chat_async.return_value = {"text": "1. First?\n2. Second?\n3. Third?"}

    result = await followup_service.generate_dynamic_followups(
        "test", "response", conversation_context="Previous conversation", language="en"
    )

    assert isinstance(result, list)
    # Should include context in prompt
    call_args = mock_zantara_client.chat_async.call_args
    assert "Previous conversation" in str(call_args)


# ============================================================================
# Tests for _build_followup_generation_prompt
# ============================================================================


def test_build_followup_generation_prompt_en(followup_service):
    """Test _build_followup_generation_prompt in English"""
    prompt = followup_service._build_followup_generation_prompt(
        "What is KITAS?", "A KITAS is...", None, "en"
    )

    assert "English" in prompt
    assert "What is KITAS?" in prompt
    assert "A KITAS is" in prompt


def test_build_followup_generation_prompt_it(followup_service):
    """Test _build_followup_generation_prompt in Italian"""
    prompt = followup_service._build_followup_generation_prompt("test", "response", None, "it")

    assert "italiano" in prompt.lower()


def test_build_followup_generation_prompt_id(followup_service):
    """Test _build_followup_generation_prompt in Indonesian"""
    prompt = followup_service._build_followup_generation_prompt("test", "response", None, "id")

    assert "bahasa Indonesia" in prompt.lower() or "indonesia" in prompt.lower()


def test_build_followup_generation_prompt_with_context(followup_service):
    """Test _build_followup_generation_prompt with context"""
    prompt = followup_service._build_followup_generation_prompt(
        "test", "response", "Previous context", "en"
    )

    assert "Previous context" in prompt


# ============================================================================
# Tests for _parse_followup_list
# ============================================================================


def test_parse_followup_list_numbered(followup_service):
    """Test _parse_followup_list with numbered list"""
    text = "1. First question?\n2. Second question?\n3. Third question?"

    result = followup_service._parse_followup_list(text)

    assert len(result) == 3
    assert "First question?" in result[0]
    assert "Second question?" in result[1]


def test_parse_followup_list_with_parentheses(followup_service):
    """Test _parse_followup_list with parentheses"""
    text = "1) First question?\n2) Second question?"

    result = followup_service._parse_followup_list(text)

    assert len(result) == 2


def test_parse_followup_list_with_quotes(followup_service):
    """Test _parse_followup_list with quotes"""
    text = '1. "First question?"\n2. "Second question?"'

    result = followup_service._parse_followup_list(text)

    assert len(result) == 2
    assert result[0] == "First question?"
    assert result[1] == "Second question?"


def test_parse_followup_list_invalid_format(followup_service):
    """Test _parse_followup_list with invalid format"""
    text = "This is not a numbered list"

    result = followup_service._parse_followup_list(text)

    assert isinstance(result, list)
    assert len(result) == 0


# ============================================================================
# Tests for detect_topic_from_query
# ============================================================================


def test_detect_topic_from_query_immigration(followup_service):
    """Test detect_topic_from_query detects immigration"""
    topics = ["visa", "kitas", "immigration", "permit", "imigrasi", "visto"]

    for topic in topics:
        result = followup_service.detect_topic_from_query(f"Tell me about {topic}")
        assert result == "immigration"


def test_detect_topic_from_query_tax(followup_service):
    """Test detect_topic_from_query detects tax"""
    topics = ["tax", "pajak", "tassa", "fiscal", "npwp", "pph"]

    for topic in topics:
        result = followup_service.detect_topic_from_query(f"Tell me about {topic}")
        assert result == "tax"


def test_detect_topic_from_query_technical(followup_service):
    """Test detect_topic_from_query detects technical"""
    topics = ["code", "programming", "api", "develop", "software", "bug", "error", "function"]

    for topic in topics:
        result = followup_service.detect_topic_from_query(f"Tell me about {topic}")
        assert result == "technical"


def test_detect_topic_from_query_casual(followup_service):
    """Test detect_topic_from_query detects casual"""
    topics = [
        "hello",
        "hi",
        "ciao",
        "halo",
        "how are",
        "come stai",
        "apa kabar",
        "thanks",
        "grazie",
    ]

    for topic in topics:
        result = followup_service.detect_topic_from_query(topic)
        assert result == "casual"


def test_detect_topic_from_query_business_default(followup_service):
    """Test detect_topic_from_query defaults to business"""
    result = followup_service.detect_topic_from_query("Tell me about company setup")

    assert result == "business"


# ============================================================================
# Tests for detect_language_from_query
# ============================================================================


def test_detect_language_from_query_italian(followup_service):
    """Test detect_language_from_query detects Italian"""
    queries = ["ciao", "come stai", "grazie", "prego", "buongiorno", "per favore", "cosa", "dove"]

    for query in queries:
        result = followup_service.detect_language_from_query(query)
        assert result == "it"


def test_detect_language_from_query_indonesian(followup_service):
    """Test detect_language_from_query detects Indonesian"""
    queries = [
        "halo",
        "apa kabar",
        "terima kasih",
        "selamat",
        "aku",
        "saya",
        "mau",
        "bisa",
    ]

    for query in queries:
        result = followup_service.detect_language_from_query(query)
        assert result == "id"


def test_detect_language_from_query_english_default(followup_service):
    """Test detect_language_from_query defaults to English"""
    result = followup_service.detect_language_from_query("Hello, how are you?")

    assert result == "en"


# ============================================================================
# Tests for get_followups
# ============================================================================


@pytest.mark.asyncio
async def test_get_followups_with_ai(followup_service, mock_zantara_client):
    """Test get_followups with AI enabled"""
    mock_zantara_client.chat_async.return_value = {"text": "1. First?\n2. Second?\n3. Third?"}

    result = await followup_service.get_followups("What is visa?", "A visa is...", use_ai=True)

    assert isinstance(result, list)
    assert len(result) <= 4
    mock_zantara_client.chat_async.assert_called_once()


@pytest.mark.asyncio
async def test_get_followups_without_ai(followup_service):
    """Test get_followups without AI"""
    followup_service.zantara_client = None

    result = await followup_service.get_followups("What is visa?", "A visa is...", use_ai=False)

    assert isinstance(result, list)
    assert len(result) == 3


@pytest.mark.asyncio
async def test_get_followups_with_context(followup_service, mock_zantara_client):
    """Test get_followups with conversation context"""
    mock_zantara_client.chat_async.return_value = {"text": "1. First?\n2. Second?\n3. Third?"}

    result = await followup_service.get_followups(
        "test", "response", conversation_context="Previous context"
    )

    assert isinstance(result, list)


# ============================================================================
# Tests for health_check
# ============================================================================


@pytest.mark.asyncio
async def test_health_check_with_ai(followup_service):
    """Test health_check with AI available"""
    result = await followup_service.health_check()

    assert result["status"] == "healthy"
    assert result["ai_available"] is True
    assert "features" in result
    assert result["features"]["dynamic_generation"] is True


@pytest.mark.asyncio
async def test_health_check_without_ai(followup_service_no_ai):
    """Test health_check without AI"""
    result = await followup_service_no_ai.health_check()

    assert result["status"] == "healthy"
    assert result["ai_available"] is False
    assert result["features"]["dynamic_generation"] is False
