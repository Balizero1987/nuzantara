#!/bin/bash
set -e

echo "🚀 NUZANTARA Database Migration to Pinecone"
echo "==========================================="

# Check environment variables
if [ -z "$PINECONE_API_KEY" ]; then
    echo "❌ Error: PINECONE_API_KEY environment variable not set"
    echo "Please set it using: export PINECONE_API_KEY=your_api_key"
    exit 1
fi

# Set defaults
CHROMA_PATH=${CHROMA_PATH:-"./data/chroma_db"}
PINECONE_ENVIRONMENT=${PINECONE_ENVIRONMENT:-"us-east-1"}

echo "📋 Configuration:"
echo "  ChromaDB Path: $CHROMA_PATH"
echo "  Pinecone Environment: $PINECONE_ENVIRONMENT"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pip install -q -r migration/requirements.txt

# Check if specific collections specified
if [ $# -eq 0 ]; then
    echo "🔍 Migrating ALL collections from ChromaDB"
    echo ""
    read -p "Are you sure? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "❌ Migration cancelled"
        exit 1
    fi
    
    # Migrate all
    python migration/migrate_to_pinecone.py
else
    echo "🔍 Migrating specific collections: $@"
    echo ""
    
    # Migrate specified collections
    python migration/migrate_to_pinecone.py "$@"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Next steps:"
echo "  1. Review migration results in migration_results_*.json"
echo "  2. Verify data in Pinecone dashboard"
echo "  3. Update application to use Pinecone service"
echo "  4. Run integration tests"
echo "  5. Monitor performance for 24h"
echo ""
