"""
ZANTARA CRM - Interactions Tracking Router
Endpoints for logging and retrieving team-client interactions
"""

import json
import logging
from datetime import datetime

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..dependencies import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/interactions", tags=["crm-interactions"])


# ================================================
# PYDANTIC MODELS
# ================================================


class InteractionCreate(BaseModel):
    client_id: int | None = None
    practice_id: int | None = None
    conversation_id: int | None = None
    interaction_type: str  # 'chat', 'email', 'whatsapp', 'call', 'meeting', 'note'
    channel: str | None = None  # 'web_chat', 'gmail', 'whatsapp', 'phone', 'in_person'
    subject: str | None = None
    summary: str | None = None  # AI-generated or manual
    full_content: str | None = None
    sentiment: str | None = None  # 'positive', 'neutral', 'negative', 'urgent'
    team_member: str  # who handled this
    direction: str = "inbound"  # 'inbound' or 'outbound'
    duration_minutes: int | None = None
    extracted_entities: dict = {}
    action_items: list[dict] = []


class InteractionResponse(BaseModel):
    id: int
    client_id: int | None
    practice_id: int | None
    interaction_type: str
    channel: str | None
    subject: str | None
    summary: str | None
    team_member: str
    direction: str
    sentiment: str | None
    interaction_date: datetime
    created_at: datetime


# ================================================
# ENDPOINTS
# ================================================


@router.post("/", response_model=InteractionResponse)
async def create_interaction(
    interaction: InteractionCreate,
    db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Log a new interaction

    **Types:**
    - chat: Web chat conversation
    - email: Email exchange
    - whatsapp: WhatsApp message
    - call: Phone call
    - meeting: In-person or video meeting
    - note: Internal note/comment

    **Channels:**
    - web_chat: ZANTARA chat widget
    - gmail: Gmail integration
    - whatsapp: WhatsApp Business
    - phone: Phone call
    - in_person: Face-to-face meeting
    """

    try:
        async with db.acquire() as conn:
            # Insert interaction
            new_interaction = await conn.fetchrow(
                """
                INSERT INTO interactions (
                    client_id, practice_id, conversation_id, interaction_type, channel,
                    subject, summary, full_content, sentiment, team_member, direction,
                    duration_minutes, extracted_entities, action_items, interaction_date
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                )
                RETURNING *
            """,
                interaction.client_id,
                interaction.practice_id,
                interaction.conversation_id,
                interaction.interaction_type,
                interaction.channel,
                interaction.subject,
                interaction.summary,
                interaction.full_content,
                interaction.sentiment,
                interaction.team_member,
                interaction.direction,
                interaction.duration_minutes,
                json.dumps(interaction.extracted_entities),
                json.dumps(interaction.action_items),
                datetime.now(),
            )

            # Update client's last_interaction_date if client_id provided
            if interaction.client_id:
                await conn.execute(
                    """
                    UPDATE clients
                    SET last_interaction_date = NOW()
                    WHERE id = $1
                """,
                    interaction.client_id,
                )

            logger.info(
                f"✅ Logged {interaction.interaction_type} interaction by {interaction.team_member}"
            )

            return InteractionResponse(**dict(new_interaction))

    except Exception as e:
        logger.error(f"❌ Failed to create interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/", response_model=list[dict])
async def list_interactions(
    client_id: int | None = Query(None, description="Filter by client"),
    practice_id: int | None = Query(None, description="Filter by practice"),
    team_member: str | None = Query(None, description="Filter by team member"),
    interaction_type: str | None = Query(None, description="Filter by type"),
    sentiment: str | None = Query(None, description="Filter by sentiment"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    List interactions with optional filtering
    """

    try:
        async with db.acquire() as conn:
            query = "SELECT * FROM interactions WHERE 1=1"
            params = []

            if client_id:
                params.append(client_id)
                query += f" AND client_id = ${len(params)}"

            if practice_id:
                params.append(practice_id)
                query += f" AND practice_id = ${len(params)}"

            if team_member:
                params.append(team_member)
                query += f" AND team_member = ${len(params)}"

            if interaction_type:
                params.append(interaction_type)
                query += f" AND interaction_type = ${len(params)}"

            if sentiment:
                params.append(sentiment)
                query += f" AND sentiment = ${len(params)}"

            params.extend([limit, offset])
            query += f" ORDER BY interaction_date DESC LIMIT ${len(params) - 1} OFFSET ${len(params)}"

            interactions = await conn.fetch(query, *params)

            return [dict(i) for i in interactions]

    except Exception as e:
        logger.error(f"❌ Failed to list interactions: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{interaction_id}")
async def get_interaction(
    interaction_id: int,
    db: asyncpg.Pool = Depends(get_db_pool)
):
    """Get full interaction details by ID"""

    try:
        async with db.acquire() as conn:
            interaction = await conn.fetchrow(
                """
                SELECT
                    i.*,
                    c.full_name as client_name,
                    c.email as client_email
                FROM interactions i
                LEFT JOIN clients c ON i.client_id = c.id
                WHERE i.id = $1
            """,
                interaction_id,
            )

            if not interaction:
                raise HTTPException(status_code=404, detail="Interaction not found")

            return dict(interaction)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/client/{client_id}/timeline")
async def get_client_timeline(
    client_id: int,
    limit: int = Query(50, le=200),
    db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get complete interaction timeline for a client

    Returns all interactions sorted by date (newest first)
    """

    try:
        async with db.acquire() as conn:
            timeline = await conn.fetch(
                """
                SELECT
                    i.*,
                    p.id as practice_id,
                    pt.name as practice_type_name,
                    pt.code as practice_type_code
                FROM interactions i
                LEFT JOIN practices p ON i.practice_id = p.id
                LEFT JOIN practice_types pt ON p.practice_type_id = pt.id
                WHERE i.client_id = $1
                ORDER BY i.interaction_date DESC
                LIMIT $2
            """,
                client_id,
                limit,
            )

            return {
                "client_id": client_id,
                "total_interactions": len(timeline),
                "timeline": [dict(t) for t in timeline],
            }

    except Exception as e:
        logger.error(f"❌ Failed to get client timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/practice/{practice_id}/history")
async def get_practice_history(
    practice_id: int,
    db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get all interactions related to a specific practice

    Useful for tracking communication history for a KITAS, PT PMA, etc.
    """

    try:
        async with db.acquire() as conn:
            history = await conn.fetch(
                """
                SELECT * FROM interactions
                WHERE practice_id = $1
                ORDER BY interaction_date DESC
            """,
                practice_id,
            )

            return {
                "practice_id": practice_id,
                "total_interactions": len(history),
                "history": [dict(h) for h in history],
            }

    except Exception as e:
        logger.error(f"❌ Failed to get practice history: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/stats/overview")
async def get_interactions_stats(
    team_member: str | None = Query(None, description="Stats for specific team member"),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get interaction statistics

    - Total interactions
    - By type (chat, email, call, etc.)
    - By sentiment
    - By team member
    """

    try:
        async with db.acquire() as conn:
            # Base query with parameterized filters
            params = []
            base_conditions = []

            if team_member:
                params.append(team_member)
                base_conditions.append(f"team_member = ${len(params)}")

            where_clause = "WHERE " + " AND ".join(base_conditions) if base_conditions else ""

            # By type
            type_query = f"""
                SELECT interaction_type, COUNT(*) as count
                FROM interactions
                {where_clause}
                GROUP BY interaction_type
            """
            by_type = await conn.fetch(type_query, *params)

            # By sentiment
            sentiment_query = f"""
                SELECT sentiment, COUNT(*) as count
                FROM interactions
                {where_clause}
                {"AND" if where_clause else "WHERE"} sentiment IS NOT NULL
                GROUP BY sentiment
            """
            by_sentiment = await conn.fetch(sentiment_query, *params)

            # By team member (if not filtered)
            if not team_member:
                by_team_member = await conn.fetch(
                    """
                    SELECT team_member, COUNT(*) as count
                    FROM interactions
                    GROUP BY team_member
                    ORDER BY count DESC
                """
                )
            else:
                by_team_member = []

            # Recent activity (last 7 days)
            params_recent = list(params)
            recent_query = f"""
                SELECT COUNT(*) as count
                FROM interactions
                {where_clause}
                {"AND" if where_clause else "WHERE"} interaction_date >= NOW() - INTERVAL '7 days'
            """
            recent_result = await conn.fetchrow(recent_query, *params_recent)
            recent_count = recent_result["count"]

            return {
                "total_interactions": sum(row["count"] for row in by_type),
                "last_7_days": recent_count,
                "by_type": {row["interaction_type"]: row["count"] for row in by_type},
                "by_sentiment": {row["sentiment"]: row["count"] for row in by_sentiment},
                "by_team_member": [dict(row) for row in by_team_member] if not team_member else [],
            }

    except Exception as e:
        logger.error(f"❌ Failed to get interaction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/from-conversation")
async def create_interaction_from_conversation(
    conversation_id: int = Query(...),
    client_email: str = Query(...),
    team_member: str = Query(...),
    summary: str | None = Query(None, description="AI-generated summary"),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Auto-create interaction record from a chat conversation

    This is called automatically when a chat session ends or at intervals
    """

    try:
        async with db.acquire() as conn:
            # Get or create client by email
            client = await conn.fetchrow(
                "SELECT id FROM clients WHERE email = $1",
                client_email
            )

            was_new_client = False
            if not client:
                # Create new client (prospect)
                client = await conn.fetchrow(
                    """
                    INSERT INTO clients (full_name, email, status, first_contact_date, created_by)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                """,
                    client_email.split("@")[0],  # Use email prefix as temp name
                    client_email,
                    "prospect",
                    datetime.now(),
                    team_member,
                )
                was_new_client = True
                logger.info(f"✅ Auto-created prospect client: {client_email}")

            client_id = client["id"]

            # Get conversation from conversations table
            conv = await conn.fetchrow(
                """
                SELECT messages FROM conversations WHERE id = $1
            """,
                conversation_id,
            )

            full_content = ""
            if conv and conv["messages"]:
                # Format messages into readable text
                messages = conv["messages"]
                full_content = "\n\n".join(
                    [
                        f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
                        for msg in messages
                    ]
                )

            # Auto-generate summary if not provided (take first user message)
            if not summary and conv and conv["messages"]:
                first_user_msg = next((m for m in conv["messages"] if m.get("role") == "user"), None)
                if first_user_msg:
                    summary = first_user_msg.get("content", "")[:200]  # First 200 chars

            # Create interaction
            new_interaction = await conn.fetchrow(
                """
                INSERT INTO interactions (
                    client_id, conversation_id, interaction_type, channel,
                    summary, full_content, team_member, direction, interaction_date
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9
                )
                RETURNING *
            """,
                client_id,
                conversation_id,
                "chat",
                "web_chat",
                summary,
                full_content,
                team_member,
                "inbound",
                datetime.now(),
            )

            # Update client last interaction
            await conn.execute(
                """
                UPDATE clients
                SET last_interaction_date = NOW()
                WHERE id = $1
            """,
                client_id,
            )

            logger.info(
                f"✅ Created interaction from conversation {conversation_id} for client {client_id}"
            )

            return {
                "success": True,
                "interaction_id": new_interaction["id"],
                "client_id": client_id,
                "was_new_client": was_new_client,
            }

    except Exception as e:
        logger.error(f"❌ Failed to create interaction from conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/sync-gmail")
async def sync_gmail_interactions(
    limit: int = Query(5, description="Max emails to process"),
    team_member: str = Query("system", description="Team member handling sync"),
):
    """
    Manually trigger Gmail sync to Auto-CRM
    """
    from services.auto_crm_service import get_auto_crm_service
    from services.gmail_service import get_gmail_service

    try:
        gmail = get_gmail_service()
        auto_crm = get_auto_crm_service()

        # 1. List unread messages
        messages = gmail.list_messages(query="is:unread", max_results=limit)

        results = []

        # 2. Process each message
        for msg_summary in messages:
            msg_id = msg_summary["id"]

            # Get full details
            details = gmail.get_message_details(msg_id)
            if not details:
                continue

            # Process with AutoCRM
            result = await auto_crm.process_email_interaction(
                email_data=details, team_member=team_member
            )

            results.append(
                {"message_id": msg_id, "subject": details.get("subject"), "crm_result": result}
            )

            # Mark as read (optional, maybe later)
            # gmail.mark_as_read(msg_id)

        return {"success": True, "processed_count": len(results), "results": results}

    except Exception as e:
        logger.error(f"❌ Gmail sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
