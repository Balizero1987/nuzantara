"""
Sync cultural knowledge from PostgreSQL to ChromaDB
"""
import asyncio
import asyncpg
import json
import os
import sys

# Add backend to path
sys.path.insert(0, 'backend')

from services.search_service import SearchService

async def sync_cultural_to_chromadb():
    database_url = os.getenv("DATABASE_URL")
    conn = await asyncpg.connect(database_url)

    # Initialize SearchService
    search_service = SearchService()

    # Fetch all cultural knowledge from PostgreSQL
    rows = await conn.fetch('''
        SELECT content, language, category, metadata
        FROM cultural_knowledge
    ''')

    print(f'📊 Found {len(rows)} cultural insights in PostgreSQL')

    # Add each to ChromaDB
    for row in rows:
        content = row['content']
        metadata_json = row['metadata']

        # Parse metadata if it's a string
        if isinstance(metadata_json, str):
            metadata = json.loads(metadata_json)
        else:
            metadata = metadata_json

        # Enhance metadata with required fields
        metadata['type'] = 'cultural_insight'
        metadata['source'] = 'manual_seed'
        metadata['language'] = row['language']

        # Add to ChromaDB
        success = await search_service.add_cultural_insight(
            text=content,
            metadata=metadata
        )

        if success:
            print(f'  ✅ Added: {metadata.get("topic", "unknown")}')
        else:
            print(f'  ❌ Failed: {metadata.get("topic", "unknown")}')

    await conn.close()
    print(f'\n✅ Sync complete!')

if __name__ == "__main__":
    asyncio.run(sync_cultural_to_chromadb())
