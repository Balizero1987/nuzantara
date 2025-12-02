"""
Unit tests for Tool Executor Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.tool_executor import ToolExecutor

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_handler_proxy():
    """Mock HandlerProxyService"""
    proxy = MagicMock()
    proxy.execute_handler = AsyncMock()
    proxy.get_anthropic_tools = AsyncMock(return_value=[])
    return proxy


@pytest.fixture
def mock_zantara_tools():
    """Mock ZantaraTools"""
    tools = MagicMock()
    tools.execute_tool = AsyncMock()
    tools.get_tool_definitions = MagicMock(return_value=[])
    return tools


@pytest.fixture
def tool_executor(mock_handler_proxy, mock_zantara_tools):
    """Create ToolExecutor instance"""
    return ToolExecutor(
        handler_proxy=mock_handler_proxy,
        internal_key="test-key",
        zantara_tools=mock_zantara_tools,
    )


@pytest.fixture
def tool_executor_no_zantara(mock_handler_proxy):
    """Create ToolExecutor without ZantaraTools"""
    return ToolExecutor(handler_proxy=mock_handler_proxy, internal_key="test-key")


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init_with_zantara_tools(mock_handler_proxy, mock_zantara_tools):
    """Test initialization with ZantaraTools"""
    executor = ToolExecutor(
        handler_proxy=mock_handler_proxy,
        internal_key="test-key",
        zantara_tools=mock_zantara_tools,
    )

    assert executor.handler_proxy == mock_handler_proxy
    assert executor.internal_key == "test-key"
    assert executor.zantara_tools == mock_zantara_tools
    assert "get_pricing" in executor.zantara_tool_names


def test_init_without_zantara_tools(mock_handler_proxy):
    """Test initialization without ZantaraTools"""
    executor = ToolExecutor(handler_proxy=mock_handler_proxy)

    assert executor.zantara_tools is None


# ============================================================================
# Tests for execute_tool_calls
# ============================================================================


@pytest.mark.asyncio
async def test_execute_tool_calls_zantara_tool_success(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls with ZantaraTools success"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": True,
        "data": {"result": "test result"},
    }

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {"service_type": "visa"},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["type"] == "tool_result"
    assert results[0]["tool_use_id"] == "toolu_123"
    mock_zantara_tools.execute_tool.assert_called_once()


@pytest.mark.asyncio
async def test_execute_tool_calls_zantara_tool_failure(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls with ZantaraTools failure"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": False,
        "error": "Tool error",
    }

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["is_error"] is True
    assert "Error" in results[0]["content"]


@pytest.mark.asyncio
async def test_execute_tool_calls_zantara_tool_list_data(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls with ZantaraTools returning list"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": True,
        "data": [1, 2, 3],
    }

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert isinstance(results[0]["content"], str)
    assert "1" in results[0]["content"]


@pytest.mark.asyncio
async def test_execute_tool_calls_zantara_tool_string_data(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls with ZantaraTools returning string"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": True,
        "data": "simple string",
    }

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["content"] == "simple string"


@pytest.mark.asyncio
async def test_execute_tool_calls_typescript_handler_success(tool_executor, mock_handler_proxy):
    """Test execute_tool_calls with TypeScript handler success"""
    mock_handler_proxy.execute_handler.return_value = {"result": "success"}

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "gmail_send",
            "input": {"to": "test@example.com"},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["type"] == "tool_result"
    mock_handler_proxy.execute_handler.assert_called_once()
    call_args = mock_handler_proxy.execute_handler.call_args
    assert call_args.kwargs["handler_key"] == "gmail.send"


@pytest.mark.asyncio
async def test_execute_tool_calls_typescript_handler_error(tool_executor, mock_handler_proxy):
    """Test execute_tool_calls with TypeScript handler error"""
    mock_handler_proxy.execute_handler.return_value = {"error": "Handler failed"}

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "gmail_send",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["is_error"] is True


@pytest.mark.asyncio
async def test_execute_tool_calls_typescript_handler_list_result(tool_executor, mock_handler_proxy):
    """Test execute_tool_calls with TypeScript handler returning list"""
    mock_handler_proxy.execute_handler.return_value = {"result": [1, 2, 3]}

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "gmail_send",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert isinstance(results[0]["content"], str)


@pytest.mark.asyncio
async def test_execute_tool_calls_typescript_handler_string_result(
    tool_executor, mock_handler_proxy
):
    """Test execute_tool_calls with TypeScript handler returning string"""
    mock_handler_proxy.execute_handler.return_value = {"result": "string result"}

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "gmail_send",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["content"] == "string result"


@pytest.mark.asyncio
async def test_execute_tool_calls_exception(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls handles exception"""
    mock_zantara_tools.execute_tool.side_effect = Exception("Execution error")

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {},
        }
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 1
    assert results[0]["is_error"] is True
    assert "error" in results[0]["content"].lower()


@pytest.mark.asyncio
async def test_execute_tool_calls_multiple_tools(
    tool_executor, mock_zantara_tools, mock_handler_proxy
):
    """Test execute_tool_calls with multiple tools"""
    mock_zantara_tools.execute_tool.return_value = {"success": True, "data": "result1"}
    mock_handler_proxy.execute_handler.return_value = {"result": "result2"}

    tool_uses = [
        {"id": "toolu_1", "name": "get_pricing", "input": {}},
        {"id": "toolu_2", "name": "gmail_send", "input": {}},
    ]

    results = await tool_executor.execute_tool_calls(tool_uses)

    assert len(results) == 2
    assert results[0]["tool_use_id"] == "toolu_1"
    assert results[1]["tool_use_id"] == "toolu_2"


@pytest.mark.asyncio
async def test_execute_tool_calls_pydantic_object(tool_executor, mock_zantara_tools):
    """Test execute_tool_calls with Pydantic ToolUseBlock object"""
    mock_zantara_tools.execute_tool.return_value = {"success": True, "data": "result"}

    # Simulate Pydantic object with attributes
    tool_use = MagicMock()
    tool_use.id = "toolu_123"
    tool_use.name = "get_pricing"
    tool_use.input = {"service_type": "visa"}

    results = await tool_executor.execute_tool_calls([tool_use])

    assert len(results) == 1
    assert results[0]["tool_use_id"] == "toolu_123"


@pytest.mark.asyncio
async def test_execute_tool_calls_zantara_tool_no_zantara_tools(
    tool_executor_no_zantara, mock_handler_proxy
):
    """Test execute_tool_calls with ZantaraTool name but no ZantaraTools instance"""
    mock_handler_proxy.execute_handler.return_value = {"result": "fallback"}

    tool_uses = [
        {
            "id": "toolu_123",
            "name": "get_pricing",
            "input": {},
        }
    ]

    results = await tool_executor_no_zantara.execute_tool_calls(tool_uses)

    # Should fallback to TypeScript handler
    assert len(results) == 1
    mock_handler_proxy.execute_handler.assert_called_once()


# ============================================================================
# Tests for execute_tool
# ============================================================================


@pytest.mark.asyncio
async def test_execute_tool_zantara_tool_success(tool_executor, mock_zantara_tools):
    """Test execute_tool with ZantaraTools success"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": True,
        "data": {"result": "test"},
    }

    result = await tool_executor.execute_tool("get_pricing", {"service_type": "visa"}, "user123")

    assert result["success"] is True
    assert result["result"] == {"result": "test"}
    mock_zantara_tools.execute_tool.assert_called_once()


@pytest.mark.asyncio
async def test_execute_tool_zantara_tool_failure(tool_executor, mock_zantara_tools):
    """Test execute_tool with ZantaraTools failure"""
    mock_zantara_tools.execute_tool.return_value = {
        "success": False,
        "error": "Tool error",
    }

    result = await tool_executor.execute_tool("get_pricing", {}, "user123")

    assert result["success"] is False
    assert result["error"] == "Tool error"


@pytest.mark.asyncio
async def test_execute_tool_typescript_handler_success(tool_executor, mock_handler_proxy):
    """Test execute_tool with TypeScript handler success"""
    mock_handler_proxy.execute_handler.return_value = {"result": "success"}

    result = await tool_executor.execute_tool("gmail_send", {"to": "test@example.com"}, "user123")

    assert result["success"] is True
    assert result["result"] == "success"
    mock_handler_proxy.execute_handler.assert_called_once()


@pytest.mark.asyncio
async def test_execute_tool_typescript_handler_error(tool_executor, mock_handler_proxy):
    """Test execute_tool with TypeScript handler error"""
    mock_handler_proxy.execute_handler.return_value = {"error": "Handler failed"}

    result = await tool_executor.execute_tool("gmail_send", {}, "user123")

    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_execute_tool_exception(tool_executor, mock_zantara_tools):
    """Test execute_tool handles exception"""
    mock_zantara_tools.execute_tool.side_effect = Exception("Execution error")

    result = await tool_executor.execute_tool("get_pricing", {}, "user123")

    assert result["success"] is False
    assert "error" in result


# ============================================================================
# Tests for get_available_tools
# ============================================================================


@pytest.mark.asyncio
async def test_get_available_tools_with_zantara(
    tool_executor, mock_zantara_tools, mock_handler_proxy
):
    """Test get_available_tools with ZantaraTools"""
    mock_zantara_tools.get_tool_definitions.return_value = [
        {"name": "get_pricing", "description": "Get pricing"}
    ]

    # get_anthropic_tools is called with internal_key argument
    async def mock_get_anthropic_tools(internal_key=None):
        return [{"name": "gmail_send", "description": "Send email"}]

    mock_handler_proxy.get_anthropic_tools = mock_get_anthropic_tools

    tools = await tool_executor.get_available_tools()

    assert len(tools) == 2
    assert any(t["name"] == "get_pricing" for t in tools)
    assert any(t["name"] == "gmail_send" for t in tools)


@pytest.mark.asyncio
async def test_get_available_tools_zantara_exception(
    tool_executor, mock_zantara_tools, mock_handler_proxy
):
    """Test get_available_tools handles ZantaraTools exception"""
    mock_zantara_tools.get_tool_definitions.side_effect = Exception("ZantaraTools error")
    mock_handler_proxy.get_anthropic_tools.return_value = [
        {"name": "gmail_send", "description": "Send email"}
    ]

    tools = await tool_executor.get_available_tools()

    # Should still get TypeScript tools
    assert len(tools) == 1
    assert tools[0]["name"] == "gmail_send"


@pytest.mark.asyncio
async def test_get_available_tools_typescript_exception(
    tool_executor, mock_zantara_tools, mock_handler_proxy
):
    """Test get_available_tools handles TypeScript tools exception"""
    mock_zantara_tools.get_tool_definitions.return_value = [
        {"name": "get_pricing", "description": "Get pricing"}
    ]

    async def mock_get_anthropic_tools(internal_key=None):
        raise Exception("TypeScript error")

    mock_handler_proxy.get_anthropic_tools = mock_get_anthropic_tools

    tools = await tool_executor.get_available_tools()

    # Should still get ZantaraTools
    assert len(tools) == 1
    assert tools[0]["name"] == "get_pricing"


@pytest.mark.asyncio
async def test_get_available_tools_no_zantara(tool_executor_no_zantara, mock_handler_proxy):
    """Test get_available_tools without ZantaraTools"""

    async def mock_get_anthropic_tools(internal_key=None):
        return [{"name": "gmail_send", "description": "Send email"}]

    mock_handler_proxy.get_anthropic_tools = mock_get_anthropic_tools

    tools = await tool_executor_no_zantara.get_available_tools()

    assert len(tools) == 1
    assert tools[0]["name"] == "gmail_send"


@pytest.mark.asyncio
async def test_get_available_tools_empty(tool_executor_no_zantara, mock_handler_proxy):
    """Test get_available_tools returns empty list when no tools available"""

    async def mock_get_anthropic_tools(internal_key=None):
        return []

    mock_handler_proxy.get_anthropic_tools = mock_get_anthropic_tools

    tools = await tool_executor_no_zantara.get_available_tools()

    assert isinstance(tools, list)
    assert len(tools) == 0
