"""
Unit tests for SimpleJakselCallerTranslation
Coverage target: 90%+ (114 statements)
Tests translation layer, HuggingFace API, fallback URLs, and language detection
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller_translation import SimpleJakselCallerTranslation

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings"""
    mock = MagicMock()
    mock.hf_api_key = "test-hf-key-12345"
    return mock


@pytest.fixture
def jaksel_caller(mock_settings):
    """Create SimpleJakselCallerTranslation instance"""
    with patch("app.routers.simple_jaksel_caller_translation.settings", mock_settings):
        return SimpleJakselCallerTranslation()


# ============================================================================
# Test Initialization
# ============================================================================


def test_init(jaksel_caller):
    """Test initialization"""
    assert (
        jaksel_caller.hf_api_url == "https://api-inference.huggingface.co/models/zeroai87/jaksel-ai"
    )
    assert "Bearer test-hf-key-12345" in jaksel_caller.hf_headers["Authorization"]
    assert jaksel_caller.hf_headers["Content-Type"] == "application/json"
    assert len(jaksel_caller.oracle_urls) == 4
    assert "anton@balizero.com" in jaksel_caller.jaksel_users
    assert jaksel_caller.jaksel_users["anton@balizero.com"] == "Anton"
    assert jaksel_caller.jaksel_users["amanda@balizero.com"] == "Amanda"
    assert jaksel_caller.jaksel_users["krisna@balizero.com"] == "Krisna"


# ============================================================================
# Test Language Detection
# ============================================================================


def test_detect_language_italian(jaksel_caller):
    """Test Italian language detection"""
    queries = [
        "ciao come stai?",
        "Italiano perfetto!",
        "grazie mille per la traduzione",
        "funziona bene praticamente",
    ]
    for query in queries:
        assert jaksel_caller.detect_language(query) == "Italiano"


def test_detect_language_indonesian(jaksel_caller):
    """Test Bahasa Indonesia detection"""
    queries = [
        "halo apa kabar?",
        "terima kasih banyak",
        "bagaimana cara kerjanya?",
        "baik sekali",
    ]
    for query in queries:
        assert jaksel_caller.detect_language(query) == "Bahasa Indonesia"


def test_detect_language_english(jaksel_caller):
    """Test English detection"""
    queries = [
        "hello how are you?",
        "thank you very much",
        "please help me with this",
        "english translation system",
    ]
    for query in queries:
        assert jaksel_caller.detect_language(query) == "English"


def test_detect_language_default(jaksel_caller):
    """Test default language (Indonesian)"""
    query = "xyz 123 unknown text"
    assert jaksel_caller.detect_language(query) == "Bahasa Indonesia"


def test_detect_language_case_insensitive(jaksel_caller):
    """Test case insensitive detection"""
    assert jaksel_caller.detect_language("CIAO COME STAI") == "Italiano"
    assert jaksel_caller.detect_language("HALO APA KABAR") == "Bahasa Indonesia"
    assert jaksel_caller.detect_language("HELLO HOW ARE YOU") == "English"


# ============================================================================
# Test Prompt Building
# ============================================================================


def test_build_jaksel_prompt(jaksel_caller):
    """Test building Jaksel prompt"""
    query = "Test query"
    user_name = "Anton"
    gemini_answer = "Professional answer"

    prompt = jaksel_caller._build_jaksel_prompt(query, user_name, gemini_answer)

    assert "Halo Kak Anton" in prompt
    assert query in prompt
    assert gemini_answer in prompt
    assert "Jaksel" in prompt
    assert "Jakarta Selatan" in prompt
    assert "casual" in prompt
    assert "friendly" in prompt


@pytest.mark.asyncio
async def test_call_jaksel_direct_success(jaksel_caller):
    """Test successful Jaksel call with translation"""
    query = "Ciao, come stai?"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm doing well, thank you!"

    # Mock aiohttp response with async context manager
    # HF API returns list format: [{"generated_text": "..."}]
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(
        return_value=[{"generated_text": "Halo Kak Anton! Gue baik-baik aja!"}]
    )
    mock_hf_response.text = AsyncMock(return_value="")

    # Create async context manager for HF response
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Mock for get() (translation API) - not used if response doesn't need translation
    mock_get_response = MagicMock()
    mock_get_response.status = 200
    mock_get_response.json = AsyncMock(return_value=[[["Ciao", "Hello", None, None]], None, "en"])
    mock_get_response_cm = AsyncMock()
    mock_get_response_cm.__aenter__ = AsyncMock(return_value=mock_get_response)
    mock_get_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Mock session.post() to return HF success for HF API URL
    def mock_post(url, **kwargs):
        # HF API URL returns success
        if "router.huggingface.co" in str(url) or "api-inference.huggingface.co" in str(url):
            return mock_hf_response_cm
        # Fallback URLs return error (not tested in this case)
        mock_fallback_response = MagicMock()
        mock_fallback_response.status = 500
        mock_fallback_response.text = AsyncMock(return_value="Error")
        mock_fallback_response_cm = AsyncMock()
        mock_fallback_response_cm.__aenter__ = AsyncMock(return_value=mock_fallback_response)
        mock_fallback_response_cm.__aexit__ = AsyncMock(return_value=None)
        return mock_fallback_response_cm

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=mock_post)
    mock_session.get = MagicMock(return_value=mock_get_response_cm)

    mock_client_session = MagicMock()
    mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("aiohttp.ClientSession", mock_client_session):
        # Use call_jaksel_with_translation instead of call_jaksel_direct
        result = await jaksel_caller.call_jaksel_with_translation(query, user_email, gemini_answer)

        assert result["success"] is True
        assert "response" in result


@pytest.mark.asyncio
async def test_call_jaksel_direct_user_not_in_team(jaksel_caller):
    """Test Jaksel call with user not in team"""
    query = "Hello"
    user_email = "unknown@example.com"
    gemini_answer = "Test answer"

    result = await jaksel_caller.call_jaksel_with_translation(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "User not in Jaksel team"


@pytest.mark.asyncio
async def test_translate_text(jaksel_caller):
    """Test text translation"""
    # Mock translation API response with async context manager
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[[["Ciao", "Hello", None, None]], None, "en"])

    # Create async context manager for response
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.get = MagicMock(return_value=mock_response_cm)

    mock_client_session = MagicMock()
    mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("aiohttp.ClientSession", mock_client_session):
        result = await jaksel_caller.translate_text("Hello", target_lang="it")
        assert result is not None


@pytest.mark.asyncio
async def test_translate_text_no_translation_needed(jaksel_caller):
    """Test translation when already in target language"""
    result = await jaksel_caller.translate_text("Ciao", target_lang="it")
    assert result == "Ciao"  # Should return original if already in target language


@pytest.mark.asyncio
async def test_detect_language(jaksel_caller):
    """Test language detection"""
    assert jaksel_caller.detect_language("Ciao, come stai?") == "Italiano"
    assert jaksel_caller.detect_language("Halo, apa kabar?") == "Bahasa Indonesia"
    assert jaksel_caller.detect_language("Hello, how are you?") == "English"


# ============================================================================
# Test Translation API
# ============================================================================


@pytest.mark.asyncio
async def test_translate_text_same_language_italian(jaksel_caller):
    """Test translation skips if already in Italian"""
    text = "ciao come stai italiano"
    result = await jaksel_caller.translate_text(text, "it")
    assert result == text


@pytest.mark.asyncio
async def test_translate_text_same_language_indonesian(jaksel_caller):
    """Test translation skips if already in Indonesian"""
    text = "halo apa kabar terima kasih"
    result = await jaksel_caller.translate_text(text, "id")
    assert result == text


@pytest.mark.asyncio
async def test_translate_text_same_language_english(jaksel_caller):
    """Test translation skips if already in English"""
    text = "hello how are you thank you"
    result = await jaksel_caller.translate_text(text, "en")
    assert result == text


@pytest.mark.asyncio
async def test_translate_text_not_italian_target(jaksel_caller):
    """Test translation returns original if target is not Italian"""
    text = "halo apa kabar"
    result = await jaksel_caller.translate_text(text, "en")
    assert result == text


@pytest.mark.asyncio
async def test_translate_text_source_already_italian(jaksel_caller):
    """Test translation returns original if source is already Italian"""
    text = "ciao come stai grazie"
    result = await jaksel_caller.translate_text(text, "it")
    assert result == text


@pytest.mark.asyncio
async def test_translate_text_success(jaksel_caller):
    """Test successful translation"""
    text = "halo apa kabar"

    # Mock translation API response
    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[[["ciao come va", None, None, None]]])
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.get = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.translate_text(text, "it")
        assert result == "ciao come va"


@pytest.mark.asyncio
async def test_translate_text_multiple_segments(jaksel_caller):
    """Test translation with multiple segments"""
    text = "halo apa kabar bagaimana"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[[["ciao ", None], ["come ", None], ["va", None]]])
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.get = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.translate_text(text, "it")
        assert result == "ciao come va"


@pytest.mark.asyncio
async def test_translate_text_empty_response(jaksel_caller):
    """Test translation with empty response returns original"""
    text = "halo apa kabar"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[[]])
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.get = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.translate_text(text, "it")
        assert result == text


@pytest.mark.asyncio
async def test_translate_text_api_failure(jaksel_caller):
    """Test translation handles API failure"""
    text = "halo apa kabar"

    mock_response = MagicMock()
    mock_response.status = 500
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.get = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.translate_text(text, "it")
        assert result == text


@pytest.mark.asyncio
async def test_translate_text_exception(jaksel_caller):
    """Test translation handles exceptions"""
    text = "halo apa kabar"

    with patch("aiohttp.ClientSession") as mock_session:
        mock_session.side_effect = Exception("Network error")
        result = await jaksel_caller.translate_text(text, "it")
        assert result == text


# ============================================================================
# Test User Validation
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_user_not_in_team(jaksel_caller):
    """Test user not in team returns error"""
    result = await jaksel_caller.call_jaksel_with_translation(
        query="Test query",
        user_email="unknown@example.com",
        gemini_answer="Fallback answer",
    )

    assert result["success"] is False
    assert "not in Jaksel team" in result["error"]
    assert result["response"] == "Fallback answer"


# ============================================================================
# Test HuggingFace API
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_list_response(jaksel_caller):
    """Test HF API success with list response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(
        return_value=[{"generated_text": "Halo bro! Jaksel response"}]
    )
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test query",
            user_email="anton@balizero.com",
            gemini_answer="Professional answer",
        )

    assert result["success"] is True
    assert "Halo bro" in result["response"]
    assert result["user_name"] == "Anton"
    assert result["model_used"] == "huggingface-jaksel-ai"


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_dict_response(jaksel_caller):
    """Test HF API success with dict response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value={"generated_text": "Halo sis! Response Jaksel"})
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="bagaimana caranya",
            user_email="amanda@balizero.com",
            gemini_answer="Professional answer",
        )

    assert result["success"] is True
    assert result["user_name"] == "Amanda"


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_string_response(jaksel_caller):
    """Test HF API success with string response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value="Direct string response")
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test query",
            user_email="krisna@balizero.com",
            gemini_answer="Professional answer",
        )

    assert result["success"] is True
    assert result["user_name"] == "Krisna"


@pytest.mark.asyncio
async def test_call_jaksel_hf_empty_response(jaksel_caller):
    """Test HF API empty response uses gemini fallback"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value=[{"generated_text": ""}])
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test query",
            user_email="anton@balizero.com",
            gemini_answer="Gemini fallback",
        )

    assert result["success"] is True
    assert result["response"] == "Gemini fallback"


@pytest.mark.asyncio
async def test_call_jaksel_hf_failure(jaksel_caller):
    """Test HF API failure tries fallback URLs"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 503
    mock_hf_response.text = AsyncMock(return_value="Service unavailable")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Mock successful fallback
    mock_fallback_response = MagicMock()
    mock_fallback_response.status = 200
    mock_fallback_response.json = AsyncMock(return_value={"response": "Fallback Jaksel response"})
    mock_fallback_response_cm = AsyncMock()
    mock_fallback_response_cm.__aenter__ = AsyncMock(return_value=mock_fallback_response)
    mock_fallback_response_cm.__aexit__ = AsyncMock(return_value=None)

    call_count = [0]

    def mock_post(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return mock_hf_response_cm
        return mock_fallback_response_cm

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=mock_post)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test query",
            user_email="anton@balizero.com",
            gemini_answer="Professional answer",
        )

    assert result["success"] is True
    assert result["response"] == "Fallback Jaksel response"
    assert result["model_used"] == "fallback-jaksel"


@pytest.mark.asyncio
async def test_call_jaksel_all_endpoints_fail(jaksel_caller):
    """Test all endpoints fail creates fallback response"""
    mock_failure = MagicMock()
    mock_failure.status = 500
    mock_failure.text = AsyncMock(return_value="Error")
    mock_failure_cm = AsyncMock()
    mock_failure_cm.__aenter__ = AsyncMock(return_value=mock_failure)
    mock_failure_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_failure_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test query",
            user_email="anton@balizero.com",
            gemini_answer="Gemini answer",
        )

    assert result["success"] is False
    assert "All endpoints failed" in result["error"]
    assert "Maaf banget nih" in result["response"]
    assert "Gemini answer" in result["response"]
    assert result["model_used"] == "fallback-jaksel-style"


# ============================================================================
# Test Translation Response
# ============================================================================


@pytest.mark.asyncio
async def test_translate_response_italian_query_indonesian_response(jaksel_caller):
    """Test translating Indonesian response for Italian query"""
    response = "Halo kak! Ini response dengan banyak kata jaksel banget gua lu bro"

    with patch.object(jaksel_caller, "translate_text", return_value="Ciao bro! Risposta tradotta"):
        result = await jaksel_caller._translate_response(response, "Italiano")
        assert result == "Ciao bro! Risposta tradotta"


@pytest.mark.asyncio
async def test_translate_response_italian_query_already_italian(jaksel_caller):
    """Test no translation if response already Italian"""
    response = "Ciao come va? Perfetto grazie italiano funziona"
    result = await jaksel_caller._translate_response(response, "Italiano")
    assert result == response


@pytest.mark.asyncio
async def test_translate_response_indonesian_query(jaksel_caller):
    """Test no translation for Indonesian query"""
    response = "Halo kak! Response dalam bahasa Indonesia"
    result = await jaksel_caller._translate_response(response, "Bahasa Indonesia")
    assert result == response


@pytest.mark.asyncio
async def test_translate_response_english_query(jaksel_caller):
    """Test no translation for English query"""
    response = "Hello! English response"
    result = await jaksel_caller._translate_response(response, "English")
    assert result == response


@pytest.mark.asyncio
async def test_translate_response_adds_ciao_bro(jaksel_caller):
    """Test adds 'Ciao bro!' if missing in Italian translation"""
    response = "Halo kak! Jaksel response banget gua lu dengan"

    with patch.object(jaksel_caller, "translate_text", return_value="Risposta senza saluto"):
        result = await jaksel_caller._translate_response(response, "Italiano")
        assert "Ciao bro!" in result


# ============================================================================
# Test Edge Cases
# ============================================================================


def test_backward_compatibility_alias():
    """Test backward compatibility alias"""
    from app.routers.simple_jaksel_caller_translation import SimpleJakselCaller

    assert SimpleJakselCaller == SimpleJakselCallerTranslation


@pytest.mark.asyncio
async def test_call_jaksel_hf_exception(jaksel_caller):
    """Test HF exception handling"""

    def mock_post_exception(*args, **kwargs):
        raise Exception("Network error")

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=mock_post_exception)

    # Mock fallback to succeed
    mock_fallback = MagicMock()
    mock_fallback.status = 200
    mock_fallback.json = AsyncMock(return_value={"response": "Fallback works"})
    mock_fallback_cm = AsyncMock()
    mock_fallback_cm.__aenter__ = AsyncMock(return_value=mock_fallback)
    mock_fallback_cm.__aexit__ = AsyncMock(return_value=None)

    # First call raises exception, subsequent calls succeed
    call_attempts = [0]

    def mock_post_mixed(*args, **kwargs):
        call_attempts[0] += 1
        if call_attempts[0] == 1:
            raise Exception("HF Network error")
        return mock_fallback_cm

    mock_session.post = MagicMock(side_effect=mock_post_mixed)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_with_translation(
            query="Test",
            user_email="anton@balizero.com",
            gemini_answer="Answer",
        )

    assert result["success"] is True


@pytest.mark.asyncio
async def test_call_jaksel_multiple_users(jaksel_caller):
    """Test calling with different users"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value=[{"generated_text": "Response"}])
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    users = [
        ("anton@balizero.com", "Anton"),
        ("amanda@balizero.com", "Amanda"),
        ("krisna@balizero.com", "Krisna"),
    ]

    with patch("aiohttp.ClientSession", return_value=mock_session):
        for email, expected_name in users:
            result = await jaksel_caller.call_jaksel_with_translation(
                query="Test",
                user_email=email,
                gemini_answer="Answer",
            )
            assert result["user_name"] == expected_name
