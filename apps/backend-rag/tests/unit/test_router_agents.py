"""
Unit tests for Agents Router
"""

import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.routers.agents import (
    AddComplianceItemRequest,
    CreateJourneyRequest,
    add_compliance_tracking,
    calculate_dynamic_pricing,
    complete_journey_step,
    create_client_journey,
    cross_oracle_synthesis,
    export_knowledge_graph,
    extract_knowledge_graph,
    get_agents_status,
    get_analytics_summary,
    get_compliance_alerts,
    get_ingestion_status,
    get_journey,
    get_next_steps,
    run_auto_ingestion,
    run_autonomous_research,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_journey():
    """Mock ClientJourney object"""
    journey = MagicMock()
    journey.journey_id = "journey-123"
    journey.steps = [{"step_id": "step-1", "title": "Step 1"}]
    journey.__dict__ = {
        "journey_id": "journey-123",
        "journey_type": "pt_pma_setup",
        "client_id": "client-123",
        "steps": [{"step_id": "step-1", "title": "Step 1"}],
        "status": "in_progress",
    }
    # MagicMock is truthy by default, no need to set __bool__
    return journey


@pytest.fixture
def mock_compliance_item():
    """Mock ComplianceItem object"""
    item = MagicMock()
    item.item_id = "item-123"
    item.client_id = "client-123"
    item.title = "Visa Expiry"
    item.deadline = datetime(2024, 12, 31)
    item.estimated_cost = 5000000
    item.__dict__ = {
        "item_id": "item-123",
        "client_id": "client-123",
        "compliance_type": "visa_expiry",
        "title": "Visa Expiry",
        "description": "KITAS expiring soon",
        "deadline": datetime(2024, 12, 31),
        "estimated_cost": 5000000,
    }
    return item


@pytest.fixture
def mock_alert():
    """Mock ComplianceAlert object"""
    from services.proactive_compliance_monitor import AlertSeverity

    alert = MagicMock()
    alert.alert_id = "alert-123"
    alert.client_id = "client-123"
    alert.title = "Visa Expiry"
    alert.deadline = datetime(2024, 12, 31)
    alert.estimated_cost = 5000000
    alert.days_until_deadline = 7
    alert.severity = AlertSeverity.CRITICAL
    alert.__dict__ = {
        "alert_id": "alert-123",
        "client_id": "client-123",
        "title": "Visa Expiry",
        "deadline": datetime(2024, 12, 31),
        "estimated_cost": 5000000,
        "days_until_deadline": 7,
        "severity": AlertSeverity.CRITICAL,
    }
    return alert


# ============================================================================
# Tests for /status endpoint
# ============================================================================


@pytest.mark.asyncio
async def test_get_agents_status():
    """Test get_agents_status endpoint"""
    result = await get_agents_status()

    assert result["status"] == "operational"
    assert result["total_agents"] == 10
    assert "phase_1_2_foundation" in result["agents"]
    assert "phase_3_orchestration" in result["agents"]
    assert "capabilities" in result


# ============================================================================
# Tests for Journey Orchestrator endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_create_client_journey_success(mock_journey):
    """Test successful journey creation"""
    request = CreateJourneyRequest(journey_type="pt_pma_setup", client_id="client-123")

    with patch("app.routers.agents.journey_orchestrator.create_journey", return_value=mock_journey):
        result = await create_client_journey(request)

        assert result["success"] is True
        assert result["journey_id"] == "journey-123"
        assert "journey" in result
        assert result["message"] == "Journey created with 1 steps"


@pytest.mark.asyncio
async def test_create_client_journey_error():
    """Test journey creation error"""
    request = CreateJourneyRequest(journey_type="invalid_type", client_id="client-123")

    with patch(
        "app.routers.agents.journey_orchestrator.create_journey",
        side_effect=ValueError("Invalid journey type"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await create_client_journey(request)

        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_journey_success():
    """Test successful journey retrieval"""

    # Create simple object instead of MagicMock to avoid boolean evaluation issues
    class MockJourney:
        def __init__(self):
            self.journey_id = "journey-123"
            self.journey_type = "pt_pma_setup"
            self.status = "in_progress"

        @property
        def __dict__(self):
            return {
                "journey_id": self.journey_id,
                "journey_type": self.journey_type,
                "status": self.status,
            }

    mock_journey = MockJourney()
    mock_progress = {"completed": 2, "total": 5, "percentage": 40.0}

    with patch("app.routers.agents.journey_orchestrator.get_journey", return_value=mock_journey):
        with patch(
            "app.routers.agents.journey_orchestrator.get_progress", return_value=mock_progress
        ):
            result = await get_journey("journey-123")

            assert result["success"] is True
            assert "journey" in result
            assert "progress" in result
            assert result["progress"] == mock_progress
            assert result["journey"]["journey_id"] == "journey-123"


@pytest.mark.asyncio
async def test_get_journey_not_found():
    """Test journey not found"""
    with patch("app.routers.agents.journey_orchestrator.get_journey", return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            await get_journey("nonexistent")

        assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_complete_journey_step_success(mock_journey):
    """Test successful step completion"""
    with patch("app.routers.agents.journey_orchestrator.complete_step") as mock_complete:
        with patch(
            "app.routers.agents.journey_orchestrator.get_journey", return_value=mock_journey
        ):
            result = await complete_journey_step("journey-123", "step-1", "Notes")

            assert result["success"] is True
            assert "message" in result
            mock_complete.assert_called_once_with("journey-123", "step-1", "Notes")


@pytest.mark.asyncio
async def test_complete_journey_step_error():
    """Test step completion error"""
    with patch(
        "app.routers.agents.journey_orchestrator.complete_step",
        side_effect=ValueError("Step not found"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await complete_journey_step("journey-123", "invalid-step")

        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_next_steps():
    """Test get next steps"""
    mock_step = MagicMock()
    mock_step.__dict__ = {"step_id": "step-2", "title": "Next Step"}

    with patch("app.routers.agents.journey_orchestrator.get_next_steps", return_value=[mock_step]):
        result = await get_next_steps("journey-123")

        assert result["success"] is True
        assert result["count"] == 1
        assert len(result["next_steps"]) == 1


# ============================================================================
# Tests for Compliance Monitor endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_add_compliance_tracking_success(mock_compliance_item):
    """Test successful compliance tracking addition"""
    request = AddComplianceItemRequest(
        client_id="client-123",
        compliance_type="visa_expiry",
        title="KITAS Expiry",
        description="KITAS expiring soon",
        deadline="2024-12-31",
        estimated_cost=5000000,
        required_documents=["passport", "visa"],
    )

    with patch(
        "app.routers.agents.compliance_monitor.add_compliance_item",
        return_value=mock_compliance_item,
    ):
        result = await add_compliance_tracking(request)

        assert result["success"] is True
        assert result["item_id"] == "item-123"
        assert "item" in result


@pytest.mark.asyncio
async def test_add_compliance_tracking_error():
    """Test compliance tracking addition error"""
    request = AddComplianceItemRequest(
        client_id="client-123",
        compliance_type="invalid_type",
        title="Test",
        description="Test",
        deadline="2024-12-31",
    )

    with patch(
        "app.routers.agents.compliance_monitor.add_compliance_item",
        side_effect=ValueError("Invalid compliance type"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await add_compliance_tracking(request)

        assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_get_compliance_alerts_no_filters(mock_alert):
    """Test get compliance alerts without filters"""
    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[mock_alert]
    ):
        result = await get_compliance_alerts()

        assert result["success"] is True
        assert result["count"] == 1
        assert len(result["alerts"]) == 1
        assert "breakdown" in result


@pytest.mark.asyncio
async def test_get_compliance_alerts_with_client_filter(mock_alert):
    """Test get compliance alerts with client filter"""
    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[mock_alert]
    ):
        result = await get_compliance_alerts(client_id="client-123")

        assert result["success"] is True
        assert result["count"] == 1


@pytest.mark.asyncio
async def test_get_compliance_alerts_with_severity_filter(mock_alert):
    """Test get compliance alerts with severity filter"""
    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[mock_alert]
    ):
        result = await get_compliance_alerts(severity="critical")

        assert result["success"] is True
        # Alert should be filtered if severity matches


@pytest.mark.asyncio
async def test_get_compliance_alerts_with_auto_notify(mock_alert):
    """Test get compliance alerts with auto_notify enabled"""
    mock_notification_hub = AsyncMock()
    mock_notification_hub.send = AsyncMock(
        return_value={"notification_id": "notif-123", "status": "sent"}
    )

    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[mock_alert]
    ):
        with patch("services.notification_hub.create_notification_from_template") as mock_create:
            with patch("services.notification_hub.notification_hub", mock_notification_hub):
                mock_notification = MagicMock()
                mock_notification.notification_id = "notif-123"
                mock_create.return_value = mock_notification

                result = await get_compliance_alerts(auto_notify=True)

                assert result["success"] is True
                assert result["count"] == 1
                assert result["notifications_sent"] is not None
                assert len(result["notifications_sent"]) == 1
                mock_create.assert_called_once()
                mock_notification_hub.send.assert_called_once()


@pytest.mark.asyncio
async def test_get_compliance_alerts_auto_notify_error(mock_alert):
    """Test auto_notify with notification sending error"""
    mock_notification_hub = AsyncMock()
    mock_notification_hub.send = AsyncMock(side_effect=Exception("Notification failed"))

    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[mock_alert]
    ):
        with patch("services.notification_hub.create_notification_from_template") as mock_create:
            with patch("services.notification_hub.notification_hub", mock_notification_hub):
                mock_notification = MagicMock()
                mock_create.return_value = mock_notification

                # Should not raise exception, just log error
                result = await get_compliance_alerts(auto_notify=True)

                assert result["success"] is True
                # Notification send failed but endpoint still succeeds


@pytest.mark.asyncio
async def test_get_compliance_alerts_with_dict_alert():
    """Test get compliance alerts with dict-based alert (not object)"""
    from services.proactive_compliance_monitor import AlertSeverity

    dict_alert = {
        "alert_id": "alert-456",
        "client_id": "client-456",
        "title": "Tax Filing",
        "deadline": "2024-12-31",
        "estimated_cost": 3000000,
        "days_until": 30,
        "severity": AlertSeverity.URGENT.value,
    }

    with patch(
        "app.routers.agents.compliance_monitor.check_compliance_items", return_value=[dict_alert]
    ):
        result = await get_compliance_alerts(client_id="client-456")

        assert result["success"] is True
        assert result["count"] == 1


# Skipped - Method get_client_items doesn't exist on ProactiveComplianceMonitor
# Coverage: Endpoint exists but method not implemented in service yet
# Lines 341-342 cannot be tested until service method is implemented


# ============================================================================
# Tests for Knowledge Graph endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_extract_knowledge_graph():
    """Test knowledge graph extraction"""
    mock_request = MagicMock()
    result = await extract_knowledge_graph(
        request=mock_request, text="John works for PT ABC in Jakarta"
    )

    assert result["success"] is True
    assert result["text_length"] == len("John works for PT ABC in Jakarta")
    assert "features" in result


@pytest.mark.asyncio
async def test_export_knowledge_graph():
    """Test knowledge graph export"""
    result = await export_knowledge_graph(format="neo4j")

    assert result["success"] is True
    assert result["format"] == "neo4j"
    assert "warning" in result  # Placeholder endpoint


# ============================================================================
# Tests for Auto Ingestion endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_run_auto_ingestion():
    """Test run auto ingestion"""
    result = await run_auto_ingestion(sources=["kemenkeu"], force=True)

    assert result["success"] is True
    assert result["sources"] == ["kemenkeu"]
    assert result["force"] is True


@pytest.mark.asyncio
async def test_get_ingestion_status():
    """Test get ingestion status"""
    result = await get_ingestion_status()

    assert result["success"] is True
    assert result["status"] == "operational"
    assert "features" in result


# ============================================================================
# Tests for Foundation Agents endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_cross_oracle_synthesis():
    """Test cross-oracle synthesis"""
    mock_request = MagicMock()
    # Mock the app.state to return None for services (missing dependencies)
    # Use configure_mock to ensure getattr returns None, not MagicMock
    mock_state = MagicMock()
    mock_state.configure_mock(intelligent_router=None, search_service=None, ai_client=None)
    mock_request.app.state = mock_state

    result = await cross_oracle_synthesis(
        request=mock_request, query="Tax regulations", domains=["tax", "legal"]
    )

    # Expect failure response when dependencies are missing
    assert result["success"] is False
    assert result["error"] == "CrossOracleSynthesisService not available - missing dependencies"
    assert result["query"] == "Tax regulations"
    assert result["domains"] == ["tax", "legal"]


@pytest.mark.asyncio
async def test_calculate_dynamic_pricing():
    """Test dynamic pricing calculation"""
    result = await calculate_dynamic_pricing(
        service_type="pt_pma", complexity="complex", urgency="urgent"
    )

    assert result["success"] is True
    assert result["service_type"] == "pt_pma"
    assert result["complexity"] == "complex"
    assert result["urgency"] == "urgent"


@pytest.mark.asyncio
async def test_run_autonomous_research():
    """Test autonomous research"""
    mock_request = MagicMock()
    # Mock the app.state to return None for services (missing dependencies)
    # Use configure_mock to ensure getattr returns None, not MagicMock
    mock_state = MagicMock()
    mock_state.configure_mock(search_service=None, ai_client=None, query_router=None)
    mock_request.app.state = mock_state

    result = await run_autonomous_research(
        request=mock_request,
        topic="Indonesian tax law",
        depth="deep",
        sources=["oracle_collections"],
    )

    # Expect failure response when dependencies are missing
    assert result["success"] is False
    assert result["error"] == "AutonomousResearchService not available - missing dependencies"
    assert result["topic"] == "Indonesian tax law"
    assert result["depth"] == "deep"


# ============================================================================
# Tests for Analytics endpoints
# ============================================================================


@pytest.mark.asyncio
async def test_get_analytics_summary():
    """Test get analytics summary"""
    mock_stats = {"total_journeys": 10, "active_journeys": 5, "completed_journeys": 5}

    with patch(
        "app.routers.agents.journey_orchestrator.get_orchestrator_stats", return_value=mock_stats
    ):
        result = await get_analytics_summary()

        assert result["success"] is True
        assert "analytics" in result
        assert result["analytics"]["journeys"] == mock_stats
        assert "timestamp" in result
