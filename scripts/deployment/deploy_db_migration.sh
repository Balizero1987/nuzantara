#!/bin/bash
# Deploy Database Migration to Railway PostgreSQL

set -e

echo "🗄️  DEPLOYING DATABASE MIGRATION TO RAILWAY"
echo "============================================"
echo ""

# Check if migration file exists
MIGRATION_FILE="apps/backend-rag 2/backend/db/migrations/001_golden_answers_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo ""

# Get DATABASE_URL from Railway
echo "🔍 Getting DATABASE_URL from Railway..."
export DATABASE_URL=$(railway variables --service scintillating-kindness | grep DATABASE_URL | cut -d'=' -f2-)

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found"
    echo ""
    echo "Please run manually:"
    echo "  1. Get DATABASE_URL from Railway dashboard"
    echo "  2. export DATABASE_URL='postgresql://...'"
    echo "  3. psql \$DATABASE_URL -f \"$MIGRATION_FILE\""
    exit 1
fi

echo "✅ DATABASE_URL retrieved"
echo ""

# Run migration using docker (if psql not available locally)
if command -v psql &> /dev/null; then
    echo "🚀 Running migration with psql..."
    psql "$DATABASE_URL" -f "$MIGRATION_FILE"
else
    echo "🐳 Running migration with Docker..."
    docker run --rm -v "$(pwd):/app" -w /app postgres:15 \
        psql "$DATABASE_URL" -f "$MIGRATION_FILE"
fi

echo ""
echo "✅ DATABASE MIGRATION COMPLETE!"
echo ""
echo "Verify tables created:"
echo "  psql \$DATABASE_URL -c '\\dt'"
echo ""
