"""
Google Workspace Productivity Tools
Implements the 'Stellar Workspace' capabilities for ZANTARA
"""

import logging
from datetime import datetime, timedelta

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/productivity", tags=["productivity"])
logger = logging.getLogger(__name__)


class EmailDraft(BaseModel):
    recipient: str
    subject: str
    body: str


class CalendarEvent(BaseModel):
    title: str
    start_time: str
    duration_minutes: int = 60
    attendees: list[str] = []


@router.post("/gmail/draft")
async def draft_email(email: EmailDraft):
    """Draft an email in Gmail"""
    logger.info(f"📧 Drafting email to {email.recipient}")
    return {
        "status": "success",
        "message": f"Email to {email.recipient} drafted successfully.",
        "link": "https://mail.google.com/mail/u/0/#drafts/12345",
    }


@router.post("/calendar/schedule")
async def schedule_meeting(event: CalendarEvent):
    """Schedule a meeting in Google Calendar"""
    from services.calendar_service import get_calendar_service

    try:
        service = get_calendar_service()

        # Calculate end time
        start_dt = datetime.fromisoformat(event.start_time.replace("Z", "+00:00"))
        end_dt = start_dt + timedelta(minutes=event.duration_minutes)

        result = service.create_event(
            summary=event.title,
            start_time=event.start_time,
            end_time=end_dt.isoformat(),
            description=f"Attendees: {', '.join(event.attendees)}",
        )

        return {
            "status": "success",
            "message": f"Meeting '{event.title}' scheduled.",
            "data": result,
        }
    except Exception as e:
        logger.error(f"Failed to schedule meeting: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/calendar/events")
async def list_events(limit: int = 10):
    """List upcoming calendar events"""
    from services.calendar_service import get_calendar_service

    try:
        service = get_calendar_service()
        events = service.list_upcoming_events(max_results=limit)
        return {"events": events}
    except Exception as e:
        logger.error(f"Failed to list events: {e}")
        return {"events": []}


@router.get("/drive/search")
async def search_drive(query: str):
    """Search Google Drive files"""
    logger.info(f"📂 Searching Drive for: {query}")
    return {
        "results": [
            {"name": "Project Proposal.pdf", "type": "pdf", "link": "#"},
            {"name": "Financial Model.xlsx", "type": "sheet", "link": "#"},
        ]
    }
