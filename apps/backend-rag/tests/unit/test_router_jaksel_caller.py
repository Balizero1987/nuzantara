"""
Unit tests for Simple Jaksel Caller (Main Router)
Coverage target: 90%+ (70 statements)
Tests Ollama endpoints, Gemini fallback, environment variables
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller import SimpleJakselCaller, SimpleJakselCallerHF

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings"""
    mock = MagicMock()
    mock.hf_api_key = "test-hf-key"
    return mock


@pytest.fixture
def jaksel_caller(mock_settings):
    """Create JakselCaller instance with mocked settings"""
    with patch("app.routers.simple_jaksel_caller.settings", mock_settings):
        with patch.dict("os.environ", {}, clear=True):
            return SimpleJakselCallerHF()


# ============================================================================
# Test Initialization
# ============================================================================


def test_initialization_default(mock_settings):
    """Test initialization with default settings"""
    with patch("app.routers.simple_jaksel_caller.settings", mock_settings):
        with patch.dict("os.environ", {}, clear=True):
            caller = SimpleJakselCallerHF()

            assert caller.ollama_tunnel_url == "https://jaksel-ollama.nuzantara.com"
            assert caller.oracle_cloud_url == "https://jaksel.balizero.com"
            assert len(caller.oracle_urls) == 4
            assert "anton@balizero.com" in caller.jaksel_users


def test_initialization_with_env_vars():
    """Test initialization with custom environment variables"""
    env_vars = {
        "JAKSEL_TUNNEL_URL": "https://custom-tunnel.example.com",
        "JAKSEL_ORACLE_URL": "https://custom-oracle.example.com",
    }

    with patch.dict("os.environ", env_vars):
        caller = SimpleJakselCallerHF()

        assert caller.ollama_tunnel_url == "https://custom-tunnel.example.com"
        assert caller.oracle_cloud_url == "https://custom-oracle.example.com"
        assert "https://custom-tunnel.example.com/api/generate" in caller.oracle_urls


def test_initialization_hf_headers(mock_settings):
    """Test HuggingFace headers initialization"""
    with patch("app.routers.simple_jaksel_caller.settings", mock_settings):
        caller = SimpleJakselCallerHF()

        assert "Authorization" in caller.hf_headers
        assert "Bearer test-hf-key" in caller.hf_headers["Authorization"]
        assert caller.hf_headers["Content-Type"] == "application/json"


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
    queries = ["مرحبا", "كيف حالك"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        # May detect as Arabic or default
        assert "Arab" in result or "Jakarta" in result


def test_detect_language_default(jaksel_caller):
    """Test default language detection"""
    queries = ["abc", "xyz", "test query"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Jakarta Selatan" in result


# ============================================================================
# Test User Recognition & Email Normalization
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


@pytest.mark.asyncio
async def test_call_jaksel_email_normalization(jaksel_caller):
    """Test email normalization (strip and lowercase)"""
    query = "test"
    user_email = "  ANTON@BALIZERO.COM  "  # With spaces and uppercase
    gemini_answer = "Answer"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Anton!"})

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    # Should recognize as Anton after normalization
    assert result["success"] is True
    assert result["user_name"] == "Anton"


@pytest.mark.asyncio
async def test_call_jaksel_empty_email(jaksel_caller):
    """Test with empty/None email"""
    query = "test"
    gemini_answer = "Answer"

    result = await jaksel_caller.call_jaksel_direct(query, None, gemini_answer)
    assert result["success"] is False

    result = await jaksel_caller.call_jaksel_direct(query, "", gemini_answer)
    assert result["success"] is False


# ============================================================================
# Test Ollama API Success
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_ollama_success_anton(jaksel_caller):
    """Test successful Ollama call for Anton"""
    query = "ciao come stai"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm fine"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Anton! Tutto bene!"})

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
    assert result["user_name"] == "Anton"
    assert result["language"] == "bahasa Indonesia (dengan gaya Italia)"
    assert result["model_used"] == "ollama-jaksel"
    assert "connected_via" in result


@pytest.mark.asyncio
async def test_call_jaksel_ollama_success_amanda(jaksel_caller):
    """Test successful Ollama call for Amanda"""
    query = "hello"
    user_email = "amanda@balizero.com"
    gemini_answer = "Hi"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Amanda!"})

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


@pytest.mark.asyncio
async def test_call_jaksel_ollama_success_krisna(jaksel_caller):
    """Test successful Ollama call for Krisna"""
    query = "test"
    user_email = "krisna@balizero.com"
    gemini_answer = "Answer"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Krisna!"})

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


# ============================================================================
# Test Ollama Fallback
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_ollama_first_fails_second_succeeds(jaksel_caller):
    """Test first Ollama URL fails, second succeeds"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # First call raises exception
    # Second call succeeds
    mock_success_response = MagicMock()
    mock_success_response.status = 200
    mock_success_response.json = AsyncMock(return_value={"response": "Fallback success!"})

    mock_success_response_cm = AsyncMock()
    mock_success_response_cm.__aenter__ = AsyncMock(return_value=mock_success_response)
    mock_success_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(
        side_effect=[Exception("Connection error"), mock_success_response_cm]
    )

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == "Fallback success!"


# ============================================================================
# Test Gemini Fallback
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_gemini_fallback_success(jaksel_caller):
    """Test Gemini fallback when all Ollama endpoints fail"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # Mock ai_client
    mock_ai_client = MagicMock()
    mock_ai_client.chat_async = AsyncMock(
        return_value={"text": "Halo Kak Anton! Gue ada jawabannya nih!"}
    )

    # All Ollama endpoints fail
    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=Exception("All Ollama failed"))

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query, user_email, gemini_answer, ai_client=mock_ai_client
        )

    assert result["success"] is True
    assert result["response"] == "Halo Kak Anton! Gue ada jawabannya nih!"
    assert result["model_used"] == "zantara-ai-fallback"
    assert result["connected_via"] == "internal-gemini"

    # Verify safety settings were passed
    mock_ai_client.chat_async.assert_called_once()
    call_kwargs = mock_ai_client.chat_async.call_args[1]
    assert "safety_settings" in call_kwargs


@pytest.mark.asyncio
async def test_call_jaksel_gemini_fallback_fails(jaksel_caller):
    """Test when Gemini fallback also fails"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Professional answer"

    # Mock ai_client that fails
    mock_ai_client = MagicMock()
    mock_ai_client.chat_async = AsyncMock(side_effect=Exception("Gemini failed"))

    # All Ollama endpoints fail
    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=Exception("Ollama failed"))

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query, user_email, gemini_answer, ai_client=mock_ai_client
        )

    # Should return styled fallback
    assert result["success"] is False
    assert "error" in result
    assert "Anton" in result["response"]
    assert gemini_answer in result["response"]
    assert result["model_used"] == "fallback-jaksel-style"


# ============================================================================
# Test All Endpoints Failure
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_all_endpoints_fail_no_ai_client(jaksel_caller):
    """Test all endpoints fail without ai_client"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Professional answer"

    # All Ollama endpoints fail
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
async def test_call_jaksel_all_ollama_http_errors(jaksel_caller):
    """Test all Ollama URLs return HTTP errors"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    mock_response = MagicMock()
    mock_response.status = 500

    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # All calls return 500 error
    mock_session.post = MagicMock(return_value=mock_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert "error" in result


# ============================================================================
# Test Backward Compatibility Alias
# ============================================================================


def test_backward_compatibility_alias():
    """Test SimpleJakselCaller alias exists and works"""
    assert SimpleJakselCaller is SimpleJakselCallerHF

    caller = SimpleJakselCaller()
    assert isinstance(caller, SimpleJakselCallerHF)
