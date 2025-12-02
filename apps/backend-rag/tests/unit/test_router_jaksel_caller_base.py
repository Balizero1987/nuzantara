"""
Unit tests for SimpleJakselCaller (base)
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller import SimpleJakselCallerHF


@pytest.fixture
def mock_settings():
    """Mock settings"""
    mock = MagicMock()
    mock.hf_api_key = "test-hf-key"
    mock.zantara_oracle_url = None
    mock.oracle_api_key = "test-oracle-key"
    return mock


@pytest.fixture
def jaksel_caller(mock_settings):
    """Create SimpleJakselCaller instance"""
    with patch("app.routers.simple_jaksel_caller.settings", mock_settings):
        return SimpleJakselCallerHF()


@pytest.mark.asyncio
async def test_call_jaksel_direct_success(jaksel_caller):
    """Test successful Jaksel call"""
    query = "Ciao, come stai?"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm doing well, thank you!"

    # Mock aiohttp response with async context manager
    # Ollama endpoints return dict format: {"response": "..."}
    mock_ollama_response = MagicMock()
    mock_ollama_response.status = 200
    mock_ollama_response.json = AsyncMock(
        return_value={"response": "Halo Kak Anton! Gue baik-baik aja nih, makasih!"}
    )
    mock_ollama_response.text = AsyncMock(return_value="")

    # Create async context manager for Ollama response
    mock_ollama_response_cm = AsyncMock()
    mock_ollama_response_cm.__aenter__ = AsyncMock(return_value=mock_ollama_response)
    mock_ollama_response_cm.__aexit__ = AsyncMock(return_value=None)

    # Mock session.post() to return success for Ollama URLs
    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_ollama_response_cm)

    # Mock ClientSession to return session with async context manager
    mock_client_session = MagicMock()
    mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("aiohttp.ClientSession", mock_client_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

        assert result["success"] is True
        assert "response" in result
        assert result["language"] is not None
        assert result["user_name"] == "Anton"


@pytest.mark.asyncio
async def test_call_jaksel_direct_user_not_in_team(jaksel_caller):
    """Test Jaksel call with user not in team"""
    query = "Hello"
    user_email = "unknown@example.com"
    gemini_answer = "Test answer"

    result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "User not in Jaksel team"
    assert result["response"] == gemini_answer


@pytest.mark.asyncio
async def test_call_jaksel_direct_hf_api_failure(jaksel_caller):
    """Test Jaksel call with HF API failure"""
    query = "Hello"
    user_email = "anton@balizero.com"
    gemini_answer = "Test answer"

    # Mock aiohttp to return error status
    mock_response = MagicMock()
    mock_response.status = 500
    mock_response.text = AsyncMock(return_value="Internal Server Error")

    # Create async context manager for response
    mock_response_cm = AsyncMock()
    mock_response_cm.__aenter__ = AsyncMock(return_value=mock_response)
    mock_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_response_cm)

    mock_client_session = MagicMock()
    mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("aiohttp.ClientSession", mock_client_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

        # Should fallback to gemini_answer or return error
        assert result is not None
        # May return success=False or fallback response
        assert "response" in result or "error" in result


def test_detect_language(jaksel_caller):
    """Test language detection"""
    # Test Italian - returns "bahasa Indonesia (dengan gaya Italia)"
    result = jaksel_caller.detect_language("Ciao, come stai?")
    assert "Italia" in result or "italia" in result.lower()

    # Test Indonesian - returns default "bahasa Indonesia dengan gaya Jakarta Selatan"
    result = jaksel_caller.detect_language("Halo, apa kabar?")
    assert "bahasa Indonesia" in result.lower() or "indonesia" in result.lower()

    # Test default - returns "bahasa Indonesia dengan gaya Jakarta Selatan"
    result = jaksel_caller.detect_language("Test")
    assert "bahasa Indonesia" in result.lower() or "indonesia" in result.lower()

    # Test that it always returns a string
    assert isinstance(result, str)
    assert len(result) > 0
