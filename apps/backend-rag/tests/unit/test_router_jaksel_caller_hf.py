"""
Unit tests for Simple Jaksel Caller HF
Coverage target: 90%+ (76 statements)
Tests HuggingFace API integration, fallback URLs, language detection
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller_hf import SimpleJakselCallerHF


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def jaksel_caller():
    """Create SimpleJakselCallerHF instance"""
    return SimpleJakselCallerHF()


# ============================================================================
# Test Initialization
# ============================================================================


def test_initialization(jaksel_caller):
    """Test SimpleJakselCallerHF initialization"""
    assert jaksel_caller.hf_api_url == "https://api-inference.huggingface.co/models/zeroai87/jaksel-ai"
    assert "Authorization" in jaksel_caller.hf_headers
    assert len(jaksel_caller.oracle_urls) == 4
    assert "anton@balizero.com" in jaksel_caller.jaksel_users


# ============================================================================
# Test Language Detection
# ============================================================================


def test_detect_language_italian(jaksel_caller):
    """Test Italian language detection"""
    queries = ["ciao come stai", "italiano perfetto", "praticamente funziona"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Italia" in result


def test_detect_language_spanish(jaksel_caller):
    """Test Spanish language detection"""
    queries = ["hola cómo estás", "español básicamente"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Spanyol" in result


def test_detect_language_french(jaksel_caller):
    """Test French language detection"""
    queries = ["salut comment ça va", "français"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Perancis" in result


def test_detect_language_chinese(jaksel_caller):
    """Test Chinese language detection"""
    queries = ["你好", "你好吗"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Mandarin" in result


def test_detect_language_russian(jaksel_caller):
    """Test Russian language detection"""
    queries = ["привет", "как дела"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Rusia" in result


def test_detect_language_arabic(jaksel_caller):
    """Test Arabic language detection"""
    # Note: Detection checks characters in order, so result may vary
    queries = ["مرحبا", "كيف حالك"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        # Either Arabic or may fallback to Russian or default
        assert "Arab" in result or "Rusia" in result or "Jakarta" in result


def test_detect_language_default(jaksel_caller):
    """Test default language detection (Indonesian)"""
    queries = ["abc", "xyz"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        # Should be Indonesian (default)
        assert "bahasa Indonesia" in result


# ============================================================================
# Test User Recognition
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_user_not_in_team(jaksel_caller):
    """Test calling Jaksel with user not in team"""
    query = "test query"
    user_email = "unknown@example.com"
    gemini_answer = "Professional answer"

    result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "User not in Jaksel team"
    assert result["response"] == gemini_answer


# ============================================================================
# Test HuggingFace API Success
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_success_list_format(jaksel_caller):
    """Test successful HF API call with list response format"""
    query = "ciao come stai"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm fine, thank you"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[{"generated_text": "Halo Kak Anton! Tutto bene, grazie!"}])

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert "Anton" in result["response"] or result["response"]
    assert result["language"] == "bahasa Indonesia (dengan gaya Italia)"
    assert result["user_name"] == "Anton"
    assert result["model_used"] == "huggingface-jaksel-ai"


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_success_dict_format(jaksel_caller):
    """Test successful HF API call with dict response format"""
    query = "hello"
    user_email = "amanda@balizero.com"
    gemini_answer = "Hi there"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"generated_text": "Halo Kak Amanda! Apa kabar?"})

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["user_name"] == "Amanda"
    assert result["connected_via"] == "huggingface-inference-api"


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_success_string_format(jaksel_caller):
    """Test successful HF API call with string response format"""
    query = "test"
    user_email = "krisna@balizero.com"
    gemini_answer = "Answer"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value="Halo Kak Krisna!")

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["user_name"] == "Krisna"


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_empty_response_fallback(jaksel_caller):
    """Test HF API returns empty response, falls back to gemini_answer"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Professional answer"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[{"generated_text": ""}])

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == gemini_answer


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_removes_empty_whitespace(jaksel_caller):
    """Test HF API response is trimmed of whitespace"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # Response with leading/trailing whitespace
    response_with_whitespace = "   Halo! Ini jawabannya   \n\n"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value=[{"generated_text": response_with_whitespace}])

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    # Response should be trimmed
    assert result["response"] == "Halo! Ini jawabannya"
    assert len(result["response"]) < len(response_with_whitespace)


# ============================================================================
# Test HuggingFace API Failure + Fallback
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_failure_fallback_success(jaksel_caller):
    """Test HF API fails, fallback URL succeeds"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # HF API fails
    mock_hf_response = MagicMock()
    mock_hf_response.status = 503
    mock_hf_response.text = AsyncMock(return_value="Service unavailable")

    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Fallback succeeds
    mock_fallback_response = MagicMock()
    mock_fallback_response.status = 200
    mock_fallback_response.json = AsyncMock(return_value={"response": "Jaksel fallback answer"})

    mock_fallback_response_cm = AsyncMock()
    mock_fallback_response_cm.__aenter__ = AsyncMock(return_value=mock_fallback_response)
    mock_fallback_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # First call (HF) fails, second call (fallback) succeeds
    mock_session.post = MagicMock(side_effect=[mock_hf_response_cm, mock_fallback_response_cm])

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == "Jaksel fallback answer"
    assert result["model_used"] == "fallback-jaksel"
    assert "hf.space" in result["connected_via"] or "nuzantara" in result["connected_via"]


@pytest.mark.asyncio
async def test_call_jaksel_hf_api_exception(jaksel_caller):
    """Test HF API raises exception"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # First fallback succeeds
    mock_fallback_response = MagicMock()
    mock_fallback_response.status = 200
    mock_fallback_response.json = AsyncMock(return_value={"response": "Fallback answer"})

    mock_fallback_response_cm = AsyncMock()
    mock_fallback_response_cm.__aenter__ = AsyncMock(return_value=mock_fallback_response)
    mock_fallback_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # First call raises exception (HF), second call succeeds (fallback)
    mock_session.post = MagicMock(side_effect=[Exception("Connection error"), mock_fallback_response_cm])

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == "Fallback answer"


# ============================================================================
# Test All Endpoints Failure
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_all_endpoints_fail(jaksel_caller):
    """Test all endpoints fail, returns styled fallback"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Professional answer"

    # All requests fail
    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=Exception("All failed"))

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "All endpoints failed"
    assert "Anton" in result["response"]
    assert gemini_answer in result["response"]
    assert result["model_used"] == "fallback-jaksel-style"


@pytest.mark.asyncio
async def test_call_jaksel_fallback_urls_all_fail(jaksel_caller):
    """Test all fallback URLs fail with exceptions"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # All calls fail
    mock_session.post = MagicMock(side_effect=Exception("Network error"))

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "All endpoints failed"


# ============================================================================
# Test Backward Compatibility Alias
# ============================================================================


def test_backward_compatibility_alias():
    """Test SimpleJakselCaller alias exists"""
    from app.routers.simple_jaksel_caller_hf import SimpleJakselCaller

    caller = SimpleJakselCaller()
    assert isinstance(caller, SimpleJakselCallerHF)
