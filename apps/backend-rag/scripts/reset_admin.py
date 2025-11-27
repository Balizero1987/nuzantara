#!/usr/bin/env python3
"""
NUZANTARA PRIME - Admin User Reset Script
Creates or resets the admin user (zero@balizero.com) with PIN 010719
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    import asyncpg
except ImportError:
    print("❌ ERROR: asyncpg not installed")
    print("   Install with: pip install asyncpg")
    sys.exit(1)

try:
    from passlib.context import CryptContext
except ImportError:
    print("❌ ERROR: passlib not installed")
    print("   Install with: pip install passlib[bcrypt]")
    sys.exit(1)

try:
    from app.core.config import settings
except ImportError as e:
    print(f"❌ ERROR: Failed to import settings: {e}")
    print("   Make sure you're running from apps/backend-rag/ directory")
    sys.exit(1)

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ADMIN_EMAIL = "zero@balizero.com"
ADMIN_PIN = "010719"
ADMIN_NAME = "Zero"
ADMIN_ROLE = "Founder"  # Using "Founder" to match existing data structure
ADMIN_DEPARTMENT = "leadership"
ADMIN_LANGUAGE = "it"


async def reset_admin_user() -> None:
    """
    Create or reset admin user in database

    - If user doesn't exist: Creates new user
    - If user exists: Updates PIN hash to ensure it works
    """
    if not settings.database_url:
        print("❌ ERROR: DATABASE_URL not configured")
        print("   Set DATABASE_URL environment variable before running this script")
        sys.exit(1)

    print("🔄 Resetting admin user...")
    print(f"   Email: {ADMIN_EMAIL}")
    print(f"   PIN: {ADMIN_PIN}")
    print("")

    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(settings.database_url)
        print("✅ Connected to database")

        # Hash the PIN using bcrypt (same as Node.js)
        pin_hash = pwd_context.hash(ADMIN_PIN)
        print("✅ PIN hashed successfully")

        # Check if user exists
        existing_user = await conn.fetchrow(
            """
            SELECT id, name, email, role, is_active, locked_until
            FROM team_members
            WHERE LOWER(email) = LOWER($1)
            """,
            ADMIN_EMAIL,
        )

        if existing_user:
            print(f"📋 User exists: {existing_user['name']} ({existing_user['email']})")

            # Update user (reset PIN, unlock account, activate)
            await conn.execute(
                """
                UPDATE team_members
                SET pin_hash = $1,
                    name = $2,
                    role = $3,
                    department = $4,
                    language = $5,
                    is_active = true,
                    failed_attempts = 0,
                    locked_until = NULL,
                    updated_at = NOW()
                WHERE LOWER(email) = LOWER($6)
                """,
                pin_hash,
                ADMIN_NAME,
                ADMIN_ROLE,
                ADMIN_DEPARTMENT,
                ADMIN_LANGUAGE,
                ADMIN_EMAIL,
            )
            print("✅ User updated (PIN reset, account unlocked)")
        else:
            print("📋 User does not exist, creating new user...")

            # Insert new user
            result = await conn.fetchrow(
                """
                INSERT INTO team_members (
                    name, email, pin_hash, role, department, language, is_active
                )
                VALUES ($1, $2, $3, $4, $5, $6, true)
                RETURNING id, name, email, role
                """,
                ADMIN_NAME,
                ADMIN_EMAIL,
                pin_hash,
                ADMIN_ROLE,
                ADMIN_DEPARTMENT,
                ADMIN_LANGUAGE,
            )
            print(f"✅ User created: {result['name']} (ID: {result['id']})")

        # Verify the user was created/updated correctly
        verified_user = await conn.fetchrow(
            """
            SELECT id, name, email, role, department, language, is_active,
                   failed_attempts, locked_until
            FROM team_members
            WHERE LOWER(email) = LOWER($1)
            """,
            ADMIN_EMAIL,
        )

        if not verified_user:
            print("❌ ERROR: User verification failed")
            sys.exit(1)

        print("")
        print("=" * 70)
        print("✅ Admin user ready.")
        print(f"   Email: {verified_user['email']}")
        print(f"   PIN: {ADMIN_PIN}")
        print(f"   Name: {verified_user['name']}")
        print(f"   Role: {verified_user['role']}")
        print(f"   Status: {'Active' if verified_user['is_active'] else 'Inactive'}")
        print(f"   Failed Attempts: {verified_user['failed_attempts']}")
        print(f"   Locked: {'Yes' if verified_user['locked_until'] else 'No'}")
        print("=" * 70)
        print("")
        print("🚀 You can now test login with:")
        print("   curl -X POST https://nuzantara-rag.fly.dev/api/auth/team/login \\")
        print('     -H "Content-Type: application/json" \\')
        print(f'     -d \'{{"email": "{ADMIN_EMAIL}", "pin": "{ADMIN_PIN}"}}\'')
        print("")

    except asyncpg.exceptions.PostgresError as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn:
            await conn.close()
            print("✅ Database connection closed")


if __name__ == "__main__":
    asyncio.run(reset_admin_user())
