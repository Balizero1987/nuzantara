"""
Unit tests for Zantara Tools Service
100% coverage target with comprehensive mocking
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.zantara_tools import ZantaraTools, get_zantara_tools

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_pricing_service():
    """Mock PricingService"""
    service = MagicMock()
    service.loaded = True
    service.get_pricing = MagicMock(return_value={"visa": {"price": 100}})
    service.search_service = MagicMock(return_value={"visa": {"price": 100}})
    return service


@pytest.fixture
def mock_collaborator_service():
    """Mock CollaboratorService"""
    service = MagicMock()
    service.search_members = MagicMock(return_value=[])
    service.list_members = MagicMock(return_value=[])
    service.get_team_stats = MagicMock(return_value={"total": 10})
    return service


@pytest.fixture
def zantara_tools(mock_pricing_service, mock_collaborator_service):
    """Create ZantaraTools instance"""
    with patch(
        "services.zantara_tools.get_pricing_service", return_value=mock_pricing_service
    ), patch("services.zantara_tools.CollaboratorService", return_value=mock_collaborator_service):
        return ZantaraTools()


# ============================================================================
# Tests for __init__
# ============================================================================


def test_init(zantara_tools, mock_pricing_service, mock_collaborator_service):
    """Test initialization"""
    assert zantara_tools.pricing_service == mock_pricing_service
    assert zantara_tools.collaborator_service == mock_collaborator_service


# ============================================================================
# Tests for execute_tool
# ============================================================================


@pytest.mark.asyncio
async def test_execute_tool_get_pricing_success(zantara_tools, mock_pricing_service):
    """Test execute_tool with get_pricing success"""
    mock_pricing_service.get_pricing.return_value = {"visa": {"price": 100}}

    result = await zantara_tools.execute_tool("get_pricing", {"service_type": "visa"})

    assert result["success"] is True
    assert "data" in result
    mock_pricing_service.get_pricing.assert_called_once_with("visa")


@pytest.mark.asyncio
async def test_execute_tool_get_pricing_with_query(zantara_tools, mock_pricing_service):
    """Test execute_tool with get_pricing and query"""
    mock_pricing_service.search_service.return_value = {"visa": {"price": 100}}

    result = await zantara_tools.execute_tool(
        "get_pricing", {"service_type": "all", "query": "visa"}
    )

    assert result["success"] is True
    mock_pricing_service.search_service.assert_called_once_with("visa")


@pytest.mark.asyncio
async def test_execute_tool_get_pricing_not_loaded(zantara_tools, mock_pricing_service):
    """Test execute_tool with get_pricing when not loaded"""
    mock_pricing_service.loaded = False

    result = await zantara_tools.execute_tool("get_pricing", {"service_type": "visa"})

    assert result["success"] is False
    assert "error" in result
    assert "fallback_contact" in result


@pytest.mark.asyncio
async def test_execute_tool_get_pricing_exception(zantara_tools, mock_pricing_service):
    """Test execute_tool with get_pricing exception"""
    mock_pricing_service.get_pricing.side_effect = Exception("Pricing error")

    result = await zantara_tools.execute_tool("get_pricing", {"service_type": "visa"})

    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_execute_tool_search_team_member_success(zantara_tools, mock_collaborator_service):
    """Test execute_tool with search_team_member success"""
    mock_profile = MagicMock()
    mock_profile.name = "John Doe"
    mock_profile.email = "john@example.com"
    mock_profile.role = "Developer"
    mock_profile.department = "Tech"
    mock_profile.expertise_level = "Senior"
    mock_profile.language = "en"
    mock_profile.notes = "Test notes"
    mock_profile.traits = ["helpful", "friendly"]

    mock_collaborator_service.search_members.return_value = [mock_profile]

    result = await zantara_tools.execute_tool("search_team_member", {"query": "John"})

    assert result["success"] is True
    assert result["data"]["count"] == 1
    assert len(result["data"]["results"]) == 1
    assert result["data"]["results"][0]["name"] == "John Doe"


@pytest.mark.asyncio
async def test_execute_tool_search_team_member_no_results(zantara_tools, mock_collaborator_service):
    """Test execute_tool with search_team_member no results"""
    mock_collaborator_service.search_members.return_value = []

    result = await zantara_tools.execute_tool("search_team_member", {"query": "Unknown"})

    assert result["success"] is True
    assert "message" in result["data"]
    assert "No team member found" in result["data"]["message"]


@pytest.mark.asyncio
async def test_execute_tool_search_team_member_empty_query(zantara_tools):
    """Test execute_tool with search_team_member empty query"""
    result = await zantara_tools.execute_tool("search_team_member", {"query": ""})

    assert result["success"] is False
    assert "error" in result


@pytest.mark.asyncio
async def test_execute_tool_get_team_members_list_all(zantara_tools, mock_collaborator_service):
    """Test execute_tool with get_team_members_list all members"""
    mock_profile = MagicMock()
    mock_profile.name = "John Doe"
    mock_profile.email = "john@example.com"
    mock_profile.role = "Developer"
    mock_profile.department = "Tech"
    mock_profile.expertise_level = "Senior"
    mock_profile.language = "en"
    mock_profile.traits = []
    mock_profile.notes = ""

    mock_collaborator_service.list_members.return_value = [mock_profile]
    mock_collaborator_service.get_team_stats.return_value = {"total": 1}

    result = await zantara_tools.execute_tool("get_team_members_list", {})

    assert result["success"] is True
    assert result["data"]["total_members"] == 1
    assert "by_department" in result["data"]
    assert "roster" in result["data"]
    assert "stats" in result["data"]


@pytest.mark.asyncio
async def test_execute_tool_get_team_members_list_by_department(
    zantara_tools, mock_collaborator_service
):
    """Test execute_tool with get_team_members_list filtered by department"""
    mock_profile = MagicMock()
    mock_profile.name = "John Doe"
    mock_profile.email = "john@example.com"
    mock_profile.role = "Developer"
    mock_profile.department = "Tech"
    mock_profile.expertise_level = "Senior"
    mock_profile.language = "en"
    mock_profile.traits = []
    mock_profile.notes = ""

    mock_collaborator_service.list_members.return_value = [mock_profile]

    result = await zantara_tools.execute_tool("get_team_members_list", {"department": "Tech"})

    assert result["success"] is True
    mock_collaborator_service.list_members.assert_called_once_with("tech")


@pytest.mark.asyncio
async def test_execute_tool_get_team_members_list_empty_department(
    zantara_tools, mock_collaborator_service
):
    """Test execute_tool with get_team_members_list empty department"""
    mock_collaborator_service.list_members.return_value = []

    result = await zantara_tools.execute_tool("get_team_members_list", {"department": ""})

    assert result["success"] is True
    # Should call with None when department is empty
    mock_collaborator_service.list_members.assert_called_once()


@pytest.mark.asyncio
async def test_execute_tool_unknown_tool(zantara_tools):
    """Test execute_tool with unknown tool"""
    result = await zantara_tools.execute_tool("unknown_tool", {})

    assert result["success"] is False
    assert "error" in result
    assert "Unknown tool" in result["error"]


@pytest.mark.asyncio
async def test_execute_tool_exception(zantara_tools, mock_pricing_service):
    """Test execute_tool handles exception"""
    mock_pricing_service.get_pricing.side_effect = Exception("Unexpected error")

    result = await zantara_tools.execute_tool("get_pricing", {"service_type": "visa"})

    assert result["success"] is False
    assert "error" in result


# ============================================================================
# Tests for get_tool_definitions
# ============================================================================


def test_get_tool_definitions(zantara_tools):
    """Test get_tool_definitions"""
    tools = zantara_tools.get_tool_definitions()

    assert isinstance(tools, list)
    assert len(tools) >= 3
    tool_names = [t["name"] for t in tools]
    assert "get_pricing" in tool_names
    assert "search_team_member" in tool_names
    assert "get_team_members_list" in tool_names


def test_get_tool_definitions_get_pricing(zantara_tools):
    """Test get_tool_definitions includes get_pricing"""
    tools = zantara_tools.get_tool_definitions()

    pricing_tool = next(t for t in tools if t["name"] == "get_pricing")
    assert "description" in pricing_tool
    assert "input_schema" in pricing_tool
    assert "service_type" in pricing_tool["input_schema"]["properties"]


def test_get_tool_definitions_search_team_member(zantara_tools):
    """Test get_tool_definitions includes search_team_member"""
    tools = zantara_tools.get_tool_definitions()

    search_tool = next(t for t in tools if t["name"] == "search_team_member")
    assert "description" in search_tool
    assert "input_schema" in search_tool


def test_get_tool_definitions_get_team_members_list(zantara_tools):
    """Test get_tool_definitions includes get_team_members_list"""
    tools = zantara_tools.get_tool_definitions()

    list_tool = next(t for t in tools if t["name"] == "get_team_members_list")
    assert "description" in list_tool
    assert "input_schema" in list_tool


def test_get_tool_definitions_include_admin_tools(zantara_tools):
    """Test get_tool_definitions with include_admin_tools parameter"""
    # get_tool_definitions accepts include_admin_tools but doesn't use it
    tools = zantara_tools.get_tool_definitions(_include_admin_tools=False)

    assert isinstance(tools, list)
    # Should return same tools regardless of include_admin_tools (not implemented)
    assert len(tools) >= 3


# ============================================================================
# Tests for get_zantara_tools
# ============================================================================


def test_get_zantara_tools_singleton():
    """Test get_zantara_tools returns singleton"""
    with patch("services.zantara_tools.ZantaraTools") as mock_zantara_tools_class:
        mock_instance = MagicMock()
        mock_zantara_tools_class.return_value = mock_instance

        # Clear global singleton
        import services.zantara_tools

        services.zantara_tools._zantara_tools = None

        result1 = get_zantara_tools()
        result2 = get_zantara_tools()

        assert result1 == result2
        assert result1 == mock_instance
        # Should only be called once (singleton)
        assert mock_zantara_tools_class.call_count == 1
