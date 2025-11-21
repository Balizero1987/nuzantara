#!/usr/bin/env python3
"""
Quick script to ingest Bali Zero pricelist into ChromaDB
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

def ingest_pricelist():
    """Ingest the Bali Zero 2025 pricelist"""

    pricelist_path = Path(__file__).parent.parent / "data" / "raw_books" / "BALI_ZERO_SERVICES_PRICELIST_2025_ENGLISH.txt"

    if not pricelist_path.exists():
        print(f"❌ Pricelist not found: {pricelist_path}")
        return False

    print(f"📄 Found pricelist: {pricelist_path.name}")
    print(f"📏 Size: {pricelist_path.stat().st_size / 1024:.1f} KB")

    # Read content
    with open(pricelist_path, 'r', encoding='utf-8') as f:
        content = f.read()

    print(f"📝 Content length: {len(content)} characters")

    # Import ChromaDB client
    try:
        from core.qdrant_db import QdrantClient
        db = QdrantClient()
        print("✅ ChromaDB client initialized")
    except Exception as e:
        print(f"❌ ChromaDB error: {e}")
        return False

    # Simple chunking (split by double newlines)
    chunks = []
    sections = content.split('\n\n')

    for i, section in enumerate(sections):
        section = section.strip()
        if section and len(section) > 20:  # Skip very short sections
            chunks.append({
                'text': section,
                'metadata': {
                    'book_title': 'Bali Zero Services Pricelist 2025',
                    'book_author': 'Bali Zero',
                    'tier': 'A',
                    'min_level': 0,
                    'language': 'en',
                    'file_path': str(pricelist_path),
                    'chunk_index': i,
                    'source': 'pricelist'
                }
            })

    print(f"📦 Created {len(chunks)} chunks")

    # Generate embeddings
    try:
        from core.embeddings import EmbeddingsGenerator
        embedder = EmbeddingsGenerator()

        chunk_texts = [c['text'] for c in chunks]
        embeddings = embedder.generate_embeddings(chunk_texts)

        print(f"🧮 Generated {len(embeddings)} embeddings")
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        return False

    # Store in ChromaDB
    try:
        chunk_ids = [f"pricelist_chunk_{i}" for i in range(len(chunks))]
        metadatas = [c['metadata'] for c in chunks]

        db.collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=chunk_texts,
            metadatas=metadatas
        )

        print(f"✅ Stored {len(chunks)} chunks in ChromaDB")

        # Verify
        stats = db.get_collection_stats()
        print(f"📊 Total documents in DB: {stats['total_documents']}")

        return True

    except Exception as e:
        print(f"❌ Storage error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("="*60)
    print("🔄 Bali Zero Pricelist Ingestion")
    print("="*60)

    success = ingest_pricelist()

    if success:
        print("\n✅ SUCCESS - Pricelist indexed in ChromaDB")
        print("\n📋 Next steps:")
        print("1. Restart RAG backend to pick up changes")
        print("2. Test: Ask ZANTARA about Bali Zero prices")
        sys.exit(0)
    else:
        print("\n❌ FAILED - Check errors above")
        sys.exit(1)
