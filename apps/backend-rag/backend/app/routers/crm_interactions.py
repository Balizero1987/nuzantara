"""
ZANTARA CRM - Interactions Tracking Router
Endpoints for logging and retrieving team-client interactions
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import logging
import os
import psycopg2
from psycopg2.extras import RealDictCursor, Json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crm/interactions", tags=["crm-interactions"])


# ================================================
# PYDANTIC MODELS
# ================================================

class InteractionCreate(BaseModel):
    client_id: Optional[int] = None
    practice_id: Optional[int] = None
    conversation_id: Optional[int] = None
    interaction_type: str  # 'chat', 'email', 'whatsapp', 'call', 'meeting', 'note'
    channel: Optional[str] = None  # 'web_chat', 'gmail', 'whatsapp', 'phone', 'in_person'
    subject: Optional[str] = None
    summary: Optional[str] = None  # AI-generated or manual
    full_content: Optional[str] = None
    sentiment: Optional[str] = None  # 'positive', 'neutral', 'negative', 'urgent'
    team_member: str  # who handled this
    direction: str = "inbound"  # 'inbound' or 'outbound'
    duration_minutes: Optional[int] = None
    extracted_entities: Dict = {}
    action_items: List[Dict] = []


class InteractionResponse(BaseModel):
    id: int
    client_id: Optional[int]
    practice_id: Optional[int]
    interaction_type: str
    channel: Optional[str]
    subject: Optional[str]
    summary: Optional[str]
    team_member: str
    direction: str
    sentiment: Optional[str]
    interaction_date: datetime
    created_at: datetime


# ================================================
# DATABASE CONNECTION
# ================================================

def get_db_connection():
    """Get PostgreSQL connection"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


# ================================================
# ENDPOINTS
# ================================================

@router.post("/", response_model=InteractionResponse)
async def create_interaction(interaction: InteractionCreate):
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
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert interaction
        cursor.execute("""
            INSERT INTO interactions (
                client_id, practice_id, conversation_id, interaction_type, channel,
                subject, summary, full_content, sentiment, team_member, direction,
                duration_minutes, extracted_entities, action_items, interaction_date
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """, (
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
            Json(interaction.extracted_entities),
            Json(interaction.action_items),
            datetime.now()
        ))

        new_interaction = cursor.fetchone()

        # Update client's last_interaction_date if client_id provided
        if interaction.client_id:
            cursor.execute("""
                UPDATE clients
                SET last_interaction_date = NOW()
                WHERE id = %s
            """, (interaction.client_id,))

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Logged {interaction.interaction_type} interaction by {interaction.team_member}")

        return InteractionResponse(**new_interaction)

    except Exception as e:
        logger.error(f"❌ Failed to create interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[Dict])
async def list_interactions(
    client_id: Optional[int] = Query(None, description="Filter by client"),
    practice_id: Optional[int] = Query(None, description="Filter by practice"),
    team_member: Optional[str] = Query(None, description="Filter by team member"),
    interaction_type: Optional[str] = Query(None, description="Filter by type"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment"),
    limit: int = Query(50, le=200),
    offset: int = Query(0)
):
    """
    List interactions with optional filtering
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = "SELECT * FROM interactions WHERE 1=1"
        params = []

        if client_id:
            query += " AND client_id = %s"
            params.append(client_id)

        if practice_id:
            query += " AND practice_id = %s"
            params.append(practice_id)

        if team_member:
            query += " AND team_member = %s"
            params.append(team_member)

        if interaction_type:
            query += " AND interaction_type = %s"
            params.append(interaction_type)

        if sentiment:
            query += " AND sentiment = %s"
            params.append(sentiment)

        query += " ORDER BY interaction_date DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        interactions = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(i) for i in interactions]

    except Exception as e:
        logger.error(f"❌ Failed to list interactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{interaction_id}")
async def get_interaction(interaction_id: int):
    """Get full interaction details by ID"""

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                i.*,
                c.full_name as client_name,
                c.email as client_email
            FROM interactions i
            LEFT JOIN clients c ON i.client_id = c.id
            WHERE i.id = %s
        """, (interaction_id,))

        interaction = cursor.fetchone()

        cursor.close()
        conn.close()

        if not interaction:
            raise HTTPException(status_code=404, detail="Interaction not found")

        return dict(interaction)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get interaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/client/{client_id}/timeline")
async def get_client_timeline(client_id: int, limit: int = Query(50, le=200)):
    """
    Get complete interaction timeline for a client

    Returns all interactions sorted by date (newest first)
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                i.*,
                p.id as practice_id,
                pt.name as practice_type_name,
                pt.code as practice_type_code
            FROM interactions i
            LEFT JOIN practices p ON i.practice_id = p.id
            LEFT JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE i.client_id = %s
            ORDER BY i.interaction_date DESC
            LIMIT %s
        """, (client_id, limit))

        timeline = cursor.fetchall()

        cursor.close()
        conn.close()

        return {
            "client_id": client_id,
            "total_interactions": len(timeline),
            "timeline": [dict(t) for t in timeline]
        }

    except Exception as e:
        logger.error(f"❌ Failed to get client timeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/practice/{practice_id}/history")
async def get_practice_history(practice_id: int):
    """
    Get all interactions related to a specific practice

    Useful for tracking communication history for a KITAS, PT PMA, etc.
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM interactions
            WHERE practice_id = %s
            ORDER BY interaction_date DESC
        """, (practice_id,))

        history = cursor.fetchall()

        cursor.close()
        conn.close()

        return {
            "practice_id": practice_id,
            "total_interactions": len(history),
            "history": [dict(h) for h in history]
        }

    except Exception as e:
        logger.error(f"❌ Failed to get practice history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/overview")
async def get_interactions_stats(
    team_member: Optional[str] = Query(None, description="Stats for specific team member")
):
    """
    Get interaction statistics

    - Total interactions
    - By type (chat, email, call, etc.)
    - By sentiment
    - By team member
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Base filter
        where_clause = "WHERE 1=1"
        params = []

        if team_member:
            where_clause += " AND team_member = %s"
            params.append(team_member)

        # By type
        cursor.execute(f"""
            SELECT interaction_type, COUNT(*) as count
            FROM interactions
            {where_clause}
            GROUP BY interaction_type
        """, params)
        by_type = cursor.fetchall()

        # By sentiment
        cursor.execute(f"""
            SELECT sentiment, COUNT(*) as count
            FROM interactions
            {where_clause}
            AND sentiment IS NOT NULL
            GROUP BY sentiment
        """, params)
        by_sentiment = cursor.fetchall()

        # By team member (if not filtered)
        if not team_member:
            cursor.execute("""
                SELECT team_member, COUNT(*) as count
                FROM interactions
                GROUP BY team_member
                ORDER BY count DESC
            """)
            by_team_member = cursor.fetchall()
        else:
            by_team_member = []

        # Recent activity (last 7 days)
        cursor.execute(f"""
            SELECT COUNT(*) as count
            FROM interactions
            {where_clause}
            AND interaction_date >= NOW() - INTERVAL '7 days'
        """, params)
        recent_count = cursor.fetchone()['count']

        cursor.close()
        conn.close()

        return {
            "total_interactions": sum(row['count'] for row in by_type),
            "last_7_days": recent_count,
            "by_type": {row['interaction_type']: row['count'] for row in by_type},
            "by_sentiment": {row['sentiment']: row['count'] for row in by_sentiment},
            "by_team_member": [dict(row) for row in by_team_member] if not team_member else []
        }

    except Exception as e:
        logger.error(f"❌ Failed to get interaction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/from-conversation")
async def create_interaction_from_conversation(
    conversation_id: int = Query(...),
    client_email: str = Query(...),
    team_member: str = Query(...),
    summary: Optional[str] = Query(None, description="AI-generated summary")
):
    """
    Auto-create interaction record from a chat conversation

    This is called automatically when a chat session ends or at intervals
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get or create client by email
        cursor.execute("SELECT id FROM clients WHERE email = %s", (client_email,))
        client = cursor.fetchone()

        if not client:
            # Create new client (prospect)
            cursor.execute("""
                INSERT INTO clients (full_name, email, status, first_contact_date, created_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                client_email.split('@')[0],  # Use email prefix as temp name
                client_email,
                'prospect',
                datetime.now(),
                team_member
            ))
            client = cursor.fetchone()
            logger.info(f"✅ Auto-created prospect client: {client_email}")

        client_id = client['id']

        # Get conversation from conversations table
        cursor.execute("""
            SELECT messages FROM conversations WHERE id = %s
        """, (conversation_id,))
        conv = cursor.fetchone()

        full_content = ""
        if conv and conv['messages']:
            # Format messages into readable text
            messages = conv['messages']
            full_content = "\n\n".join([
                f"{msg.get('role', 'unknown').upper()}: {msg.get('content', '')}"
                for msg in messages
            ])

        # Auto-generate summary if not provided (take first user message)
        if not summary and conv and conv['messages']:
            first_user_msg = next((m for m in conv['messages'] if m.get('role') == 'user'), None)
            if first_user_msg:
                summary = first_user_msg.get('content', '')[:200]  # First 200 chars

        # Create interaction
        cursor.execute("""
            INSERT INTO interactions (
                client_id, conversation_id, interaction_type, channel,
                summary, full_content, team_member, direction, interaction_date
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """, (
            client_id,
            conversation_id,
            'chat',
            'web_chat',
            summary,
            full_content,
            team_member,
            'inbound',
            datetime.now()
        ))

        new_interaction = cursor.fetchone()

        # Update client last interaction
        cursor.execute("""
            UPDATE clients
            SET last_interaction_date = NOW()
            WHERE id = %s
        """, (client_id,))

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Created interaction from conversation {conversation_id} for client {client_id}")

        return {
            "success": True,
            "interaction_id": new_interaction['id'],
            "client_id": client_id,
            "was_new_client": client is None
        }

    except Exception as e:
        logger.error(f"❌ Failed to create interaction from conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
