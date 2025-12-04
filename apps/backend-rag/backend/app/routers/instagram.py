"""
Instagram Business API Router
Handles webhook verification and incoming messages from Meta
"""

import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.dependencies import get_intelligent_router
from services.intelligent_router import IntelligentRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook/instagram", tags=["instagram"])


# ============================================================================
# PYDANTIC MODELS FOR WEBHOOK PAYLOAD
# ============================================================================


class InstagramMessage(BaseModel):
    mid: str
    text: str
    sender_id: str = Field(..., alias="sender")
    recipient_id: str = Field(..., alias="recipient")
    timestamp: int


class InstagramMessaging(BaseModel):
    sender: dict[str, str]
    recipient: dict[str, str]
    timestamp: int
    message: dict[str, Any] | None = None


class InstagramEntry(BaseModel):
    id: str
    time: int
    messaging: list[InstagramMessaging] | None = None


class InstagramWebhookPayload(BaseModel):
    object: str
    entry: list[InstagramEntry]


# ============================================================================
# WEBHOOK VERIFICATION (GET)
# ============================================================================


@router.get("")
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge"),
):
    """
    Meta Webhook Verification Endpoint
    """
    if mode == "subscribe" and token == settings.instagram_verify_token:
        logger.info("✅ Instagram Webhook verified successfully")
        return int(challenge)

    logger.warning(f"❌ Instagram Webhook verification failed. Token: {token}")
    raise HTTPException(status_code=403, detail="Verification failed")


# ============================================================================
# MESSAGE HANDLING (POST)
# ============================================================================


@router.post("")
async def handle_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    intelligent_router: IntelligentRouter = Depends(get_intelligent_router),
):
    """
    Handle incoming Instagram messages
    """
    try:
        payload = await request.json()
        logger.info(f"📩 Received Instagram payload: {json.dumps(payload)}")

        # Check if it's a valid message
        if (
            payload.get("object") == "instagram"
            and payload.get("entry")
            and payload["entry"][0].get("messaging")
        ):
            messaging_event = payload["entry"][0]["messaging"][0]

            # Check if it is a text message
            if messaging_event.get("message") and "text" in messaging_event["message"]:
                sender_id = messaging_event["sender"]["id"]
                message_text = messaging_event["message"]["text"]

                logger.info(f"📸 Instagram Message from {sender_id}: {message_text}")

                # Process in background to avoid timeout
                background_tasks.add_task(
                    process_instagram_message, sender_id, message_text, intelligent_router
                )

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"❌ Error handling Instagram webhook: {e}")
        # Always return 200 to Meta to prevent retries
        return {"status": "error", "message": str(e)}


async def process_instagram_message(user_id: str, message: str, router: IntelligentRouter):
    """
    Process message via IntelligentRouter and send response
    """
    try:
        # Use IntelligentRouter to get response
        # Note: We use user_id (IG User ID) as the session ID
        response_chunks = []
        async for chunk in router.stream_chat(
            message=message,
            user_id=f"instagram_{user_id}",
            conversation_history=[],  # TODO: Load history
            memory=None,  # TODO: Load memory
            collaborator=None,
        ):
            if not chunk.startswith("[METADATA]"):
                response_chunks.append(chunk)

        full_response = "".join(response_chunks)

        # Send response back to Instagram
        await send_instagram_message(user_id, full_response)

    except Exception as e:
        logger.error(f"❌ Error processing Instagram message: {e}")


async def send_instagram_message(recipient_id: str, message_text: str):
    """
    Send message via Meta Graph API for Instagram
    """
    if not settings.instagram_access_token:
        logger.error("❌ Instagram configuration missing (Access Token)")
        return

    # API Version v17.0 or higher
    url = "https://graph.facebook.com/v17.0/me/messages"
    headers = {
        "Authorization": f"Bearer {settings.instagram_access_token}",
        "Content-Type": "application/json",
    }
    data = {
        "recipient": {"id": recipient_id},
        "message": {"text": message_text},
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            logger.info(f"✅ Instagram response sent to {recipient_id}")
        except Exception as e:
            logger.error(f"❌ Failed to send Instagram message: {e}")
