#!/bin/bash

# Worker #2 Migration Runner
# Run migration to RAG database

echo "🚀 WORKER #2 RAG MIGRATION"
echo "==========================="

# Load environment variables
if [ -f .env.rag ]; then
    export $(cat .env.rag | xargs)
    echo "✅ Environment variables loaded from .env.rag"
else
    echo "❌ .env.rag file not found!"
    echo "Please create .env.rag with your database and API credentials."
    exit 1
fi

# Check required variables
if [ -z "$DB_HOST" ] || [ -z "$COHERE_API_KEY" ]; then
    echo "❌ Required environment variables not set!"
    echo "Please check your .env.rag file."
    exit 1
fi

# Run migration
echo "📊 Starting migration..."
python3 migrate_to_rag_worker2.py

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"

    # Run tests if migration succeeded
    echo ""
    echo "🧪 Running RAG tests..."
    python3 test_worker2_rag.py
else
    echo "❌ Migration failed!"
    exit 1
fi

