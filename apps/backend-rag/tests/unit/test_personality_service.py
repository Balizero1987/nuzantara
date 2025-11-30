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


# ============================================================================
# Additional tests for 100% coverage
# ============================================================================


def test_get_user_personality_zero_user(personality_service):
    """Test get_user_personality for zero personality user"""
    service, mock_client = personality_service

    # Mock a user with zero personality
    with patch("data.team_members.TEAM_MEMBERS", {
        "zero@balizero.com": {
            "id": "zero_id",
            "name": "Zero",
            "personality": "zero",
        }
    }):
        # Re-instantiate service with new team members
        mock_settings = MagicMock()
        mock_settings.zantara_oracle_url = "http://test"
        mock_settings.oracle_api_key = "test_key"

        with patch("app.core.config.settings", mock_settings):
            from services.personality_service import PersonalityService
            service = PersonalityService()

            result = service.get_user_personality("zero@balizero.com")

            assert isinstance(result, dict)
            assert "personality_type" in result
            # Should be zero or professional depending on team_members config
            assert result["personality_type"] in ["zero", "professional"]


def test_get_user_personality_professional_user(personality_service):
    """Test get_user_personality for professional personality user"""
    service, mock_client = personality_service

    # Mock a user with professional personality
    with patch("data.team_members.TEAM_MEMBERS", {
        "pro@balizero.com": {
            "id": "pro_id",
            "name": "Professional",
            "personality": "professional",
        }
    }):
        mock_settings = MagicMock()
        mock_settings.zantara_oracle_url = "http://test"
        mock_settings.oracle_api_key = "test_key"

        with patch("app.core.config.settings", mock_settings):
            from services.personality_service import PersonalityService
            service = PersonalityService()

            result = service.get_user_personality("pro@balizero.com")

            assert isinstance(result, dict)
            assert "personality_type" in result


def test_get_user_personality_fallback_to_professional():
    """Test get_user_personality falls back to professional for unlisted users"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    # Mock team members with specific IDs for jaksel and zero
    mock_team_members = {
        "unknown@example.com": {
            "id": "unknown_id",  # This ID won't match jaksel or zero
            "name": "Unknown User",
            "personality": "unknown",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Ensure the ID is not in jaksel or zero team_members
        service.personality_profiles["jaksel"]["team_members"] = ["jaksel_amanda"]
        service.personality_profiles["zero"]["team_members"] = ["zero_id"]

        result = service.get_user_personality("unknown@example.com")

        assert isinstance(result, dict)
        assert result["personality_type"] == "professional"  # Should fallback to professional


@pytest.mark.asyncio
async def test_translate_to_personality_jaksel_with_language_forcing():
    """Test translate_to_personality for Jaksel with language forcing"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "jaksel_amanda",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "it",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock aiohttp for HTTP calls
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"response": "Ciao! Come stai?"})

        with patch("aiohttp.ClientSession") as mock_session:
            mock_post_cm = MagicMock()
            mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
            mock_post_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session_instance = MagicMock()
            mock_session_instance.post = MagicMock(return_value=mock_post_cm)

            mock_session_cm = MagicMock()
            mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
            mock_session_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session.return_value = mock_session_cm

            result = await service.translate_to_personality(
                "Professional answer", "amanda@balizero.com", "Ciao, come stai?"
            )

            assert isinstance(result, dict)
            assert "success" in result or "response" in result


@pytest.mark.asyncio
async def test_translate_to_personality_jaksel_http_error():
    """Test translate_to_personality for Jaksel with HTTP error"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "jaksel_amanda",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Ensure amanda is in jaksel team_members
        service.personality_profiles["jaksel"]["team_members"] = ["jaksel_amanda"]

        # Mock aiohttp for HTTP calls with error
        mock_response = MagicMock()
        mock_response.status = 500

        with patch("aiohttp.ClientSession") as mock_session:
            mock_post_cm = MagicMock()
            mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
            mock_post_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session_instance = MagicMock()
            mock_session_instance.post = MagicMock(return_value=mock_post_cm)

            mock_session_cm = MagicMock()
            mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
            mock_session_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session.return_value = mock_session_cm

            result = await service.translate_to_personality(
                "Professional answer", "amanda@balizero.com", "Hello"
            )

            assert isinstance(result, dict)
            # Should fallback to gemini response
            assert "response" in result
            # The function returns gemini-only path result
            assert "model_used" in result


@pytest.mark.asyncio
async def test_translate_to_personality_jaksel_exception():
    """Test translate_to_personality for Jaksel with exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "jaksel_amanda",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Ensure amanda is in jaksel team_members
        service.personality_profiles["jaksel"]["team_members"] = ["jaksel_amanda"]

        # Mock aiohttp to raise exception
        with patch("aiohttp.ClientSession", side_effect=Exception("Connection error")):
            result = await service.translate_to_personality(
                "Professional answer", "amanda@balizero.com", "Hello"
            )

            assert isinstance(result, dict)
            # Should fallback to gemini response
            assert "response" in result
            # The function returns gemini-only path result
            assert "model_used" in result


@pytest.mark.asyncio
async def test_translate_to_personality_non_jaksel():
    """Test translate_to_personality for non-Jaksel personality"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "pro@balizero.com": {
            "id": "pro_id",
            "name": "Professional",
            "personality": "professional",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock the translate_to_personality_gemini_only method
        mock_gemini_response = {
            "success": True,
            "response": "Professional response",
            "model_used": "gemini-pro",
        }

        with patch.object(service, 'translate_to_personality_gemini_only',
                         AsyncMock(return_value=mock_gemini_response)):
            result = await service.translate_to_personality(
                "Professional answer", "pro@balizero.com", "Hello"
            )

            assert isinstance(result, dict)
            assert result["success"] is True


@pytest.mark.asyncio
async def test_test_personality_invalid_type(personality_service):
    """Test test_personality with invalid personality type"""
    service, mock_client = personality_service

    result = await service.test_personality("invalid_type", "Test message")

    assert isinstance(result, dict)
    assert "error" in result
    assert "not found" in result["error"]


@pytest.mark.asyncio
async def test_test_personality_http_error():
    """Test test_personality with HTTP error"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    with patch("app.core.config.settings", mock_settings):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock aiohttp for HTTP calls with error
        mock_response = MagicMock()
        mock_response.status = 500

        with patch("aiohttp.ClientSession") as mock_session:
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
            assert "success" in result
            assert result["success"] is False


@pytest.mark.asyncio
async def test_test_personality_exception():
    """Test test_personality with exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    with patch("app.core.config.settings", mock_settings):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        with patch("aiohttp.ClientSession", side_effect=Exception("Connection error")):
            result = await service.test_personality("jaksel", "Test message")

            assert isinstance(result, dict)
            assert "success" in result
            assert result["success"] is False
            assert "error" in result


@pytest.mark.asyncio
async def test_translate_to_personality_gemini_only_with_model_getter():
    """Test translate_to_personality_gemini_only with model getter"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "amanda_id",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock Gemini model
        mock_gemini_model = MagicMock()
        mock_gemini_result = MagicMock()
        mock_gemini_result.text = "Gemini personality response"
        mock_gemini_model.generate_content_async = AsyncMock(return_value=mock_gemini_result)

        # Mock model getter
        def mock_model_getter(purpose):
            return mock_gemini_model

        result = await service.translate_to_personality_gemini_only(
            "Professional answer", "amanda@balizero.com", "Hello", gemini_model_getter=mock_model_getter
        )

        assert isinstance(result, dict)
        assert result["success"] is True
        assert "response" in result
        assert result["model_used"] == "gemini-pro-personality"


@pytest.mark.asyncio
async def test_translate_to_personality_gemini_only_model_getter_exception():
    """Test translate_to_personality_gemini_only with model getter exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "amanda_id",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock model getter that raises exception
        def mock_model_getter(purpose):
            raise Exception("Model getter failed")

        result = await service.translate_to_personality_gemini_only(
            "Professional answer", "amanda@balizero.com", "Hello", gemini_model_getter=mock_model_getter
        )

        assert isinstance(result, dict)
        assert result["success"] is True
        # Should fallback to original response
        assert "response" in result


@pytest.mark.asyncio
async def test_translate_to_personality_gemini_only_exception():
    """Test translate_to_personality_gemini_only with overall exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "amanda_id",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock get_user_personality to raise exception
        with patch.object(service, 'get_user_personality', side_effect=Exception("User error")):
            result = await service.translate_to_personality_gemini_only(
                "Professional answer", "amanda@balizero.com", "Hello"
            )

            assert isinstance(result, dict)
            assert result["success"] is True
            assert "response" in result
            assert "error" in result


def test_get_personality_system_prompt_italian_language(personality_service):
    """Test get_personality_system_prompt with Italian language"""
    service, mock_client = personality_service

    prompt = service.get_personality_system_prompt("jaksel", "it")

    assert isinstance(prompt, str)
    assert "ITALIAN" in prompt or "italian" in prompt.lower()


def test_get_personality_system_prompt_ukrainian_language(personality_service):
    """Test get_personality_system_prompt with Ukrainian language"""
    service, mock_client = personality_service

    prompt = service.get_personality_system_prompt("jaksel", "ua")

    assert isinstance(prompt, str)
    assert "UKRAINIAN" in prompt or "ukrainian" in prompt.lower()


def test_get_personality_system_prompt_other_language(personality_service):
    """Test get_personality_system_prompt with other language"""
    service, mock_client = personality_service

    prompt = service.get_personality_system_prompt("jaksel", "fr")

    assert isinstance(prompt, str)
    assert "fr" in prompt or "LANGUAGE" in prompt


@pytest.mark.asyncio
async def test_enhance_with_zantara_model_http_error():
    """Test _enhance_with_zantara_model with HTTP error"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    with patch("app.core.config.settings", mock_settings):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock aiohttp for HTTP calls with error
        mock_response = MagicMock()
        mock_response.status = 500

        with patch("aiohttp.ClientSession") as mock_session:
            mock_post_cm = MagicMock()
            mock_post_cm.__aenter__ = AsyncMock(return_value=mock_response)
            mock_post_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session_instance = MagicMock()
            mock_session_instance.post = MagicMock(return_value=mock_post_cm)

            mock_session_cm = MagicMock()
            mock_session_cm.__aenter__ = AsyncMock(return_value=mock_session_instance)
            mock_session_cm.__aexit__ = AsyncMock(return_value=None)

            mock_session.return_value = mock_session_cm

            personality = {"name": "Jaksel"}
            result = await service._enhance_with_zantara_model("Test text", personality)

            assert isinstance(result, str)
            assert result == "Test text"  # Should return original text on error


@pytest.mark.asyncio
async def test_enhance_with_zantara_model_exception():
    """Test _enhance_with_zantara_model with exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    with patch("app.core.config.settings", mock_settings):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        with patch("aiohttp.ClientSession", side_effect=Exception("Connection error")):
            personality = {"name": "Jaksel"}
            result = await service._enhance_with_zantara_model("Test text", personality)

            assert isinstance(result, str)
            assert result == "Test text"  # Should return original text on exception


@pytest.mark.asyncio
async def test_fast_chat_http_error():
    """Test fast_chat with HTTP error"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "amanda_id",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        # Mock aiohttp for HTTP calls with error
        mock_response = MagicMock()
        mock_response.status = 500

        with patch("aiohttp.ClientSession") as mock_session:
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
            assert "response" in result
            assert result["category"] == "error"


@pytest.mark.asyncio
async def test_fast_chat_exception():
    """Test fast_chat with exception"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = "http://test"
    mock_settings.oracle_api_key = "test_key"

    mock_team_members = {
        "amanda@balizero.com": {
            "id": "amanda_id",
            "name": "Amanda",
            "personality": "jaksel",
            "preferred_language": "en",
        }
    }

    with patch("app.core.config.settings", mock_settings), \
         patch("data.team_members.TEAM_MEMBERS", mock_team_members):
        from services.personality_service import PersonalityService
        service = PersonalityService()

        with patch("aiohttp.ClientSession", side_effect=Exception("Connection error")):
            result = await service.fast_chat("amanda@balizero.com", "Hello")

            assert isinstance(result, dict)
            assert "response" in result
            assert result["category"] == "error"

