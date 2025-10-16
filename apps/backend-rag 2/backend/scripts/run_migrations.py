#!/usr/bin/env python3
"""
Run database migrations on Railway PostgreSQL
Called during container startup before main application starts
"""
import os
import sys
from pathlib import Path

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed - skipping migrations")
    sys.exit(0)  # Non-blocking


def run_migrations():
    """Execute all pending SQL migrations"""

    # Get database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("⚠️  DATABASE_URL not set - skipping migrations")
        return

    print("🗄️  Running database migrations...")

    # Find all migration files
    migrations_dir = Path(__file__).parent.parent / "db" / "migrations"
    if not migrations_dir.exists():
        print(f"⚠️  Migrations directory not found: {migrations_dir}")
        return

    migration_files = sorted(migrations_dir.glob("*.sql"))
    if not migration_files:
        print("⚠️  No migration files found")
        return

    try:
        # Connect to database
        conn = psycopg2.connect(database_url)
        conn.autocommit = False
        cursor = conn.cursor()

        # Create migrations tracking table if not exists
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

        # Get already executed migrations
        cursor.execute("SELECT filename FROM _migrations;")
        executed = {row[0] for row in cursor.fetchall()}

        # Execute pending migrations
        for migration_file in migration_files:
            filename = migration_file.name

            if filename in executed:
                print(f"   ⏭️  {filename} (already executed)")
                continue

            print(f"   🚀 Executing {filename}...")

            # Read and execute migration
            with open(migration_file, 'r') as f:
                migration_sql = f.read()

            try:
                cursor.execute(migration_sql)

                # Mark as executed
                cursor.execute(
                    "INSERT INTO _migrations (filename) VALUES (%s);",
                    (filename,)
                )

                conn.commit()
                print(f"   ✅ {filename} completed")

            except Exception as e:
                conn.rollback()
                print(f"   ❌ {filename} failed: {e}")
                # Continue with next migration (non-blocking)

        cursor.close()
        conn.close()

        print("✅ Database migrations completed")

    except Exception as e:
        print(f"❌ Migration error: {e}")
        # Non-blocking - application can start without migrations


if __name__ == "__main__":
    run_migrations()
