"""
Unit tests for SimpleJakselCallerHFItalian
Coverage target: 90%+ (98 statements)
Tests multilingual support, HuggingFace API, and language verification
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.simple_jaksel_caller_hf_italian import SimpleJakselCallerHFItalian

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_settings():
    """Mock settings"""
    mock = MagicMock()
    mock.hf_api_key = "test-hf-key-italian-123"
    return mock


@pytest.fixture
def jaksel_caller(mock_settings):
    """Create SimpleJakselCallerHFItalian instance"""
    with patch("app.routers.simple_jaksel_caller_hf_italian.settings", mock_settings):
        return SimpleJakselCallerHFItalian()


# ============================================================================
# Test Initialization
# ============================================================================


def test_init(jaksel_caller):
    """Test initialization"""
    assert jaksel_caller.hf_api_url == "https://api-inference.huggingface.co/models/zeroai87/jaksel-ai"
    assert "Bearer test-hf-key-italian-123" in jaksel_caller.hf_headers["Authorization"]
    assert jaksel_caller.hf_headers["Content-Type"] == "application/json"
    assert len(jaksel_caller.oracle_urls) == 4
    assert "anton@balizero.com" in jaksel_caller.jaksel_users
    assert jaksel_caller.jaksel_users["anton@balizero.com"] == "Anton"
    assert jaksel_caller.jaksel_users["amanda@balizero.com"] == "Amanda"
    assert jaksel_caller.jaksel_users["krisna@balizero.com"] == "Krisna"


# ============================================================================
# Test Language Detection (Improved)
# ============================================================================


def test_detect_language_improved_italian(jaksel_caller):
    """Test improved Italian detection"""
    queries = [
        "ciao come stai?",
        "italiano perfetto",
        "praticamente funziona",
        "milano italia",
        "napoli roma",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Italiano"


def test_detect_language_improved_indonesian(jaksel_caller):
    """Test improved Indonesian detection"""
    queries = [
        "halo apa kabar?",
        "terima kasih banyak",
        "jakarta bandung",
        "surabaya medan",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Bahasa Indonesia"


def test_detect_language_improved_english(jaksel_caller):
    """Test improved English detection"""
    queries = [
        "hello how are you?",
        "thank you system",
        "automatic translation",
        "america london",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "English"


def test_detect_language_improved_spanish(jaksel_caller):
    """Test Spanish detection"""
    queries = [
        "hola cómo estás?",
        "gracias por favor",
        "madrid barcelona",
        "sistema automático",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Spagnolo"


def test_detect_language_improved_french(jaksel_caller):
    """Test French detection"""
    queries = [
        "bonjour comment allez-vous?",
        "merci beaucoup",
        "paris lyon",
        "système automatique",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Francese"


def test_detect_language_improved_german(jaksel_caller):
    """Test German detection"""
    queries = [
        "hallo wie geht es?",
        "danke bitte",
        "berlin münchen",
        "system automatisch",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Tedesco"


def test_detect_language_improved_chinese(jaksel_caller):
    """Test Chinese detection"""
    queries = [
        "你好吗",
        "谢谢系统",
        "北京上海",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Cinese"


def test_detect_language_improved_russian(jaksel_caller):
    """Test Russian detection"""
    queries = [
        "привет как дела?",
        "спасибо пожалуйста",
        "москва россия",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Russo"


def test_detect_language_improved_arabic(jaksel_caller):
    """Test Arabic detection"""
    queries = [
        "مرحبا كيف حالك",
        "شكرا من فضلك",
        "نظام ترجمة",
    ]
    for query in queries:
        assert jaksel_caller.detect_language_improved(query) == "Arabo"


def test_detect_language_improved_default(jaksel_caller):
    """Test default language when no match"""
    query = "xyz 123 unknown text"
    result = jaksel_caller.detect_language_improved(query)
    # Default is Bahasa Indonesia when no language patterns match
    assert result in ["Italiano", "Bahasa Indonesia"]


def test_detect_language_improved_scoring(jaksel_caller):
    """Test language scoring (more Italian keywords should win)"""
    query = "ciao come grazie italiano perfetto halo"
    assert jaksel_caller.detect_language_improved(query) == "Italiano"

    query = "halo apa bagaimana terima kasih ciao"
    assert jaksel_caller.detect_language_improved(query) == "Bahasa Indonesia"


@pytest.mark.asyncio
async def test_call_jaksel_direct_success(jaksel_caller):
    """Test successful Jaksel call"""
    query = "Ciao, come stai?"
    user_email = "anton@balizero.com"
    gemini_answer = "I'm doing well, thank you!"

    # Mock aiohttp response with async context manager
    # HF API returns list format: [{"generated_text": "..."}]
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value=[{"generated_text": "Ciao Kak Anton! Sto bene, grazie!"}])
    mock_hf_response.text = AsyncMock(return_value="")
    
    # Create async context manager for HF response
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)
    
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

    mock_client_session = MagicMock()
    mock_client_session.return_value.__aenter__ = AsyncMock(return_value=mock_session)
    mock_client_session.return_value.__aexit__ = AsyncMock(return_value=None)

    with patch("aiohttp.ClientSession", mock_client_session):
        result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

        assert result["success"] is True
        assert "response" in result


@pytest.mark.asyncio
async def test_call_jaksel_direct_user_not_in_team(jaksel_caller):
    """Test Jaksel call with user not in team"""
    query = "Hello"
    user_email = "unknown@example.com"
    gemini_answer = "Test answer"

    result = await jaksel_caller.call_jaksel_direct(query, user_email, gemini_answer)

    assert result["success"] is False
    assert result["error"] == "User not in Jaksel team"


def test_build_multilingual_prompt(jaksel_caller):
    """Test multilingual prompt building"""
    query = "Ciao"
    user_name = "Anton"
    gemini_answer = "Test answer"
    
    # Test Italian prompt
    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Italiano")
    assert "Italiano" in prompt or "italiano" in prompt.lower()
    assert user_name in prompt or "{user_name}" in prompt
    
    # Test Indonesian prompt
    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Bahasa Indonesia")
    assert "Bahasa Indonesia" in prompt or "indonesia" in prompt.lower()
    assert user_name in prompt or "{user_name}" in prompt


# ============================================================================
# Test Multilingual Prompt Building
# ============================================================================


def test_build_multilingual_prompt_italian(jaksel_caller):
    """Test building Italian prompt"""
    query = "Ciao come va?"
    user_name = "Anton"
    gemini_answer = "Va bene"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Italiano")

    assert "ITALIANO" in prompt.upper()
    assert query in prompt
    assert gemini_answer in prompt
    assert "Sono Jaksel" in prompt


def test_build_multilingual_prompt_indonesian(jaksel_caller):
    """Test building Indonesian prompt"""
    query = "Apa kabar?"
    user_name = "Amanda"
    gemini_answer = "Baik"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Bahasa Indonesia")

    assert user_name in prompt
    assert query in prompt
    assert gemini_answer in prompt
    assert "bahasa Indonesia" in prompt


def test_build_multilingual_prompt_english(jaksel_caller):
    """Test building English prompt"""
    query = "How are you?"
    user_name = "Krisna"
    gemini_answer = "Good"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "English")

    assert user_name in prompt
    assert query in prompt
    assert gemini_answer in prompt
    assert "English" in prompt or "bahasa English" in prompt


def test_build_multilingual_prompt_spanish(jaksel_caller):
    """Test building Spanish prompt"""
    query = "¿Cómo estás?"
    user_name = "Anton"
    gemini_answer = "Bien"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Spagnolo")

    assert user_name in prompt
    assert query in prompt
    assert gemini_answer in prompt


def test_build_multilingual_prompt_french(jaksel_caller):
    """Test building French prompt"""
    query = "Comment allez-vous?"
    user_name = "Amanda"
    gemini_answer = "Bien"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Francese")

    assert user_name in prompt
    assert query in prompt
    assert gemini_answer in prompt


def test_build_multilingual_prompt_german(jaksel_caller):
    """Test building German prompt"""
    query = "Wie geht es?"
    user_name = "Krisna"
    gemini_answer = "Gut"

    prompt = jaksel_caller._build_multilingual_prompt(query, user_name, gemini_answer, "Tedesco")

    assert user_name in prompt
    assert query in prompt
    assert gemini_answer in prompt


# ============================================================================
# Test Language Verification
# ============================================================================


def test_verify_response_language_italian_correct(jaksel_caller):
    """Test verify Italian response"""
    response = "Ciao come va? Grazie perfetto italiano funziona"
    result = jaksel_caller._verify_response_language(response, "Italiano")
    assert result == "✅ Correct language"


def test_verify_response_language_italian_partial(jaksel_caller):
    """Test verify Italian response partial match"""
    response = "This response has some ciao words"
    result = jaksel_caller._verify_response_language(response, "Italiano")
    assert result == "⚠️ Partial match"


def test_verify_response_language_italian_wrong(jaksel_caller):
    """Test verify Italian response wrong"""
    response = "This is completely wrong language"
    result = jaksel_caller._verify_response_language(response, "Italiano")
    assert result == "❌ Wrong language"


def test_verify_response_language_indonesian_correct(jaksel_caller):
    """Test verify Indonesian response"""
    response = "Halo kak! Terima kasih banget canggih gua lu"
    result = jaksel_caller._verify_response_language(response, "Bahasa Indonesia")
    assert result == "✅ Correct language"


def test_verify_response_language_english_correct(jaksel_caller):
    """Test verify English response"""
    response = "Hello thank you please system translation"
    result = jaksel_caller._verify_response_language(response, "English")
    assert result == "✅ Correct language"


def test_verify_response_language_spanish_correct(jaksel_caller):
    """Test verify Spanish response"""
    response = "Hola gracias por favor sistema"
    result = jaksel_caller._verify_response_language(response, "Spagnolo")
    assert result == "✅ Correct language"


def test_verify_response_language_unknown(jaksel_caller):
    """Test verify response for unknown language"""
    response = "Some text here"
    result = jaksel_caller._verify_response_language(response, "UnknownLang")
    assert "Wrong language" in result or "Partial" in result


# ============================================================================
# Test Get Jaksel Language Name
# ============================================================================


def test_get_jaksel_language_name(jaksel_caller):
    """Test getting Jaksel language names"""
    assert jaksel_caller._get_jaksel_language_name("Italiano") == "bahasa Italia"
    assert jaksel_caller._get_jaksel_language_name("Bahasa Indonesia") == "bahasa Indonesia"
    assert jaksel_caller._get_jaksel_language_name("English") == "bahasa English"
    assert jaksel_caller._get_jaksel_language_name("Spagnolo") == "bahasa Spanyol"
    assert jaksel_caller._get_jaksel_language_name("Francese") == "bahasa Perancis"
    assert jaksel_caller._get_jaksel_language_name("Tedesco") == "bahasa Jerman"
    assert jaksel_caller._get_jaksel_language_name("Cinese") == "bahasa Mandarin"
    assert jaksel_caller._get_jaksel_language_name("Russo") == "bahasa Rusia"
    assert jaksel_caller._get_jaksel_language_name("Arabo") == "bahasa Arab"


def test_get_jaksel_language_name_unknown(jaksel_caller):
    """Test getting Jaksel language name for unknown language"""
    result = jaksel_caller._get_jaksel_language_name("UnknownLanguage")
    assert result == "bahasa Indonesia"


# ============================================================================
# Test User Validation
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_user_not_in_team(jaksel_caller):
    """Test user not in team"""
    result = await jaksel_caller.call_jaksel_direct(
        query="Test",
        user_email="unknown@example.com",
        gemini_answer="Fallback",
    )

    assert result["success"] is False
    assert "not in Jaksel team" in result["error"]
    assert result["response"] == "Fallback"


# ============================================================================
# Test HuggingFace API
# ============================================================================


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_list_response(jaksel_caller):
    """Test HF API success with list response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value=[{"generated_text": "Ciao bro! Risposta Jaksel"}])
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query="ciao come va?",
            user_email="anton@balizero.com",
            gemini_answer="Professional answer",
        )

    assert result["success"] is True
    assert "Ciao bro" in result["response"]
    assert result["user_name"] == "Anton"
    assert result["model_used"] == "huggingface-jaksel-ai"


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_dict_response(jaksel_caller):
    """Test HF API success with dict response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value={"generated_text": "Halo sis! Response"})
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query="halo",
            user_email="amanda@balizero.com",
            gemini_answer="Answer",
        )

    assert result["success"] is True
    assert result["user_name"] == "Amanda"


@pytest.mark.asyncio
async def test_call_jaksel_hf_success_string_response(jaksel_caller):
    """Test HF API success with string response"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 200
    mock_hf_response.json = AsyncMock(return_value="String response")
    mock_hf_response.text = AsyncMock(return_value="")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(return_value=mock_hf_response_cm)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query="test",
            user_email="krisna@balizero.com",
            gemini_answer="Answer",
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
        result = await jaksel_caller.call_jaksel_direct(
            query="test",
            user_email="anton@balizero.com",
            gemini_answer="Gemini fallback",
        )

    assert result["success"] is True
    assert result["response"] == "Gemini fallback"


@pytest.mark.asyncio
async def test_call_jaksel_hf_failure(jaksel_caller):
    """Test HF API failure tries fallback"""
    mock_hf_response = MagicMock()
    mock_hf_response.status = 503
    mock_hf_response.text = AsyncMock(return_value="Service unavailable")
    mock_hf_response_cm = AsyncMock()
    mock_hf_response_cm.__aenter__ = AsyncMock(return_value=mock_hf_response)
    mock_hf_response_cm.__aexit__ = AsyncMock(return_value=None)

    mock_fallback_response = MagicMock()
    mock_fallback_response.status = 200
    mock_fallback_response.json = AsyncMock(return_value={"response": "Fallback response"})
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
        result = await jaksel_caller.call_jaksel_direct(
            query="test",
            user_email="anton@balizero.com",
            gemini_answer="Answer",
        )

    assert result["success"] is True
    assert result["response"] == "Fallback response"
    assert result["model_used"] == "fallback-jaksel"


@pytest.mark.asyncio
async def test_call_jaksel_all_endpoints_fail(jaksel_caller):
    """Test all endpoints fail"""
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
        result = await jaksel_caller.call_jaksel_direct(
            query="test",
            user_email="anton@balizero.com",
            gemini_answer="Gemini answer",
        )

    assert result["success"] is False
    assert "All endpoints failed" in result["error"]
    assert "Maaf banget nih" in result["response"]
    assert result["model_used"] == "fallback-jaksel-style"


@pytest.mark.asyncio
async def test_call_jaksel_hf_exception(jaksel_caller):
    """Test HF exception handling"""
    call_attempts = [0]

    def mock_post_mixed(*args, **kwargs):
        call_attempts[0] += 1
        if call_attempts[0] == 1:
            raise Exception("HF Network error")

        mock_fallback = MagicMock()
        mock_fallback.status = 200
        mock_fallback.json = AsyncMock(return_value={"response": "Fallback works"})
        mock_fallback_cm = AsyncMock()
        mock_fallback_cm.__aenter__ = AsyncMock(return_value=mock_fallback)
        mock_fallback_cm.__aexit__ = AsyncMock(return_value=None)
        return mock_fallback_cm

    mock_session = MagicMock()
    mock_session.__aenter__ = AsyncMock(return_value=mock_session)
    mock_session.__aexit__ = AsyncMock(return_value=None)
    mock_session.post = MagicMock(side_effect=mock_post_mixed)

    with patch("aiohttp.ClientSession", return_value=mock_session):
        result = await jaksel_caller.call_jaksel_direct(
            query="test",
            user_email="anton@balizero.com",
            gemini_answer="Answer",
        )

    assert result["success"] is True


# ============================================================================
# Test Edge Cases
# ============================================================================


def test_backward_compatibility_alias():
    """Test backward compatibility alias"""
    from app.routers.simple_jaksel_caller_hf_italian import SimpleJakselCaller
    assert SimpleJakselCaller == SimpleJakselCallerHFItalian


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
            result = await jaksel_caller.call_jaksel_direct(
                query="Test",
                user_email=email,
                gemini_answer="Answer",
            )
            assert result["user_name"] == expected_name


@pytest.mark.asyncio
async def test_call_jaksel_different_languages(jaksel_caller):
    """Test calling with different language queries"""
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

    queries = [
        ("ciao come va?", "Italiano"),
        ("halo apa kabar?", "Bahasa Indonesia"),
        ("hello how are you?", "English"),
    ]

    with patch("aiohttp.ClientSession", return_value=mock_session):
        for query, expected_lang in queries:
            result = await jaksel_caller.call_jaksel_direct(
                query=query,
                user_email="anton@balizero.com",
                gemini_answer="Answer",
            )
            assert result["language"] == expected_lang


def test_detect_language(jaksel_caller):
    """Test language detection"""
    # Uses detect_language_improved which returns language names
    result = jaksel_caller.detect_language_improved("Ciao, come stai?")
    assert result == "Italiano"

    result = jaksel_caller.detect_language_improved("Halo, apa kabar?")
    assert result == "Bahasa Indonesia"

    result = jaksel_caller.detect_language_improved("Hello, how are you?")
    assert result == "English"

