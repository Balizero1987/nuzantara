"""
ZANTARA CRM - Practices Management Router
Endpoints for managing practices (KITAS, PT PMA, Visas, etc.)
"""

import logging
from datetime import date, datetime, timedelta
from decimal import Decimal

import psycopg2
from fastapi import APIRouter, HTTPException, Query
from psycopg2 import sql
from psycopg2.extras import Json, RealDictCursor
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/practices", tags=["crm-practices"])


# ================================================
# PYDANTIC MODELS
# ================================================


class PracticeCreate(BaseModel):
    client_id: int
    practice_type_code: str  # Practice type code retrieved from database
    status: str = "inquiry"
    priority: str = "normal"  # 'low', 'normal', 'high', 'urgent'
    quoted_price: Decimal | None = None
    assigned_to: str | None = None  # team member email
    notes: str | None = None
    internal_notes: str | None = None


class PracticeUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    quoted_price: Decimal | None = None
    actual_price: Decimal | None = None
    payment_status: str | None = None
    paid_amount: Decimal | None = None
    assigned_to: str | None = None
    start_date: datetime | None = None
    completion_date: datetime | None = None
    expiry_date: date | None = None
    notes: str | None = None
    internal_notes: str | None = None
    documents: list[dict] | None = None
    missing_documents: list[str] | None = None


class PracticeResponse(BaseModel):
    id: int
    uuid: str
    client_id: int
    practice_type_id: int
    status: str
    priority: str
    quoted_price: Decimal | None
    actual_price: Decimal | None
    payment_status: str
    assigned_to: str | None
    start_date: datetime | None
    completion_date: datetime | None
    expiry_date: date | None
    created_at: datetime


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


@router.post("/", response_model=PracticeResponse)
async def create_practice(
    practice: PracticeCreate,
    created_by: str = Query(..., description="Team member creating this practice"),
):
    """
    Create a new practice for a client

    - **client_id**: ID of the client
    - **practice_type_code**: Practice type code (retrieved from database)
    - **status**: Initial status (default: 'inquiry')
    - **quoted_price**: Price quoted to client
    - **assigned_to**: Team member email to handle this
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get practice_type_id from code
        cursor.execute(
            "SELECT id, base_price FROM practice_types WHERE code = %s",
            (practice.practice_type_code,),
        )
        practice_type = cursor.fetchone()

        if not practice_type:
            raise HTTPException(
                status_code=404, detail=f"Practice type '{practice.practice_type_code}' not found"
            )

        # Use base_price if no quoted price provided
        quoted_price = practice.quoted_price or practice_type["base_price"]

        # Insert practice
        cursor.execute(
            """
            INSERT INTO practices (
                client_id, practice_type_id, status, priority,
                quoted_price, assigned_to, notes, internal_notes,
                inquiry_date, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """,
            (
                practice.client_id,
                practice_type["id"],
                practice.status,
                practice.priority,
                quoted_price,
                practice.assigned_to,
                practice.notes,
                practice.internal_notes,
                datetime.now(),
                created_by,
            ),
        )

        new_practice = cursor.fetchone()

        # Update client's last_interaction_date
        cursor.execute(
            """
            UPDATE clients
            SET last_interaction_date = NOW()
            WHERE id = %s
        """,
            (practice.client_id,),
        )

        # Log activity
        cursor.execute(
            """
            INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
            VALUES (%s, %s, %s, %s, %s)
        """,
            (
                "practice",
                new_practice["id"],
                "created",
                created_by,
                f"New {practice.practice_type_code} practice created",
            ),
        )

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(
            f"✅ Created practice: {practice.practice_type_code} for client {practice.client_id}"
        )

        return PracticeResponse(**new_practice)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/", response_model=list[dict])
async def list_practices(
    client_id: int | None = Query(None, description="Filter by client ID"),
    status: str | None = Query(None, description="Filter by status"),
    assigned_to: str | None = Query(None, description="Filter by assigned team member"),
    practice_type: str | None = Query(None, description="Filter by practice type code"),
    priority: str | None = Query(None, description="Filter by priority"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
):
    """
    List practices with optional filtering

    Returns practices with client and practice type information joined
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build query with joins
        query = """
            SELECT
                p.*,
                c.full_name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                pt.name as practice_type_name,
                pt.code as practice_type_code,
                pt.category as practice_category
            FROM practices p
            JOIN clients c ON p.client_id = c.id
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE 1=1
        """
        params = []

        if client_id:
            query += " AND p.client_id = %s"
            params.append(client_id)

        if status:
            query += " AND p.status = %s"
            params.append(status)

        if assigned_to:
            query += " AND p.assigned_to = %s"
            params.append(assigned_to)

        if practice_type:
            query += " AND pt.code = %s"
            params.append(practice_type)

        if priority:
            query += " AND p.priority = %s"
            params.append(priority)

        query += " ORDER BY p.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        practices = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(p) for p in practices]

    except Exception as e:
        logger.error(f"❌ Failed to list practices: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/active")
async def get_active_practices(assigned_to: str | None = Query(None)):
    """
    Get all active practices (in progress, not completed/cancelled)

    Optionally filter by assigned team member
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT * FROM active_practices_view
            WHERE 1=1
        """
        params = []

        if assigned_to:
            query += " AND assigned_to = %s"
            params.append(assigned_to)

        query += " ORDER BY priority DESC, start_date ASC"

        cursor.execute(query, params)
        practices = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(p) for p in practices]

    except Exception as e:
        logger.error(f"❌ Failed to get active practices: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/renewals/upcoming")
async def get_upcoming_renewals(_days: int = Query(90, description="Days to look ahead")):
    """
    Get practices with upcoming renewal dates

    Default: next 90 days
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM upcoming_renewals_view")
        renewals = cursor.fetchall()

        cursor.close()
        conn.close()

        return [dict(r) for r in renewals]

    except Exception as e:
        logger.error(f"❌ Failed to get upcoming renewals: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{practice_id}")
async def get_practice(practice_id: int):
    """Get practice details by ID with full client and type info"""

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT
                p.*,
                c.full_name as client_name,
                c.email as client_email,
                c.phone as client_phone,
                pt.name as practice_type_name,
                pt.code as practice_type_code,
                pt.category as practice_category,
                pt.required_documents as required_documents
            FROM practices p
            JOIN clients c ON p.client_id = c.id
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.id = %s
        """,
            (practice_id,),
        )

        practice = cursor.fetchone()

        cursor.close()
        conn.close()

        if not practice:
            raise HTTPException(status_code=404, detail="Practice not found")

        return dict(practice)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{practice_id}")
async def update_practice(
    practice_id: int,
    updates: PracticeUpdate,
    updated_by: str = Query(..., description="Team member making the update"),
):
    """
    Update practice information

    Common status values:
    - inquiry
    - quotation_sent
    - payment_pending
    - in_progress
    - waiting_documents
    - submitted_to_gov
    - approved
    - completed
    - cancelled
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query
        update_fields: list[sql.SQL] = []
        params = []

        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                column = sql.Identifier(field)
                if field in ["documents", "missing_documents"]:
                    update_fields.append(sql.SQL("{} = %s").format(column))
                    params.append(Json(value))
                else:
                    update_fields.append(sql.SQL("{} = %s").format(column))
                    params.append(value)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clauses = update_fields + [sql.SQL("updated_at = NOW()")]
        query = sql.SQL(
            """
            UPDATE practices
            SET {set_clause}
            WHERE id = %s
            RETURNING *
        """
        ).format(set_clause=sql.SQL(", ").join(set_clauses))
        params.append(practice_id)

        cursor.execute(query, params)
        updated_practice = cursor.fetchone()

        if not updated_practice:
            raise HTTPException(status_code=404, detail="Practice not found")

        # Log activity
        changed_fields = list(updates.dict(exclude_unset=True).keys())
        cursor.execute(
            """
            INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description, changes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
            (
                "practice",
                practice_id,
                "updated",
                updated_by,
                f"Updated: {', '.join(changed_fields)}",
                Json(updates.dict(exclude_unset=True)),
            ),
        )

        # If status changed to 'completed' and there's an expiry date, create renewal alert
        if updates.status == "completed" and updates.expiry_date:
            alert_date = updates.expiry_date - timedelta(days=60)  # 60 days before expiry

            cursor.execute(
                """
                INSERT INTO renewal_alerts (
                    practice_id, client_id, alert_type, description,
                    target_date, alert_date, notify_team_member
                )
                SELECT
                    %s, client_id, 'renewal_due',
                    'Practice renewal due soon',
                    %s, %s, assigned_to
                FROM practices
                WHERE id = %s
            """,
                (practice_id, updates.expiry_date, alert_date, practice_id),
            )

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Updated practice ID {practice_id} by {updated_by}")

        return dict(updated_practice)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{practice_id}/documents/add")
async def add_document_to_practice(
    practice_id: int,
    document_name: str = Query(...),
    drive_file_id: str = Query(...),
    uploaded_by: str = Query(...),
):
    """
    Add a document to a practice

    - **document_name**: Name/type of document (e.g., "Passport Copy")
    - **drive_file_id**: Google Drive file ID
    - **uploaded_by**: Email of person uploading
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get current documents
        cursor.execute("SELECT documents FROM practices WHERE id = %s", (practice_id,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Practice not found")

        documents = result["documents"] or []

        # Add new document
        new_doc = {
            "name": document_name,
            "drive_file_id": drive_file_id,
            "uploaded_at": datetime.now().isoformat(),
            "uploaded_by": uploaded_by,
            "status": "received",
        }

        documents.append(new_doc)

        # Update practice
        cursor.execute(
            """
            UPDATE practices
            SET documents = %s, updated_at = NOW()
            WHERE id = %s
        """,
            (Json(documents), practice_id),
        )

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Added document '{document_name}' to practice {practice_id}")

        return {"success": True, "document": new_doc, "total_documents": len(documents)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add document: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/stats/overview")
async def get_practices_stats():
    """
    Get overall practice statistics

    - Counts by status
    - Counts by practice type
    - Revenue metrics
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # By status
        cursor.execute(
            """
            SELECT status, COUNT(*) as count
            FROM practices
            GROUP BY status
        """
        )
        by_status = cursor.fetchall()

        # By practice type
        cursor.execute(
            """
            SELECT pt.code, pt.name, COUNT(p.id) as count
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            GROUP BY pt.code, pt.name
            ORDER BY count DESC
        """
        )
        by_type = cursor.fetchall()

        # Revenue stats
        cursor.execute(
            """
            SELECT
                SUM(actual_price) as total_revenue,
                SUM(CASE WHEN payment_status = 'paid' THEN actual_price ELSE 0 END) as paid_revenue,
                SUM(CASE WHEN payment_status IN ('unpaid', 'partial') THEN actual_price - COALESCE(paid_amount, 0) ELSE 0 END) as outstanding_revenue
            FROM practices
            WHERE actual_price IS NOT NULL
        """
        )
        revenue = cursor.fetchone()

        # Active practices count
        cursor.execute(
            """
            SELECT COUNT(*) as count
            FROM practices
            WHERE status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
        """
        )
        active_count = cursor.fetchone()["count"]

        cursor.close()
        conn.close()

        return {
            "total_practices": sum(row["count"] for row in by_status),
            "active_practices": active_count,
            "by_status": {row["status"]: row["count"] for row in by_status},
            "by_type": [dict(row) for row in by_type],
            "revenue": dict(revenue),
        }

    except Exception as e:
        logger.error(f"❌ Failed to get practices stats: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
