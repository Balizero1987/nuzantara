#!/bin/bash
# Smart Migration + Start Script for Fly.io
# Automatically migrates ChromaDB to Qdrant if needed, then starts server

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 RAG BACKEND - Smart Start with Migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if migration flag exists
MIGRATION_DONE_FLAG="/tmp/qdrant_migration_done"

if [ -f "$MIGRATION_DONE_FLAG" ]; then
    echo "✅ Migration already completed (flag found)"
    echo "   Skipping migration and starting server directly..."
    echo ""
else
    echo "🔍 Checking if Qdrant migration is needed..."
    echo ""

    # Check if Qdrant has collections
    QDRANT_URL="${QDRANT_URL:-https://nuzantara-qdrant.fly.dev}"

    if curl -s -f "$QDRANT_URL/collections" > /tmp/qdrant_check.json 2>&1; then
        COLLECTION_COUNT=$(cat /tmp/qdrant_check.json | python3 -c "import sys, json; print(len(json.load(sys.stdin)['result']['collections']))" 2>/dev/null || echo "0")

        if [ "$COLLECTION_COUNT" -gt "0" ]; then
            echo "✅ Qdrant has $COLLECTION_COUNT collections - skipping migration"
            echo "   Creating skip flag..."
            touch "$MIGRATION_DONE_FLAG"
        else
            echo "⚠️  Qdrant is empty - migration needed!"
            echo ""
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "🚀 Starting Migration: ChromaDB (R2) → Qdrant"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo ""
            echo "⏱️  Estimated time: 15-20 minutes"
            echo "📊 Expected: 14 collections, ~14,365 documents"
            echo ""

            # Run migration
            if python scripts/migrate_r2_to_qdrant.py; then
                echo ""
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "✅ MIGRATION SUCCESSFUL!"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""

                # Create success flag
                touch "$MIGRATION_DONE_FLAG"
                echo "✅ Created migration completion flag"
                echo ""
            else
                echo ""
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo "❌ MIGRATION FAILED!"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                echo ""
                echo "⚠️  Server will start anyway (fallback to ChromaDB)"
                echo "   Check logs above for migration error details"
                echo ""
            fi
        fi
    else
        echo "⚠️  Cannot reach Qdrant - will try migration anyway"
        echo ""

        # Try migration
        if python scripts/migrate_r2_to_qdrant.py; then
            touch "$MIGRATION_DONE_FLAG"
            echo "✅ Migration completed"
        else
            echo "❌ Migration failed - continuing with ChromaDB"
        fi
    fi
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting RAG Backend Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start the server
exec uvicorn app.main_cloud:app --host 0.0.0.0 --port 8000
