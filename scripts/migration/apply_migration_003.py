#!/usr/bin/env python3
"""
Apply migration 003: Work Sessions Schema
Runs migration 003_work_sessions_schema.sql on Fly.io PostgreSQL
"""

import asyncio
import asyncpg
import os
from pathlib import Path


async def apply_migration():
    """Apply migration 003 to Fly.io PostgreSQL database"""

    # Get DATABASE_URL from environment
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not found")
        print("   Please set DATABASE_URL to your Fly.io PostgreSQL connection string")
        return False

    print("=" * 70)
    print("🚀 APPLYING MIGRATION 003: Work Sessions Schema")
    print("=" * 70)
    print(f"📊 Database: {database_url[:50]}...")
    print()

    try:
        # Read migration file
        migration_file = Path(__file__).parent.parent / "apps/backend-rag/backend/db/migrations/003_work_sessions_schema.sql"

        if not migration_file.exists():
            print(f"❌ Migration file not found: {migration_file}")
            return False

        print(f"📄 Reading migration: {migration_file.name}")

        with open(migration_file, 'r') as f:
            migration_sql = f.read()

        print(f"   SQL size: {len(migration_sql)} bytes")
        print()

        # Connect to database
        print("🔌 Connecting to PostgreSQL...")
        conn = await asyncpg.connect(database_url)
        print("✅ Connected successfully")
        print()

        # Apply migration
        print("⚙️ Applying migration 003...")
        await conn.execute(migration_sql)
        print("✅ Migration applied successfully")
        print()

        # Verify tables were created
        print("🔍 Verifying tables...")

        # Check team_work_sessions table
        sessions_count = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'team_work_sessions'
        """)

        # Check team_daily_reports table
        reports_count = await conn.fetchval("""
            SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name = 'team_daily_reports'
        """)

        if sessions_count > 0:
            print("   ✅ team_work_sessions table created")
        else:
            print("   ⚠️ team_work_sessions table not found")

        if reports_count > 0:
            print("   ✅ team_daily_reports table created")
        else:
            print("   ⚠️ team_daily_reports table not found")

        print()

        # Check indexes
        print("🔍 Checking indexes...")
        indexes = await conn.fetch("""
            SELECT indexname FROM pg_indexes
            WHERE tablename IN ('team_work_sessions', 'team_daily_reports')
            ORDER BY indexname
        """)

        for idx in indexes:
            print(f"   ✅ {idx['indexname']}")

        print()

        await conn.close()

        print("=" * 70)
        print("✅ MIGRATION 003 COMPLETED SUCCESSFULLY")
        print("=" * 70)
        print()
        print("Next steps:")
        print("1. Deploy to Fly.io: git push")
        print("2. Test work session tracking")
        print("3. Check ZERO notifications")
        print()

        return True

    except Exception as e:
        print()
        print("=" * 70)
        print(f"❌ MIGRATION FAILED")
        print("=" * 70)
        print(f"Error: {e}")
        print()
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(apply_migration())
    exit(0 if success else 1)
