"""
ZANTARA CRM - Practices Management Router
Endpoints for managing practices (KITAS, PT PMA, Visas, etc.)
"""

import json
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from ..dependencies import get_db_pool

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


class PracticeDetailResponse(BaseModel):
    """Practice with client and type info joined"""
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
    notes: str | None
    documents: list[dict] | None
    missing_documents: list[str] | None
    created_at: datetime
    updated_at: datetime | None
    client_name: str
    client_email: str | None
    client_phone: str | None
    practice_type_name: str
    practice_type_code: str
    practice_category: str
    required_documents: list[str] | None = None


class DocumentAddResponse(BaseModel):
    success: bool
    document: dict
    total_documents: int


class RevenueStats(BaseModel):
    total_revenue: Decimal | None
    paid_revenue: Decimal | None
    outstanding_revenue: Decimal | None


class PracticesStatsResponse(BaseModel):
    total_practices: int
    active_practices: int
    by_status: dict[str, int]
    by_type: list[dict]
    revenue: RevenueStats


# ================================================
# ENDPOINTS
# ================================================


@router.post("/", response_model=PracticeResponse)
async def create_practice(
    practice: PracticeCreate,
    created_by: str = Query(..., description="Team member creating this practice"),
    db: asyncpg.Pool = Depends(get_db_pool),
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
        async with db.acquire() as conn:
            # Get practice_type_id from code
            practice_type = await conn.fetchrow(
                "SELECT id, base_price FROM practice_types WHERE code = $1",
                practice.practice_type_code,
            )

            if not practice_type:
                raise HTTPException(
                    status_code=404, detail=f"Practice type '{practice.practice_type_code}' not found"
                )

            # Use base_price if no quoted price provided
            quoted_price = practice.quoted_price or practice_type["base_price"]

            # Insert practice
            new_practice = await conn.fetchrow(
                """
                INSERT INTO practices (
                    client_id, practice_type_id, status, priority,
                    quoted_price, assigned_to, notes, internal_notes,
                    inquiry_date, created_by
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                )
                RETURNING *
            """,
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
            )

            # Update client's last_interaction_date
            await conn.execute(
                """
                UPDATE clients
                SET last_interaction_date = NOW()
                WHERE id = $1
            """,
                practice.client_id,
            )

            # Log activity
            await conn.execute(
                """
                INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
                VALUES ($1, $2, $3, $4, $5)
            """,
                "practice",
                new_practice["id"],
                "created",
                created_by,
                f"New {practice.practice_type_code} practice created",
            )

            logger.info(
                f"✅ Created practice: {practice.practice_type_code} for client {practice.client_id}"
            )

            return PracticeResponse(**dict(new_practice))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/", response_model=list[PracticeDetailResponse])
async def list_practices(
    client_id: int | None = Query(None, description="Filter by client ID"),
    status: str | None = Query(None, description="Filter by status"),
    assigned_to: str | None = Query(None, description="Filter by assigned team member"),
    practice_type: str | None = Query(None, description="Filter by practice type code"),
    priority: str | None = Query(None, description="Filter by priority"),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    List practices with optional filtering

    Returns practices with client and practice type information joined
    """

    try:
        async with db.acquire() as conn:
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
            param_count = 1

            if client_id:
                query += f" AND p.client_id = ${param_count}"
                params.append(client_id)
                param_count += 1

            if status:
                query += f" AND p.status = ${param_count}"
                params.append(status)
                param_count += 1

            if assigned_to:
                query += f" AND p.assigned_to = ${param_count}"
                params.append(assigned_to)
                param_count += 1

            if practice_type:
                query += f" AND pt.code = ${param_count}"
                params.append(practice_type)
                param_count += 1

            if priority:
                query += f" AND p.priority = ${param_count}"
                params.append(priority)
                param_count += 1

            query += f" ORDER BY p.created_at DESC LIMIT ${param_count} OFFSET ${param_count + 1}"
            params.extend([limit, offset])

            practices = await conn.fetch(query, *params)

            return [dict(p) for p in practices]

    except Exception as e:
        logger.error(f"❌ Failed to list practices: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/active", response_model=list[dict])
async def get_active_practices(
    assigned_to: str | None = Query(None),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get all active practices (in progress, not completed/cancelled)

    Optionally filter by assigned team member
    """

    try:
        async with db.acquire() as conn:
            query = """
                SELECT * FROM active_practices_view
                WHERE 1=1
            """
            params = []

            if assigned_to:
                query += " AND assigned_to = $1"
                params.append(assigned_to)

            query += " ORDER BY priority DESC, start_date ASC"

            practices = await conn.fetch(query, *params)

            return [dict(p) for p in practices]

    except Exception as e:
        logger.error(f"❌ Failed to get active practices: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/renewals/upcoming", response_model=list[dict])
async def get_upcoming_renewals(
    _days: int = Query(90, description="Days to look ahead"),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get practices with upcoming renewal dates

    Default: next 90 days
    """

    try:
        async with db.acquire() as conn:
            renewals = await conn.fetch("SELECT * FROM upcoming_renewals_view")

            return [dict(r) for r in renewals]

    except Exception as e:
        logger.error(f"❌ Failed to get upcoming renewals: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{practice_id}", response_model=PracticeDetailResponse)
async def get_practice(
    practice_id: int,
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """Get practice details by ID with full client and type info"""

    try:
        async with db.acquire() as conn:
            practice = await conn.fetchrow(
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
                WHERE p.id = $1
            """,
                practice_id,
            )

            if not practice:
                raise HTTPException(status_code=404, detail="Practice not found")

            return dict(practice)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{practice_id}", response_model=PracticeResponse)
async def update_practice(
    practice_id: int,
    updates: PracticeUpdate,
    updated_by: str = Query(..., description="Team member making the update"),
    db: asyncpg.Pool = Depends(get_db_pool),
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
        async with db.acquire() as conn:
            # Build update query
            update_fields = []
            params = []
            param_count = 1

            for field, value in updates.dict(exclude_unset=True).items():
                if value is not None:
                    if field in ["documents", "missing_documents"]:
                        update_fields.append(f"{field} = ${param_count}")
                        params.append(json.dumps(value))
                    else:
                        update_fields.append(f"{field} = ${param_count}")
                        params.append(value)
                    param_count += 1

            if not update_fields:
                raise HTTPException(status_code=400, detail="No fields to update")

            query = f"""
                UPDATE practices
                SET {", ".join(update_fields)}, updated_at = NOW()
                WHERE id = ${param_count}
                RETURNING *
            """
            params.append(practice_id)

            updated_practice = await conn.fetchrow(query, *params)

            if not updated_practice:
                raise HTTPException(status_code=404, detail="Practice not found")

            # Log activity
            changed_fields = list(updates.dict(exclude_unset=True).keys())
            await conn.execute(
                """
                INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description, changes)
                VALUES ($1, $2, $3, $4, $5, $6)
            """,
                "practice",
                practice_id,
                "updated",
                updated_by,
                f"Updated: {', '.join(changed_fields)}",
                json.dumps(updates.dict(exclude_unset=True)),
            )

            # If status changed to 'completed' and there's an expiry date, create renewal alert
            if updates.status == "completed" and updates.expiry_date:
                alert_date = updates.expiry_date - timedelta(days=60)  # 60 days before expiry

                await conn.execute(
                    """
                    INSERT INTO renewal_alerts (
                        practice_id, client_id, alert_type, description,
                        target_date, alert_date, notify_team_member
                    )
                    SELECT
                        $1, client_id, 'renewal_due',
                        'Practice renewal due soon',
                        $2, $3, assigned_to
                    FROM practices
                    WHERE id = $4
                """,
                    practice_id,
                    updates.expiry_date,
                    alert_date,
                    practice_id,
                )

            logger.info(f"✅ Updated practice ID {practice_id} by {updated_by}")

            return dict(updated_practice)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update practice: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/{practice_id}/documents/add", response_model=DocumentAddResponse)
async def add_document_to_practice(
    practice_id: int,
    document_name: str = Query(...),
    drive_file_id: str = Query(...),
    uploaded_by: str = Query(...),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Add a document to a practice

    - **document_name**: Name/type of document (e.g., "Passport Copy")
    - **drive_file_id**: Google Drive file ID
    - **uploaded_by**: Email of person uploading
    """

    try:
        async with db.acquire() as conn:
            # Get current documents
            result = await conn.fetchrow("SELECT documents FROM practices WHERE id = $1", practice_id)

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
            await conn.execute(
                """
                UPDATE practices
                SET documents = $1, updated_at = NOW()
                WHERE id = $2
            """,
                json.dumps(documents),
                practice_id,
            )

            logger.info(f"✅ Added document '{document_name}' to practice {practice_id}")

            return {"success": True, "document": new_doc, "total_documents": len(documents)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to add document: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/stats/overview", response_model=PracticesStatsResponse)
async def get_practices_stats(db: asyncpg.Pool = Depends(get_db_pool)):
    """
    Get overall practice statistics

    - Counts by status
    - Counts by practice type
    - Revenue metrics
    """

    try:
        async with db.acquire() as conn:
            # By status
            by_status = await conn.fetch(
                """
                SELECT status, COUNT(*) as count
                FROM practices
                GROUP BY status
            """
            )

            # By practice type
            by_type = await conn.fetch(
                """
                SELECT pt.code, pt.name, COUNT(p.id) as count
                FROM practices p
                JOIN practice_types pt ON p.practice_type_id = pt.id
                GROUP BY pt.code, pt.name
                ORDER BY count DESC
            """
            )

            # Revenue stats
            revenue = await conn.fetchrow(
                """
                SELECT
                    SUM(actual_price) as total_revenue,
                    SUM(CASE WHEN payment_status = 'paid' THEN actual_price ELSE 0 END) as paid_revenue,
                    SUM(CASE WHEN payment_status IN ('unpaid', 'partial') THEN actual_price - COALESCE(paid_amount, 0) ELSE 0 END) as outstanding_revenue
                FROM practices
                WHERE actual_price IS NOT NULL
            """
            )

            # Active practices count
            active_count_row = await conn.fetchrow(
                """
                SELECT COUNT(*) as count
                FROM practices
                WHERE status IN ('inquiry', 'in_progress', 'waiting_documents', 'submitted_to_gov')
            """
            )
            active_count = active_count_row["count"]

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
