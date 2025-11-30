"""
ZANTARA CRM - Shared Memory Router
Team-wide memory access for AI and team members
Enables queries like "clients with upcoming renewals", "active practices for John Smith", etc.
"""

import json
import logging

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..dependencies import get_db_pool

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/shared-memory", tags=["crm-shared-memory"])


# ================================================
# PYDANTIC MODELS
# ================================================


class SearchSummary(BaseModel):
    clients_found: int
    practices_found: int
    interactions_found: int


class SharedMemorySearchResponse(BaseModel):
    query: str
    clients: list[dict]
    practices: list[dict]
    interactions: list[dict]
    interpretation: list[str]
    summary: SearchSummary


class UpcomingRenewalsResponse(BaseModel):
    total_renewals: int
    days_ahead: int
    renewals: list[dict]


class PracticesContext(BaseModel):
    total: int
    active: int
    completed: int
    list: list[dict]


class InteractionsContext(BaseModel):
    total: int
    recent: list[dict]


class ContextSummary(BaseModel):
    first_contact: str | None
    last_interaction: str | None
    total_practices: int
    total_interactions: int
    upcoming_renewals: int


class ClientFullContextResponse(BaseModel):
    client: dict
    practices: PracticesContext
    interactions: InteractionsContext
    renewals: list[dict]
    action_items: list[dict]
    summary: ContextSummary


class TeamOverviewResponse(BaseModel):
    total_active_clients: int
    practices_by_status: dict[str, int]
    active_practices_by_team_member: list[dict]
    renewals_next_30_days: int
    interactions_last_7_days: int
    active_practices_by_type: list[dict]


# ================================================
# HELPER FUNCTIONS
# ================================================


async def _get_practice_codes(db: asyncpg.Pool):
    """
    Get practice type codes from database

    Returns:
        List of practice type codes (e.g., ['KITAS', 'KITAP', 'PT_PMA'])
    """
    try:
        rows = await db.fetch("SELECT code FROM practice_types WHERE active = true")
        return [row["code"] for row in rows]
    except Exception:
        # If table doesn't exist or query fails, return empty list
        return []


# ================================================
# ENDPOINTS
# ================================================


@router.get("/search", response_model=SharedMemorySearchResponse)
async def search_shared_memory(
    q: str = Query(..., description="Natural language query"),
    limit: int = Query(20, le=100),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Natural language search across CRM data

    Examples:
    - "clients with KITAS expiring soon"
    - "active practices for John Smith"
    - "recent interactions with antonello@balizero.com"
    - "urgent practices"
    - "PT PMA practices in progress"

    Returns relevant results from clients, practices, and interactions
    """

    try:
        query_lower = q.lower()
        results = {
            "query": q,
            "clients": [],
            "practices": [],
            "interactions": [],
            "interpretation": [],
        }

        # Detect intent and search accordingly

        # 1. Renewal/Expiry queries
        if any(word in query_lower for word in ["expir", "renewal", "renew", "scaden"]):
            results["interpretation"].append("Detected: Renewal/Expiry query")

            rows = await db.fetch(
                """
                SELECT
                    c.full_name as client_name,
                    c.email,
                    c.phone,
                    pt.name as practice_type,
                    pt.code as practice_code,
                    p.expiry_date,
                    p.expiry_date - CURRENT_DATE as days_until_expiry,
                    p.assigned_to,
                    p.id as practice_id
                FROM practices p
                JOIN clients c ON p.client_id = c.id
                JOIN practice_types pt ON p.practice_type_id = pt.id
                WHERE p.expiry_date IS NOT NULL
                AND p.expiry_date > CURRENT_DATE
                AND p.expiry_date <= CURRENT_DATE + INTERVAL '90 days'
                AND p.status = 'completed'
                ORDER BY p.expiry_date ASC
                LIMIT $1
            """,
                limit,
            )

            results["practices"] = [dict(row) for row in rows]

        # 2. Client name search
        if not results["practices"]:  # If not a renewal query, try client search
            # Extract potential names (words that are capitalized)
            words = q.split()
            name_parts = [w for w in words if w[0].isupper() and len(w) > 2]

            if name_parts:
                results["interpretation"].append(
                    f"Detected: Client search for '{' '.join(name_parts)}'"
                )

                search_pattern = f"%{' '.join(name_parts)}%"

                # Search clients
                rows = await db.fetch(
                    """
                    SELECT
                        c.*,
                        COUNT(DISTINCT p.id) as total_practices,
                        COUNT(DISTINCT CASE WHEN p.status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov') THEN p.id END) as active_practices
                    FROM clients c
                    LEFT JOIN practices p ON c.id = p.client_id
                    WHERE c.full_name ILIKE $1 OR c.email ILIKE $2
                    GROUP BY c.id
                    LIMIT $3
                """,
                    search_pattern,
                    search_pattern,
                    limit,
                )

                results["clients"] = [dict(row) for row in rows]

                # Get practices for found clients
                if results["clients"]:
                    client_ids = [c["id"] for c in results["clients"]]

                    rows = await db.fetch(
                        """
                        SELECT
                            p.*,
                            pt.name as practice_type_name,
                            pt.code as practice_type_code,
                            c.full_name as client_name
                        FROM practices p
                        JOIN practice_types pt ON p.practice_type_id = pt.id
                        JOIN clients c ON p.client_id = c.id
                        WHERE p.client_id = ANY($1)
                        ORDER BY p.created_at DESC
                    """,
                        client_ids,
                    )

                    results["practices"] = [dict(row) for row in rows]

        # 3. Practice type search - retrieved from database
        # TABULA RASA: No hardcoded practice codes - all practice types come from database
        practice_codes = await _get_practice_codes(db)  # Retrieved from database at runtime
        detected_practice_type = None

        for code in practice_codes:
            if code.replace("_", " ").lower() in query_lower or code.lower() in query_lower:
                detected_practice_type = code
                break

        if detected_practice_type and not results["practices"]:
            results["interpretation"].append(
                f"Detected: Practice type search for '{detected_practice_type}'"
            )

            # Determine status filter
            status_filter = []
            if "active" in query_lower or "in progress" in query_lower:
                status_filter = [
                    "inquiry",
                    "quotation_sent",
                    "payment_pending",
                    "in_progress",
                    "waiting_documents",
                    "submitted_to_gov",
                ]
            elif "completed" in query_lower:
                status_filter = ["completed"]
            else:
                status_filter = [
                    "inquiry",
                    "in_progress",
                    "waiting_documents",
                    "submitted_to_gov",
                ]  # default to active

            rows = await db.fetch(
                """
                SELECT
                    p.*,
                    pt.name as practice_type_name,
                    pt.code as practice_type_code,
                    c.full_name as client_name,
                    c.email as client_email,
                    c.phone as client_phone
                FROM practices p
                JOIN practice_types pt ON p.practice_type_id = pt.id
                JOIN clients c ON p.client_id = c.id
                WHERE pt.code = $1
                AND p.status = ANY($2)
                ORDER BY p.created_at DESC
                LIMIT $3
            """,
                detected_practice_type,
                status_filter,
                limit,
            )

            results["practices"] = [dict(row) for row in rows]

        # 4. Urgency/Priority search
        if any(word in query_lower for word in ["urgent", "priority", "asap", "quickly"]):
            results["interpretation"].append("Detected: Urgency/Priority filter")

            rows = await db.fetch(
                """
                SELECT
                    p.*,
                    pt.name as practice_type_name,
                    c.full_name as client_name,
                    c.email as client_email
                FROM practices p
                JOIN practice_types pt ON p.practice_type_id = pt.id
                JOIN clients c ON p.client_id = c.id
                WHERE p.priority IN ('high', 'urgent')
                AND p.status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
                ORDER BY
                    CASE p.priority
                        WHEN 'urgent' THEN 1
                        WHEN 'high' THEN 2
                        ELSE 3
                    END,
                    p.created_at DESC
                LIMIT $1
            """,
                limit,
            )

            results["practices"] = [dict(row) for row in rows]

        # 5. Recent interactions
        if any(
            word in query_lower
            for word in ["recent", "last", "latest", "interaction", "communication"]
        ):
            results["interpretation"].append("Detected: Recent interactions query")

            # Extract days if mentioned ("last 7 days", "last week", etc.)
            days = 7  # default
            if "30" in q or "month" in query_lower:
                days = 30
            elif "week" in query_lower:
                days = 7
            elif "today" in query_lower:
                days = 1

            rows = await db.fetch(
                """
                SELECT
                    i.*,
                    c.full_name as client_name,
                    c.email as client_email
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.interaction_date >= NOW() - INTERVAL '1 day' * $1
                ORDER BY i.interaction_date DESC
                LIMIT $2
            """,
                days,
                limit,
            )

            results["interactions"] = [dict(row) for row in rows]

        # Summary
        results["summary"] = {
            "clients_found": len(results["clients"]),
            "practices_found": len(results["practices"]),
            "interactions_found": len(results["interactions"]),
        }

        return results

    except Exception as e:
        logger.error(f"❌ Shared memory search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/upcoming-renewals", response_model=UpcomingRenewalsResponse)
async def get_upcoming_renewals(
    days: int = Query(90, description="Look ahead days"), db: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get all practices with upcoming renewal dates

    Default: next 90 days
    """

    try:
        rows = await db.fetch(
            """
            SELECT
                c.full_name as client_name,
                c.email,
                c.phone,
                c.whatsapp,
                pt.name as practice_type,
                pt.code as practice_code,
                p.expiry_date,
                p.expiry_date - CURRENT_DATE as days_until_expiry,
                p.assigned_to,
                p.id as practice_id,
                p.status
            FROM practices p
            JOIN clients c ON p.client_id = c.id
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.expiry_date IS NOT NULL
            AND p.expiry_date > CURRENT_DATE
            AND p.expiry_date <= CURRENT_DATE + INTERVAL '1 day' * $1
            ORDER BY p.expiry_date ASC
        """,
            days,
        )

        renewals = [dict(row) for row in rows]

        return {"total_renewals": len(renewals), "days_ahead": days, "renewals": renewals}

    except Exception as e:
        logger.error(f"❌ Failed to get upcoming renewals: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/client/{client_id}/full-context", response_model=ClientFullContextResponse)
async def get_client_full_context(client_id: int, db: asyncpg.Pool = Depends(get_db_pool)):
    """
    Get complete context for a client
    Everything the AI needs to know about this client

    Returns:
    - Client info
    - All practices (active + completed)
    - Recent interactions (last 20)
    - Upcoming renewals
    - Action items
    """

    try:
        # Client info
        client = await db.fetchrow("SELECT * FROM clients WHERE id = $1", client_id)

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Practices
        practices_rows = await db.fetch(
            """
            SELECT
                p.*,
                pt.name as practice_type_name,
                pt.code as practice_type_code
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.client_id = $1
            ORDER BY p.created_at DESC
        """,
            client_id,
        )
        practices = [dict(row) for row in practices_rows]

        # Recent interactions
        interactions_rows = await db.fetch(
            """
            SELECT * FROM interactions
            WHERE client_id = $1
            ORDER BY interaction_date DESC
            LIMIT 20
        """,
            client_id,
        )
        interactions = [dict(row) for row in interactions_rows]

        # Upcoming renewals
        renewals_rows = await db.fetch(
            """
            SELECT
                p.*,
                pt.name as practice_type_name,
                p.expiry_date - CURRENT_DATE as days_until_expiry
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.client_id = $1
            AND p.expiry_date > CURRENT_DATE
            ORDER BY p.expiry_date ASC
        """,
            client_id,
        )
        renewals = [dict(row) for row in renewals_rows]

        # Aggregate action items from interactions
        action_items = []
        for interaction in interactions:
            if interaction.get("action_items"):
                action_items.extend(interaction["action_items"])

        return {
            "client": dict(client),
            "practices": {
                "total": len(practices),
                "active": len(
                    [
                        p
                        for p in practices
                        if p["status"]
                        in ["inquiry", "in_progress", "waiting_documents", "submitted_to_gov"]
                    ]
                ),
                "completed": len([p for p in practices if p["status"] == "completed"]),
                "list": practices,
            },
            "interactions": {"total": len(interactions), "recent": interactions},
            "renewals": renewals,
            "action_items": action_items[:10],  # top 10
            "summary": {
                "first_contact": client["first_contact_date"],
                "last_interaction": client["last_interaction_date"],
                "total_practices": len(practices),
                "total_interactions": len(interactions),
                "upcoming_renewals": len(renewals),
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get client full context: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/team-overview", response_model=TeamOverviewResponse)
async def get_team_overview(db: asyncpg.Pool = Depends(get_db_pool)):
    """
    Get team-wide CRM overview

    Perfect for dashboard or team queries like:
    - "How many active practices do we have?"
    - "What's our workload distribution?"
    - "Recent activity summary"
    """

    try:
        overview = {}

        # Total clients
        row = await db.fetchrow("SELECT COUNT(*) as count FROM clients WHERE status = 'active'")
        overview["total_active_clients"] = row["count"]

        # Total practices by status
        rows = await db.fetch(
            """
            SELECT status, COUNT(*) as count
            FROM practices
            GROUP BY status
        """
        )
        overview["practices_by_status"] = {row["status"]: row["count"] for row in rows}

        # Practices by team member
        rows = await db.fetch(
            """
            SELECT assigned_to, COUNT(*) as count
            FROM practices
            WHERE assigned_to IS NOT NULL
            AND status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
            GROUP BY assigned_to
            ORDER BY count DESC
        """
        )
        overview["active_practices_by_team_member"] = [dict(row) for row in rows]

        # Upcoming renewals (next 30 days)
        row = await db.fetchrow(
            """
            SELECT COUNT(*) as count
            FROM practices
            WHERE expiry_date IS NOT NULL
            AND expiry_date > CURRENT_DATE
            AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        """
        )
        overview["renewals_next_30_days"] = row["count"]

        # Recent interactions (last 7 days)
        row = await db.fetchrow(
            """
            SELECT COUNT(*) as count
            FROM interactions
            WHERE interaction_date >= NOW() - INTERVAL '7 days'
        """
        )
        overview["interactions_last_7_days"] = row["count"]

        # Practice types distribution
        rows = await db.fetch(
            """
            SELECT
                pt.code,
                pt.name,
                COUNT(p.id) as count
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
            GROUP BY pt.code, pt.name
            ORDER BY count DESC
        """
        )
        overview["active_practices_by_type"] = [dict(row) for row in rows]

        return overview

    except Exception as e:
        logger.error(f"❌ Failed to get team overview: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
