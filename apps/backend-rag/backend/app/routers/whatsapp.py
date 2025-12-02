"""
WhatsApp Business API Router
Handles webhook verification and incoming messages from Meta
"""

import json
import logging
from typing import Any, Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.core.config import settings
from app.dependencies import get_intelligent_router
from services.intelligent_router import IntelligentRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhook/whatsapp", tags=["whatsapp"])


# ============================================================================
# PYDANTIC MODELS FOR WEBHOOK PAYLOAD
# ============================================================================


class WhatsAppText(BaseModel):
    body: str


class WhatsAppMessage(BaseModel):
    from_: str = Field(..., alias="from")
    id: str
    timestamp: str
    text: Optional[WhatsAppText] = None
    type: str


class WhatsAppValue(BaseModel):
    messaging_product: str
    metadata: dict[str, Any]
    contacts: Optional[list[dict[str, Any]]] = None
    messages: Optional[list[WhatsAppMessage]] = None


class WhatsAppChange(BaseModel):
    value: WhatsAppValue
    field: str


class WhatsAppEntry(BaseModel):
    id: str
    changes: list[WhatsAppChange]


class WhatsAppWebhookPayload(BaseModel):
    object: str
    entry: list[WhatsAppEntry]


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
    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        logger.info("✅ WhatsApp Webhook verified successfully")
        return int(challenge)

    logger.warning(f"❌ WhatsApp Webhook verification failed. Token: {token}")
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
    Handle incoming WhatsApp messages
    """
    try:
        payload = await request.json()
        logger.info(f"📩 Received WhatsApp payload: {json.dumps(payload)}")

        # Check if it's a valid message
        if (
            payload.get("object") == "whatsapp_business_account"
            and payload.get("entry")
            and payload["entry"][0].get("changes")
            and payload["entry"][0]["changes"][0].get("value")
            and payload["entry"][0]["changes"][0]["value"].get("messages")
        ):
            message_data = payload["entry"][0]["changes"][0]["value"]["messages"][0]
            from_number = message_data["from"]
            message_type = message_data["type"]

            # Only handle text messages for now
            if message_type == "text":
                message_body = message_data["text"]["body"]
                logger.info(f"💬 WhatsApp Message from {from_number}: {message_body}")

                # Process in background to avoid timeout
                background_tasks.add_task(
                    process_whatsapp_message, from_number, message_body, intelligent_router
                )

        return {"status": "ok"}

    except Exception as e:
        logger.error(f"❌ Error handling WhatsApp webhook: {e}")
        # Always return 200 to Meta to prevent retries
        return {"status": "error", "message": str(e)}


async def process_whatsapp_message(user_id: str, message: str, router: IntelligentRouter):
    """
    Process message via IntelligentRouter and send response
    """
    try:
        # Use IntelligentRouter to get response
        # Note: We use user_id (phone number) as the session ID
        response_chunks = []
        async for chunk in router.stream_chat(
            message=message,
            user_id=f"whatsapp_{user_id}",
            conversation_history=[],  # TODO: Load history
            memory=None,  # TODO: Load memory
            collaborator=None,
        ):
            if not chunk.startswith("[METADATA]"):
                response_chunks.append(chunk)

        full_response = "".join(response_chunks)

        # Send response back to WhatsApp
        await send_whatsapp_message(user_id, full_response)

    except Exception as e:
        logger.error(f"❌ Error processing WhatsApp message: {e}")


async def send_whatsapp_message(to_number: str, message_text: str):
    """
    Send message via Meta Graph API
    """
    if not settings.whatsapp_access_token or not settings.whatsapp_phone_number_id:
        logger.error("❌ WhatsApp configuration missing (Access Token or Phone ID)")
        return

    url = f"https://graph.facebook.com/v17.0/{settings.whatsapp_phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {settings.whatsapp_access_token}",
        "Content-Type": "application/json",
    }
    data = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message_text},
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=data)
            response.raise_for_status()
            logger.info(f"✅ WhatsApp response sent to {to_number}")
        except Exception as e:
            logger.error(f"❌ Failed to send WhatsApp message: {e}")
