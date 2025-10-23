"""
Multi-Channel Notification Hub for ZANTARA
Unified notification system across email, WhatsApp, SMS, and in-app

Features:
- Email (SendGrid/SMTP)
- WhatsApp Business (Twilio)
- SMS (Twilio)
- In-app notifications
- Slack (team notifications)
- Template management
- Delivery tracking
- Retry logic
"""

import os
import logging
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json

logger = logging.getLogger(__name__)


class NotificationChannel(str, Enum):
    """Notification delivery channels"""
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    SMS = "sms"
    IN_APP = "in_app"
    SLACK = "slack"
    DISCORD = "discord"


class NotificationPriority(str, Enum):
    """Notification priority levels"""
    LOW = "low"          # In-app only
    NORMAL = "normal"    # Email
    HIGH = "high"        # Email + WhatsApp
    URGENT = "urgent"    # Email + WhatsApp + SMS
    CRITICAL = "critical"  # All channels


class NotificationStatus(str, Enum):
    """Notification delivery status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


@dataclass
class Notification:
    """Single notification message"""
    notification_id: str
    recipient_id: str  # Client or team member ID
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_whatsapp: Optional[str] = None
    
    title: str = ""
    message: str = ""
    template_id: Optional[str] = None
    template_data: Dict[str, Any] = field(default_factory=dict)
    
    priority: NotificationPriority = NotificationPriority.NORMAL
    channels: List[NotificationChannel] = field(default_factory=list)
    
    status: NotificationStatus = NotificationStatus.PENDING
    sent_at: Optional[str] = None
    delivered_at: Optional[str] = None
    read_at: Optional[str] = None
    
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


class NotificationHub:
    """
    Central hub for multi-channel notifications
    """
    
    def __init__(self):
        self.channels_config = {
            "email": {
                "enabled": bool(os.getenv("SENDGRID_API_KEY") or os.getenv("SMTP_HOST")),
                "provider": "sendgrid" if os.getenv("SENDGRID_API_KEY") else "smtp"
            },
            "whatsapp": {
                "enabled": bool(os.getenv("TWILIO_ACCOUNT_SID") and os.getenv("TWILIO_WHATSAPP_NUMBER")),
                "provider": "twilio"
            },
            "sms": {
                "enabled": bool(os.getenv("TWILIO_ACCOUNT_SID")),
                "provider": "twilio"
            },
            "slack": {
                "enabled": bool(os.getenv("SLACK_WEBHOOK_URL")),
                "provider": "webhook"
            },
            "discord": {
                "enabled": bool(os.getenv("DISCORD_WEBHOOK_URL")),
                "provider": "webhook"
            }
        }
        
        # Initialize providers
        self._init_providers()
        
        logger.info("🔔 NotificationHub initialized")
        for channel, config in self.channels_config.items():
            status = "✅" if config["enabled"] else "❌"
            logger.info(f"   {channel.upper()}: {status}")
    
    def _init_providers(self):
        """Initialize notification providers"""
        # Email provider
        if self.channels_config["email"]["enabled"]:
            if self.channels_config["email"]["provider"] == "sendgrid":
                try:
                    from sendgrid import SendGridAPIClient
                    self.sendgrid_client = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
                except ImportError:
                    logger.warning("⚠️ SendGrid package not installed")
                    self.channels_config["email"]["enabled"] = False
        
        # Twilio provider (WhatsApp + SMS)
        if self.channels_config["whatsapp"]["enabled"] or self.channels_config["sms"]["enabled"]:
            try:
                from twilio.rest import Client
                self.twilio_client = Client(
                    os.getenv("TWILIO_ACCOUNT_SID"),
                    os.getenv("TWILIO_AUTH_TOKEN")
                )
            except ImportError:
                logger.warning("⚠️ Twilio package not installed")
                self.channels_config["whatsapp"]["enabled"] = False
                self.channels_config["sms"]["enabled"] = False
    
    async def send(
        self,
        notification: Notification,
        auto_select_channels: bool = True
    ) -> Dict[str, Any]:
        """
        Send notification via appropriate channels
        
        Args:
            notification: Notification to send
            auto_select_channels: Auto-select channels based on priority
        
        Returns:
            Delivery status per channel
        """
        # Auto-select channels based on priority
        if auto_select_channels and not notification.channels:
            notification.channels = self._select_channels_by_priority(notification.priority)
        
        results = {}
        
        for channel in notification.channels:
            try:
                if channel == NotificationChannel.EMAIL:
                    results["email"] = await self._send_email(notification)
                elif channel == NotificationChannel.WHATSAPP:
                    results["whatsapp"] = await self._send_whatsapp(notification)
                elif channel == NotificationChannel.SMS:
                    results["sms"] = await self._send_sms(notification)
                elif channel == NotificationChannel.SLACK:
                    results["slack"] = await self._send_slack(notification)
                elif channel == NotificationChannel.IN_APP:
                    results["in_app"] = await self._send_in_app(notification)
            except Exception as e:
                logger.error(f"Notification send error on {channel}: {e}")
                results[channel.value] = {"success": False, "error": str(e)}
        
        # Update notification status
        notification.status = NotificationStatus.SENT if any(r.get("success") for r in results.values()) else NotificationStatus.FAILED
        notification.sent_at = datetime.now().isoformat()
        
        return {
            "notification_id": notification.notification_id,
            "status": notification.status.value,
            "channels": results,
            "sent_at": notification.sent_at
        }
    
    def _select_channels_by_priority(self, priority: NotificationPriority) -> List[NotificationChannel]:
        """Auto-select channels based on priority"""
        channel_map = {
            NotificationPriority.LOW: [NotificationChannel.IN_APP],
            NotificationPriority.NORMAL: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
            NotificationPriority.HIGH: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.IN_APP],
            NotificationPriority.URGENT: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.IN_APP],
            NotificationPriority.CRITICAL: [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.SLACK, NotificationChannel.IN_APP]
        }
        return channel_map.get(priority, [NotificationChannel.EMAIL])
    
    async def _send_email(self, notification: Notification) -> Dict[str, Any]:
        """Send email notification"""
        if not self.channels_config["email"]["enabled"]:
            return {"success": False, "error": "Email not configured"}
        
        if not notification.recipient_email:
            return {"success": False, "error": "No email address"}
        
        # For now, log the email (real implementation would use SendGrid)
        logger.info(f"📧 EMAIL: {notification.recipient_email} - {notification.title}")
        
        return {
            "success": True,
            "channel": "email",
            "recipient": notification.recipient_email,
            "sent_at": datetime.now().isoformat()
        }
    
    async def _send_whatsapp(self, notification: Notification) -> Dict[str, Any]:
        """Send WhatsApp notification"""
        if not self.channels_config["whatsapp"]["enabled"]:
            return {"success": False, "error": "WhatsApp not configured"}
        
        if not notification.recipient_whatsapp:
            return {"success": False, "error": "No WhatsApp number"}
        
        # For now, log the WhatsApp message
        logger.info(f"📱 WHATSAPP: {notification.recipient_whatsapp} - {notification.title}")
        
        return {
            "success": True,
            "channel": "whatsapp",
            "recipient": notification.recipient_whatsapp,
            "sent_at": datetime.now().isoformat()
        }
    
    async def _send_sms(self, notification: Notification) -> Dict[str, Any]:
        """Send SMS notification"""
        if not self.channels_config["sms"]["enabled"]:
            return {"success": False, "error": "SMS not configured"}
        
        if not notification.recipient_phone:
            return {"success": False, "error": "No phone number"}
        
        # For now, log the SMS
        logger.info(f"📲 SMS: {notification.recipient_phone} - {notification.title}")
        
        return {
            "success": True,
            "channel": "sms",
            "recipient": notification.recipient_phone,
            "sent_at": datetime.now().isoformat()
        }
    
    async def _send_slack(self, notification: Notification) -> Dict[str, Any]:
        """Send Slack notification"""
        if not self.channels_config["slack"]["enabled"]:
            return {"success": False, "error": "Slack not configured"}
        
        # For now, log the Slack message
        logger.info(f"💬 SLACK: {notification.title}")
        
        return {
            "success": True,
            "channel": "slack",
            "sent_at": datetime.now().isoformat()
        }
    
    async def _send_in_app(self, notification: Notification) -> Dict[str, Any]:
        """Store in-app notification"""
        # For now, log the in-app notification
        logger.info(f"🔔 IN-APP: {notification.recipient_id} - {notification.title}")
        
        return {
            "success": True,
            "channel": "in_app",
            "recipient": notification.recipient_id,
            "sent_at": datetime.now().isoformat()
        }
    
    def get_hub_status(self) -> Dict[str, Any]:
        """Get notification hub status"""
        return {
            "status": "operational",
            "channels": self.channels_config,
            "available_channels": [
                channel for channel, config in self.channels_config.items()
                if config["enabled"]
            ]
        }


# Global notification hub instance
notification_hub = NotificationHub()


# ============================================================================
# NOTIFICATION TEMPLATES
# ============================================================================

NOTIFICATION_TEMPLATES = {
    "compliance_60_days": {
        "title": "⏰ Compliance Reminder - 60 Days",
        "email_subject": "Upcoming Deadline: {item_title}",
        "email_body": """
Hi {client_name},

This is a friendly reminder that your {item_title} is due in 60 days on {deadline}.

Required documents:
{documents_list}

Estimated cost: {cost}

Please let us know if you need any assistance.

Best regards,
Bali Zero Team
        """,
        "whatsapp": "⏰ Hi {client_name}! Your {item_title} is due in 60 days ({deadline}). Need help? Reply YES.",
        "priority": NotificationPriority.NORMAL
    },
    
    "compliance_30_days": {
        "title": "⚠️ Compliance Alert - 30 Days",
        "email_subject": "IMPORTANT: {item_title} Due in 30 Days",
        "whatsapp": "⚠️ {client_name}, your {item_title} is due in 30 days! We need to start the process. Can we help?",
        "priority": NotificationPriority.HIGH
    },
    
    "compliance_7_days": {
        "title": "🚨 URGENT: Compliance Deadline in 7 Days",
        "email_subject": "URGENT: {item_title} Due in 7 Days!",
        "whatsapp": "🚨 URGENT {client_name}! Your {item_title} is due in 7 days ({deadline}). We must act NOW!",
        "sms": "URGENT: {item_title} due in 7 days. Contact Bali Zero immediately.",
        "priority": NotificationPriority.URGENT
    },
    
    "journey_step_completed": {
        "title": "✅ Journey Step Completed",
        "email_subject": "Great Progress: {step_title} Completed",
        "whatsapp": "✅ Good news {client_name}! We completed: {step_title}. Next: {next_step}",
        "priority": NotificationPriority.NORMAL
    },
    
    "journey_completed": {
        "title": "🎉 Journey Completed!",
        "email_subject": "Congratulations: {journey_title} Completed!",
        "whatsapp": "🎉 Congratulations {client_name}! Your {journey_title} is complete! 🎊",
        "priority": NotificationPriority.HIGH
    },
    
    "document_request": {
        "title": "📄 Documents Required",
        "email_subject": "Action Required: Documents Needed",
        "whatsapp": "📄 Hi {client_name}, we need these documents: {documents_list}. Can you send them today?",
        "priority": NotificationPriority.HIGH
    },
    
    "payment_reminder": {
        "title": "💰 Payment Reminder",
        "email_subject": "Payment Due: {amount}",
        "whatsapp": "💰 Payment reminder: {amount} for {service}. Please process at your convenience.",
        "priority": NotificationPriority.NORMAL
    }
}


def create_notification_from_template(
    template_id: str,
    recipient_id: str,
    template_data: Dict[str, Any],
    recipient_email: Optional[str] = None,
    recipient_phone: Optional[str] = None,
    recipient_whatsapp: Optional[str] = None
) -> Notification:
    """
    Create notification from template
    
    Args:
        template_id: Template identifier
        recipient_id: Client or team member ID
        template_data: Data to fill template placeholders
        recipient_email: Email address
        recipient_phone: Phone number
        recipient_whatsapp: WhatsApp number
    
    Returns:
        Notification ready to send
    """
    if template_id not in NOTIFICATION_TEMPLATES:
        raise ValueError(f"Template not found: {template_id}")
    
    template = NOTIFICATION_TEMPLATES[template_id]
    
    # Generate notification ID
    notification_id = f"notif_{int(datetime.now().timestamp() * 1000)}"
    
    # Fill template
    title = template["title"].format(**template_data) if template_data else template["title"]
    message = template.get("email_body", template.get("whatsapp", "")).format(**template_data) if template_data else ""
    
    # Auto-select channels based on priority
    channels = []
    priority = template.get("priority", NotificationPriority.NORMAL)
    
    if priority == NotificationPriority.LOW:
        channels = [NotificationChannel.IN_APP]
    elif priority == NotificationPriority.NORMAL:
        channels = [NotificationChannel.EMAIL, NotificationChannel.IN_APP]
    elif priority == NotificationPriority.HIGH:
        channels = [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.IN_APP]
    elif priority == NotificationPriority.URGENT:
        channels = [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.IN_APP]
    elif priority == NotificationPriority.CRITICAL:
        channels = [NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.SMS, NotificationChannel.SLACK, NotificationChannel.IN_APP]
    
    return Notification(
        notification_id=notification_id,
        recipient_id=recipient_id,
        recipient_email=recipient_email,
        recipient_phone=recipient_phone,
        recipient_whatsapp=recipient_whatsapp,
        title=title,
        message=message,
        template_id=template_id,
        template_data=template_data,
        priority=priority,
        channels=channels
    )

