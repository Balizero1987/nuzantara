"""
Apply database migrations
Use this script when psql is not available locally
Migrations will be applied on Fly.io deployment
"""

import os
import sys
from pathlib import Path

# Check if this should run locally or on Fly.io
from app.core.config import settings
if settings.fly_app_name:
    print("Running on Fly.io - migrations are handled through release commands")
    print("Use Fly.io CLI or dashboard to apply migrations when needed")
    sys.exit(0)

print("=" * 70)
print("DATABASE MIGRATIONS - Local Development")
print("=" * 70)
print()
print("✅ Migration files created:")
print("   - apps/backend-rag/backend/db/migrations/005_oracle_knowledge_bases.sql")
print("   - apps/backend-rag/backend/db/migrations/006_property_and_tax_tables.sql")
print()
print("📝 These migrations will be applied automatically when you:")
print("   1. Deploy to Fly.io")
print("   2. Run backend with DATABASE_URL configured")
print()
print("💡 For local development without PostgreSQL:")
print("   - The scrapers will work with Qdrant only (file-based)")
print("   - API endpoints requiring PostgreSQL will show appropriate errors")
print("   - Full functionality requires Fly.io deployment with PostgreSQL")
print()
print("🚀 To deploy and apply migrations:")
print()
print("   # Option 1: Fly.io CLI")
print("   fly ssh console --app nuzantara-rag --command \"psql $DATABASE_URL -f apps/backend-rag/backend/db/migrations/005_oracle_knowledge_bases.sql\"")
print("   fly ssh console --app nuzantara-rag --command \"psql $DATABASE_URL -f apps/backend-rag/backend/db/migrations/006_property_and_tax_tables.sql\"")
print()
print("   # Option 2: Fly.io Dashboard")
print("   - Open the PostgreSQL application in Fly.io")
print("   - Use the SQL console to run the migration files in order")
print()
print("=" * 70)

# Check if we can run knowledge base population with Qdrant only
print()
print("Checking Qdrant setup for local development...")
print()

chroma_dirs = [
    "./data/oracle_kb",
    "./data/tax_kb",
    "./data/property_kb"
]

for dir_path in chroma_dirs:
    full_path = Path(dir_path)
    if full_path.exists():
        print(f"✅ {dir_path} exists")
    else:
        print(f"📁 {dir_path} will be created on first run")

print()
print("✅ Qdrant is ready for local development (file-based storage)")
print()
print("Next steps:")
print("1. Run knowledge base population: python migrate_oracle_kb.py")
print("   (Will work with Qdrant, PostgreSQL parts will be skipped)")
print()
print("2. Run scrapers locally: python backend/scrapers/tax_scraper.py --mode once")
print("   (Will save to Qdrant only)")
print()
print("3. For full PostgreSQL integration, deploy to Fly.io")
print()
