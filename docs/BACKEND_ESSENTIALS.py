# ZANTARA BACKEND ESSENTIALS
# This file contains the core logic and API definitions for the Zantara Backend.
# Use this context to build the Frontend in Vercel/React.

# ==============================================================================
# 1. API ROUTES (FastAPI)
# ==============================================================================

# --- MAIN APP ENTRY POINT (app/main_cloud.py) ---
"""
The main FastAPI application that aggregates all routers.
Base URL: http://localhost:8000 (or production URL)
"""
# (See routers below for specific endpoints)

# --- CHAT & STREAMING (services/intelligent_router.py) ---
"""
Core Chat Logic.
Endpoint: POST /chat_stream
Input: { "message": "...", "user_id": "...", "session_id": "..." }
Output: Streaming text response.
SPECIAL FEATURE: The stream now starts with a metadata block:
[METADATA]{"memory_used": true, "rag_sources": [...], "intent": "..."}[METADATA]
The frontend MUST parse and hide this block, using it to show a context widget.
"""

# --- CRM INTERACTIONS (app/routers/crm_interactions.py) ---
"""
Manages interactions (Chat, Email, Meetings).
"""
# POST /api/crm/interactions/sync-gmail
# Triggers Gmail sync. Returns list of processed emails.

# --- PRODUCTIVITY (app/routers/productivity.py) ---
"""
Google Workspace Integration.
"""
# POST /api/productivity/calendar/schedule
# Input: { "title": "...", "start_time": "ISO8601", "duration_minutes": 60, "attendees": [] }
# Output: { "status": "success", "data": { ... } }

# GET /api/productivity/calendar/events
# Output: { "events": [ ... ] }

# --- MEDIA GENERATION (app/routers/media.py) ---
"""
Image Generation.
"""
# POST /media/generate-image
# Input: { "prompt": "..." }
# Output: { "url": "..." }

# ==============================================================================
# 2. CORE SERVICES (Python Logic)
# ==============================================================================


# --- GMAIL SERVICE (services/gmail_service.py) ---
class GmailService:
    def list_messages(self, query="is:unread", max_results=5):
        # Returns list of message summaries
        pass

    def get_message_details(self, message_id):
        # Returns {subject, sender, body, date, snippet}
        pass


# --- CALENDAR SERVICE (services/calendar_service.py) ---
class CalendarService:
    def list_upcoming_events(self, max_results=10):
        # Returns list of events
        pass

    def create_event(self, summary, start_time, end_time, description=""):
        # Creates event in Google Calendar
        pass


# --- AUTO CRM SERVICE (services/auto_crm_service.py) ---
class AutoCRMService:
    async def process_email_interaction(self, email_data, team_member="system"):
        # Extracts intent from email and creates/updates CRM Client
        pass


# ==============================================================================
# 3. DATA MODELS (Pydantic)
# ==============================================================================

# InteractionCreate (CRM)
# {
#   "client_id": int,
#   "interaction_type": "chat" | "email" | "meeting",
#   "channel": "web_chat" | "gmail" | "whatsapp",
#   "subject": str,
#   "summary": str,
#   "direction": "inbound" | "outbound"
# }

# CalendarEvent (Productivity)
# {
#   "title": str,
#   "start_time": str (ISO format),
#   "duration_minutes": int,
#   "attendees": list[str]
# }
