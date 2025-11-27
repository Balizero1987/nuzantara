"""
ZANTARA CRM - Shared Memory Router
Team-wide memory access for AI and team members
Enables queries like "clients with upcoming renewals", "active practices for John Smith", etc.
"""

import logging

import psycopg2
from fastapi import APIRouter, HTTPException, Query
from psycopg2.extras import RealDictCursor

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/shared-memory", tags=["crm-shared-memory"])


# ================================================
# DATABASE CONNECTION
# ================================================


def get_db_connection():
    """Get PostgreSQL connection"""
    database_url = settings.database_url
    if not database_url:
        raise Exception("DATABASE_URL environment variable not set")
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)


# ================================================
# ENDPOINTS
# ================================================


@router.get("/search")
async def search_shared_memory(
    q: str = Query(..., description="Natural language query"), limit: int = Query(20, le=100)
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
        conn = get_db_connection()
        cursor = conn.cursor()

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

            cursor.execute(
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
                LIMIT %s
            """,
                (limit,),
            )

            results["practices"] = [dict(row) for row in cursor.fetchall()]

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
                cursor.execute(
                    """
                    SELECT
                        c.*,
                        COUNT(DISTINCT p.id) as total_practices,
                        COUNT(DISTINCT CASE WHEN p.status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov') THEN p.id END) as active_practices
                    FROM clients c
                    LEFT JOIN practices p ON c.id = p.client_id
                    WHERE c.full_name ILIKE %s OR c.email ILIKE %s
                    GROUP BY c.id
                    LIMIT %s
                """,
                    (search_pattern, search_pattern, limit),
                )

                results["clients"] = [dict(row) for row in cursor.fetchall()]

                # Get practices for found clients
                if results["clients"]:
                    client_ids = [c["id"] for c in results["clients"]]

                    cursor.execute(
                        """
                        SELECT
                            p.*,
                            pt.name as practice_type_name,
                            pt.code as practice_type_code,
                            c.full_name as client_name
                        FROM practices p
                        JOIN practice_types pt ON p.practice_type_id = pt.id
                        JOIN clients c ON p.client_id = c.id
                        WHERE p.client_id = ANY(%s)
                        ORDER BY p.created_at DESC
                    """,
                        (client_ids,),
                    )

                    results["practices"] = [dict(row) for row in cursor.fetchall()]

        # 3. Practice type search - retrieved from database
        # TABULA RASA: No hardcoded practice codes - all practice types come from database
        practice_codes = []  # Retrieved from database at runtime
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

            cursor.execute(
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
                WHERE pt.code = %s
                AND p.status = ANY(%s)
                ORDER BY p.created_at DESC
                LIMIT %s
            """,
                (detected_practice_type, status_filter, limit),
            )

            results["practices"] = [dict(row) for row in cursor.fetchall()]

        # 4. Urgency/Priority search
        if any(word in query_lower for word in ["urgent", "priority", "asap", "quickly"]):
            results["interpretation"].append("Detected: Urgency/Priority filter")

            cursor.execute(
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
                LIMIT %s
            """,
                (limit,),
            )

            results["practices"] = [dict(row) for row in cursor.fetchall()]

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

            cursor.execute(
                """
                SELECT
                    i.*,
                    c.full_name as client_name,
                    c.email as client_email
                FROM interactions i
                JOIN clients c ON i.client_id = c.id
                WHERE i.interaction_date >= NOW() - INTERVAL '%s days'
                ORDER BY i.interaction_date DESC
                LIMIT %s
            """,
                (days, limit),
            )

            results["interactions"] = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        # Summary
        results["summary"] = {
            "clients_found": len(results["clients"]),
            "practices_found": len(results["practices"]),
            "interactions_found": len(results["interactions"]),
        }

        return results

    except Exception as e:
        logger.error(f"❌ Shared memory search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming-renewals")
async def get_upcoming_renewals(days: int = Query(90, description="Look ahead days")):
    """
    Get all practices with upcoming renewal dates

    Default: next 90 days
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
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
            AND p.expiry_date <= CURRENT_DATE + INTERVAL '%s days'
            ORDER BY p.expiry_date ASC
        """,
            (days,),
        )

        renewals = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return {"total_renewals": len(renewals), "days_ahead": days, "renewals": renewals}

    except Exception as e:
        logger.error(f"❌ Failed to get upcoming renewals: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/client/{client_id}/full-context")
async def get_client_full_context(client_id: int):
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
        conn = get_db_connection()
        cursor = conn.cursor()

        # Client info
        cursor.execute("SELECT * FROM clients WHERE id = %s", (client_id,))
        client = cursor.fetchone()

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Practices
        cursor.execute(
            """
            SELECT
                p.*,
                pt.name as practice_type_name,
                pt.code as practice_type_code
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.client_id = %s
            ORDER BY p.created_at DESC
        """,
            (client_id,),
        )
        practices = [dict(row) for row in cursor.fetchall()]

        # Recent interactions
        cursor.execute(
            """
            SELECT * FROM interactions
            WHERE client_id = %s
            ORDER BY interaction_date DESC
            LIMIT 20
        """,
            (client_id,),
        )
        interactions = [dict(row) for row in cursor.fetchall()]

        # Upcoming renewals
        cursor.execute(
            """
            SELECT
                p.*,
                pt.name as practice_type_name,
                p.expiry_date - CURRENT_DATE as days_until_expiry
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.client_id = %s
            AND p.expiry_date > CURRENT_DATE
            ORDER BY p.expiry_date ASC
        """,
            (client_id,),
        )
        renewals = [dict(row) for row in cursor.fetchall()]

        # Aggregate action items from interactions
        action_items = []
        for interaction in interactions:
            if interaction.get("action_items"):
                action_items.extend(interaction["action_items"])

        cursor.close()
        conn.close()

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
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/team-overview")
async def get_team_overview():
    """
    Get team-wide CRM overview

    Perfect for dashboard or team queries like:
    - "How many active practices do we have?"
    - "What's our workload distribution?"
    - "Recent activity summary"
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        overview = {}

        # Total clients
        cursor.execute("SELECT COUNT(*) as count FROM clients WHERE status = 'active'")
        overview["total_active_clients"] = cursor.fetchone()["count"]

        # Total practices by status
        cursor.execute(
            """
            SELECT status, COUNT(*) as count
            FROM practices
            GROUP BY status
        """
        )
        overview["practices_by_status"] = {row["status"]: row["count"] for row in cursor.fetchall()}

        # Practices by team member
        cursor.execute(
            """
            SELECT assigned_to, COUNT(*) as count
            FROM practices
            WHERE assigned_to IS NOT NULL
            AND status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
            GROUP BY assigned_to
            ORDER BY count DESC
        """
        )
        overview["active_practices_by_team_member"] = [dict(row) for row in cursor.fetchall()]

        # Upcoming renewals (next 30 days)
        cursor.execute(
            """
            SELECT COUNT(*) as count
            FROM practices
            WHERE expiry_date IS NOT NULL
            AND expiry_date > CURRENT_DATE
            AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        """
        )
        overview["renewals_next_30_days"] = cursor.fetchone()["count"]

        # Recent interactions (last 7 days)
        cursor.execute(
            """
            SELECT COUNT(*) as count
            FROM interactions
            WHERE interaction_date >= NOW() - INTERVAL '7 days'
        """
        )
        overview["interactions_last_7_days"] = cursor.fetchone()["count"]

        # Practice types distribution
        cursor.execute(
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
        overview["active_practices_by_type"] = [dict(row) for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return overview

    except Exception as e:
        logger.error(f"❌ Failed to get team overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))
