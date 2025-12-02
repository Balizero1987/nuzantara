"""
Unit tests for Handler Proxy Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.handler_proxy import HandlerProxyService, get_handler_proxy, init_handler_proxy

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_httpx_client():
    """Mock httpx.AsyncClient"""
    client = AsyncMock()
    client.post = AsyncMock()
    client.get = AsyncMock()
    client.aclose = AsyncMock()
    return client


@pytest.fixture
def handler_proxy_service(mock_httpx_client):
    """Create HandlerProxyService instance with mocked client"""
    with patch("services.handler_proxy.httpx.AsyncClient", return_value=mock_httpx_client):
        service = HandlerProxyService("https://test-backend.com")
        service.client = mock_httpx_client
        return service, mock_httpx_client


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(mock_httpx_client):
    """Test initialization"""
    with patch("services.handler_proxy.httpx.AsyncClient", return_value=mock_httpx_client):
        service = HandlerProxyService("https://test-backend.com")

        assert service.backend_url == "https://test-backend.com"
        assert service.client == mock_httpx_client


def test_init_strips_trailing_slash(mock_httpx_client):
    """Test initialization strips trailing slash"""
    with patch("services.handler_proxy.httpx.AsyncClient", return_value=mock_httpx_client):
        service = HandlerProxyService("https://test-backend.com/")

        assert service.backend_url == "https://test-backend.com"


# ============================================================================
# Tests for execute_handler
# ============================================================================


@pytest.mark.asyncio
async def test_execute_handler_success(handler_proxy_service):
    """Test execute_handler successful"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {"result": "success"}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_handler("gmail.send", {"to": "test@example.com"})

    assert result == {"result": "success"}
    mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_execute_handler_with_internal_key(handler_proxy_service):
    """Test execute_handler with internal key"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_handler("gmail.send", {}, internal_key="test-key")

    assert isinstance(result, dict)
    # Check that internal key was included in headers
    call_args = mock_client.post.call_args
    assert "x-api-key" in call_args.kwargs["headers"]


@pytest.mark.asyncio
async def test_execute_handler_failure(handler_proxy_service):
    """Test execute_handler with failure response"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": False, "error": "Handler failed"}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_handler("gmail.send", {})

    assert "error" in result
    assert result["error"] == "Handler failed"


@pytest.mark.asyncio
async def test_execute_handler_http_error(handler_proxy_service):
    """Test execute_handler with HTTP error"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"
    http_error = httpx.HTTPStatusError("Error", request=MagicMock(), response=mock_response)
    mock_client.post.side_effect = http_error

    result = await service.execute_handler("gmail.send", {})

    assert "error" in result
    assert "500" in result["error"]


@pytest.mark.asyncio
async def test_execute_handler_exception(handler_proxy_service):
    """Test execute_handler with exception"""
    service, mock_client = handler_proxy_service
    mock_client.post.side_effect = Exception("Network error")

    result = await service.execute_handler("gmail.send", {})

    assert "error" in result
    assert "Network error" in result["error"]


@pytest.mark.asyncio
async def test_execute_handler_no_params(handler_proxy_service):
    """Test execute_handler without params"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_handler("memory.save")

    assert isinstance(result, dict)
    # Check that params was empty dict
    call_args = mock_client.post.call_args
    payload = call_args.kwargs["json"]
    assert payload["params"] == {}


# ============================================================================
# Tests for execute_batch
# ============================================================================


@pytest.mark.asyncio
async def test_execute_batch_success(handler_proxy_service):
    """Test execute_batch successful"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {"results": []}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    handlers = [
        {"key": "memory.save", "params": {"userId": "123"}},
        {"key": "gmail.send", "params": {"to": "test@example.com"}},
    ]

    result = await service.execute_batch(handlers)

    assert isinstance(result, dict)
    mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_execute_batch_with_internal_key(handler_proxy_service):
    """Test execute_batch with internal key"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_batch([], internal_key="test-key")

    assert isinstance(result, dict)
    call_args = mock_client.post.call_args
    assert "x-api-key" in call_args.kwargs["headers"]


@pytest.mark.asyncio
async def test_execute_batch_failure(handler_proxy_service):
    """Test execute_batch with failure"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": False, "error": "Batch failed"}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.execute_batch([])

    assert "error" in result
    assert result["error"] == "Batch failed"


@pytest.mark.asyncio
async def test_execute_batch_exception(handler_proxy_service):
    """Test execute_batch with exception"""
    service, mock_client = handler_proxy_service
    mock_client.post.side_effect = Exception("Network error")

    result = await service.execute_batch([])

    assert "error" in result
    assert "Network error" in result["error"]


# ============================================================================
# Tests for get_all_handlers
# ============================================================================


@pytest.mark.asyncio
async def test_get_all_handlers_success(handler_proxy_service):
    """Test get_all_handlers successful"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {"handlers": []}}
    mock_response.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_response

    result = await service.get_all_handlers()

    assert isinstance(result, dict)
    mock_client.get.assert_called_once()


@pytest.mark.asyncio
async def test_get_all_handlers_with_internal_key(handler_proxy_service):
    """Test get_all_handlers with internal key"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {}}
    mock_response.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_response

    result = await service.get_all_handlers(internal_key="test-key")

    assert isinstance(result, dict)
    call_args = mock_client.get.call_args
    assert "x-api-key" in call_args.kwargs["headers"]


@pytest.mark.asyncio
async def test_get_all_handlers_failure(handler_proxy_service):
    """Test get_all_handlers with failure"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": False, "error": "Failed"}
    mock_response.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_response

    result = await service.get_all_handlers()

    assert "error" in result


@pytest.mark.asyncio
async def test_get_all_handlers_exception(handler_proxy_service):
    """Test get_all_handlers with exception"""
    service, mock_client = handler_proxy_service
    mock_client.get.side_effect = Exception("Network error")

    result = await service.get_all_handlers()

    assert "error" in result


# ============================================================================
# Tests for get_anthropic_tools
# ============================================================================


@pytest.mark.asyncio
async def test_get_anthropic_tools_success(handler_proxy_service):
    """Test get_anthropic_tools successful"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {"tools": [{"name": "tool1"}]}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.get_anthropic_tools()

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["name"] == "tool1"


@pytest.mark.asyncio
async def test_get_anthropic_tools_with_internal_key(handler_proxy_service):
    """Test get_anthropic_tools with internal key"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "data": {"tools": []}}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.get_anthropic_tools(internal_key="test-key")

    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_get_anthropic_tools_failure(handler_proxy_service):
    """Test get_anthropic_tools with failure"""
    service, mock_client = handler_proxy_service
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": False, "error": "Failed"}
    mock_response.raise_for_status = MagicMock()
    mock_client.post.return_value = mock_response

    result = await service.get_anthropic_tools()

    assert isinstance(result, list)
    assert len(result) == 0


@pytest.mark.asyncio
async def test_get_anthropic_tools_exception(handler_proxy_service):
    """Test get_anthropic_tools with exception"""
    service, mock_client = handler_proxy_service
    mock_client.post.side_effect = Exception("Network error")

    result = await service.get_anthropic_tools()

    assert isinstance(result, list)
    assert len(result) == 0


# ============================================================================
# Tests for close
# ============================================================================


@pytest.mark.asyncio
async def test_close(handler_proxy_service):
    """Test close"""
    service, mock_client = handler_proxy_service

    await service.close()

    mock_client.aclose.assert_called_once()


# ============================================================================
# Tests for get_handler_proxy
# ============================================================================


def test_get_handler_proxy_none():
    """Test get_handler_proxy when not initialized"""
    with patch("services.handler_proxy.handler_proxy", None):
        result = get_handler_proxy()

        assert result is None


def test_get_handler_proxy_initialized():
    """Test get_handler_proxy when initialized"""
    mock_proxy = MagicMock()
    with patch("services.handler_proxy.handler_proxy", mock_proxy):
        result = get_handler_proxy()

        assert result == mock_proxy


# ============================================================================
# Tests for init_handler_proxy
# ============================================================================


def test_init_handler_proxy(mock_httpx_client):
    """Test init_handler_proxy"""
    with patch("services.handler_proxy.httpx.AsyncClient", return_value=mock_httpx_client):
        result = init_handler_proxy("https://test-backend.com")

        assert isinstance(result, HandlerProxyService)
        assert result.backend_url == "https://test-backend.com"
