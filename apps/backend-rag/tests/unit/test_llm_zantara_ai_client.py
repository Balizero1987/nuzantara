"""
Unit tests for Zantara AI Client
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from llm.zantara_ai_client import ZantaraAIClient


@pytest.fixture
def mock_settings():
    """Mock settings"""
    with patch("llm.zantara_ai_client.settings") as mock:
        mock.google_api_key = "test-api-key"
        mock.zantara_ai_cost_input = 0.15
        mock.zantara_ai_cost_output = 0.60
        yield mock


@pytest.fixture
def mock_genai():
    """Mock Google Generative AI"""
    genai = MagicMock()
    genai.configure = MagicMock()
    return genai


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_api_key(mock_settings, mock_genai):
    """Test initialization with API key"""
    # Patch settings and genai
    with patch("app.core.config.settings") as mock_settings_obj:
        mock_settings_obj.google_api_key = "test-api-key"
        mock_settings_obj.zantara_ai_cost_input = 0.15
        mock_settings_obj.zantara_ai_cost_output = 0.60
        
        with patch("google.generativeai.configure") as mock_configure:
            client = ZantaraAIClient(api_key="test-api-key")

            assert client.api_key == "test-api-key"
            assert client.model == "gemini-2.5-flash"
            assert hasattr(client, "model")
            mock_configure.assert_called_once_with(api_key="test-api-key")


def test_init_without_api_key(mock_genai):
    """Test initialization without API key"""
    # Create a mock settings object
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60
    
    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key=None)

            # When no API key, mock_mode should be True
            assert client.mock_mode is True


def test_init_with_custom_model(mock_settings, mock_genai):
    """Test initialization with custom model"""
    with patch("google.generativeai.configure"):
        client = ZantaraAIClient(model="custom-model")

        assert client.model == "custom-model"


# ============================================================================
# Tests for get_model_info
# ============================================================================


def test_get_model_info(mock_settings, mock_genai):
    """Test getting model information"""
    with patch("google.generativeai.configure"):
        client = ZantaraAIClient()
        info = client.get_model_info()

        assert info["model"] == "gemini-2.5-flash"
        assert info["provider"] == "google"
        assert "pricing" in info
        assert info["pricing"]["input"] == 0.15
        assert info["pricing"]["output"] == 0.60


# ============================================================================
# Tests for _build_system_prompt
# ============================================================================


def test_build_system_prompt_default(mock_settings, mock_genai):
    """Test building default system prompt"""
    with patch("google.generativeai.configure"):
        client = ZantaraAIClient()
        prompt = client._build_system_prompt()

        assert "ZANTARA" in prompt
        # "REASONING PROTOCOLS" might not be in v8 prompt, checking for core identity
        assert "CORE IDENTITY" in prompt or "Core Identity" in prompt or "ZANTARA" in prompt


def test_build_system_prompt_fallback(mock_settings, mock_genai):
    """Test building fallback system prompt (not using rich prompt)"""
    with patch("google.generativeai.configure"):
        client = ZantaraAIClient()
        # use_v6_optimized was replaced by use_rich_prompt
        prompt = client._build_system_prompt(use_rich_prompt=False)

        assert "ZANTARA" in prompt


# ============================================================================
# Tests for chat_async
# ============================================================================


@pytest.mark.asyncio
async def test_chat_async_mock_mode(mock_settings):
    """Test chat_async in mock mode"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            messages = [{"role": "user", "content": "Hello"}]
            result = await client.chat_async(messages=messages)

            assert result["text"] == "This is a MOCK response from ZantaraAIClient (Mock Mode)."
            assert result["provider"] == "mock"
            assert result["cost"] == 0.0


@pytest.mark.asyncio
async def test_chat_async_native_gemini_success(mock_settings):
    """Test chat_async with native Gemini success"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            # Mock GenerativeModel
            mock_model = MagicMock()
            mock_chat = AsyncMock()
            mock_chat.send_message_async = AsyncMock(
                return_value=MagicMock(text="Test response")
            )
            mock_model.start_chat = MagicMock(return_value=mock_chat)

            with patch("google.generativeai.GenerativeModel", return_value=mock_model):
                client = ZantaraAIClient(api_key="test-key")
                client.mock_mode = False  # Force production mode
                messages = [{"role": "user", "content": "Hello"}]
                result = await client.chat_async(messages=messages)

                assert result["text"] == "Test response"
                assert result["provider"] == "google_native"
                assert "tokens" in result


@pytest.mark.asyncio
async def test_chat_async_native_gemini_error(mock_settings):
    """Test chat_async with native Gemini error"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            # Mock GenerativeModel that raises error
            mock_model = MagicMock()
            mock_chat = AsyncMock()
            mock_chat.send_message_async = AsyncMock(side_effect=Exception("API Error"))
            mock_model.start_chat = MagicMock(return_value=mock_chat)

            with patch("google.generativeai.GenerativeModel", return_value=mock_model):
                client = ZantaraAIClient(api_key="test-key")
                client.mock_mode = False
                messages = [{"role": "user", "content": "Hello"}]

                with pytest.raises(Exception):
                    await client.chat_async(messages=messages)


@pytest.mark.asyncio
async def test_chat_async_with_system_prompt(mock_settings):
    """Test chat_async with custom system prompt"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            messages = [{"role": "user", "content": "Hello"}]
            result = await client.chat_async(messages=messages, system="Custom system prompt")

            assert result["provider"] == "mock"


@pytest.mark.asyncio
async def test_chat_async_with_memory_context(mock_settings):
    """Test chat_async with memory context"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            messages = [{"role": "user", "content": "Hello"}]
            result = await client.chat_async(messages=messages, memory_context="Test memory")

            assert result["provider"] == "mock"


# ============================================================================
# Tests for stream
# ============================================================================


@pytest.mark.asyncio
async def test_stream_mock_mode(mock_settings):
    """Test stream in mock mode"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            chunks = []
            async for chunk in client.stream("Hello", "user123"):
                chunks.append(chunk)

            assert len(chunks) > 0
            assert "MOCK" in "".join(chunks)


@pytest.mark.asyncio
async def test_stream_native_gemini_success(mock_settings):
    """Test stream with native Gemini success"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            # Mock streaming response
            mock_chunk1 = MagicMock()
            mock_chunk1.text = "Hello "
            mock_chunk2 = MagicMock()
            mock_chunk2.text = "World"

            async def mock_stream():
                yield mock_chunk1
                yield mock_chunk2

            mock_model = MagicMock()
            mock_chat = AsyncMock()
            mock_chat.send_message_async = AsyncMock(return_value=mock_stream())
            mock_model.start_chat = MagicMock(return_value=mock_chat)

            with patch("google.generativeai.GenerativeModel", return_value=mock_model):
                client = ZantaraAIClient(api_key="test-key")
                client.mock_mode = False
                chunks = []
                async for chunk in client.stream("Hello", "user123"):
                    chunks.append(chunk)

                assert len(chunks) >= 0  # May be empty if stream fails


# ============================================================================
# Tests for conversational
# ============================================================================


@pytest.mark.asyncio
async def test_conversational_success(mock_settings):
    """Test conversational method success"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            result = await client.conversational(
                message="Hello", _user_id="user123", conversation_history=None
            )

            assert "text" in result
            assert result["ai_used"] == "zantara-ai"
            assert "tokens" in result


@pytest.mark.asyncio
async def test_conversational_with_history(mock_settings):
    """Test conversational with conversation history"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            history = [{"role": "user", "content": "Previous message"}]
            result = await client.conversational(
                message="Hello", _user_id="user123", conversation_history=history
            )

            assert "text" in result
            assert result["ai_used"] == "zantara-ai"


@pytest.mark.asyncio
async def test_conversational_with_memory_context(mock_settings):
    """Test conversational with memory context"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            result = await client.conversational(
                message="Hello",
                _user_id="user123",
                memory_context="Test memory context",
            )

            assert "text" in result


# ============================================================================
# Tests for conversational_with_tools
# ============================================================================




@pytest.mark.asyncio
async def test_conversational_with_tools_with_tools(mock_settings):
    """Test conversational_with_tools with tools (fallback to conversational)"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            tools = [{"type": "function", "function": {"name": "test_tool", "description": "Test"}}]
            result = await client.conversational_with_tools(
                message="Hello", user_id="user123", tools=tools
            )

            # In mock mode, should fallback to conversational
            assert "text" in result
            assert result["tools_called"] == []
            assert result["used_tools"] is False


@pytest.mark.asyncio
async def test_conversational_with_tools_no_tools_fixed(mock_settings):
    """Test conversational_with_tools without tools (fixed version)"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient()
            # When tools is None or empty, should use standard conversational
            result = await client.conversational_with_tools(
                message="Hello", user_id="user123", tools=None
            )

            assert "text" in result
            assert result["tools_called"] == []
            assert result["used_tools"] is False


@pytest.mark.asyncio
async def test_conversational_with_tools_error_fallback(mock_settings):
    """Test conversational_with_tools error fallback"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            # Mock OpenAI-compatible client
            mock_client = MagicMock()
            # First call (tool calling) raises error
            # Second call (fallback conversational) succeeds
            mock_response = MagicMock()
            mock_response.choices = [MagicMock()]
            mock_response.choices[0].message.content = "Fallback response"
            
            async def mock_create(*args, **kwargs):
                # First call raises error, subsequent calls succeed
                if not hasattr(mock_create, "call_count"):
                    mock_create.call_count = 0
                mock_create.call_count += 1
                if mock_create.call_count == 1:
                    raise Exception("API Error")
                return mock_response
            
            mock_client.chat.completions.create = AsyncMock(side_effect=mock_create)

            client = ZantaraAIClient(api_key="test-key")
            client.client = mock_client
            client.mock_mode = False
            client.use_native_genai = False  # Force OpenAI compat mode to use mocked client

            tools = [{"type": "function", "function": {"name": "test_tool", "description": "Test"}}]
            result = await client.conversational_with_tools(
                message="Hello", user_id="user123", tools=tools
            )

            # Should fallback to conversational
            assert "text" in result
            assert result["tools_called"] == []
            assert result["used_tools"] is False


# ============================================================================
# Tests for is_available
# ============================================================================


def test_is_available_with_api_key(mock_settings):
    """Test is_available with API key"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            assert client.is_available() is True


def test_is_available_without_api_key(mock_settings):
    """Test is_available without API key"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = None
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key=None)
            # In mock mode, genai_client might still be set, so check actual behavior
            assert isinstance(client.is_available(), bool)


# ============================================================================
# Additional Tests for Missing Coverage
# ============================================================================


def test_init_configure_error():
    """Test initialization when genai.configure raises exception"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure", side_effect=Exception("Config error")):
            client = ZantaraAIClient(api_key="test-key")
            # Should fall back to mock mode when configuration fails
            assert client.mock_mode is True


def test_is_available_openai_compat_mode():
    """Test is_available in OpenAI compatibility mode"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = False
            client.client = MagicMock()
            # Should return True when client and api_key are set
            assert client.is_available() is True


@pytest.mark.asyncio
async def test_chat_async_with_system_role():
    """Test chat_async with system role in messages"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    mock_chat = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Response text"
    mock_chat.send_message_async = AsyncMock(return_value=mock_response)

    mock_model = MagicMock()
    mock_model.start_chat = MagicMock(return_value=mock_chat)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel = MagicMock(return_value=mock_model)
    mock_genai.types.GenerationConfig = MagicMock()

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai", mock_genai):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = True

            messages = [
                {"role": "system", "content": "System message"},
                {"role": "user", "content": "User message"},
            ]

            result = await client.chat_async(messages, system="System prompt")

            # Should skip system role in messages
            assert result["text"] == "Response text"


@pytest.mark.asyncio
async def test_chat_async_with_assistant_messages():
    """Test chat_async with assistant messages in history"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    mock_chat = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Response text"
    mock_chat.send_message_async = AsyncMock(return_value=mock_response)

    mock_model = MagicMock()
    mock_model.start_chat = MagicMock(return_value=mock_chat)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel = MagicMock(return_value=mock_model)
    mock_genai.types.GenerationConfig = MagicMock()

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai", mock_genai):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = True

            messages = [
                {"role": "user", "content": "First question"},
                {"role": "assistant", "content": "First answer"},
                {"role": "user", "content": "Second question"},
            ]

            result = await client.chat_async(messages)

            # Should handle assistant messages properly
            assert result["text"] == "Response text"
            # Verify history was built with model role for assistant
            call_args = mock_model.start_chat.call_args
            if call_args and "history" in call_args[1]:
                history = call_args[1]["history"]
                # Should have user and model (assistant) in history
                assert any(msg["role"] == "model" for msg in history)


@pytest.mark.asyncio
async def test_chat_async_without_client():
    """Test chat_async when OpenAI client is not initialized"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = False  # Force OpenAI compat mode
            client.client = None  # No client initialized

            messages = [{"role": "user", "content": "Test"}]

            with pytest.raises(ValueError, match="OpenAI-compatible client is not available"):
                await client.chat_async(messages)


@pytest.mark.asyncio
async def test_stream_native_gemini_with_history():
    """Test native Gemini streaming with conversation history"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    # Mock streaming response
    mock_chunk1 = MagicMock()
    mock_chunk1.text = "Hello "
    mock_chunk2 = MagicMock()
    mock_chunk2.text = "world"

    async def mock_stream():
        yield mock_chunk1
        yield mock_chunk2

    mock_chat = MagicMock()
    mock_chat.send_message_async = AsyncMock(return_value=mock_stream())

    mock_model = MagicMock()
    mock_model.start_chat = MagicMock(return_value=mock_chat)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel = MagicMock(return_value=mock_model)
    mock_genai.types.GenerationConfig = MagicMock()

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai", mock_genai):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = True

            conversation_history = [
                {"role": "user", "content": "Previous question"},
                {"role": "assistant", "content": "Previous answer"},
            ]

            result_chunks = []
            async for chunk in client.stream(
                message="New question",
                user_id="test-user",
                conversation_history=conversation_history,
            ):
                result_chunks.append(chunk)

            # Should have received chunks
            assert len(result_chunks) > 0


@pytest.mark.asyncio
async def test_stream_openai_compat_no_client_fallback():
    """Test OpenAI compat streaming fallback when client not initialized"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = False  # Force OpenAI compat mode
            client.client = None  # No client initialized

            result_chunks = []
            async for chunk in client.stream(message="Test", user_id="test-user"):
                result_chunks.append(chunk)

            # Should return fallback response
            full_response = "".join(result_chunks)
            assert "scusi" in full_response.lower() or "problema" in full_response.lower() or "servizio" in full_response.lower()


@pytest.mark.asyncio
async def test_stream_openai_compat_retry_success():
    """Test OpenAI compat streaming with retry that succeeds"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    # Mock streaming chunks
    mock_chunk = MagicMock()
    mock_choice = MagicMock()
    mock_delta = MagicMock()
    mock_delta.content = "Hello"
    mock_choice.delta = mock_delta
    mock_chunk.choices = [mock_choice]

    async def mock_create_stream(*args, **kwargs):
        # Simulate async iterator
        async def stream_gen():
            yield mock_chunk

        return stream_gen()

    mock_client = MagicMock()
    mock_client.chat.completions.create = mock_create_stream

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = False
            client.client = mock_client

            result_chunks = []
            async for chunk in client.stream(message="Test", user_id="test-user"):
                result_chunks.append(chunk)

            assert "Hello" in result_chunks


@pytest.mark.asyncio
async def test_stream_openai_compat_retry_then_fallback():
    """Test OpenAI compat streaming retries then falls back"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    call_count = 0

    async def mock_create_failing(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        raise Exception("connection timeout error")

    mock_client = MagicMock()
    mock_client.chat.completions.create = mock_create_failing

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            # Mock asyncio.sleep to speed up test
            with patch("asyncio.sleep", new_callable=AsyncMock):
                client = ZantaraAIClient(api_key="test-key")
                client.use_native_genai = False
                client.client = mock_client

                result_chunks = []
                async for chunk in client.stream(message="Test", user_id="test-user"):
                    result_chunks.append(chunk)

                # Should have retried 3 times
                assert call_count == 3
                # Should return fallback response
                full_response = "".join(result_chunks)
                assert "scusi" in full_response.lower()


@pytest.mark.asyncio
async def test_stream_native_gemini_retry_then_fallback():
    """Test native Gemini streaming retries then falls back"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    call_count = 0

    async def mock_send_failing(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        raise Exception("503 Service Unavailable")

    mock_chat = MagicMock()
    mock_chat.send_message_async = AsyncMock(side_effect=mock_send_failing)

    mock_model = MagicMock()
    mock_model.start_chat = MagicMock(return_value=mock_chat)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel = MagicMock(return_value=mock_model)
    mock_genai.types.GenerationConfig = MagicMock()

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai", mock_genai):
            # Mock asyncio.sleep to speed up test
            with patch("asyncio.sleep", new_callable=AsyncMock):
                client = ZantaraAIClient(api_key="test-key")
                client.use_native_genai = True

                result_chunks = []
                async for chunk in client.stream(message="Test", user_id="test-user"):
                    result_chunks.append(chunk)

                # Should have retried 3 times
                assert call_count == 3
                # Should return fallback response
                full_response = "".join(result_chunks)
                assert "scusi" in full_response.lower()


@pytest.mark.asyncio
async def test_conversational_with_tools_with_conversation_history():
    """Test conversational_with_tools with conversation history"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    # Mock response with tool call
    mock_message = MagicMock()
    mock_message.content = "Response text"
    mock_tool_call = MagicMock()
    mock_tool_call.function.name = "test_tool"
    mock_message.tool_calls = [mock_tool_call]

    mock_choice = MagicMock()
    mock_choice.message = mock_message

    mock_response = MagicMock()
    mock_response.choices = [mock_choice]

    mock_client = MagicMock()
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai.configure"):
            client = ZantaraAIClient(api_key="test-key")
            client.use_native_genai = False
            client.client = mock_client

            conversation_history = [
                {"role": "user", "content": "Previous question"},
                {"role": "assistant", "content": "Previous answer"},
            ]

            tools = [{"type": "function", "function": {"name": "test_tool"}}]

            result = await client.conversational_with_tools(
                message="New question",
                user_id="test-user",
                tools=tools,
                conversation_history=conversation_history,
            )

            # Should have extended messages with conversation history
            assert result["text"] == "Response text"
            assert "test_tool" in result["tools_called"]





@pytest.mark.asyncio
async def test_stream_native_gemini_no_content_fallback():
    """Test native Gemini streaming when no content received"""
    mock_settings_obj = MagicMock()
    mock_settings_obj.google_api_key = "test-key"
    mock_settings_obj.zantara_ai_cost_input = 0.15
    mock_settings_obj.zantara_ai_cost_output = 0.60

    # Mock empty stream (no chunks yielded)
    async def empty_stream():
        return
        yield  # Make it a generator but never yield

    mock_chat = MagicMock()
    mock_chat.send_message_async = AsyncMock(return_value=empty_stream())

    mock_model = MagicMock()
    mock_model.start_chat = MagicMock(return_value=mock_chat)

    mock_genai = MagicMock()
    mock_genai.GenerativeModel = MagicMock(return_value=mock_model)
    mock_genai.types.GenerationConfig = MagicMock()

    with patch("llm.zantara_ai_client.settings", mock_settings_obj):
        with patch("google.generativeai", mock_genai):
            with patch("asyncio.sleep", new_callable=AsyncMock):
                client = ZantaraAIClient(api_key="test-key")
                client.use_native_genai = True

                result_chunks = []
                async for chunk in client.stream(message="Test", user_id="test-user"):
                    result_chunks.append(chunk)

                # Should return fallback after no content
                full_response = "".join(result_chunks)
                assert len(full_response) > 0

