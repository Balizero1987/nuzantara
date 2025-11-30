"""
ZANTARA CRM - Clients Management Router
Endpoints for managing client data (anagrafica clienti)
"""

import json
import logging
from datetime import datetime

import asyncpg
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr

from ..dependencies import get_db_pool

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
# ENDPOINTS
# ================================================


@router.post("/", response_model=ClientResponse)
async def create_client(
    client: ClientCreate,
    created_by: str = Query(..., description="Team member email creating this client"),
    db: asyncpg.Pool = Depends(get_db_pool),
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
        async with db.acquire() as conn:
            # Insert client
            new_client = await conn.fetchrow(
                """
                INSERT INTO clients (
                    full_name, email, phone, whatsapp, nationality, passport_number,
                    client_type, assigned_to, address, notes, tags, custom_fields,
                    first_contact_date, created_by, status
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                )
                RETURNING *
                """,
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
                json.dumps(client.tags),
                json.dumps(client.custom_fields),
                datetime.now(),
                created_by,
                "active",
            )

        logger.info(f"✅ Created client: {client.full_name} (ID: {new_client['id']})")
        return ClientResponse(**dict(new_client))

    except asyncpg.UniqueViolationError as e:
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
    db: asyncpg.Pool = Depends(get_db_pool),
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
        async with db.acquire() as conn:
            # Build query with parameterized placeholders
            conditions = ["1=1"]
            params = []
            param_idx = 1

            if status:
                conditions.append(f"status = ${param_idx}")
                params.append(status)
                param_idx += 1

            if assigned_to:
                conditions.append(f"assigned_to = ${param_idx}")
                params.append(assigned_to)
                param_idx += 1

            if search:
                search_pattern = f"%{search}%"
                conditions.append(
                    f"(full_name ILIKE ${param_idx} OR email ILIKE ${param_idx + 1} OR phone ILIKE ${param_idx + 2})"
                )
                params.extend([search_pattern, search_pattern, search_pattern])
                param_idx += 3

            query = f"""
                SELECT * FROM clients
                WHERE {' AND '.join(conditions)}
                ORDER BY created_at DESC
                LIMIT ${param_idx} OFFSET ${param_idx + 1}
            """
            params.extend([limit, offset])

            clients = await conn.fetch(query, *params)

        return [ClientResponse(**dict(client)) for client in clients]

    except Exception as e:
        logger.error(f"❌ Failed to list clients: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: int,
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """Get client by ID"""

    try:
        async with db.acquire() as conn:
            client = await conn.fetchrow("SELECT * FROM clients WHERE id = $1", client_id)

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        return ClientResponse(**dict(client))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/by-email/{email}", response_model=ClientResponse)
async def get_client_by_email(
    email: str,
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """Get client by email address"""

    try:
        async with db.acquire() as conn:
            client = await conn.fetchrow("SELECT * FROM clients WHERE email = $1", email)

        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        return ClientResponse(**dict(client))

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
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Update client information

    Only provided fields will be updated. Other fields remain unchanged.
    """

    try:
        # Build update query with field validation
        allowed_fields = {
            "full_name",
            "email",
            "phone",
            "whatsapp",
            "nationality",
            "passport_number",
            "status",
            "client_type",
            "assigned_to",
            "address",
            "notes",
            "tags",
            "custom_fields",
        }

        update_parts = []
        params = []
        param_idx = 1

        for field, value in updates.model_dump(exclude_unset=True).items():
            # Validate field name to prevent SQL injection
            if field not in allowed_fields:
                raise HTTPException(status_code=400, detail=f"Invalid field name: {field}")

            if value is not None:
                if field in ["tags", "custom_fields"]:
                    update_parts.append(f"{field} = ${param_idx}")
                    params.append(json.dumps(value))
                else:
                    update_parts.append(f"{field} = ${param_idx}")
                    params.append(value)
                param_idx += 1

        if not update_parts:
            raise HTTPException(status_code=400, detail="No fields to update")

        async with db.acquire() as conn:
            query = f"""
                UPDATE clients
                SET {", ".join(update_parts)}, updated_at = NOW()
                WHERE id = ${param_idx}
                RETURNING *
            """
            params.append(client_id)

            updated_client = await conn.fetchrow(query, *params)

            if not updated_client:
                raise HTTPException(status_code=404, detail="Client not found")

            # Log activity
            await conn.execute(
                """
                INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
                VALUES ($1, $2, $3, $4, $5)
                """,
                "client",
                client_id,
                "updated",
                updated_by,
                f"Updated fields: {', '.join(updates.model_dump(exclude_unset=True).keys())}",
            )

        logger.info(f"✅ Updated client ID {client_id} by {updated_by}")
        return ClientResponse(**dict(updated_client))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to update client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    deleted_by: str = Query(..., description="Team member deleting the client"),
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Delete a client (soft delete - marks as inactive)

    This doesn't permanently delete the client, just marks them as inactive.
    Use with caution as this will also affect related practices and interactions.
    """

    try:
        async with db.acquire() as conn:
            # Soft delete (mark as inactive)
            result = await conn.fetchrow(
                """
                UPDATE clients
                SET status = 'inactive', updated_at = NOW()
                WHERE id = $1
                RETURNING id
                """,
                client_id,
            )

            if not result:
                raise HTTPException(status_code=404, detail="Client not found")

            # Log activity
            await conn.execute(
                """
                INSERT INTO activity_log (entity_type, entity_id, action, performed_by, description)
                VALUES ($1, $2, $3, $4, $5)
                """,
                "client",
                client_id,
                "deleted",
                deleted_by,
                "Client marked as inactive",
            )

        logger.info(f"✅ Deleted (soft) client ID {client_id} by {deleted_by}")
        return {"success": True, "message": "Client marked as inactive"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete client: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/{client_id}/summary")
async def get_client_summary(
    client_id: int,
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get comprehensive client summary including:
    - Basic client info
    - All practices (active + completed)
    - Recent interactions
    - Documents
    - Upcoming renewals
    """

    try:
        async with db.acquire() as conn:
            # Get client basic info
            client = await conn.fetchrow("SELECT * FROM clients WHERE id = $1", client_id)

            if not client:
                raise HTTPException(status_code=404, detail="Client not found")

            # Get practices
            practices = await conn.fetch(
                """
                SELECT p.*, pt.name as practice_type_name, pt.category
                FROM practices p
                JOIN practice_types pt ON p.practice_type_id = pt.id
                WHERE p.client_id = $1
                ORDER BY p.created_at DESC
                """,
                client_id,
            )

            # Get recent interactions
            interactions = await conn.fetch(
                """
                SELECT *
                FROM interactions
                WHERE client_id = $1
                ORDER BY interaction_date DESC
                LIMIT 10
                """,
                client_id,
            )

            # Get upcoming renewals
            renewals = await conn.fetch(
                """
                SELECT *
                FROM renewal_alerts
                WHERE client_id = $1 AND status = 'pending'
                ORDER BY alert_date ASC
                """,
                client_id,
            )

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
async def get_clients_stats(
    db: asyncpg.Pool = Depends(get_db_pool),
):
    """
    Get overall client statistics

    Returns counts by status, top assigned team members, etc.
    """

    try:
        async with db.acquire() as conn:
            # Total clients by status
            by_status = await conn.fetch(
                """
                SELECT status, COUNT(*) as count
                FROM clients
                GROUP BY status
                """
            )

            # Clients by assigned team member
            by_team_member = await conn.fetch(
                """
                SELECT assigned_to, COUNT(*) as count
                FROM clients
                WHERE assigned_to IS NOT NULL
                GROUP BY assigned_to
                ORDER BY count DESC
                """
            )

            # New clients last 30 days
            new_count = await conn.fetchval(
                """
                SELECT COUNT(*) as count
                FROM clients
                WHERE created_at >= NOW() - INTERVAL '30 days'
                """
            )

        return {
            "total": sum(row["count"] for row in by_status),
            "by_status": {row["status"]: row["count"] for row in by_status},
            "by_team_member": [dict(row) for row in by_team_member],
            "new_last_30_days": new_count,
        }

    except Exception as e:
        logger.error(f"❌ Failed to get client stats: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
