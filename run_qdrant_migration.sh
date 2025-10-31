#!/bin/bash
# Qdrant Migration Script - Automated
# Migrates ChromaDB → Qdrant with safety checks

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 QDRANT MIGRATION - ChromaDB → Qdrant"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if we're in the right directory
if [ ! -d "apps/backend-rag" ]; then
    echo "❌ Error: apps/backend-rag not found!"
    echo "Run this script from: ~/Desktop/NUZANTARA-RAILWAY"
    exit 1
fi

echo "📍 Location: $(pwd)"
echo ""

# Set Qdrant URL
export QDRANT_URL="http://qdrant.railway.internal:8080"
echo "✅ QDRANT_URL: $QDRANT_URL"
echo ""

# Install qdrant-client if needed
echo "📦 Checking dependencies..."
cd apps/backend-rag

if ! python3 -c "import qdrant_client" 2>/dev/null; then
    echo "Installing qdrant-client..."
    pip3 install -q qdrant-client
    echo "✅ qdrant-client installed"
else
    echo "✅ qdrant-client already installed"
fi

if ! python3 -c "import chromadb" 2>/dev/null; then
    echo "Installing chromadb..."
    pip3 install -q chromadb
    echo "✅ chromadb installed"
else
    echo "✅ chromadb already installed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 STEP 1: DRY-RUN (Test without changes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f "scripts/migrate_chromadb_to_qdrant.py" ]; then
    echo "❌ Migration script not found!"
    echo "Expected: apps/backend-rag/scripts/migrate_chromadb_to_qdrant.py"
    exit 1
fi

echo "Running dry-run migration..."
echo ""

python3 scripts/migrate_chromadb_to_qdrant.py --dry-run

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Dry-run completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Dry-run OK? Proceed with REAL migration? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "❌ Migration cancelled by user"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 STEP 2: REAL MIGRATION (This will take 8-10 minutes)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Migrating 14,365 documents across 14 collections..."
echo "Please wait, this may take a while..."
echo ""

python3 scripts/migrate_chromadb_to_qdrant.py

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ MIGRATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Next Steps:"
echo "1. Verify collections in Qdrant dashboard"
echo "2. Test RAG queries"
echo "3. Monitor performance"
echo ""
echo "Qdrant Dashboard: Check Railway logs for dashboard URL"
echo ""
echo "🎉 P0.3 COMPLETE! ChromaDB SPOF eliminated!"
echo ""
