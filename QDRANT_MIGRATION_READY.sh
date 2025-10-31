#!/bin/bash
# Qdrant Migration - Auto Executor
# Run when Qdrant service is deployed

set -e

echo "🚀 Qdrant Migration - Starting..."
echo ""

# Check env vars
if [ -z "$QDRANT_URL" ]; then
    echo "⚠️  QDRANT_URL not set!"
    echo "Set: export QDRANT_URL=https://nuzantara-qdrant.fly.dev"
    exit 1
fi

echo "✅ QDRANT_URL: $QDRANT_URL"
echo ""

# Install qdrant-client if needed
echo "📦 Installing qdrant-client..."
pip install -q qdrant-client chromadb

echo ""
echo "🧪 Running dry-run test..."
cd apps/backend-rag
python scripts/migrate_chromadb_to_qdrant.py --dry-run

echo ""
read -p "Dry-run OK? Proceed with real migration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo ""
echo "🚀 Starting REAL migration..."
python scripts/migrate_chromadb_to_qdrant.py

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Verify collections: curl \$QDRANT_URL/collections"
echo "2. Update backend-rag to use Qdrant"
echo "3. Test RAG queries"
