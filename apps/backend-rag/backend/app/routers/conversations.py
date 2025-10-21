"""
ZANTARA Conversations Router
Endpoints for persistent conversation history with PostgreSQL
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bali-zero/conversations", tags=["conversations"])


# Pydantic models
class SaveConversationRequest(BaseModel):
    user_email: str
    messages: List[Dict]  # [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    session_id: Optional[str] = None
    metadata: Optional[Dict] = None


class ConversationHistoryResponse(BaseModel):
    success: bool
    messages: List[Dict] = []
    total_messages: int = 0
    error: Optional[str] = None


# Database connection helper
def get_db_connection():
    """Get PostgreSQL connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")

    # Parse Railway's DATABASE_URL format
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


@router.post("/save")
async def save_conversation(request: SaveConversationRequest):
    """
    Save conversation messages to PostgreSQL

    Body:
    {
        "user_email": "user@example.com",
        "messages": [{"role": "user", "content": "..."}, ...],
        "session_id": "optional-session-id",
        "metadata": {"key": "value"}
    }
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert conversation
        cursor.execute("""
            INSERT INTO conversations (user_id, session_id, messages, metadata, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            request.user_email,
            request.session_id or f"session-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            Json(request.messages),
            Json(request.metadata or {}),
            datetime.now()
        ))

        conversation_id = cursor.fetchone()['id']
        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Saved conversation for {request.user_email} (ID: {conversation_id}, {len(request.messages)} messages)")

        return {
            "success": True,
            "conversation_id": conversation_id,
            "messages_saved": len(request.messages)
        }

    except Exception as e:
        logger.error(f"❌ Failed to save conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_conversation_history(
    user_email: str,
    limit: int = 20,
    session_id: Optional[str] = None
) -> ConversationHistoryResponse:
    """
    Get conversation history for a user

    Query params:
    - user_email: User's email address
    - limit: Max number of messages to return (default: 20)
    - session_id: Optional session filter
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get most recent conversation for user
        if session_id:
            cursor.execute("""
                SELECT messages, created_at
                FROM conversations
                WHERE user_id = %s AND session_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_email, session_id))
        else:
            cursor.execute("""
                SELECT messages, created_at
                FROM conversations
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_email,))

        result = cursor.fetchone()

        cursor.close()
        conn.close()

        if not result:
            return ConversationHistoryResponse(
                success=True,
                messages=[],
                total_messages=0
            )

        messages = result['messages']

        # Limit messages if needed
        if len(messages) > limit:
            messages = messages[-limit:]

        logger.info(f"✅ Retrieved {len(messages)} messages for {user_email}")

        return ConversationHistoryResponse(
            success=True,
            messages=messages,
            total_messages=len(messages)
        )

    except Exception as e:
        logger.error(f"❌ Failed to retrieve conversation history: {e}")
        return ConversationHistoryResponse(
            success=False,
            messages=[],
            total_messages=0,
            error=str(e)
        )


@router.delete("/clear")
async def clear_conversation_history(user_email: str, session_id: Optional[str] = None):
    """
    Clear conversation history for a user

    Query params:
    - user_email: User's email address
    - session_id: Optional session filter (if omitted, clears ALL conversations for user)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if session_id:
            cursor.execute("""
                DELETE FROM conversations
                WHERE user_id = %s AND session_id = %s
            """, (user_email, session_id))
        else:
            cursor.execute("""
                DELETE FROM conversations
                WHERE user_id = %s
            """, (user_email,))

        deleted_count = cursor.rowcount
        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Cleared {deleted_count} conversations for {user_email}")

        return {
            "success": True,
            "deleted_count": deleted_count
        }

    except Exception as e:
        logger.error(f"❌ Failed to clear conversation history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_conversation_stats(user_email: str):
    """
    Get conversation statistics for a user

    Query params:
    - user_email: User's email address
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COUNT(*) as total_conversations,
                SUM(jsonb_array_length(messages)) as total_messages,
                MAX(created_at) as last_conversation
            FROM conversations
            WHERE user_id = %s
        """, (user_email,))

        stats = cursor.fetchone()

        cursor.close()
        conn.close()

        return {
            "success": True,
            "user_email": user_email,
            "total_conversations": stats['total_conversations'] or 0,
            "total_messages": stats['total_messages'] or 0,
            "last_conversation": stats['last_conversation'].isoformat() if stats['last_conversation'] else None
        }

    except Exception as e:
        logger.error(f"❌ Failed to get conversation stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
