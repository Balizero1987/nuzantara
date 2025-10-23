"""
Multi-Channel Notification Router
REST API for ZANTARA notification system
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import logging

from services.notification_hub import (
    notification_hub,
    create_notification_from_template,
    Notification,
    NotificationChannel,
    NotificationPriority,
    NOTIFICATION_TEMPLATES
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class SendNotificationRequest(BaseModel):
    recipient_id: str
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_whatsapp: Optional[str] = None
    
    title: str
    message: str
    priority: str = "normal"
    channels: Optional[List[str]] = None


class TemplateNotificationRequest(BaseModel):
    template_id: str = Field(..., description="Template ID (e.g., compliance_60_days)")
    recipient_id: str
    recipient_email: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_whatsapp: Optional[str] = None
    template_data: Dict[str, Any] = Field(default_factory=dict, description="Data to fill template")


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/status")
async def get_notification_status():
    """
    Get notification hub status and available channels
    """
    return {
        "success": True,
        "hub": notification_hub.get_hub_status(),
        "templates_available": len(NOTIFICATION_TEMPLATES),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/templates")
async def list_notification_templates():
    """
    List all available notification templates
    """
    return {
        "success": True,
        "templates": {
            template_id: {
                "title": template["title"],
                "priority": template.get("priority", "normal"),
                "channels": ["email", "whatsapp", "sms"] if "urgent" in template_id or "critical" in template_id else ["email"]
            }
            for template_id, template in NOTIFICATION_TEMPLATES.items()
        },
        "total": len(NOTIFICATION_TEMPLATES)
    }


@router.post("/send")
async def send_notification(request: SendNotificationRequest):
    """
    Send a custom notification
    
    Auto-selects channels based on priority:
    - low: In-app only
    - normal: Email + In-app
    - high: Email + WhatsApp + In-app
    - urgent: Email + WhatsApp + SMS + In-app
    - critical: All channels
    """
    try:
        # Create notification
        notification = Notification(
            notification_id=f"notif_{int(datetime.now().timestamp() * 1000)}",
            recipient_id=request.recipient_id,
            recipient_email=request.recipient_email,
            recipient_phone=request.recipient_phone,
            recipient_whatsapp=request.recipient_whatsapp,
            title=request.title,
            message=request.message,
            priority=NotificationPriority(request.priority),
            channels=[NotificationChannel(ch) for ch in request.channels] if request.channels else []
        )
        
        # Send notification
        result = await notification_hub.send(notification, auto_select_channels=not request.channels)
        
        return {
            "success": True,
            **result
        }
    
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/send-template")
async def send_template_notification(request: TemplateNotificationRequest):
    """
    Send notification using a predefined template
    
    Available templates:
    - compliance_60_days: 60-day compliance reminder
    - compliance_30_days: 30-day compliance alert
    - compliance_7_days: 7-day urgent compliance alert
    - journey_step_completed: Journey step completion
    - journey_completed: Journey completion celebration
    - document_request: Document request
    - payment_reminder: Payment reminder
    """
    try:
        # Create notification from template
        notification = create_notification_from_template(
            template_id=request.template_id,
            recipient_id=request.recipient_id,
            template_data=request.template_data,
            recipient_email=request.recipient_email,
            recipient_phone=request.recipient_phone,
            recipient_whatsapp=request.recipient_whatsapp
        )
        
        # Send notification
        result = await notification_hub.send(notification)
        
        return {
            "success": True,
            "template_id": request.template_id,
            **result
        }
    
    except Exception as e:
        logger.error(f"Send template notification error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test")
async def test_notification_channels(
    email: Optional[str] = None,
    phone: Optional[str] = None,
    whatsapp: Optional[str] = None
):
    """
    Test notification channels with a test message
    
    Useful for verifying configuration
    """
    test_notification = Notification(
        notification_id=f"test_{int(datetime.now().timestamp())}",
        recipient_id="test_user",
        recipient_email=email,
        recipient_phone=phone,
        recipient_whatsapp=whatsapp,
        title="🧪 Test Notification from ZANTARA",
        message="This is a test notification to verify channel configuration.",
        priority=NotificationPriority.NORMAL,
        channels=[NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.SMS]
    )
    
    result = await notification_hub.send(test_notification)
    
    return {
        "success": True,
        "test": "notification_channels",
        **result
    }

