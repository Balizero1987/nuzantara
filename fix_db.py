#!/usr/bin/env python3
"""
Fix PostgreSQL database schema for NUZANTARA RAG Backend
Creates missing tables causing deployment failures
"""

import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def fix_database():
    """Fix database schema by creating missing tables"""

    # Get DATABASE_URL from environment
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment")
        return False

    print(f"✅ Found DATABASE_URL")

    try:
        # Connect to PostgreSQL
        print("🔌 Connecting to PostgreSQL...")
        conn = psycopg2.connect(database_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        print("✅ Connected to PostgreSQL")

        # Create cultural_knowledge table
        print("\n📊 Creating cultural_knowledge table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cultural_knowledge (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                language VARCHAR(10) DEFAULT 'en',
                category VARCHAR(50),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_language ON cultural_knowledge(language);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_category ON cultural_knowledge(category);")
        print("✅ cultural_knowledge table created")

        # Create query_clusters table
        print("\n📊 Creating query_clusters table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_clusters (
                id SERIAL PRIMARY KEY,
                query TEXT NOT NULL,
                cluster_id INTEGER,
                similarity_score FLOAT,
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_query_clusters_cluster_id ON query_clusters(cluster_id);")
        print("✅ query_clusters table created")

        # Fix memory_facts table
        print("\n📊 Fixing memory_facts table...")
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'memory_facts'
            );
        """)
        table_exists = cursor.fetchone()[0]

        if table_exists:
            # Check if id column exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'memory_facts' AND column_name = 'id'
                );
            """)
            id_exists = cursor.fetchone()[0]

            if not id_exists:
                cursor.execute("ALTER TABLE memory_facts ADD COLUMN id SERIAL PRIMARY KEY;")
                print("✅ Added id column to memory_facts table")
            else:
                print("✅ memory_facts.id column already exists")
        else:
            print("ℹ️  memory_facts table does not exist - will be created by app")

        # Verify tables created
        print("\n📊 Verifying tables...")
        cursor.execute("""
            SELECT table_name,
                   (SELECT COUNT(*) FROM information_schema.columns
                    WHERE columns.table_name = tables.table_name) as column_count
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('cultural_knowledge', 'query_clusters', 'memory_facts')
            ORDER BY table_name;
        """)

        results = cursor.fetchall()
        print("\n✅ Tables verified:")
        for table_name, column_count in results:
            print(f"   - {table_name}: {column_count} columns")

        cursor.close()
        conn.close()

        print("\n🎉 Database schema fix completed successfully!")
        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    success = fix_database()
    exit(0 if success else 1)
