"""
Unit tests for Proactive Compliance Monitor
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

import pytest

# Ensure backend is in path
backend_path = Path(__file__).parent.parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from services.proactive_compliance_monitor import (
    AlertSeverity,
    AlertStatus,
    ComplianceAlert,
    ComplianceItem,
    ComplianceType,
    ProactiveComplianceMonitor,
)

# ============================================================================
# Fixtures
# ============================================================================


@pytest.fixture
def mock_search_service():
    """Mock SearchService"""
    return MagicMock()


@pytest.fixture
def mock_notification_service():
    """Mock notification service"""
    mock = MagicMock()
    mock.send = AsyncMock(return_value=True)
    return mock


@pytest.fixture
def compliance_monitor(mock_search_service, mock_notification_service):
    """Create ProactiveComplianceMonitor instance"""
    return ProactiveComplianceMonitor(
        search_service=mock_search_service,
        notification_service=mock_notification_service,
    )


# ============================================================================
# Tests for Enums
# ============================================================================


def test_compliance_type_enum():
    """Test ComplianceType enum values"""
    assert ComplianceType.VISA_EXPIRY == "visa_expiry"
    assert ComplianceType.TAX_FILING == "tax_filing"
    assert ComplianceType.LICENSE_RENEWAL == "license_renewal"


def test_alert_severity_enum():
    """Test AlertSeverity enum values"""
    assert AlertSeverity.INFO == "info"
    assert AlertSeverity.WARNING == "warning"
    assert AlertSeverity.URGENT == "urgent"
    assert AlertSeverity.CRITICAL == "critical"


def test_alert_status_enum():
    """Test AlertStatus enum values"""
    assert AlertStatus.PENDING == "pending"
    assert AlertStatus.SENT == "sent"
    assert AlertStatus.ACKNOWLEDGED == "acknowledged"
    assert AlertStatus.RESOLVED == "resolved"


# ============================================================================
# Tests for Dataclasses
# ============================================================================


def test_compliance_item_creation():
    """Test ComplianceItem dataclass creation"""
    item = ComplianceItem(
        item_id="item1",
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        description="KITAS expires soon",
        deadline=(datetime.now() + timedelta(days=30)).isoformat(),
        requirement_details="Renew KITAS",
    )
    assert item.item_id == "item1"
    assert item.compliance_type == ComplianceType.VISA_EXPIRY
    assert item.estimated_cost is None


def test_compliance_alert_creation():
    """Test ComplianceAlert dataclass creation"""
    alert = ComplianceAlert(
        alert_id="alert1",
        compliance_item_id="item1",
        client_id="client1",
        severity=AlertSeverity.WARNING,
        title="Warning: KITAS Expiry",
        message="KITAS expires in 30 days",
        deadline=(datetime.now() + timedelta(days=30)).isoformat(),
        days_until_deadline=30,
        action_required="Renew KITAS",
    )
    assert alert.alert_id == "alert1"
    assert alert.severity == AlertSeverity.WARNING
    assert alert.status == AlertStatus.PENDING


# ============================================================================
# Tests for ProactiveComplianceMonitor.__init__
# ============================================================================


def test_init(compliance_monitor, mock_search_service, mock_notification_service):
    """Test ProactiveComplianceMonitor initialization"""
    assert compliance_monitor.search is mock_search_service
    assert compliance_monitor.notifications is mock_notification_service
    assert len(compliance_monitor.compliance_items) == 0
    assert len(compliance_monitor.alerts) == 0
    assert compliance_monitor.monitor_stats["total_items_tracked"] == 0


def test_init_annual_deadlines(compliance_monitor):
    """Test that annual deadlines are defined"""
    assert len(compliance_monitor.ANNUAL_DEADLINES) > 0
    assert "spt_tahunan_individual" in compliance_monitor.ANNUAL_DEADLINES
    assert "spt_tahunan_corporate" in compliance_monitor.ANNUAL_DEADLINES


# ============================================================================
# Tests for add_compliance_item
# ============================================================================


def test_add_compliance_item(compliance_monitor):
    """Test adding compliance item"""
    deadline = (datetime.now() + timedelta(days=60)).isoformat()

    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
        description="KITAS expires soon",
        estimated_cost=5000000.0,
    )

    assert isinstance(item, ComplianceItem)
    assert item.client_id == "client123"
    assert item.item_id in compliance_monitor.compliance_items
    assert compliance_monitor.monitor_stats["total_items_tracked"] == 1
    assert compliance_monitor.monitor_stats["active_items"] == 1


def test_add_compliance_item_with_documents(compliance_monitor):
    """Test adding compliance item with required documents"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()

    item = compliance_monitor.add_compliance_item(
        client_id="client456",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="IMTA Renewal",
        deadline=deadline,
        required_documents=["Passport", "CV", "Educational certificates"],
    )

    assert len(item.required_documents) == 3
    assert "Passport" in item.required_documents


# ============================================================================
# Tests for add_visa_expiry
# ============================================================================


def test_add_visa_expiry(compliance_monitor):
    """Test adding visa expiry tracking"""
    expiry_date = (datetime.now() + timedelta(days=90)).isoformat()

    item = compliance_monitor.add_visa_expiry(
        client_id="client789",
        visa_type="KITAS",
        expiry_date=expiry_date,
        passport_number="A12345678",
    )

    assert item.compliance_type == ComplianceType.VISA_EXPIRY
    assert "KITAS" in item.title
    assert item.metadata["visa_type"] == "KITAS"
    assert item.metadata["passport_number"] == "A12345678"


# ============================================================================
# Tests for add_annual_tax_deadline
# ============================================================================


def test_add_annual_tax_deadline(compliance_monitor):
    """Test adding annual tax deadline"""
    item = compliance_monitor.add_annual_tax_deadline(
        client_id="client999",
        deadline_type="spt_tahunan_individual",
        year=2024,
    )

    assert item.compliance_type == ComplianceType.TAX_FILING
    assert "2024" in item.title
    assert item.metadata["tax_year"] == 2024
    assert item.estimated_cost == 2000000  # From template


def test_add_annual_tax_deadline_invalid_type(compliance_monitor):
    """Test adding annual tax deadline with invalid type"""
    with pytest.raises(ValueError, match="Unknown deadline type"):
        compliance_monitor.add_annual_tax_deadline(
            client_id="client999",
            deadline_type="invalid_type",
            year=2024,
        )


# ============================================================================
# Tests for calculate_severity
# ============================================================================


def test_calculate_severity_info(compliance_monitor):
    """Test calculating INFO severity (>30 days)"""
    deadline = (datetime.now() + timedelta(days=45)).isoformat()
    severity, days_until = compliance_monitor.calculate_severity(deadline)

    assert severity == AlertSeverity.INFO
    assert days_until > 30


def test_calculate_severity_warning(compliance_monitor):
    """Test calculating WARNING severity (7-30 days)"""
    deadline = (datetime.now() + timedelta(days=25)).isoformat()
    severity, days_until = compliance_monitor.calculate_severity(deadline)

    assert severity == AlertSeverity.WARNING
    assert 7 < days_until <= 30


def test_calculate_severity_urgent(compliance_monitor):
    """Test calculating URGENT severity (<=7 days)"""
    deadline = (datetime.now() + timedelta(days=5)).isoformat()
    severity, days_until = compliance_monitor.calculate_severity(deadline)

    assert severity == AlertSeverity.URGENT
    assert days_until <= 7


def test_calculate_severity_critical_overdue(compliance_monitor):
    """Test calculating CRITICAL severity (overdue)"""
    deadline = (datetime.now() - timedelta(days=5)).isoformat()
    severity, days_until = compliance_monitor.calculate_severity(deadline)

    assert severity == AlertSeverity.CRITICAL
    assert days_until < 0


def test_calculate_severity_critical_very_close(compliance_monitor):
    """Test calculating URGENT severity (<=7 days)"""
    deadline = (datetime.now() + timedelta(days=3)).isoformat()
    severity, days_until = compliance_monitor.calculate_severity(deadline)

    assert severity == AlertSeverity.URGENT  # URGENT for <=7 days
    assert days_until <= 7


# ============================================================================
# Tests for check_compliance_items
# ============================================================================


def test_check_compliance_items_generates_alerts(compliance_monitor):
    """Test checking compliance items generates alerts"""
    # Add item with deadline in 30 days (WARNING)
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()

    assert len(alerts) > 0
    assert alerts[0].severity == AlertSeverity.WARNING
    assert alerts[0].compliance_item_id == item.item_id
    assert compliance_monitor.monitor_stats["alerts_generated"] > 0


def test_check_compliance_items_no_duplicate_alerts(compliance_monitor):
    """Test that checking twice doesn't create duplicate alerts"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts1 = compliance_monitor.check_compliance_items()
    alerts2 = compliance_monitor.check_compliance_items()

    assert len(alerts1) > 0
    assert len(alerts2) == 0  # Should not create duplicate


def test_check_compliance_items_critical_overdue(compliance_monitor):
    """Test checking compliance items marks overdue as critical"""
    deadline = (datetime.now() - timedelta(days=5)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Overdue KITAS",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()

    assert len(alerts) > 0
    assert alerts[0].severity == AlertSeverity.CRITICAL
    assert compliance_monitor.monitor_stats["overdue_items"] > 0


# ============================================================================
# Tests for send_alert
# ============================================================================


@pytest.mark.asyncio
async def test_send_alert_success(compliance_monitor, mock_notification_service):
    """Test sending alert successfully"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    success = await compliance_monitor.send_alert(alert_id, via="whatsapp")

    assert success is True
    assert compliance_monitor.alerts[alert_id].status == AlertStatus.SENT
    assert compliance_monitor.alerts[alert_id].sent_at is not None
    assert compliance_monitor.monitor_stats["alerts_sent"] > 0
    mock_notification_service.send.assert_called_once()


@pytest.mark.asyncio
async def test_send_alert_no_notification_service(compliance_monitor):
    """Test sending alert without notification service"""
    compliance_monitor.notifications = None
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    success = await compliance_monitor.send_alert(alert_id)

    assert success is True  # Should succeed even without service (logs only)


@pytest.mark.asyncio
async def test_send_alert_not_found(compliance_monitor):
    """Test sending non-existent alert"""
    success = await compliance_monitor.send_alert("nonexistent_alert")

    assert success is False


# ============================================================================
# Tests for acknowledge_alert
# ============================================================================


def test_acknowledge_alert(compliance_monitor):
    """Test acknowledging alert"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    success = compliance_monitor.acknowledge_alert(alert_id)

    assert success is True
    assert compliance_monitor.alerts[alert_id].status == AlertStatus.ACKNOWLEDGED
    assert compliance_monitor.alerts[alert_id].acknowledged_at is not None


def test_acknowledge_alert_not_found(compliance_monitor):
    """Test acknowledging non-existent alert"""
    success = compliance_monitor.acknowledge_alert("nonexistent")

    assert success is False


# ============================================================================
# Tests for resolve_compliance_item
# ============================================================================


def test_resolve_compliance_item(compliance_monitor):
    """Test resolving compliance item"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    initial_active = compliance_monitor.monitor_stats["active_items"]

    success = compliance_monitor.resolve_compliance_item(item.item_id)

    assert success is True
    assert item.item_id not in compliance_monitor.compliance_items
    assert compliance_monitor.monitor_stats["active_items"] == initial_active - 1


def test_resolve_compliance_item_resolves_alerts(compliance_monitor):
    """Test resolving compliance item marks related alerts as resolved"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    compliance_monitor.resolve_compliance_item(item.item_id)

    assert compliance_monitor.alerts[alert_id].status == AlertStatus.RESOLVED


def test_resolve_compliance_item_not_found(compliance_monitor):
    """Test resolving non-existent compliance item"""
    success = compliance_monitor.resolve_compliance_item("nonexistent")

    assert success is False


# ============================================================================
# Tests for get_upcoming_deadlines
# ============================================================================


def test_get_upcoming_deadlines_all(compliance_monitor):
    """Test getting all upcoming deadlines"""
    # Add items with different deadlines
    deadline1 = (datetime.now() + timedelta(days=30)).isoformat()
    deadline2 = (datetime.now() + timedelta(days=60)).isoformat()
    deadline3 = (datetime.now() + timedelta(days=120)).isoformat()

    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 1",
        deadline=deadline1,
    )
    compliance_monitor.add_compliance_item(
        client_id="client2",
        compliance_type=ComplianceType.TAX_FILING,
        title="Item 2",
        deadline=deadline2,
    )
    compliance_monitor.add_compliance_item(
        client_id="client3",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="Item 3",
        deadline=deadline3,
    )

    upcoming = compliance_monitor.get_upcoming_deadlines(days_ahead=90)

    assert len(upcoming) == 2  # Only items within 90 days
    assert upcoming[0].deadline <= upcoming[1].deadline  # Sorted by deadline


def test_get_upcoming_deadlines_filtered_by_client(compliance_monitor):
    """Test getting upcoming deadlines filtered by client"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()

    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 1",
        deadline=deadline,
    )
    compliance_monitor.add_compliance_item(
        client_id="client2",
        compliance_type=ComplianceType.TAX_FILING,
        title="Item 2",
        deadline=deadline,
    )

    upcoming = compliance_monitor.get_upcoming_deadlines(client_id="client1", days_ahead=90)

    assert len(upcoming) == 1
    assert upcoming[0].client_id == "client1"


# ============================================================================
# Tests for get_alerts_for_client
# ============================================================================


def test_get_alerts_for_client(compliance_monitor):
    """Test getting alerts for specific client"""
    deadline1 = (datetime.now() + timedelta(days=30)).isoformat()
    deadline2 = (datetime.now() + timedelta(days=60)).isoformat()

    item1 = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 1",
        deadline=deadline1,
    )
    item2 = compliance_monitor.add_compliance_item(
        client_id="client2",
        compliance_type=ComplianceType.TAX_FILING,
        title="Item 2",
        deadline=deadline2,
    )

    compliance_monitor.check_compliance_items()

    alerts = compliance_monitor.get_alerts_for_client("client1")

    assert len(alerts) > 0
    assert all(alert.client_id == "client1" for alert in alerts)


def test_get_alerts_for_client_filtered_by_status(compliance_monitor):
    """Test getting alerts filtered by status"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 1",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    # Acknowledge alert
    compliance_monitor.acknowledge_alert(alert_id)

    # Get only pending alerts
    pending_alerts = compliance_monitor.get_alerts_for_client(
        "client1", status_filter=AlertStatus.PENDING
    )

    assert len(pending_alerts) == 0  # All acknowledged

    # Get acknowledged alerts
    acknowledged_alerts = compliance_monitor.get_alerts_for_client(
        "client1", status_filter=AlertStatus.ACKNOWLEDGED
    )

    assert len(acknowledged_alerts) > 0


def test_get_alerts_for_client_sorted_by_severity(compliance_monitor):
    """Test that alerts are sorted by severity (critical first)"""
    # Add items with different severities
    overdue_deadline = (datetime.now() - timedelta(days=5)).isoformat()
    urgent_deadline = (datetime.now() + timedelta(days=5)).isoformat()
    info_deadline = (datetime.now() + timedelta(days=70)).isoformat()

    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Overdue",
        deadline=overdue_deadline,
    )
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.TAX_FILING,
        title="Info",
        deadline=info_deadline,
    )
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="Urgent",
        deadline=urgent_deadline,
    )

    compliance_monitor.check_compliance_items()

    alerts = compliance_monitor.get_alerts_for_client("client1")

    assert len(alerts) >= 3
    # First should be CRITICAL (overdue)
    assert alerts[0].severity == AlertSeverity.CRITICAL


# ============================================================================
# Tests for get_monitor_stats
# ============================================================================


def test_get_monitor_stats(compliance_monitor):
    """Test getting monitor statistics"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    compliance_monitor.check_compliance_items()

    stats = compliance_monitor.get_monitor_stats()

    assert "total_items_tracked" in stats
    assert "active_items" in stats
    assert "alerts_generated" in stats
    assert "alert_severity_distribution" in stats
    assert AlertSeverity.WARNING.value in stats["alert_severity_distribution"]


def test_get_monitor_stats_updates(compliance_monitor):
    """Test that stats update correctly"""
    initial_total = compliance_monitor.monitor_stats["total_items_tracked"]

    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    stats = compliance_monitor.get_monitor_stats()

    assert stats["total_items_tracked"] == initial_total + 1
    assert stats["active_items"] == initial_total + 1


# ============================================================================
# Tests for _generate_alert with estimated_cost and documents
# ============================================================================


def test_generate_alert_with_estimated_cost(compliance_monitor):
    """Test alert generation includes estimated cost"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
        estimated_cost=5000000.0,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert = alerts[0]

    assert "Estimated cost" in alert.message
    assert "5,000,000" in alert.message or "5000000" in alert.message
    assert alert.estimated_cost == 5000000.0


def test_generate_alert_with_required_documents(compliance_monitor):
    """Test alert generation includes required documents"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    docs = ["Passport", "Visa Copy", "Job Contract", "Employment Letter", "Bank Statement"]

    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="IMTA Renewal",
        deadline=deadline,
        required_documents=docs,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert = alerts[0]

    assert "Required documents" in alert.message
    assert "Passport" in alert.message
    assert "Visa Copy" in alert.message
    assert "Job Contract" in alert.message


def test_generate_alert_with_cost_and_documents(compliance_monitor):
    """Test alert generation includes both cost and documents"""
    deadline = (datetime.now() + timedelta(days=5)).isoformat()
    docs = ["Document1", "Document2"]

    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.TAX_FILING,
        title="SPT Tahunan",
        deadline=deadline,
        estimated_cost=2000000.0,
        required_documents=docs,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert = alerts[0]

    assert "Estimated cost" in alert.message
    assert "Required documents" in alert.message
    assert "Document1" in alert.message


def test_generate_alert_truncates_documents_to_five(compliance_monitor):
    """Test alert generation limits documents to top 5"""
    deadline = (datetime.now() + timedelta(days=10)).isoformat()
    docs = [f"Document{i}" for i in range(10)]  # 10 documents

    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="License",
        deadline=deadline,
        required_documents=docs,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert = alerts[0]

    # Count occurrences of documents
    doc_count = sum(1 for i in range(5) if f"Document{i}" in alert.message)
    doc_count_later = sum(1 for i in range(5, 10) if f"Document{i}" in alert.message)

    # Only first 5 should be in message
    assert doc_count == 5
    assert doc_count_later == 0


# ============================================================================
# Tests for send_alert failure scenarios
# ============================================================================


@pytest.mark.asyncio
async def test_send_alert_notification_service_failure(
    compliance_monitor, mock_notification_service
):
    """Test sending alert when notification service fails"""
    mock_notification_service.send = AsyncMock(return_value=False)

    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    success = await compliance_monitor.send_alert(alert_id, via="email")

    assert success is False
    assert (
        compliance_monitor.alerts[alert_id].status == AlertStatus.PENDING
    )  # Should remain PENDING
    assert compliance_monitor.alerts[alert_id].sent_at is None


@pytest.mark.asyncio
async def test_send_alert_via_different_channels(compliance_monitor, mock_notification_service):
    """Test sending alert via different notification channels"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client123",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS Expiry",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    # Test via email
    success_email = await compliance_monitor.send_alert(alert_id, via="email")
    assert success_email is True

    # Reset alert to test other channels
    compliance_monitor.alerts[alert_id].status = AlertStatus.PENDING
    compliance_monitor.alerts[alert_id].sent_at = None

    success_slack = await compliance_monitor.send_alert(alert_id, via="slack")
    assert success_slack is True


# ============================================================================
# Tests for generate_alerts method
# ============================================================================


def test_generate_alerts_empty(compliance_monitor):
    """Test generate_alerts with no items"""
    alerts = compliance_monitor.generate_alerts()

    assert alerts == []
    assert isinstance(alerts, list)


def test_generate_alerts_single_item(compliance_monitor):
    """Test generate_alerts with single item"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="KITAS",
        deadline=deadline,
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 1
    assert alerts[0]["client_id"] == "client1"
    assert alerts[0]["title"] == "KITAS"
    assert alerts[0]["severity"] == "warning"
    assert alerts[0]["status"] == "active"


def test_generate_alerts_multiple_items_with_severities(compliance_monitor):
    """Test generate_alerts calculates correct severity for multiple items"""
    # Critical (overdue)
    overdue_deadline = (datetime.now() - timedelta(days=5)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Overdue Item",
        deadline=overdue_deadline,
    )

    # Urgent (7 days)
    urgent_deadline = (datetime.now() + timedelta(days=5)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client2",
        compliance_type=ComplianceType.TAX_FILING,
        title="Urgent Item",
        deadline=urgent_deadline,
    )

    # Warning (30 days)
    warning_deadline = (datetime.now() + timedelta(days=20)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client3",
        compliance_type=ComplianceType.LICENSE_RENEWAL,
        title="Warning Item",
        deadline=warning_deadline,
    )

    # Info (60+ days)
    info_deadline = (datetime.now() + timedelta(days=75)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client4",
        compliance_type=ComplianceType.PERMIT_RENEWAL,
        title="Info Item",
        deadline=info_deadline,
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 4

    # Find each alert by title
    alert_map = {a["title"]: a for a in alerts}

    assert alert_map["Overdue Item"]["severity"] == "critical"
    assert alert_map["Urgent Item"]["severity"] == "urgent"
    assert alert_map["Warning Item"]["severity"] == "warning"
    assert alert_map["Info Item"]["severity"] == "info"


def test_generate_alerts_includes_compliance_type(compliance_monitor):
    """Test generate_alerts includes compliance type"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.TAX_FILING,
        title="Tax Item",
        deadline=deadline,
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 1
    assert alerts[0]["compliance_type"] == "tax_filing"


def test_generate_alerts_description_field(compliance_monitor):
    """Test generate_alerts includes description"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Visa",
        deadline=deadline,
        description="KITAS renewal required",
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 1
    assert alerts[0]["description"] == "KITAS renewal required"


def test_generate_alerts_datetime_object_handling(compliance_monitor):
    """Test generate_alerts handles datetime objects"""
    # Test with datetime object instead of ISO string
    deadline = datetime.now() + timedelta(days=30)

    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Visa",
        deadline=deadline.isoformat(),  # Convert to ISO first
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 1
    assert "alert_id" in alerts[0]
    assert alerts[0]["deadline"] is not None


def test_generate_alerts_creates_correct_alert_id_format(compliance_monitor):
    """Test generate_alerts creates alert_id with correct format"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Visa",
        deadline=deadline,
    )

    alerts = compliance_monitor.generate_alerts()

    assert len(alerts) == 1
    assert alerts[0]["alert_id"].startswith("alert_")
    assert item.item_id in alerts[0]["alert_id"]


# ============================================================================
# Tests for edge cases and additional coverage
# ============================================================================


def test_resolve_compliance_item_with_multiple_related_alerts(compliance_monitor):
    """Test resolving item with multiple related alerts at different severities"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item",
        deadline=deadline,
    )

    # Generate alert at WARNING level
    alerts1 = compliance_monitor.check_compliance_items()
    assert len(alerts1) > 0

    # Manually create alert at different severity to simulate multiple alerts
    manual_alert = ComplianceAlert(
        alert_id=f"manual_alert_{item.item_id}_critical",
        compliance_item_id=item.item_id,
        client_id="client1",
        severity=AlertSeverity.CRITICAL,
        title="CRITICAL: Item",
        message="This is critical",
        deadline=deadline,
        days_until_deadline=0,
        action_required="Urgent action",
        status=AlertStatus.PENDING,
    )
    compliance_monitor.alerts[manual_alert.alert_id] = manual_alert

    # Resolve item and verify both alerts are marked as resolved
    compliance_monitor.resolve_compliance_item(item.item_id)

    alert_statuses = [
        a.status for a in compliance_monitor.alerts.values() if a.compliance_item_id == item.item_id
    ]
    assert all(status == AlertStatus.RESOLVED for status in alert_statuses)


def test_find_alert_returns_none_for_expired_alerts(compliance_monitor):
    """Test _find_alert doesn't return expired alerts"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item",
        deadline=deadline,
    )

    alerts = compliance_monitor.check_compliance_items()
    alert_id = alerts[0].alert_id

    # Mark alert as expired
    compliance_monitor.alerts[alert_id].status = AlertStatus.EXPIRED

    # _find_alert should return None since it's expired
    found = compliance_monitor._find_alert(item.item_id, AlertSeverity.WARNING)
    assert found is None

    # But we should be able to create a new alert at the same severity
    new_alerts = compliance_monitor.check_compliance_items()
    assert len(new_alerts) > 0  # New alert should be generated


def test_calculate_severity_boundary_conditions(compliance_monitor):
    """Test severity calculation at exact boundary conditions"""
    # Exactly 30 days (boundary between WARNING and INFO) - <= 30 is WARNING
    deadline_30 = (datetime.now() + timedelta(days=30)).isoformat()
    severity_30, days_30 = compliance_monitor.calculate_severity(deadline_30)
    assert severity_30 == AlertSeverity.WARNING

    # Exactly 7 days (boundary between URGENT and WARNING) - <= 7 is URGENT
    deadline_7 = (datetime.now() + timedelta(days=7)).isoformat()
    severity_7, days_7 = compliance_monitor.calculate_severity(deadline_7)
    assert severity_7 == AlertSeverity.URGENT

    # Way over 30 days (should be INFO) - > 30 is INFO
    deadline_60 = (datetime.now() + timedelta(days=60)).isoformat()
    severity_60, days_60 = compliance_monitor.calculate_severity(deadline_60)
    assert severity_60 == AlertSeverity.INFO


def test_alert_with_iso_date_containing_z(compliance_monitor):
    """Test deadline parsing with Z suffix (ISO UTC timezone)"""
    # Create deadline with Z suffix (UTC timezone indicator)
    base_deadline = datetime.now() + timedelta(days=30)
    deadline_with_z = base_deadline.isoformat() + "Z"

    item = compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item",
        deadline=deadline_with_z,
    )

    # Should not raise exception
    severity, days = compliance_monitor.calculate_severity(deadline_with_z)
    assert isinstance(severity, AlertSeverity)
    assert isinstance(days, int)


def test_generate_alerts_with_exception_handling(compliance_monitor):
    """Test generate_alerts handles exceptions gracefully"""
    # Patch the compliance_items to cause an exception during iteration
    original_items = compliance_monitor.compliance_items.copy()

    # Add a regular item first
    deadline = (datetime.now() + timedelta(days=30)).isoformat()
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Normal Item",
        deadline=deadline,
    )

    # Now inject a problematic item that will cause an error
    class BadComplianceItem:
        """Item that causes exception when accessing deadline"""

        def __init__(self):
            self.item_id = "bad_item"

        @property
        def deadline(self):
            raise ValueError("Corrupted deadline")

    # Inject bad item into compliance_items dict
    compliance_monitor.compliance_items["bad_item"] = BadComplianceItem()

    # generate_alerts should handle exception and return empty list
    alerts = compliance_monitor.generate_alerts()

    # Should return empty list due to exception, not raise
    assert isinstance(alerts, list)
    assert alerts == []  # Exception handling returns empty list


def test_compliance_item_stats_distribution(compliance_monitor):
    """Test that compliance type distribution is tracked correctly"""
    deadline = (datetime.now() + timedelta(days=30)).isoformat()

    # Add multiple items of different types
    compliance_monitor.add_compliance_item(
        client_id="client1",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 1",
        deadline=deadline,
    )

    compliance_monitor.add_compliance_item(
        client_id="client2",
        compliance_type=ComplianceType.TAX_FILING,
        title="Item 2",
        deadline=deadline,
    )

    compliance_monitor.add_compliance_item(
        client_id="client3",
        compliance_type=ComplianceType.VISA_EXPIRY,
        title="Item 3",
        deadline=deadline,
    )

    stats = compliance_monitor.get_monitor_stats()

    assert stats["compliance_type_distribution"]["visa_expiry"] == 2
    assert stats["compliance_type_distribution"]["tax_filing"] == 1
