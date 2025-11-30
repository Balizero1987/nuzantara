"""
ZANTARA Conversations Router
Endpoints for persistent conversation history with PostgreSQL
+ Auto-CRM population from conversations
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

import asyncpg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..dependencies import get_db_pool

# Add parent directory to path for services
sys.path.append(str(Path(__file__).parent.parent.parent))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bali-zero/conversations", tags=["conversations"])

# Import auto-CRM service (lazy import to avoid circular dependencies)
_auto_crm_service = None


def get_auto_crm():
    """Lazy import of auto-CRM service"""
    global _auto_crm_service
    if _auto_crm_service is None:
        try:
            from services.auto_crm_service import get_auto_crm_service

            _auto_crm_service = get_auto_crm_service()
            logger.info("✅ Auto-CRM service loaded")
        except Exception as e:
            logger.warning(f"⚠️  Auto-CRM service not available: {e}")
            _auto_crm_service = False  # Mark as unavailable
    return _auto_crm_service if _auto_crm_service else None


# Pydantic models
class SaveConversationRequest(BaseModel):
    user_email: str
    messages: list[
        dict
    ]  # [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    session_id: str | None = None
    metadata: dict | None = None


class ConversationHistoryResponse(BaseModel):
    success: bool
    messages: list[dict] = []
    total_messages: int = 0
    error: str | None = None




@router.post("/save")
async def save_conversation(
    request: SaveConversationRequest, db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Save conversation messages to PostgreSQL
    + Auto-populate CRM with client/practice data

    Body:
    {
        "user_email": "user@example.com",
        "messages": [{"role": "user", "content": "..."}, ...],
        "session_id": "optional-session-id",
        "metadata": {"key": "value"}
    }

    Returns:
    {
        "success": true,
        "conversation_id": 123,
        "messages_saved": 10,
        "crm": {
            "processed": true,
            "client_id": 42,
            "client_created": false,
            "client_updated": true,
            "practice_id": 15,
            "practice_created": true,
            "interaction_id": 88
        }
    }
    """
    try:
        async with db.acquire() as conn:
            # Insert conversation
            row = await conn.fetchrow(
                """
                INSERT INTO conversations (user_id, session_id, messages, metadata, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            """,
                request.user_email,
                request.session_id
                or f"session-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                request.messages,
                request.metadata or {},
                datetime.now(),
            )

            conversation_id = row["id"]

        logger.info(
            f"✅ Saved conversation for {request.user_email} (ID: {conversation_id}, {len(request.messages)} messages)"
        )

        # Auto-populate CRM (don't fail if this fails)
        crm_result = {}
        auto_crm = get_auto_crm()

        if auto_crm and len(request.messages) > 0:
            try:
                logger.info(
                    f"🧠 Processing conversation {conversation_id} for CRM auto-population..."
                )

                crm_result = await auto_crm.process_conversation(
                    conversation_id=conversation_id,
                    messages=request.messages,
                    user_email=request.user_email,
                    team_member=request.metadata.get("team_member", "system")
                    if request.metadata
                    else "system",
                )

                if crm_result.get("success"):
                    logger.info(
                        f"✅ Auto-CRM: client_id={crm_result.get('client_id')}, practice_id={crm_result.get('practice_id')}"
                    )
                else:
                    logger.warning(f"⚠️  Auto-CRM failed: {crm_result.get('error')}")

            except Exception as crm_error:
                logger.error(f"❌ Auto-CRM processing error: {crm_error}")
                crm_result = {"processed": False, "error": str(crm_error)}
        else:
            crm_result = {"processed": False, "reason": "auto-crm not available"}

        return {
            "success": True,
            "conversation_id": conversation_id,
            "messages_saved": len(request.messages),
            "crm": crm_result,
        }

    except Exception as e:
        logger.error(f"❌ Failed to save conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/history")
async def get_conversation_history(
    user_email: str,
    limit: int = 20,
    session_id: str | None = None,
    db: asyncpg.Pool = Depends(get_db_pool),
) -> ConversationHistoryResponse:
    """
    Get conversation history for a user

    Query params:
    - user_email: User's email address
    - limit: Max number of messages to return (default: 20)
    - session_id: Optional session filter
    """
    try:
        async with db.acquire() as conn:
            # Get most recent conversation for user
            if session_id:
                result = await conn.fetchrow(
                    """
                    SELECT messages, created_at
                    FROM conversations
                    WHERE user_id = $1 AND session_id = $2
                    ORDER BY created_at DESC
                    LIMIT 1
                """,
                    user_email,
                    session_id,
                )
            else:
                result = await conn.fetchrow(
                    """
                    SELECT messages, created_at
                    FROM conversations
                    WHERE user_id = $1
                    ORDER BY created_at DESC
                    LIMIT 1
                """,
                    user_email,
                )

        if not result:
            return ConversationHistoryResponse(success=True, messages=[], total_messages=0)

        messages = result["messages"]

        # Limit messages if needed
        if len(messages) > limit:
            messages = messages[-limit:]

        logger.info(f"✅ Retrieved {len(messages)} messages for {user_email}")

        return ConversationHistoryResponse(
            success=True, messages=messages, total_messages=len(messages)
        )

    except Exception as e:
        logger.error(f"❌ Failed to retrieve conversation history: {e}")
        return ConversationHistoryResponse(
            success=False, messages=[], total_messages=0, error=str(e)
        )


@router.delete("/clear")
async def clear_conversation_history(
    user_email: str, session_id: str | None = None, db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Clear conversation history for a user

    Query params:
    - user_email: User's email address
    - session_id: Optional session filter (if omitted, clears ALL conversations for user)
    """
    try:
        async with db.acquire() as conn:
            if session_id:
                result = await conn.execute(
                    """
                    DELETE FROM conversations
                    WHERE user_id = $1 AND session_id = $2
                """,
                    user_email,
                    session_id,
                )
            else:
                result = await conn.execute(
                    """
                    DELETE FROM conversations
                    WHERE user_id = $1
                """,
                    user_email,
                )

            # asyncpg execute returns a string like "DELETE 5"
            deleted_count = int(result.split()[-1]) if result.split()[-1].isdigit() else 0

        logger.info(f"✅ Cleared {deleted_count} conversations for {user_email}")

        return {"success": True, "deleted_count": deleted_count}

    except Exception as e:
        logger.error(f"❌ Failed to clear conversation history: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/stats")
async def get_conversation_stats(user_email: str, db: asyncpg.Pool = Depends(get_db_pool)):
    """
    Get conversation statistics for a user

    Query params:
    - user_email: User's email address
    """
    try:
        async with db.acquire() as conn:
            stats = await conn.fetchrow(
                """
                SELECT
                    COUNT(*) as total_conversations,
                    SUM(jsonb_array_length(messages)) as total_messages,
                    MAX(created_at) as last_conversation
                FROM conversations
                WHERE user_id = $1
            """,
                user_email,
            )

        return {
            "success": True,
            "user_email": user_email,
            "total_conversations": stats["total_conversations"] or 0,
            "total_messages": stats["total_messages"] or 0,
            "last_conversation": stats["last_conversation"].isoformat()
            if stats["last_conversation"]
            else None,
        }

    except Exception as e:
        logger.error(f"❌ Failed to get conversation stats: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
