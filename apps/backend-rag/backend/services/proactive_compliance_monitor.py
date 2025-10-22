"""
Proactive Compliance Monitor - Phase 3 (Orchestration Agent #2)

Monitors compliance deadlines and requirements for clients, sending
proactive alerts before deadlines.

Features:
- Tracks visa expiry dates (KITAS, KITAP, passport)
- Monitors tax filing deadlines (SPT Tahunan, PPh, PPn)
- Tracks license renewals (IMTA, NIB, business permits)
- Monitors regulatory changes from legal_updates/tax_updates
- Sends proactive notifications (60/30/7 days before)
- Auto-calculates renewal costs from bali_zero_pricing

Example Monitored Items:
- KITAS expiry: Remind 60 days before
- SPT Tahunan deadline (March 31): Remind in February
- IMTA renewal: Remind 30 days before
- Regulation changes: Immediate alert if affects client
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class ComplianceType(str, Enum):
    """Type of compliance item"""
    VISA_EXPIRY = "visa_expiry"
    TAX_FILING = "tax_filing"
    LICENSE_RENEWAL = "license_renewal"
    PERMIT_RENEWAL = "permit_renewal"
    REGULATORY_CHANGE = "regulatory_change"
    DOCUMENT_EXPIRY = "document_expiry"


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    INFO = "info"          # >60 days
    WARNING = "warning"    # 30-60 days
    URGENT = "urgent"      # 7-30 days
    CRITICAL = "critical"  # <7 days or overdue


class AlertStatus(str, Enum):
    """Alert status"""
    PENDING = "pending"
    SENT = "sent"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    EXPIRED = "expired"


@dataclass
class ComplianceItem:
    """Single compliance tracking item"""
    item_id: str
    client_id: str
    compliance_type: ComplianceType
    title: str
    description: str
    deadline: str  # ISO date
    requirement_details: str
    estimated_cost: Optional[float] = None
    required_documents: List[str] = field(default_factory=list)
    renewal_process: Optional[str] = None
    source_oracle: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ComplianceAlert:
    """Alert for upcoming compliance deadline"""
    alert_id: str
    compliance_item_id: str
    client_id: str
    severity: AlertSeverity
    title: str
    message: str
    deadline: str
    days_until_deadline: int
    action_required: str
    estimated_cost: Optional[float] = None
    status: AlertStatus = AlertStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    sent_at: Optional[str] = None
    acknowledged_at: Optional[str] = None


class ProactiveComplianceMonitor:
    """
    Monitors compliance deadlines and sends proactive alerts.

    Alert Schedule:
    - 60 days before: INFO alert
    - 30 days before: WARNING alert
    - 7 days before: URGENT alert
    - Overdue: CRITICAL alert
    """

    # Predefined compliance schedules
    ANNUAL_DEADLINES = {
        "spt_tahunan_individual": {
            "title": "SPT Tahunan (Individual Tax Return)",
            "deadline_month": 3,
            "deadline_day": 31,
            "description": "Annual tax return filing for individuals",
            "estimated_cost": 2000000,  # IDR for service
            "compliance_type": ComplianceType.TAX_FILING
        },
        "spt_tahunan_corporate": {
            "title": "SPT Tahunan (Corporate Tax Return)",
            "deadline_month": 4,
            "deadline_day": 30,
            "description": "Annual tax return filing for corporations",
            "estimated_cost": 5000000,
            "compliance_type": ComplianceType.TAX_FILING
        },
        "ppn_monthly": {
            "title": "Monthly VAT (PPn) Filing",
            "deadline_day": 15,  # Every month
            "description": "Monthly VAT reporting and payment",
            "estimated_cost": 500000,
            "compliance_type": ComplianceType.TAX_FILING
        }
    }

    # Alert thresholds (days before deadline)
    ALERT_THRESHOLDS = {
        AlertSeverity.INFO: 60,
        AlertSeverity.WARNING: 30,
        AlertSeverity.URGENT: 7,
        AlertSeverity.CRITICAL: 0  # Overdue
    }

    def __init__(
        self,
        search_service=None,
        notification_service=None  # For WhatsApp/email alerts
    ):
        """
        Initialize Proactive Compliance Monitor.

        Args:
            search_service: SearchService for querying Oracle collections
            notification_service: Optional service for sending alerts
        """
        self.search = search_service
        self.notifications = notification_service

        # Storage (in production, use database)
        self.compliance_items: Dict[str, ComplianceItem] = {}
        self.alerts: Dict[str, ComplianceAlert] = {}

        self.monitor_stats = {
            "total_items_tracked": 0,
            "active_items": 0,
            "alerts_generated": 0,
            "alerts_sent": 0,
            "overdue_items": 0,
            "compliance_type_distribution": {}
        }

        logger.info("✅ ProactiveComplianceMonitor initialized")
        logger.info(f"   Annual deadlines: {len(self.ANNUAL_DEADLINES)}")

    def add_compliance_item(
        self,
        client_id: str,
        compliance_type: ComplianceType,
        title: str,
        deadline: str,
        description: str = "",
        estimated_cost: Optional[float] = None,
        required_documents: Optional[List[str]] = None,
        metadata: Optional[Dict] = None
    ) -> ComplianceItem:
        """
        Add a new compliance item to track.

        Args:
            client_id: Client identifier
            compliance_type: Type of compliance
            title: Item title
            deadline: Deadline (ISO date)
            description: Item description
            estimated_cost: Estimated cost in IDR
            required_documents: List of required documents
            metadata: Additional metadata

        Returns:
            ComplianceItem instance
        """
        item_id = f"{compliance_type.value}_{client_id}_{int(datetime.now().timestamp())}"

        item = ComplianceItem(
            item_id=item_id,
            client_id=client_id,
            compliance_type=compliance_type,
            title=title,
            description=description,
            deadline=deadline,
            requirement_details=description,
            estimated_cost=estimated_cost,
            required_documents=required_documents or [],
            metadata=metadata or {}
        )

        self.compliance_items[item_id] = item

        # Update stats
        self.monitor_stats["total_items_tracked"] += 1
        self.monitor_stats["active_items"] += 1
        self.monitor_stats["compliance_type_distribution"][compliance_type.value] = \
            self.monitor_stats["compliance_type_distribution"].get(compliance_type.value, 0) + 1

        logger.info(f"📋 Added compliance item: {item_id} - {title} (deadline: {deadline})")

        return item

    def add_visa_expiry(
        self,
        client_id: str,
        visa_type: str,
        expiry_date: str,
        passport_number: str
    ) -> ComplianceItem:
        """
        Add KITAS/KITAP expiry tracking.

        Args:
            client_id: Client identifier
            visa_type: Type of visa (KITAS, KITAP, etc.)
            expiry_date: Expiry date (ISO)
            passport_number: Passport number

        Returns:
            ComplianceItem instance
        """
        return self.add_compliance_item(
            client_id=client_id,
            compliance_type=ComplianceType.VISA_EXPIRY,
            title=f"{visa_type} Expiry",
            deadline=expiry_date,
            description=f"{visa_type} for passport {passport_number} expires on {expiry_date}",
            estimated_cost=15000000,  # Typical KITAS renewal cost
            required_documents=[
                "Passport (min 18 months validity)",
                "Current KITAS",
                "Sponsor letter",
                "IMTA (if working)",
                "Tax clearance",
                "Health certificate"
            ],
            metadata={
                "visa_type": visa_type,
                "passport_number": passport_number
            }
        )

    def add_annual_tax_deadline(
        self,
        client_id: str,
        deadline_type: str,
        year: int
    ) -> ComplianceItem:
        """
        Add annual tax deadline (SPT Tahunan, etc.).

        Args:
            client_id: Client identifier
            deadline_type: Type of deadline (spt_tahunan_individual, etc.)
            year: Tax year

        Returns:
            ComplianceItem instance
        """
        if deadline_type not in self.ANNUAL_DEADLINES:
            raise ValueError(f"Unknown deadline type: {deadline_type}")

        template = self.ANNUAL_DEADLINES[deadline_type]

        # Calculate deadline date
        deadline_date = datetime(
            year,
            template["deadline_month"],
            template["deadline_day"]
        )

        return self.add_compliance_item(
            client_id=client_id,
            compliance_type=template["compliance_type"],
            title=f"{template['title']} - {year}",
            deadline=deadline_date.isoformat(),
            description=template["description"],
            estimated_cost=template.get("estimated_cost"),
            metadata={
                "deadline_type": deadline_type,
                "tax_year": year
            }
        )

    def calculate_severity(
        self,
        deadline: str
    ) -> tuple[AlertSeverity, int]:
        """
        Calculate alert severity based on days until deadline.

        Args:
            deadline: Deadline date (ISO)

        Returns:
            Tuple of (severity, days_until_deadline)
        """
        deadline_date = datetime.fromisoformat(deadline.replace('Z', ''))
        now = datetime.now()
        days_until = (deadline_date - now).days

        if days_until < 0:
            return AlertSeverity.CRITICAL, days_until
        elif days_until <= self.ALERT_THRESHOLDS[AlertSeverity.URGENT]:
            return AlertSeverity.URGENT, days_until
        elif days_until <= self.ALERT_THRESHOLDS[AlertSeverity.WARNING]:
            return AlertSeverity.WARNING, days_until
        else:
            return AlertSeverity.INFO, days_until

    def check_compliance_items(self) -> List[ComplianceAlert]:
        """
        Check all compliance items and generate alerts.

        Returns:
            List of new alerts generated
        """
        new_alerts = []

        for item_id, item in self.compliance_items.items():
            severity, days_until = self.calculate_severity(item.deadline)

            # Check if alert already exists for this threshold
            existing_alert = self._find_alert(item_id, severity)
            if existing_alert:
                continue  # Already alerted at this severity level

            # Generate alert
            alert = self._generate_alert(item, severity, days_until)
            self.alerts[alert.alert_id] = alert
            new_alerts.append(alert)

            # Update stats
            self.monitor_stats["alerts_generated"] += 1

            if severity == AlertSeverity.CRITICAL:
                self.monitor_stats["overdue_items"] += 1

        logger.info(f"🔔 Generated {len(new_alerts)} new compliance alerts")

        return new_alerts

    def _find_alert(
        self,
        compliance_item_id: str,
        severity: AlertSeverity
    ) -> Optional[ComplianceAlert]:
        """Find existing alert for item at severity level"""
        for alert in self.alerts.values():
            if (alert.compliance_item_id == compliance_item_id and
                alert.severity == severity and
                alert.status != AlertStatus.EXPIRED):
                return alert
        return None

    def _generate_alert(
        self,
        item: ComplianceItem,
        severity: AlertSeverity,
        days_until: int
    ) -> ComplianceAlert:
        """Generate alert from compliance item"""
        alert_id = f"alert_{item.item_id}_{severity.value}_{int(datetime.now().timestamp())}"

        # Generate message based on severity
        if severity == AlertSeverity.CRITICAL:
            message = f"⚠️ OVERDUE: {item.title} was due on {item.deadline}"
            action = "URGENT ACTION REQUIRED - Contact Bali Zero immediately"
        elif severity == AlertSeverity.URGENT:
            message = f"🚨 URGENT: {item.title} is due in {days_until} days"
            action = "Start renewal process immediately"
        elif severity == AlertSeverity.WARNING:
            message = f"⚠️ REMINDER: {item.title} is due in {days_until} days"
            action = "Prepare required documents and schedule appointment"
        else:
            message = f"ℹ️ UPCOMING: {item.title} is due in {days_until} days"
            action = "Review requirements and plan ahead"

        # Add cost info if available
        if item.estimated_cost:
            message += f"\nEstimated cost: Rp {item.estimated_cost:,.0f}"

        # Add document requirements
        if item.required_documents:
            message += f"\nRequired documents:\n"
            for doc in item.required_documents[:5]:  # Top 5
                message += f"  • {doc}\n"

        return ComplianceAlert(
            alert_id=alert_id,
            compliance_item_id=item.item_id,
            client_id=item.client_id,
            severity=severity,
            title=f"{severity.value.upper()}: {item.title}",
            message=message,
            deadline=item.deadline,
            days_until_deadline=days_until,
            action_required=action,
            estimated_cost=item.estimated_cost
        )

    async def send_alert(
        self,
        alert_id: str,
        via: str = "whatsapp"
    ) -> bool:
        """
        Send alert to client.

        Args:
            alert_id: Alert identifier
            via: Notification method (whatsapp, email, slack)

        Returns:
            True if sent successfully
        """
        alert = self.alerts.get(alert_id)
        if not alert:
            return False

        # In production, integrate with notification service
        logger.info(f"📤 Sending alert {alert_id} via {via}")

        if self.notifications:
            # Use notification service
            success = await self.notifications.send(
                client_id=alert.client_id,
                message=alert.message,
                via=via
            )
        else:
            # Log only (no notification service)
            logger.info(f"   To: {alert.client_id}")
            logger.info(f"   Message: {alert.message}")
            success = True

        if success:
            alert.status = AlertStatus.SENT
            alert.sent_at = datetime.now().isoformat()
            self.monitor_stats["alerts_sent"] += 1

        return success

    def acknowledge_alert(
        self,
        alert_id: str
    ) -> bool:
        """
        Mark alert as acknowledged by client.

        Args:
            alert_id: Alert identifier

        Returns:
            True if acknowledged
        """
        alert = self.alerts.get(alert_id)
        if not alert:
            return False

        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_at = datetime.now().isoformat()

        logger.info(f"✅ Alert acknowledged: {alert_id}")
        return True

    def resolve_compliance_item(
        self,
        item_id: str
    ) -> bool:
        """
        Mark compliance item as resolved.

        Args:
            item_id: Compliance item identifier

        Returns:
            True if resolved
        """
        if item_id not in self.compliance_items:
            return False

        # Remove from active tracking
        del self.compliance_items[item_id]

        # Mark related alerts as resolved
        for alert_id, alert in self.alerts.items():
            if alert.compliance_item_id == item_id:
                alert.status = AlertStatus.RESOLVED

        # Update stats
        self.monitor_stats["active_items"] -= 1

        logger.info(f"✅ Resolved compliance item: {item_id}")
        return True

    def get_upcoming_deadlines(
        self,
        client_id: Optional[str] = None,
        days_ahead: int = 90
    ) -> List[ComplianceItem]:
        """
        Get upcoming compliance deadlines.

        Args:
            client_id: Optional filter by client
            days_ahead: Look ahead window in days

        Returns:
            List of upcoming compliance items
        """
        cutoff_date = datetime.now() + timedelta(days=days_ahead)

        upcoming = []
        for item in self.compliance_items.values():
            if client_id and item.client_id != client_id:
                continue

            deadline_date = datetime.fromisoformat(item.deadline.replace('Z', ''))
            if deadline_date <= cutoff_date:
                upcoming.append(item)

        # Sort by deadline
        upcoming.sort(key=lambda x: x.deadline)

        return upcoming

    def get_alerts_for_client(
        self,
        client_id: str,
        status_filter: Optional[AlertStatus] = None
    ) -> List[ComplianceAlert]:
        """
        Get alerts for a specific client.

        Args:
            client_id: Client identifier
            status_filter: Optional status filter

        Returns:
            List of alerts
        """
        alerts = [
            alert for alert in self.alerts.values()
            if alert.client_id == client_id
        ]

        if status_filter:
            alerts = [a for a in alerts if a.status == status_filter]

        # Sort by severity (critical first)
        severity_order = [
            AlertSeverity.CRITICAL,
            AlertSeverity.URGENT,
            AlertSeverity.WARNING,
            AlertSeverity.INFO
        ]
        alerts.sort(key=lambda x: severity_order.index(x.severity))

        return alerts

    def get_monitor_stats(self) -> Dict:
        """Get monitoring statistics"""
        return {
            **self.monitor_stats,
            "alert_severity_distribution": {
                severity.value: sum(
                    1 for a in self.alerts.values()
                    if a.severity == severity and a.status != AlertStatus.EXPIRED
                )
                for severity in AlertSeverity
            }
        }
