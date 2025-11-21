"""
ZANTARA - Admin Migration Endpoint (TEMPORARY)
Apply CRM schema migration via API
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
import logging
import os
import psycopg2
from pathlib import Path

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

# Security: require API key
ADMIN_API_KEY = "zantara-internal-dev-key-2025"


@router.post("/apply-migration-007")
async def apply_migration_007(x_api_key: str = Header(...)):
    """
    TEMPORARY ENDPOINT: Apply CRM schema migration 007

    Requires: x-api-key header
    """

    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")

    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not set")

        # Read migration SQL
        migration_file = Path(__file__).parent.parent.parent / "db/migrations/007_crm_system_schema.sql"

        if not migration_file.exists():
            raise HTTPException(status_code=500, detail=f"Migration file not found: {migration_file}")

        logger.info(f"📁 Reading migration from {migration_file}")

        with open(migration_file, 'r') as f:
            sql = f.read()

        # Connect and execute
        logger.info("🔌 Connecting to PostgreSQL...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        logger.info("⚙️  Executing migration 007...")
        cursor.execute(sql)

        conn.commit()

        # Verify tables created
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'team_members', 'clients', 'practice_types', 'practices',
                'interactions', 'documents', 'renewal_alerts', 'crm_settings',
                'activity_log'
            )
            ORDER BY table_name
        """)

        tables = [row[0] for row in cursor.fetchall()]

        # Get practice types
        cursor.execute("SELECT code, name FROM practice_types ORDER BY code")
        practice_types = [{"code": row[0], "name": row[1]} for row in cursor.fetchall()]

        # Get views
        cursor.execute("""
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema = 'public'
            AND table_name LIKE '%_view'
            ORDER BY table_name
        """)
        views = [row[0] for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        logger.info("✅ Migration 007 applied successfully!")

        return {
            "success": True,
            "message": "Migration 007 applied successfully",
            "tables_created": tables,
            "practice_types_loaded": practice_types,
            "views_created": views,
            "total_tables": len(tables),
            "total_practice_types": len(practice_types),
            "total_views": len(views)
        }

    except psycopg2.Error as e:
        logger.error(f"❌ Database error: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/check-crm-tables")
async def check_crm_tables():
    """
    Check if CRM tables exist (no auth required for checking)
    """

    try:
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return {"exists": False, "error": "DATABASE_URL not set"}

        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN (
                'team_members', 'clients', 'practice_types', 'practices',
                'interactions', 'documents', 'renewal_alerts', 'crm_settings',
                'activity_log'
            )
            ORDER BY table_name
        """)

        tables = [row[0] for row in cursor.fetchall()]

        cursor.close()
        conn.close()

        return {
            "exists": len(tables) > 0,
            "tables_found": tables,
            "total": len(tables),
            "expected": 9,
            "ready": len(tables) == 9
        }

    except Exception as e:
        return {
            "exists": False,
            "error": str(e)
        }
