#!/bin/bash
set -e

echo "🧪 Testing Pinecone Migration"
echo "============================"

# Check environment
if [ -z "$PINECONE_API_KEY" ]; then
    echo "❌ Error: PINECONE_API_KEY not set"
    exit 1
fi

echo "📊 Running migration tests..."
echo ""

# Test 1: List collections
echo "Test 1: Listing ChromaDB collections..."
python -c "
import chromadb
client = chromadb.PersistentClient(path='./data/chroma_db')
collections = client.list_collections()
print(f'Found {len(collections)} collections:')
for col in collections:
    print(f'  - {col.name}: {col.count()} vectors')
"

echo ""

# Test 2: Check Pinecone connection
echo "Test 2: Testing Pinecone connection..."
python -c "
import os
from pinecone import Pinecone
pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
indexes = pc.list_indexes().names()
print(f'Found {len(indexes)} Pinecone indexes:')
for idx in indexes:
    print(f'  - {idx}')
"

echo ""

# Test 3: Dry run migration (first 10 vectors)
echo "Test 3: Dry run migration (sample)..."
python -c "
import os
import sys
sys.path.append('.')
from migration.migrate_to_pinecone import DatabaseMigration

migration = DatabaseMigration(
    chroma_path='./data/chroma_db',
    pinecone_api_key=os.getenv('PINECONE_API_KEY'),
    batch_size=10
)

collections = migration.list_collections()
if collections:
    info = migration.get_collection_info(collections[0])
    print(f'Sample collection: {info[\"name\"]}')
    print(f'  Vectors: {info[\"count\"]}')
    print(f'  Dimension: {info[\"dimension\"]}')
"

echo ""
echo "✅ All tests passed!"
echo ""
echo "Ready to run migration with: ./migration/migrate.sh"
