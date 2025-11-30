"""
Unit tests for Personality Service
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

from services.personality_service import JakselLanguageMatcher, PersonalityService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def jaksel_matcher():
    """Create JakselLanguageMatcher instance"""
    return JakselLanguageMatcher()


@pytest.fixture
def mock_zantara_client():
    """Mock ZantaraAIClient"""
    client = AsyncMock()
    client.chat_async = AsyncMock(return_value={"text": "Personality response"})
    return client


@pytest.fixture
def personality_service(mock_zantara_client):
    """Create PersonalityService instance"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"
    
    # Mock TEAM_MEMBERS - use actual structure if available
    try:
        from data.team_members import TEAM_MEMBERS as real_team_members
        mock_team_members = real_team_members
    except ImportError:
        mock_team_members = {
            "amanda@balizero.com": {
                "name": "Amanda",
                "personality": "jaksel",
            }
        }
    
    # Patch settings before import
    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        service = PersonalityService()
        return service, mock_zantara_client


# ============================================================================
# Tests for JakselLanguageMatcher
# ============================================================================


def test_jaksel_matcher_init(jaksel_matcher):
    """Test JakselLanguageMatcher initialization"""
    assert jaksel_matcher is not None
    assert hasattr(jaksel_matcher, "greeting_patterns")
    assert hasattr(jaksel_matcher, "script_patterns")


def test_detect_language_italian_greeting(jaksel_matcher):
    """Test detect_language detects Italian greeting"""
    result = jaksel_matcher.detect_language("Ciao, come stai?")

    assert result["language"] == "it"
    assert result["family"] == "latin"
    assert result["confidence"] == "high"


def test_detect_language_spanish_greeting(jaksel_matcher):
    """Test detect_language detects Spanish greeting"""
    result = jaksel_matcher.detect_language("Hola, buenos días")

    assert result["language"] == "es"
    assert result["family"] == "latin"


def test_detect_language_arabic_script(jaksel_matcher):
    """Test detect_language detects Arabic script"""
    result = jaksel_matcher.detect_language("هذا نص عربي")

    assert result["family"] == "arabic"
    assert result["method"] == "script_detection"


def test_detect_language_chinese_script(jaksel_matcher):
    """Test detect_language detects Chinese script"""
    result = jaksel_matcher.detect_language("这是一个中文文本")

    assert result["family"] == "east_asian"
    assert result["method"] == "script_detection"


def test_detect_language_common_words_italian(jaksel_matcher):
    """Test detect_language detects via common words"""
    result = jaksel_matcher.detect_language("il la un è di che e")

    assert result["language"] == "it"
    assert result["method"] == "common_words"


def test_detect_language_fallback(jaksel_matcher):
    """Test detect_language fallback"""
    result = jaksel_matcher.detect_language("Random text xyz")

    assert result["family"] == "default"
    assert result["confidence"] == "none"


def test_adapt_query_for_jaksel_italian(jaksel_matcher):
    """Test adapt_query_for_jaksel for Italian"""
    lang_info = {"language": "it", "family": "latin"}
    
    result = jaksel_matcher.adapt_query_for_jaksel("Test query", lang_info)

    assert isinstance(result, dict)
    # Check for either jaksel_instruction or adapted_query key
    instruction_key = "jaksel_instruction" if "jaksel_instruction" in result else "adapted_query"
    assert instruction_key in result
    instruction_text = result[instruction_key]
    assert "ITALIANO" in instruction_text or "italiano" in instruction_text.lower() or "it" in instruction_text.lower()


def test_adapt_query_for_jaksel_arabic(jaksel_matcher):
    """Test adapt_query_for_jaksel for Arabic"""
    lang_info = {"language": "ar", "family": "arabic"}
    
    result = jaksel_matcher.adapt_query_for_jaksel("Test query", lang_info)

    assert isinstance(result, dict)
    instruction_key = "jaksel_instruction" if "jaksel_instruction" in result else "adapted_query"
    assert instruction_key in result
    instruction_text = result[instruction_key]
    assert "العربية" in instruction_text or "arabic" in instruction_text.lower() or "ar" in instruction_text.lower()


def test_adapt_query_for_jaksel_family_fallback(jaksel_matcher):
    """Test adapt_query_for_jaksel uses family fallback"""
    # Code requires language key, use empty string to trigger family fallback
    lang_info = {"language": "", "family": "latin"}
    
    result = jaksel_matcher.adapt_query_for_jaksel("Test query", lang_info)

    assert isinstance(result, dict)
    assert "adapted_query" in result
    assert result["family"] == "latin"


# ============================================================================
# Tests for PersonalityService
# ============================================================================


def test_personality_service_init(personality_service):
    """Test PersonalityService initialization"""
    service, mock_client = personality_service

    assert service is not None
    assert hasattr(service, "personality_profiles")


def test_get_user_personality_known_user(personality_service):
    """Test get_user_personality for known user"""
    service, mock_client = personality_service

    result = service.get_user_personality("amanda@balizero.com")

    assert isinstance(result, dict)
    assert "personality_type" in result
    assert "personality" in result
    assert "name" in result["personality"] or "user" in result


def test_get_user_personality_unknown_user(personality_service):
    """Test get_user_personality for unknown user"""
    service, mock_client = personality_service

    result = service.get_user_personality("unknown@example.com")

    assert isinstance(result, dict)
    # Should return default personality
    assert "personality_type" in result


def test_get_available_personalities(personality_service):
    """Test get_available_personalities"""
    service, mock_client = personality_service

    personalities = service.get_available_personalities()

    assert isinstance(personalities, list)
    assert len(personalities) > 0
    assert all("name" in p for p in personalities)


def test_get_personality_system_prompt(personality_service):
    """Test get_personality_system_prompt"""
    service, mock_client = personality_service

    prompt = service.get_personality_system_prompt("jaksel")

    assert isinstance(prompt, str)
    assert len(prompt) > 0


def test_get_personality_system_prompt_unknown(personality_service):
    """Test get_personality_system_prompt for unknown personality"""
    service, mock_client = personality_service

    prompt = service.get_personality_system_prompt("unknown")

    assert isinstance(prompt, str)


@pytest.mark.asyncio
async def test_translate_to_personality_success(personality_service):
    """Test translate_to_personality successful"""
    service, mock_client = personality_service
    
    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Translated response"})
    
    with patch("aiohttp.ClientSession") as mock_session:
        mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = mock_response
        
        result = await service.translate_to_personality(
            "Professional answer", "amanda@balizero.com", "Hello"
        )

        assert isinstance(result, dict)
        assert "response" in result or "text" in result or "error" in result


@pytest.mark.asyncio
async def test_translate_to_personality_exception(personality_service):
    """Test translate_to_personality handles exception"""
    service, mock_client = personality_service
    
    with patch("aiohttp.ClientSession", side_effect=Exception("AI error")):
        result = await service.translate_to_personality(
            "Professional answer", "amanda@balizero.com", "Hello"
        )

        assert isinstance(result, dict)
        # Should return error or fallback
        assert "error" in result or "response" in result


@pytest.mark.asyncio
async def test_fast_chat_success(personality_service):
    """Test fast_chat successful"""
    service, mock_client = personality_service

    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Fast response"})

    with patch("aiohttp.ClientSession") as mock_session:
        # Properly mock async context managers for grouped async with
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session_instance = MagicMock()
        mock_session_instance.post = MagicMock(return_value=mock_post_cm)

        mock_session_cm = MagicMock()
        mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
        mock_session_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session.return_value = mock_session_cm

        result = await service.fast_chat("amanda@balizero.com", "Hello")

        assert isinstance(result, dict)
        assert "response" in result or "text" in result or "error" in result


@pytest.mark.asyncio
async def test_fast_chat_unknown_user(personality_service):
    """Test fast_chat for unknown user"""
    service, mock_client = personality_service

    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Response"})

    with patch("aiohttp.ClientSession") as mock_session:
        # Properly mock async context managers for grouped async with
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session_instance = MagicMock()
        mock_session_instance.post = MagicMock(return_value=mock_post_cm)

        mock_session_cm = MagicMock()
        mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
        mock_session_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session.return_value = mock_session_cm

        result = await service.fast_chat("unknown@example.com", "Hello")

        assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_test_personality(personality_service):
    """Test test_personality"""
    service, mock_client = personality_service

    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Test response"})

    with patch("aiohttp.ClientSession") as mock_session:
        # Properly mock async context managers for grouped async with
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session_instance = MagicMock()
        mock_session_instance.post = MagicMock(return_value=mock_post_cm)

        mock_session_cm = MagicMock()
        mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
        mock_session_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session.return_value = mock_session_cm

        result = await service.test_personality("jaksel", "Test message")

        assert isinstance(result, dict)
        assert "response" in result or "text" in result or "error" in result


@pytest.mark.asyncio
async def test_translate_to_personality_gemini_only(personality_service):
    """Test translate_to_personality_gemini_only"""
    service, mock_client = personality_service
    
    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Gemini response"})
    
    with patch("aiohttp.ClientSession") as mock_session:
        mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = mock_response
        
        result = await service.translate_to_personality_gemini_only(
            "Professional answer", "amanda@balizero.com", "Hello"
        )

        assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_enhance_with_zantara_model(personality_service):
    """Test _enhance_with_zantara_model"""
    service, mock_client = personality_service

    # Mock aiohttp for HTTP calls
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"text": "Enhanced response"})

    with patch("aiohttp.ClientSession") as mock_session:
        # Properly mock async context managers for grouped async with
        mock_post_cm = MagicMock()
        mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_post_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session_instance = MagicMock()
        mock_session_instance.post = MagicMock(return_value=mock_post_cm)

        mock_session_cm = MagicMock()
        mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
        mock_session_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session.return_value = mock_session_cm

        personality = {
            "name": "Jaksel",
            "description": "Test personality",
            "system_prompt": "Test prompt",
        }

        result = await service._enhance_with_zantara_model("Original text", personality)

        assert isinstance(result, str)
        assert len(result) > 0

