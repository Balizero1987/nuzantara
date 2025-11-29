"""
Google Calendar Service for ZANTARA
Handles event listing and scheduling using Google API.
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/calendar"]


class CalendarService:
    """
    Service to interact with Google Calendar API.
    """

    def __init__(self):
        self.creds = None
        self.service = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google API"""
        try:
            if os.path.exists("token.json"):
                self.creds = Credentials.from_authorized_user_file("token.json", SCOPES)

            if not self.creds or not self.creds.valid:
                if self.creds and self.creds.expired and self.creds.refresh_token:
                    self.creds.refresh(Request())
                elif os.path.exists("credentials.json"):
                    # Skipping interactive flow in headless env
                    logger.warning(
                        "⚠️ credentials.json found but interactive login required. Skipping real auth."
                    )
                else:
                    logger.warning(
                        "⚠️ No Calendar credentials found. Service will run in MOCK mode."
                    )

            if self.creds:
                self.service = build("calendar", "v3", credentials=self.creds)
                logger.info("✅ Calendar Service initialized (Authenticated)")
            else:
                logger.info("⚠️ Calendar Service initialized (MOCK MODE)")

        except Exception as e:
            logger.error(f"❌ Calendar authentication failed: {e}")

    def list_upcoming_events(self, max_results: int = 10) -> list[dict[str, Any]]:
        """List upcoming events"""
        if not self.service:
            # Mock behavior
            now = datetime.now()
            return [
                {
                    "id": "mock_evt_1",
                    "summary": "Client Meeting: Mario Rossi",
                    "start": {"dateTime": (now + timedelta(days=1)).isoformat()},
                    "end": {"dateTime": (now + timedelta(days=1, hours=1)).isoformat()},
                    "location": "Zantara Office / Google Meet",
                },
                {
                    "id": "mock_evt_2",
                    "summary": "Team Sync: Weekly Update",
                    "start": {"dateTime": (now + timedelta(days=2)).isoformat()},
                    "end": {"dateTime": (now + timedelta(days=2, hours=1)).isoformat()},
                    "location": "Google Meet",
                },
            ]

        try:
            now = datetime.utcnow().isoformat() + "Z"  # 'Z' indicates UTC time
            events_result = (
                self.service.events()
                .list(
                    calendarId="primary",
                    timeMin=now,
                    maxResults=max_results,
                    singleEvents=True,
                    orderBy="startTime",
                )
                .execute()
            )
            events = events_result.get("items", [])
            return events
        except Exception as e:
            logger.error(f"❌ Failed to list events: {e}")
            return []

    def create_event(
        self, summary: str, start_time: str, end_time: str, description: str = ""
    ) -> dict[str, Any]:
        """Create a new event"""
        if not self.service:
            logger.info(f"📅 [MOCK] Event created: {summary} at {start_time}")
            return {"id": "mock_new_evt", "summary": summary, "status": "confirmed"}

        try:
            event = {
                "summary": summary,
                "description": description,
                "start": {
                    "dateTime": start_time,
                    "timeZone": "Asia/Makassar",
                },
                "end": {
                    "dateTime": end_time,
                    "timeZone": "Asia/Makassar",
                },
            }

            event = self.service.events().insert(calendarId="primary", body=event).execute()
            logger.info(f"✅ Event created: {event.get('htmlLink')}")
            return event
        except Exception as e:
            logger.error(f"❌ Failed to create event: {e}")
            return {}


# Singleton
_calendar_service = None


def get_calendar_service():
    global _calendar_service
    if not _calendar_service:
        _calendar_service = CalendarService()
    return _calendar_service
