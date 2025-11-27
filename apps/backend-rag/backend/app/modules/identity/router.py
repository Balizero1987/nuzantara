"""
NUZANTARA PRIME - Identity Router
HTTP API endpoints for authentication
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.modules.identity.service import IdentityService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/team", tags=["identity"])

# Service instance (singleton)
_identity_service: IdentityService | None = None


def get_identity_service() -> IdentityService:
    """Get or create IdentityService instance"""
    global _identity_service
    if _identity_service is None:
        _identity_service = IdentityService()
    return _identity_service


# ============================================================================
# Request/Response Models
# ============================================================================


class LoginRequest(BaseModel):
    """Login request model"""

    email: EmailStr = Field(..., description="User email address")
    pin: str = Field(..., min_length=4, max_length=8, description="User PIN (4-8 digits)")


class LoginResponse(BaseModel):
    """Login response model (matches Node.js format exactly)"""

    success: bool
    sessionId: str
    token: str  # JWT token
    user: dict  # User object
    permissions: list[str]
    personalizedResponse: bool
    loginTime: str  # ISO timestamp


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/seed-team")
async def seed_team_endpoint() -> dict:
    """
    TEMPORARY: Seed team members database
    TODO: Remove this endpoint after seeding
    """
    try:
        import asyncpg

        from app.modules.identity.service import IdentityService

        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        # Team data
        TEAM_MEMBERS = [
            {"email": "zainal@balizero.com", "name": "Zainal Abidin", "role": "CEO", "pin": "847261", "department": "management", "language": "id", "notes": "52 anni, indonesiano e javanese, Islam"},
            {"email": "ruslana@balizero.com", "name": "Ruslana", "role": "Board Member", "pin": "293518", "department": "management", "language": "uk", "notes": "39 anni, ucraino, Donna che ama sognare"},
            {"email": "olena@balizero.com", "name": "Olena", "role": "Advisory", "pin": "925814", "department": "advisory", "language": "uk", "notes": "39 anni, ucraino"},
            {"email": "marta@balizero.com", "name": "Marta", "role": "Advisory", "pin": "847325", "department": "advisory", "language": "uk", "notes": "29 anni, ucraino"},
            {"email": "anton@balizero.com", "name": "Anton", "role": "Executive Consultant", "pin": "538147", "department": "setup", "language": "id", "notes": "31 anni, indonesiano/jakarta e javanese, Islam, Poco proattivo nel team"},
            {"email": "info@balizero.com", "name": "Vino", "role": "Junior Consultant", "pin": "926734", "department": "setup", "language": "id", "notes": "22 anni, indonesiano/jakarta e javanese, Islam, Poca conoscenza dell'inglese e parla pochissimo"},
            {"email": "krishna@balizero.com", "name": "Krishna", "role": "Executive Consultant", "pin": "471592", "department": "setup", "language": "id", "notes": "24 anni, indonesiano/jakarta e molto balinese, Indu, Ragazzo molto curioso e simpatico. Affabile. sta avendo un flirt con Dea"},
            {"email": "consulting@balizero.com", "name": "Adit", "role": "Supervisor", "pin": "385216", "department": "setup", "language": "id", "notes": "22 anni, indonesiano/jakarta e javanese e balinese, Islam, E' il mio vice sul campo, Ha cominciato a lavorare con me quando aveva 17 anni. Ha sempre dimostrato fedeltà e affetto verso di me. Ma spesso poco disciplinato e poco organizzato"},
            {"email": "ari.firda@balizero.com", "name": "Ari", "role": "Team Leader", "pin": "759483", "department": "setup", "language": "id", "notes": "24 anni, indonesiano/jakarta e molto sundanese, Islam, Ragazzo dalla grandissima forza di volontà. Da operaio in fabbrica a consulente legale con grande soddisfazione e ripercussione sulla sua vita privata, in positivo. Si è sposato a ottobre del 2025 con Lilis nella sua città di origine Bandung. Insieme ad Adit sono le mie rocce"},
            {"email": "dea@balizero.com", "name": "Dea", "role": "Executive Consultant", "pin": "162847", "department": "setup", "language": "id", "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Ragazza curiosa, e disposta al sacrificio. Sta lavorando nel Setup team ma anche nel marketing e nel tax department. Un vero Jolly. Sta avendo un flirt con Krishna"},
            {"email": "surya@balizero.com", "name": "Surya", "role": "Team Leader", "pin": "894621", "department": "setup", "language": "id", "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Lui è il Professore. Attentissimo alla cura personale e alla cura dei dettagli estetici. Si presenta bene ma deve studiare di più per avere quello scatto"},
            {"email": "damar@balizero.com", "name": "Damar", "role": "Junior Consultant", "pin": "637519", "department": "setup", "language": "id", "notes": "25 anni, indonesiano/jakarta e javanese, Islam, E' nuovo, ma un ragazzo ben educato. E questo è già sufficiente"},
            {"email": "tax@balizero.com", "name": "Veronika", "role": "Tax Manager", "pin": "418639", "department": "tax", "language": "id", "notes": "48 anni, indonesiano/jakarta, Cattolica, Il mio manager nel tax department, una donna che adora gli animali domestici. Molto rispettosa con me e ha creato una bella atmosfera con il gruppo del tax"},
            {"email": "angel.tax@balizero.com", "name": "Angel", "role": "Tax Lead", "pin": "341758", "department": "tax", "language": "id", "notes": "21 anni, indonesiano/jakarta e javanese, Islam, nonostante la sua giovane età è una veterana del tax. Giovane ragazza dedita alla sua task"},
            {"email": "kadek.tax@balizero.com", "name": "Kadek", "role": "Tax Lead", "pin": "786294", "department": "tax", "language": "id", "notes": "23 anni, indonesiano/jakarta e molto balinese, Indu, Ragazzo brillante che sta crescendo con l'inglese"},
            {"email": "dewa.ayu.tax@balizero.com", "name": "Dewa Ayu", "role": "Tax Lead", "pin": "259176", "department": "tax", "language": "id", "notes": "24 anni, indonesiano/jakarta e molto balinese, Indu, Dolce e ama Tik Tok"},
            {"email": "faisha.tax@balizero.com", "name": "Faisha", "role": "Take Care", "pin": "673942", "department": "tax", "language": "id", "notes": "19 anni, indonesiano/jakarta e molto sundanese, Un chiacchierone e si prende paura di tutto"},
            {"email": "rina@balizero.com", "name": "Rina", "role": "Reception", "pin": "214876", "department": "reception", "language": "id", "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Un po' introversa ma molto buona"},
            {"email": "sahira@balizero.com", "name": "Sahira", "role": "Junior Marketing e Accounting", "pin": "512638", "department": "marketing", "language": "id", "notes": "24 anni, indonesiano/jakarta e javanese, Islam, cerca di darsi un tono a lavoro e questo mi piace"},
            {"email": "zero@balizero.com", "name": "Zero", "role": "Founder", "pin": "010719", "department": "leadership", "language": "it", "notes": "Founder and Tech Lead"},
            {"email": "amanda@balizero.com", "name": "Amanda", "role": "Consultant", "pin": "614829", "department": "setup", "language": "id", "notes": "Consultant"},
            {"email": "nina@balizero.com", "name": "Nina", "role": "Advisory", "pin": "582931", "department": "marketing", "language": "id", "notes": "Advisory"},
        ]

        identity_service = IdentityService()
        conn = await asyncpg.connect(settings.database_url)

        try:
            # Ensure table has notes column
            await conn.execute(
                """
                ALTER TABLE team_members
                ADD COLUMN IF NOT EXISTS notes TEXT
                """
            )

            created_count = 0
            updated_count = 0
            errors = []

            for member in TEAM_MEMBERS:
                try:
                    pin_hash = identity_service.get_password_hash(member["pin"])
                    existing = await conn.fetchrow(
                        "SELECT id FROM team_members WHERE LOWER(email) = LOWER($1)",
                        member["email"]
                    )

                    if existing:
                        await conn.execute(
                            """
                            UPDATE team_members
                            SET full_name = $1, pin_hash = $2, role = $3, department = $4,
                                language = $5, notes = $6, active = true,
                                failed_attempts = 0, locked_until = NULL, updated_at = NOW()
                            WHERE LOWER(email) = LOWER($7)
                            """,
                            member["name"], pin_hash, member["role"], member["department"],
                            member.get("language", "en"), member.get("notes"),
                            member["email"]
                        )
                        updated_count += 1
                    else:
                        await conn.execute(
                            """
                            INSERT INTO team_members (full_name, email, pin_hash, role, department, language, notes, active)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                            """,
                            member["name"], member["email"], pin_hash, member["role"],
                            member["department"], member.get("language", "en"), member.get("notes")
                        )
                        created_count += 1
                except Exception as e:
                    errors.append(f"{member['email']}: {str(e)}")

            final_count = await conn.fetchval("SELECT COUNT(*) FROM team_members WHERE active = true")

            return {
                "success": True,
                "created": created_count,
                "updated": updated_count,
                "errors": errors,
                "total_active": final_count
            }
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Seed team error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")


@router.post("/run-migration-010")
async def run_migration_010() -> dict:
    """
    TEMPORARY: Execute migration 010 to fix team_members schema
    TODO: Remove this endpoint after migration is applied
    """
    try:
        import asyncpg

        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        conn = await asyncpg.connect(settings.database_url)
        results = []

        try:
            logger.info("Executing migration 010 (simplified)...")
            
            # Add missing columns one by one
            migrations = [
                ("full_name", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS full_name VARCHAR(255)"),
                ("pin_hash", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255)"),
                ("department", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS department VARCHAR(100)"),
                ("language", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en'"),
                ("personalized_response", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS personalized_response BOOLEAN DEFAULT false"),
                ("notes", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS notes TEXT"),
                ("last_login", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE"),
                ("failed_attempts", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0"),
                ("locked_until", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE"),
                ("active", "ALTER TABLE team_members ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true"),
            ]
            
            # Sync name to full_name if name exists but full_name doesn't
            try:
                await conn.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'team_members' AND column_name = 'name'
                        ) AND NOT EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'team_members' AND column_name = 'full_name'
                        ) THEN
                            ALTER TABLE team_members ADD COLUMN full_name VARCHAR(255);
                            UPDATE team_members SET full_name = name WHERE full_name IS NULL;
                        END IF;
                    END $$;
                """)
                results.append("✓ Synced name to full_name")
            except Exception as e:
                results.append(f"⚠ Name sync error: {str(e)}")
            
            for col_name, sql in migrations:
                try:
                    await conn.execute(sql)
                    results.append(f"✓ Added column: {col_name}")
                    logger.info(f"Added column: {col_name}")
                except Exception as e:
                    results.append(f"⚠ Column {col_name}: {str(e)}")
                    logger.warning(f"Column {col_name} error (may already exist): {e}")

            # Sync is_active to active if both exist
            try:
                await conn.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'team_members' AND column_name = 'is_active'
                        ) AND EXISTS (
                            SELECT 1 FROM information_schema.columns
                            WHERE table_name = 'team_members' AND column_name = 'active'
                        ) THEN
                            UPDATE team_members SET active = is_active WHERE active IS NULL;
                            ALTER TABLE team_members DROP COLUMN IF EXISTS is_active;
                        END IF;
                    END $$;
                """)
                results.append("✓ Synced is_active to active")
            except Exception as e:
                results.append(f"⚠ Sync error: {str(e)}")

            # Create indexes
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_team_members_department ON team_members(department)",
                "CREATE INDEX IF NOT EXISTS idx_team_members_language ON team_members(language)",
            ]
            
            for idx_sql in indexes:
                try:
                    await conn.execute(idx_sql)
                    results.append(f"✓ Created index")
                except Exception as e:
                    results.append(f"⚠ Index error: {str(e)}")

            # Verify columns
            cols = await conn.fetch("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'team_members' 
                AND column_name IN ('pin_hash', 'department', 'language', 'full_name', 'active', 'is_active', 'personalized_response', 'notes', 'last_login', 'failed_attempts', 'locked_until')
                ORDER BY column_name
            """)

            return {
                "success": True,
                "message": "Migration 010 executed successfully",
                "results": results,
                "columns": [{"name": c["column_name"], "type": c["data_type"]} for c in cols]
            }
        except Exception as e:
            logger.error(f"Migration 010 error: {e}", exc_info=True)
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Full traceback: {error_details}")
            raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")
        finally:
            await conn.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Migration failed: {str(e)}")


@router.get("/debug-auth")
async def debug_auth() -> dict:
    """
    TEMPORARY: Debug authentication - analizza l'hash nel database
    TODO: Remove this endpoint after debugging
    """
    try:
        import asyncpg
        import bcrypt

        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        conn = await asyncpg.connect(settings.database_url)

        try:
            # Query user
            query = """
                SELECT id, full_name as name, email, pin_hash, role, active as is_active
                FROM team_members
                WHERE LOWER(email) = LOWER($1)
            """

            row = await conn.fetchrow(query, "zero@balizero.com")

            if not row:
                return {"error": "User not found"}

            pin_hash_from_db = row["pin_hash"]
            pin = "010719"

            # Analisi hash
            analysis = {
                "hash_type": str(type(pin_hash_from_db)),
                "hash_length": len(pin_hash_from_db),
                "hash_value_raw": repr(pin_hash_from_db),
                "hash_value_str": pin_hash_from_db,
                "hash_first_20": pin_hash_from_db[:20] if pin_hash_from_db else None,
                "starts_with_b_quote": pin_hash_from_db.startswith("b'") if pin_hash_from_db else False,
                "starts_with_dollar": pin_hash_from_db.startswith("$2") if pin_hash_from_db else False,
            }

            # Test verifica
            verification_tests = {}

            # Test 1: Standard
            try:
                plain_bytes = pin.encode('utf-8')
                hashed_bytes = pin_hash_from_db.encode('utf-8')
                result = bcrypt.checkpw(plain_bytes, hashed_bytes)
                verification_tests["standard"] = {
                    "success": result,
                    "error": None
                }
            except Exception as e:
                verification_tests["standard"] = {
                    "success": False,
                    "error": f"{type(e).__name__}: {str(e)}"
                }

            # Test 2: Se inizia con b', pulisci
            if pin_hash_from_db.startswith("b'") or pin_hash_from_db.startswith('b"'):
                try:
                    cleaned_hash = pin_hash_from_db
                    if cleaned_hash.startswith("b'"):
                        cleaned_hash = cleaned_hash[2:]
                    if cleaned_hash.startswith('b"'):
                        cleaned_hash = cleaned_hash[2:]
                    if cleaned_hash.endswith("'") or cleaned_hash.endswith('"'):
                        cleaned_hash = cleaned_hash[:-1]

                    plain_bytes = pin.encode('utf-8')
                    hashed_bytes = cleaned_hash.encode('utf-8')
                    result = bcrypt.checkpw(plain_bytes, hashed_bytes)
                    verification_tests["cleaned"] = {
                        "success": result,
                        "error": None,
                        "cleaned_hash_preview": cleaned_hash[:30] + "..."
                    }
                except Exception as e:
                    verification_tests["cleaned"] = {
                        "success": False,
                        "error": f"{type(e).__name__}: {str(e)}"
                    }

            return {
                "user": {
                    "email": row["email"],
                    "name": row["name"],
                    "role": row["role"]
                },
                "hash_analysis": analysis,
                "verification_tests": verification_tests,
                "pin_tested": pin
            }
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Debug auth error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Debug failed: {str(e)}")


@router.post("/reset-admin")
async def reset_admin_user() -> dict:
    """
    TEMPORARY: Reset admin user (zero@balizero.com) with PIN 010719
    TODO: Remove this endpoint after admin is set up
    """
    try:
        import asyncpg

        if not settings.database_url:
            raise HTTPException(status_code=500, detail="DATABASE_URL not configured")

        # Get identity service for password hashing (UNIFIED CRYPTO LOGIC)
        identity_service = get_identity_service()

        conn = await asyncpg.connect(settings.database_url)

        try:
            # Create table if it doesn't exist (migration)
            # Note: Using full_name and active to match migration 007 schema
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS team_members (
                    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    pin_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(100) NOT NULL DEFAULT 'member',
                    department VARCHAR(100),
                    language VARCHAR(10) DEFAULT 'en',
                    personalized_response BOOLEAN DEFAULT false,
                    active BOOLEAN DEFAULT true,
                    last_login TIMESTAMP,
                    failed_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            """
            )

            # Create index if not exists
            await conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(LOWER(email))
            """
            )

            # Hash PIN using identity service (UNIFIED CRYPTO LOGIC - same as login)
            pin_hash = identity_service.get_password_hash("010719")

            # Insert or update
            result = await conn.fetchrow(
                """
                INSERT INTO team_members (full_name, email, pin_hash, role, department, language, active)
                VALUES ($1, $2, $3, $4, $5, $6, true)
                ON CONFLICT (email) DO UPDATE SET
                    pin_hash = EXCLUDED.pin_hash,
                    active = true,
                    failed_attempts = 0,
                    locked_until = NULL,
                    updated_at = NOW()
                RETURNING id, full_name as name, email, role
                """,
                "Zero",
                "zero@balizero.com",
                pin_hash,
                "Founder",
                "leadership",
                "it",
            )

            return {
                    "success": True,
                "message": "Admin user ready",
                "email": result["email"],
                "pin": "010719",
                "name": result["name"],
                "role": result["role"],
            }
        except Exception as inner_e:
            raise HTTPException(status_code=500, detail=f"Database operation failed: {str(inner_e)}")
        finally:
            await conn.close()
    except Exception as e:
        logger.error(f"Reset admin error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reset admin: {str(e)}")


@router.post("/login", response_model=LoginResponse)
async def team_login(request: LoginRequest) -> LoginResponse:
    """
    Team member login endpoint

    Replicates the exact behavior of Node.js /api/auth/team/login endpoint.

    - Validates email and PIN format
    - Authenticates user against database
    - Generates JWT token (7 days expiry)
    - Returns user data and permissions

    Returns:
        LoginResponse with JWT token and user data
    """
    try:
        # Validate PIN format (4-8 digits, same as Node.js)
        if not request.pin.isdigit():
            raise HTTPException(status_code=400, detail="Invalid PIN format. Must be 4-8 digits.")

        if len(request.pin) < 4 or len(request.pin) > 8:
            raise HTTPException(status_code=400, detail="Invalid PIN format. Must be 4-8 digits.")

        # Get service instance
        identity_service = get_identity_service()

        # Authenticate user
        user = await identity_service.authenticate_user(email=request.email, pin=request.pin)

        if not user:
            logger.warning(f"Login failed for {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or PIN. Please try again.")

        # Generate session ID (same format as Node.js)
        session_id = f"session_{int(datetime.now(timezone.utc).timestamp() * 1000)}_{user.id}"

        # Create JWT token
        token = identity_service.create_access_token(user, session_id)

        # Get permissions
        permissions = identity_service.get_permissions_for_role(user.role)

        # Prepare response (matches Node.js format exactly)
        login_time = datetime.now(timezone.utc).isoformat()

        response = LoginResponse(
            success=True,
            sessionId=session_id,
            token=token,
            user={
                "id": user.id,
                "name": user.name,
                "role": user.role,
                "department": user.department,
                "language": user.language or "en",
                "email": user.email,
            },
            permissions=permissions,
            personalizedResponse=user.personalized_response or False,
            loginTime=login_time,
        )

        logger.info(f"🔐 Team login successful: {user.name} ({user.role}) - Session: {session_id}")

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error for {request.email}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Authentication service unavailable")
