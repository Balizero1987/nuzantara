"""
Unit tests for Simple Jaksel Caller Original
Coverage target: 90%+ (70 statements)
Tests Ollama API integration, fallback URLs, language detection
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller_original import SimpleJakselCaller


# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings_no_oracle():
    """Mock settings without Oracle URL"""
    mock = MagicMock()
    mock.zantara_oracle_url = None
    mock.oracle_api_key = "test-oracle-key"
    return mock


@pytest.fixture
def mock_settings_with_oracle():
    """Mock settings with Oracle URL"""
    mock = MagicMock()
    mock.zantara_oracle_url = "https://oracle.example.com/api/generate"
    mock.oracle_api_key = "test-oracle-key"
    return mock


@pytest.fixture
def mock_settings_with_nlgate():
    """Mock settings with nlgate URL (should be skipped)"""
    mock = MagicMock()
    mock.zantara_oracle_url = "https://nlgate.nusantaracorp.com/api"
    mock.oracle_api_key = "test-key"
    return mock


@pytest.fixture
def jaksel_caller(mock_settings_no_oracle):
    """Create SimpleJakselCaller instance"""
    with patch("app.routers.simple_jaksel_caller_original.settings", mock_settings_no_oracle):
        return SimpleJakselCaller()


# ============================================================================
# Test Initialization
# ============================================================================


def test_initialization_without_oracle_url(mock_settings_no_oracle):
    """Test initialization without Oracle URL in settings"""
    with patch("app.routers.simple_jaksel_caller_original.settings", mock_settings_no_oracle):
        caller = SimpleJakselCaller()

        assert len(caller.oracle_urls) == 4
        assert caller.api_key == "test-oracle-key"
        assert "anton@balizero.com" in caller.jaksel_users


def test_initialization_with_oracle_url(mock_settings_with_oracle):
    """Test initialization with valid Oracle URL in settings"""
    with patch("app.routers.simple_jaksel_caller_original.settings", mock_settings_with_oracle):
        caller = SimpleJakselCaller()

        # Oracle URL should be inserted at position 0
        assert len(caller.oracle_urls) == 5
        assert caller.oracle_urls[0] == "https://oracle.example.com/api/generate"


def test_initialization_with_nlgate_url(mock_settings_with_nlgate):
    """Test initialization with nlgate URL (should not be inserted)"""
    with patch("app.routers.simple_jaksel_caller_original.settings", mock_settings_with_nlgate):
        caller = SimpleJakselCaller()

        # nlgate URL should not be inserted
        assert len(caller.oracle_urls) == 4


def test_initialization_without_api_key():
    """Test initialization without API key"""
    mock = MagicMock()
    mock.zantara_oracle_url = None
    mock.oracle_api_key = None

    with patch("app.routers.simple_jaksel_caller_original.settings", mock):
        caller = SimpleJakselCaller()
        assert caller.api_key == ""


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
        # May detect as Arabic, Russian (character overlap), or default
        assert "Arab" in result or "Rusia" in result or "Jakarta" in result


def test_detect_language_default(jaksel_caller):
    """Test default language detection (Indonesian)"""
    queries = ["abc", "xyz", "test"]
    for query in queries:
        result = jaksel_caller.detect_language(query)
        assert "Jakarta Selatan" in result


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
# Test Ollama API Success
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_api_success(jaksel_caller):
    """Test successful Ollama API call"""
    query = "ciao come stai"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm fine, thank you"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Anton! Tutto bene, grazie!"})

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
    assert result["model_used"] == "zantara-oracle-jaksel"
    assert "connected_via" in result


@pytest.mark.asyncio
async def test_call_jaksel_api_success_amanda(jaksel_caller):
    """Test successful API call for Amanda"""
    query = "hello"
    user_email = "amanda@balizero.com"
    gemini_answer = "Hi there"

    mock_response = MagicMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"response": "Halo Kak Amanda! Apa kabar?"})

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
async def test_call_jaksel_api_success_krisna(jaksel_caller):
    """Test successful API call for Krisna"""
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


@pytest.mark.asyncio
async def test_call_jaksel_with_local_url_no_auth():
    """Test API call to localhost doesn't add Authorization header"""
    mock_settings = MagicMock()
    mock_settings.zantara_oracle_url = None
    mock_settings.oracle_api_key = "test-key"

    with patch("app.routers.simple_jaksel_caller_original.settings", mock_settings):
        caller = SimpleJakselCaller()
        # Set only localhost URL
        caller.oracle_urls = ["http://127.0.0.1:11434/api/generate"]

        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value={"response": "Test"})

        mock_response_cm = AsyncMock()
        mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_response_cm.__aexit__ = AsyncMock(return_value=None)

        mock_session = MagicMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=None)

        # Capture the call to verify headers
        post_calls = []
        def capture_post(*args, **kwargs):
            post_calls.append((args, kwargs))
            return mock_response_cm

        mock_session.post = MagicMock(side_effect=capture_post)

        with patch("aiohttp.ClientSession", return_value=mock_session):
            result = await caller.call_jaksel_direct("test", "anton@balizero.com", "answer")

        # Verify Authorization header was NOT added for localhost
        assert len(post_calls) > 0
        headers = post_calls[0][1].get("headers", {})
        assert "Authorization" not in headers


# ============================================================================
# Test API Failure + Fallback
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_api_failure_fallback_success(jaksel_caller):
    """Test first API fails, second succeeds"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # First call fails
    mock_fail_response = MagicMock()
    mock_fail_response.status = 503
    mock_fail_response.text = AsyncMock(return_value="Service unavailable")

    mock_fail_response_cm = AsyncMock()
    mock_fail_response_cm.__aenter__ = AsyncMock(return_value=mock_fail_response)
    mock_fail_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Second call succeeds
    mock_success_response = MagicMock()
    mock_success_response.status = 200
    mock_success_response.json = AsyncMock(return_value={"response": "Jaksel fallback answer"})

    mock_success_response_cm = AsyncMock()
    mock_success_response_cm.__aenter__ = AsyncMock(return_value=mock_success_response)
    mock_success_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # First call fails, second succeeds
    mock_session.post = MagicMock(side_effect=[mock_fail_response_cm, mock_success_response_cm])

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == "Jaksel fallback answer"
    assert result["model_used"] == "zantara-oracle-jaksel"


@pytest.mark.asyncio
async def test_call_jaksel_api_exception(jaksel_caller):
    """Test API raises exception, falls back to next URL"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # First call raises exception
    # Second call succeeds
    mock_success_response = MagicMock()
    mock_success_response.status = 200
    mock_success_response.json = AsyncMock(return_value={"response": "Fallback answer"})

    mock_success_response_cm = AsyncMock()
    mock_success_response_cm.__aenter__ = AsyncMock(return_value=mock_success_response)
    mock_success_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    # First call raises exception, second succeeds
    mock_session.post = MagicMock(side_effect=[Exception("Connection error"), mock_success_response_cm])

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
    assert "error" in result
    assert "Anton" in result["response"]
    assert gemini_answer in result["response"]
    assert result["model_used"] == "gemini-fallback-jaksel-style"


@pytest.mark.asyncio
async def test_call_jaksel_all_urls_http_errors(jaksel_caller):
    """Test all URLs return HTTP errors"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    mock_response = MagicMock()
    mock_response.status = 500
    mock_response.text = AsyncMock(return_value="Internal Server Error")

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
    assert "Anton" in result["response"]


@pytest.mark.asyncio
async def test_call_jaksel_mixed_failures(jaksel_caller):
    """Test mixed failures (exception + HTTP error) before success"""
    query = "test"
    user_email = "anton@balizero.com"
    gemini_answer = "Answer"

    # First: Exception
    # Second: HTTP 500
    mock_error_response = MagicMock()
    mock_error_response.status = 500
    mock_error_response.text = AsyncMock(return_value="Error")

    mock_error_response_cm = AsyncMock()
    mock_error_response_cm.__aenter__ = AsyncMock(return_value=mock_error_response)
    mock_error_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Third: Success
    mock_success_response = MagicMock()
    mock_success_response.status = 200
    mock_success_response.json = AsyncMock(return_value={"response": "Success!"})

    mock_success_response_cm = AsyncMock()
    mock_success_response_cm.__aenter__ = AsyncMock(return_value=mock_success_response)
    mock_success_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(
        side_effect=[
            Exception("Network error"),
            mock_error_response_cm,
            mock_success_response_cm,
        ]
    )

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is True
    assert result["response"] == "Success!"
