"""
Unit tests for Streaming Service
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

from services.streaming_service import StreamingService

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_zantara_client():
    """Mock ZantaraAIClient"""
    client = MagicMock()
    client.model = "gemini-2.5-flash"
    client.stream = AsyncMock()
    client.chat_async = AsyncMock()
    return client


@pytest.fixture
def streaming_service(mock_zantara_client):
    """Create StreamingService instance with mocked client"""
    with patch("services.streaming_service.ZantaraAIClient", return_value=mock_zantara_client):
        service = StreamingService()
        service.zantara_client = mock_zantara_client
        return service, mock_zantara_client


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(mock_zantara_client):
    """Test initialization"""
    with patch("services.streaming_service.ZantaraAIClient", return_value=mock_zantara_client):
        service = StreamingService()

        assert service.zantara_client == mock_zantara_client


# ============================================================================
# Tests for stream_zantara_response
# ============================================================================


@pytest.mark.asyncio
async def test_stream_zantara_response_success(streaming_service):
    """Test stream_zantara_response successful"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        for chunk in ["Hello", " ", "world", "!"]:
            yield chunk

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "Hello"}]
    ):
        chunks.append(chunk)

    assert len(chunks) > 0
    assert any(c["type"] == "token" for c in chunks)
    assert any(c["type"] == "metadata" for c in chunks)
    assert any(c["type"] == "done" for c in chunks)


@pytest.mark.asyncio
async def test_stream_zantara_response_with_model(streaming_service):
    """Test stream_zantara_response with custom model"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}], model="custom-model"
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_zantara_response_with_system(streaming_service):
    """Test stream_zantara_response with system prompt"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}], system="System prompt"
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_zantara_response_exception(streaming_service):
    """Test stream_zantara_response with exception"""
    service, mock_client = streaming_service

    async def error_stream(*args, **kwargs):
        raise Exception("Stream error")
        yield  # Make it a generator (unreachable)

    mock_client.stream = error_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}]
    ):
        chunks.append(chunk)

    assert len(chunks) > 0
    assert any(c["type"] == "error" for c in chunks)


@pytest.mark.asyncio
async def test_stream_zantara_response_empty_messages(streaming_service):
    """Test stream_zantara_response with empty messages"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(messages=[]):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_zantara_response_metadata(streaming_service):
    """Test stream_zantara_response includes metadata"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}], model="test-model"
    ):
        chunks.append(chunk)
        if chunk["type"] == "metadata":
            assert chunk["data"]["model"] == "test-model"
            assert "tokens_streamed" in chunk["data"]


@pytest.mark.asyncio
async def test_stream_zantara_response_multiple_messages(streaming_service):
    """Test stream_zantara_response with multiple conversation messages"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        for chunk in ["Response", " ", "text"]:
            yield chunk

    mock_client.stream = mock_stream

    messages = [
        {"role": "user", "content": "First message"},
        {"role": "assistant", "content": "First response"},
        {"role": "user", "content": "Second message"},
    ]

    chunks = []
    async for chunk in service.stream_zantara_response(messages=messages):
        chunks.append(chunk)

    # Check that we got tokens, metadata, and done
    assert any(c["type"] == "token" for c in chunks)
    assert any(c["type"] == "metadata" for c in chunks)
    assert any(c["type"] == "done" for c in chunks)


@pytest.mark.asyncio
async def test_stream_zantara_response_with_max_tokens(streaming_service):
    """Test stream_zantara_response with custom max_tokens"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}], max_tokens=5000
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_zantara_response_counts_tokens_correctly(streaming_service):
    """Test stream_zantara_response counts streamed tokens correctly"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        for i in range(10):
            yield f"token_{i}"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}]
    ):
        chunks.append(chunk)

    # Find the metadata chunk
    metadata_chunks = [c for c in chunks if c["type"] == "metadata"]
    assert len(metadata_chunks) == 1
    assert metadata_chunks[0]["data"]["tokens_streamed"] == 10


# ============================================================================
# Tests for stream_with_context
# ============================================================================


@pytest.mark.asyncio
async def test_stream_with_context_all_contexts(streaming_service):
    """Test stream_with_context with all contexts"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test",
        conversation_history=[{"role": "user", "content": "previous"}],
        system_prompt="System",
        rag_context="RAG context",
        memory_context="Memory context",
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_no_contexts(streaming_service):
    """Test stream_with_context without optional contexts"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test", conversation_history=[], system_prompt="System"
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_rag_only(streaming_service):
    """Test stream_with_context with RAG context only"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test", conversation_history=[], system_prompt="System", rag_context="RAG"
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_memory_only(streaming_service):
    """Test stream_with_context with memory context only"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test", conversation_history=[], system_prompt="System", memory_context="Memory"
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_with_model(streaming_service):
    """Test stream_with_context with custom model"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test",
        conversation_history=[],
        system_prompt="System",
        model="custom-model",
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_with_max_tokens(streaming_service):
    """Test stream_with_context with custom max_tokens"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test",
        conversation_history=[],
        system_prompt="System",
        max_tokens=3000,
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_context_builds_enhanced_prompt(streaming_service):
    """Test stream_with_context builds enhanced system prompt correctly"""
    service, mock_client = streaming_service

    captured_system = None

    async def mock_stream(*args, **kwargs):
        nonlocal captured_system
        captured_system = kwargs.get("system")
        yield "test"

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="test question",
        conversation_history=[{"role": "user", "content": "prev msg"}],
        system_prompt="Base system",
        rag_context="RAG info",
        memory_context="Memory info",
    ):
        chunks.append(chunk)

    # Verify enhanced system prompt contains all contexts
    assert captured_system is not None
    assert "Base system" in captured_system
    assert "Memory info" in captured_system
    assert "RAG info" in captured_system


# ============================================================================
# Tests for stream_with_retry
# ============================================================================


@pytest.mark.asyncio
async def test_stream_with_retry_success(streaming_service):
    """Test stream_with_retry successful on first attempt"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield {"type": "token", "data": "test"}
        yield {"type": "done"}

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}], model="test-model"
    ):
        chunks.append(chunk)

    assert len(chunks) >= 2
    assert any(c["type"] == "done" for c in chunks)


@pytest.mark.asyncio
async def test_stream_with_retry_retries_on_error(streaming_service):
    """Test stream_with_retry retries on error"""
    service, mock_client = streaming_service

    attempt_count = 0

    async def mock_stream(*args, **kwargs):
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count == 1:
            yield {"type": "error", "data": "Error"}
        else:
            yield {"type": "token", "data": "test"}
            yield {"type": "done"}

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}], model="test-model", max_retries=2
    ):
        chunks.append(chunk)

    assert attempt_count == 2
    assert any(c["type"] == "done" for c in chunks)


@pytest.mark.asyncio
async def test_stream_with_retry_max_retries_exceeded(streaming_service):
    """Test stream_with_retry fails after max retries"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield {"type": "error", "data": "Error"}

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}], model="test-model", max_retries=1
    ):
        chunks.append(chunk)

    # Should have error after retries
    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_retry_exception(streaming_service):
    """Test stream_with_retry handles exception"""
    service, mock_client = streaming_service

    attempt_count = 0

    async def mock_stream(*args, **kwargs):
        nonlocal attempt_count
        attempt_count += 1
        if attempt_count == 1:
            raise Exception("Stream error")
        else:
            yield {"type": "token", "data": "test"}
            yield {"type": "done"}

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}], model="test-model", max_retries=1
    ):
        chunks.append(chunk)

    assert attempt_count == 2


@pytest.mark.asyncio
async def test_stream_with_retry_all_attempts_fail_exception(streaming_service):
    """Test stream_with_retry when all attempts fail with exception"""
    service, mock_client = streaming_service

    call_count = [0]

    # Create a mock that tracks calls and always raises
    original_stream = service.stream_zantara_response

    async def mock_stream_generator(*args, **kwargs):
        call_count[0] += 1
        raise Exception(f"Stream error attempt {call_count[0]}")
        yield  # Make it a generator (unreachable)

    # Patch the method
    service.stream_zantara_response = mock_stream_generator

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}], model="test-model", max_retries=1
    ):
        chunks.append(chunk)

    # Should try initial + 1 retry = 2 attempts
    assert call_count[0] == 2
    assert any(c["type"] == "error" for c in chunks)
    assert any("failed after 2 attempts" in str(c.get("data", "")) for c in chunks)


# ============================================================================
# Tests for format_sse_event
# ============================================================================


def test_format_sse_event_string(streaming_service):
    """Test format_sse_event with string data"""
    service, mock_client = streaming_service

    result = service.format_sse_event("token", "Hello")

    assert "event: token" in result
    assert "data: Hello" in result


def test_format_sse_event_dict(streaming_service):
    """Test format_sse_event with dict data"""
    service, mock_client = streaming_service

    result = service.format_sse_event("metadata", {"model": "test", "tokens": 10})

    assert "event: metadata" in result
    assert "model" in result
    assert "tokens" in result


def test_format_sse_event_list(streaming_service):
    """Test format_sse_event with list data"""
    service, mock_client = streaming_service

    result = service.format_sse_event("data", [1, 2, 3])

    assert "event: data" in result
    assert "1" in result
    assert "2" in result


def test_format_sse_event_integer(streaming_service):
    """Test format_sse_event with integer data"""
    service, mock_client = streaming_service

    result = service.format_sse_event("count", 42)

    assert "event: count" in result
    assert "data: 42" in result


def test_format_sse_event_complex_dict(streaming_service):
    """Test format_sse_event with complex nested data"""
    service, mock_client = streaming_service

    data = {
        "status": "success",
        "metadata": {"model": "test", "tokens": 100},
        "nested": {"deep": {"value": "test"}},
    }

    result = service.format_sse_event("complex", data)

    assert "event: complex" in result
    assert "status" in result
    assert "metadata" in result
    assert "nested" in result


def test_format_sse_event_formatting(streaming_service):
    """Test format_sse_event returns correct SSE format"""
    service, mock_client = streaming_service

    result = service.format_sse_event("test", "data")

    # Check SSE format: event line, data line, double newline
    assert result.startswith("event: test\n")
    assert "data: data\n" in result
    assert result.endswith("\n\n")


# ============================================================================
# Tests for health_check
# ============================================================================


@pytest.mark.asyncio
async def test_health_check_success(streaming_service):
    """Test health_check successful"""
    service, mock_client = streaming_service
    mock_client.chat_async.return_value = {"text": "test"}

    result = await service.health_check()

    assert result["status"] == "healthy"
    assert result["zantara_available"] is True


@pytest.mark.asyncio
async def test_health_check_failure(streaming_service):
    """Test health_check failure"""
    service, mock_client = streaming_service
    mock_client.chat_async.side_effect = Exception("AI error")

    result = await service.health_check()

    assert result["status"] == "unhealthy"
    assert result["zantara_available"] is False
    assert "error" in result


# ============================================================================
# Additional Edge Cases and Integration Tests
# ============================================================================


@pytest.mark.asyncio
async def test_stream_zantara_response_uses_default_model(streaming_service):
    """Test that stream_zantara_response uses client's default model when none specified"""
    service, mock_client = streaming_service
    mock_client.model = "default-gemini-model"

    async def mock_stream(*args, **kwargs):
        yield "test"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}]
    ):
        chunks.append(chunk)

    # Find metadata and verify it uses the default model
    metadata_chunks = [c for c in chunks if c["type"] == "metadata"]
    assert len(metadata_chunks) == 1
    assert metadata_chunks[0]["data"]["model"] == "default-gemini-model"


@pytest.mark.asyncio
async def test_stream_with_context_preserves_conversation_history(streaming_service):
    """Test that stream_with_context preserves original conversation history"""
    service, mock_client = streaming_service

    captured_messages = None

    async def mock_stream(*args, messages=None, **kwargs):
        nonlocal captured_messages
        captured_messages = messages
        yield "test"

    service.stream_zantara_response = mock_stream

    original_history = [
        {"role": "user", "content": "msg1"},
        {"role": "assistant", "content": "resp1"},
    ]

    chunks = []
    async for chunk in service.stream_with_context(
        query="new query",
        conversation_history=original_history.copy(),
        system_prompt="System",
    ):
        chunks.append(chunk)

    # Verify that conversation history wasn't modified in place
    assert len(original_history) == 2
    assert original_history[0]["content"] == "msg1"


@pytest.mark.asyncio
async def test_stream_with_retry_respects_max_retries(streaming_service):
    """Test that stream_with_retry respects max_retries parameter"""
    service, mock_client = streaming_service

    call_count = [0]

    async def mock_stream_generator(*args, **kwargs):
        call_count[0] += 1
        raise Exception(f"Error {call_count[0]}")
        yield  # Make it a generator (unreachable)

    service.stream_zantara_response = mock_stream_generator

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}],
        model="test-model",
        max_retries=3,
    ):
        chunks.append(chunk)

    # Should attempt 1 initial + 3 retries = 4 total
    assert call_count[0] == 4


@pytest.mark.asyncio
async def test_stream_with_retry_with_system_prompt(streaming_service):
    """Test stream_with_retry passes system prompt correctly"""
    service, mock_client = streaming_service

    captured_system = None

    async def mock_stream(*args, system=None, **kwargs):
        nonlocal captured_system
        captured_system = system
        yield {"type": "token", "data": "test"}
        yield {"type": "done"}

    service.stream_zantara_response = mock_stream

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}],
        model="test-model",
        system="Custom system prompt",
    ):
        chunks.append(chunk)

    assert captured_system == "Custom system prompt"


@pytest.mark.asyncio
async def test_stream_zantara_response_error_contains_message(streaming_service):
    """Test that error chunk contains the exception message"""
    service, mock_client = streaming_service
    error_msg = "Specific network error occurred"

    async def error_stream(*args, **kwargs):
        raise Exception(error_msg)
        yield  # Make it a generator (unreachable)

    mock_client.stream = error_stream

    chunks = []
    async for chunk in service.stream_zantara_response(
        messages=[{"role": "user", "content": "test"}]
    ):
        chunks.append(chunk)

    error_chunks = [c for c in chunks if c["type"] == "error"]
    assert len(error_chunks) == 1
    assert error_msg in error_chunks[0]["data"]


@pytest.mark.asyncio
async def test_stream_with_context_empty_query(streaming_service):
    """Test stream_with_context with empty query string"""
    service, mock_client = streaming_service

    async def mock_stream(*args, **kwargs):
        yield "response"

    mock_client.stream = mock_stream

    chunks = []
    async for chunk in service.stream_with_context(
        query="",
        conversation_history=[],
        system_prompt="System",
    ):
        chunks.append(chunk)

    assert len(chunks) > 0


@pytest.mark.asyncio
async def test_stream_with_retry_sleeps_between_retries(streaming_service):
    """Test that stream_with_retry waits between retry attempts"""
    service, mock_client = streaming_service

    retry_times = []

    async def mock_stream_with_timing(*args, **kwargs):
        import time

        retry_times.append(time.time())
        if len(retry_times) < 2:
            raise Exception("Retry me")
        else:
            yield {"type": "token", "data": "success"}
            yield {"type": "done"}

    service.stream_zantara_response = mock_stream_with_timing

    chunks = []
    async for chunk in service.stream_with_retry(
        messages=[{"role": "user", "content": "test"}],
        model="test-model",
        max_retries=1,
    ):
        chunks.append(chunk)

    # Should have 2 attempts
    assert len(retry_times) == 2
    # There should be approximately 1 second between attempts
    time_diff = retry_times[1] - retry_times[0]
    assert time_diff >= 0.9  # Allow some tolerance for execution time
