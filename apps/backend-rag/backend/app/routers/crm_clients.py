"""
ZANTARA CRM - Clients Management Router
Endpoints for managing client data (anagrafica clienti)
"""

import logging
from datetime import datetime

import psycopg2
from fastapi import APIRouter, HTTPException, Query
from psycopg2.extras import Json, RealDictCursor
from pydantic import BaseModel, EmailStr

from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/crm/clients", tags=["crm-clients"])


# ================================================
# PYDANTIC MODELS
# ================================================


class ClientCreate(BaseModel):
    full_name: str
    email: EmailStr | None = None
    phone: str | None = None
    whatsapp: str | None = None
    nationality: str | None = None
    passport_number: str | None = None
    client_type: str = "individual"  # 'individual' or 'company'
    assigned_to: str | None = None  # team member email
    address: str | None = None
    notes: str | None = None
    tags: list[str] = []
    custom_fields: dict = {}


class ClientUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    whatsapp: str | None = None
    nationality: str | None = None
    passport_number: str | None = None
    status: str | None = None  # 'active', 'inactive', 'prospect'
    client_type: str | None = None
    assigned_to: str | None = None
    address: str | None = None
    notes: str | None = None
    tags: list[str] | None = None
    custom_fields: dict | None = None


class ClientResponse(BaseModel):
    id: int
    uuid: str
    full_name: str
    email: str | None
    phone: str | None
    whatsapp: str | None
    nationality: str | None
    status: str
    client_type: str
    assigned_to: str | None
    first_contact_date: datetime | None
    last_interaction_date: datetime | None
    tags: list[str]
    created_at: datetime
    updated_at: datetime


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


@router.post("/", response_model=ClientResponse)
async def create_client(
    client: ClientCreate,
    created_by: str = Query(..., description="Team member email creating this client"),
):
    """
    Create a new client

    - **full_name**: Client's full name (required)
    - **email**: Email address (optional but recommended)
    - **phone**: Phone number
    - **whatsapp**: WhatsApp number (can be same as phone)
    - **nationality**: Client's nationality
    - **passport_number**: Passport number
    - **assigned_to**: Team member email to assign client to
    - **tags**: Array of tags (e.g., ['vip', 'urgent'])
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert client
        cursor.execute(
            """
            INSERT INTO clients (
                full_name, email, phone, whatsapp, nationality, passport_number,
                client_type, assigned_to, address, notes, tags, custom_fields,
                first_contact_date, created_by, status
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            RETURNING *
        """,
            (
                client.full_name,
                client.email,
                client.phone,
                client.whatsapp,
                client.nationality,
                client.passport_number,
                client.client_type,
                client.assigned_to,
                client.address,
                client.notes,
                Json(client.tags),
                Json(client.custom_fields),
                datetime.now(),
                created_by,
                "active",
            ),
        )

        new_client = cursor.fetchone()
        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Created client: {client.full_name} (ID: {new_client['id']})")

        return ClientResponse(**new_client)

    except psycopg2.IntegrityError as e:
        logger.error(f"❌ Integrity error creating client: {e}")
        raise HTTPException(
            status_code=400, detail="Client with this email or phone already exists"
        ) from e

    except Exception as e:
        logger.error(f"❌ Failed to create client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/", response_model=list[ClientResponse])
async def list_clients(
    status: str | None = Query(None, description="Filter by status: active, inactive, prospect"),
    assigned_to: str | None = Query(None, description="Filter by assigned team member email"),
    search: str | None = Query(None, description="Search by name, email, or phone"),
    limit: int = Query(50, le=200, description="Max results to return"),
    offset: int = Query(0, description="Offset for pagination"),
):
    """
    List all clients with optional filtering

    - **status**: Filter by client status
    - **assigned_to**: Filter by assigned team member
    - **search**: Search in name, email, phone fields
    - **limit**: Max results (default: 50, max: 200)
    - **offset**: For pagination
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build query
        query = "SELECT * FROM clients WHERE 1=1"
        params = []

        if status:
            query += " AND status = %s"
            params.append(status)

        if assigned_to:
            query += " AND assigned_to = %s"
            params.append(assigned_to)

        if search:
            query += """ AND (
                full_name ILIKE %s OR
                email ILIKE %s OR
                phone ILIKE %s
            )"""
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])

        query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, params)
        clients = cursor.fetchall()

        cursor.close()
        conn.close()

        return [ClientResponse(**client) for client in clients]

    except Exception as e:
        logger.error(f"❌ Failed to list clients: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int):
    """Get client by ID"""

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM clients WHERE id = %s", (client_id,))
        client = cursor.fetchone()

        cursor.close()
        conn.close()

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        return ClientResponse(**client)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/by-email/{email}")
async def get_client_by_email(email: str):
    """Get client by email address"""

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM clients WHERE email = %s", (email,))
        client = cursor.fetchone()

        cursor.close()
        conn.close()

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        return ClientResponse(**client)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get client by email: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    updates: ClientUpdate,
    updated_by: str = Query(..., description="Team member making the update"),
):
    """
    Update client information

    Only provided fields will be updated. Other fields remain unchanged.
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build update query dynamically
        update_fields = []
        params = []

        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                if field in ["tags", "custom_fields"]:
                    update_fields.append(f"{field} = %s")
                    params.append(Json(value))
                else:
                    update_fields.append(f"{field} = %s")
                    params.append(value)

        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")

        query = f"""
            UPDATE clients
            SET {", ".join(update_fields)}, updated_at = NOW()
            WHERE id = %s
            RETURNING *
        """
        params.append(client_id)

        cursor.execute(query, params)
        updated_client = cursor.fetchone()

        if not updated_client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Log activity
        cursor.execute(
            """
            INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
            VALUES (%s, %s, %s, %s, %s)
        """,
            (
                "client",
                client_id,
                "updated",
                updated_by,
                f"Updated fields: {', '.join(updates.dict(exclude_unset=True).keys())}",
            ),
        )

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Updated client ID {client_id} by {updated_by}")

        return ClientResponse(**updated_client)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{client_id}")
async def delete_client(
    client_id: int, deleted_by: str = Query(..., description="Team member deleting the client")
):
    """
    Delete a client (soft delete - marks as inactive)

    This doesn't permanently delete the client, just marks them as inactive.
    Use with caution as this will also affect related practices and interactions.
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Soft delete (mark as inactive)
        cursor.execute(
            """
            UPDATE clients
            SET status = 'inactive', updated_at = NOW()
            WHERE id = %s
            RETURNING id
        """,
            (client_id,),
        )

        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Client not found")

        # Log activity
        cursor.execute(
            """
            INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
            VALUES (%s, %s, %s, %s, %s)
        """,
            ("client", client_id, "deleted", deleted_by, "Client marked as inactive"),
        )

        conn.commit()

        cursor.close()
        conn.close()

        logger.info(f"✅ Deleted (soft) client ID {client_id} by {deleted_by}")

        return {"success": True, "message": "Client marked as inactive"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{client_id}/summary")
async def get_client_summary(client_id: int):
    """
    Get comprehensive client summary including:
    - Basic client info
    - All practices (active + completed)
    - Recent interactions
    - Documents
    - Upcoming renewals
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get client basic info
        cursor.execute("SELECT * FROM clients WHERE id = %s", (client_id,))
        client = cursor.fetchone()

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get practices
        cursor.execute(
            """
            SELECT p.*, pt.name as practice_type_name, pt.category
            FROM practices p
            JOIN practice_types pt ON p.practice_type_id = pt.id
            WHERE p.client_id = %s
            ORDER BY p.created_at DESC
        """,
            (client_id,),
        )
        practices = cursor.fetchall()

        # Get recent interactions
        cursor.execute(
            """
            SELECT *
            FROM interactions
            WHERE client_id = %s
            ORDER BY interaction_date DESC
            LIMIT 10
        """,
            (client_id,),
        )
        interactions = cursor.fetchall()

        # Get upcoming renewals
        cursor.execute(
            """
            SELECT *
            FROM renewal_alerts
            WHERE client_id = %s AND status = 'pending'
            ORDER BY alert_date ASC
        """,
            (client_id,),
        )
        renewals = cursor.fetchall()

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
                "list": [dict(p) for p in practices],
            },
            "interactions": {"total": len(interactions), "recent": [dict(i) for i in interactions]},
            "renewals": {"upcoming": [dict(r) for r in renewals]},
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get client summary: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/stats/overview")
async def get_clients_stats():
    """
    Get overall client statistics

    Returns counts by status, top assigned team members, etc.
    """

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Total clients by status
        cursor.execute(
            """
            SELECT status, COUNT(*) as count
            FROM clients
            GROUP BY status
        """
        )
        by_status = cursor.fetchall()

        # Clients by assigned team member
        cursor.execute(
            """
            SELECT assigned_to, COUNT(*) as count
            FROM clients
            WHERE assigned_to IS NOT NULL
            GROUP BY assigned_to
            ORDER BY count DESC
        """
        )
        by_team_member = cursor.fetchall()

        # New clients last 30 days
        cursor.execute(
            """
            SELECT COUNT(*) as count
            FROM clients
            WHERE created_at >= NOW() - INTERVAL '30 days'
        """
        )
        new_last_30_days = cursor.fetchone()["count"]

        cursor.close()
        conn.close()

        return {
            "total": sum(row["count"] for row in by_status),
            "by_status": {row["status"]: row["count"] for row in by_status},
            "by_team_member": [dict(row) for row in by_team_member],
            "new_last_30_days": new_last_30_days,
        }

    except Exception as e:
        logger.error(f"❌ Failed to get client stats: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
