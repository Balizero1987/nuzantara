#!/usr/bin/env python3
"""
Complete ChromaDB → Qdrant Migration Script
Migrates all 13,004 documents from local Mac ChromaDB backup to Qdrant on Fly.io

Usage:
    python migrate_chromadb_to_qdrant_complete.py --dry-run  # Test first
    python migrate_chromadb_to_qdrant_complete.py            # Real migration
"""

import os
import sys
import sqlite3
import json
import struct
from pathlib import Path
from typing import List, Dict, Any, Tuple
import argparse
from datetime import datetime

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
except ImportError:
    print("❌ Error: qdrant-client not installed")
    print("Run: pip install qdrant-client")
    sys.exit(1)

# Configuration
SOURCE_CHROMADB = os.path.expanduser("~/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db")
QDRANT_URL = "https://nuzantara-qdrant.fly.dev"  # External URL (for local script)
# QDRANT_URL = "http://nuzantara-qdrant.internal:6333"  # Internal (if running on Fly)
BATCH_SIZE = 100
VECTOR_DIM = 384  # ChromaDB default embedding dimension

def deserialize_embedding(blob: bytes) -> List[float]:
    """Deserialize ChromaDB embedding blob to float list"""
    if not blob:
        return []

    # ChromaDB stores embeddings as binary float32
    num_floats = len(blob) // 4
    return list(struct.unpack(f'{num_floats}f', blob))


def get_chromadb_stats(chroma_path: str) -> Dict[str, Any]:
    """Get statistics from ChromaDB"""
    db_path = os.path.join(chroma_path, "chroma.sqlite3")

    if not os.path.exists(db_path):
        raise FileNotFoundError(f"ChromaDB not found at: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get collections
    cursor.execute("""
        SELECT id, name
        FROM collections
        ORDER BY name
    """)
    collections = {row[0]: row[1] for row in cursor.fetchall()}

    # Get document counts per collection from embeddings_queue
    collection_counts = {}
    for coll_id, coll_name in collections.items():
        cursor.execute("""
            SELECT COUNT(*)
            FROM embeddings_queue
            WHERE topic LIKE ?
        """, (f'%{coll_id}%',))
        count = cursor.fetchone()[0]
        collection_counts[coll_name] = count

    # Total embeddings from embeddings_queue
    cursor.execute("SELECT COUNT(*) FROM embeddings_queue")
    total_embeddings = cursor.fetchone()[0]

    conn.close()

    return {
        "collections": collections,
        "collection_counts": collection_counts,
        "total_embeddings": total_embeddings
    }


def migrate_collection(
    chroma_path: str,
    collection_name: str,
    collection_id: str,
    qdrant_client: QdrantClient,
    dry_run: bool = False
) -> int:
    """Migrate a single collection from ChromaDB to Qdrant"""

    print(f"\n📦 Processing collection: {collection_name}")

    db_path = os.path.join(chroma_path, "chroma.sqlite3")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get all embeddings for this collection via segments
    # First get segment_id for this collection
    cursor.execute("""
        SELECT id FROM segments WHERE collection = ?
    """, (collection_id,))

    segment_result = cursor.fetchone()
    if not segment_result:
        print(f"   ⚠️  No segment found for collection {collection_name}")
        return 0

    segment_id = segment_result[0]

    # Get embeddings from embeddings_queue (has actual vectors)
    cursor.execute("""
        SELECT
            id,
            vector,
            metadata
        FROM embeddings_queue
        WHERE topic LIKE ?
        ORDER BY seq_id
    """, (f'%{collection_id}%',))

    rows = cursor.fetchall()
    total_docs = len(rows)

    print(f"   Found {total_docs} documents")

    if dry_run:
        print(f"   ⏭️  Dry-run: Skipping actual migration")
        conn.close()
        return total_docs

    # Create collection in Qdrant
    try:
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(
                size=VECTOR_DIM,
                distance=Distance.COSINE
            )
        )
        print(f"   ✅ Created collection in Qdrant")
    except Exception as e:
        if "already exists" in str(e).lower():
            print(f"   ⚠️  Collection already exists, will append data")
        else:
            raise

    # Migrate in batches
    migrated = 0
    for i in range(0, total_docs, BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]

        points = []
        for row in batch:
            doc_id, vector_blob, metadata_json = row

            # Deserialize embedding
            vector = deserialize_embedding(vector_blob)

            if not vector or len(vector) != VECTOR_DIM:
                print(f"   ⚠️  Skipping document {doc_id}: invalid vector (dim={len(vector)})")
                continue

            # Parse metadata
            try:
                metadata = json.loads(metadata_json) if metadata_json else {}
            except:
                metadata = {}

            # Extract document text from metadata
            document = metadata.get("document", metadata.get("text", ""))

            # Add to payload
            payload = {
                **metadata,
                "document": document,
                "collection": collection_name,
                "source": "chromadb_migration"
            }

            points.append(PointStruct(
                id=doc_id,
                vector=vector,
                payload=payload
            ))

        if points:
            try:
                qdrant_client.upsert(
                    collection_name=collection_name,
                    points=points
                )
                migrated += len(points)
                print(f"   ✅ Migrated batch {i//BATCH_SIZE + 1}/{(total_docs + BATCH_SIZE - 1)//BATCH_SIZE} ({migrated}/{total_docs} docs)")
            except Exception as e:
                print(f"   ❌ Batch {i//BATCH_SIZE + 1} failed: {e}")

    conn.close()

    # Verify count in Qdrant
    try:
        collection_info = qdrant_client.get_collection(collection_name)
        qdrant_count = collection_info.points_count

        if qdrant_count == migrated:
            print(f"   ✅ Verification passed: {qdrant_count} documents in Qdrant")
        else:
            print(f"   ⚠️  Count mismatch: migrated {migrated}, Qdrant has {qdrant_count}")
    except Exception as e:
        print(f"   ⚠️  Could not verify count: {e}")

    return migrated


def main():
    parser = argparse.ArgumentParser(description="Migrate ChromaDB to Qdrant")
    parser.add_argument("--dry-run", action="store_true", help="Test migration without actually uploading")
    parser.add_argument("--source", default=SOURCE_CHROMADB, help="Path to ChromaDB directory")
    parser.add_argument("--qdrant-url", default=QDRANT_URL, help="Qdrant URL")
    args = parser.parse_args()

    print("=" * 70)
    print("🚀 ChromaDB → Qdrant Complete Migration")
    print("=" * 70)
    print(f"Source: {args.source}")
    print(f"Target: {args.qdrant_url}")
    print(f"Mode: {'DRY-RUN ⏭️' if args.dry_run else 'REAL MIGRATION 🔥'}")
    print("=" * 70)

    # Verify source exists
    if not os.path.exists(args.source):
        print(f"❌ Error: Source ChromaDB not found at {args.source}")
        sys.exit(1)

    # Get ChromaDB statistics
    print("\n📊 Analyzing ChromaDB...")
    try:
        stats = get_chromadb_stats(args.source)
    except Exception as e:
        print(f"❌ Error reading ChromaDB: {e}")
        sys.exit(1)

    print(f"\n✅ Found:")
    print(f"   - Collections: {len(stats['collections'])}")
    print(f"   - Total Documents: {stats['total_embeddings']}")
    print(f"\n📋 Collections:")
    for coll_name, count in sorted(stats['collection_counts'].items()):
        print(f"   - {coll_name}: {count} documents")

    # Confirm migration
    if not args.dry_run:
        print(f"\n⚠️  This will migrate {stats['total_embeddings']} documents to {args.qdrant_url}")
        response = input("Continue? (yes/no): ")
        if response.lower() != "yes":
            print("❌ Migration cancelled")
            sys.exit(0)

    # Connect to Qdrant
    print(f"\n🔌 Connecting to Qdrant...")
    try:
        qdrant = QdrantClient(url=args.qdrant_url)
        # Test connection
        collections = qdrant.get_collections()
        print(f"   ✅ Connected (existing collections: {len(collections.collections)})")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        sys.exit(1)

    # Migrate each collection
    print(f"\n🔄 Starting migration...")
    start_time = datetime.now()

    total_migrated = 0
    for coll_id, coll_name in sorted(stats['collections'].items(), key=lambda x: x[1]):
        try:
            migrated = migrate_collection(
                args.source,
                coll_name,
                coll_id,
                qdrant,
                dry_run=args.dry_run
            )
            total_migrated += migrated
        except Exception as e:
            print(f"   ❌ Failed to migrate {coll_name}: {e}")
            import traceback
            traceback.print_exc()

    # Summary
    elapsed = datetime.now() - start_time
    print("\n" + "=" * 70)
    print("📊 Migration Summary")
    print("=" * 70)
    print(f"Mode: {'DRY-RUN' if args.dry_run else 'COMPLETED'}")
    print(f"Collections: {len(stats['collections'])}")
    print(f"Documents Migrated: {total_migrated} / {stats['total_embeddings']}")
    print(f"Time Elapsed: {elapsed.total_seconds():.1f} seconds")
    print(f"Success Rate: {(total_migrated / stats['total_embeddings'] * 100):.1f}%")
    print("=" * 70)

    if args.dry_run:
        print("\n✅ Dry-run complete! Run without --dry-run to perform actual migration.")
    elif total_migrated == stats['total_embeddings']:
        print("\n🎉 Migration completed successfully!")
    else:
        print(f"\n⚠️  Migration incomplete: {stats['total_embeddings'] - total_migrated} documents not migrated")

    # Verify Qdrant collections
    if not args.dry_run:
        print("\n🔍 Verifying Qdrant...")
        try:
            collections = qdrant.get_collections()
            print(f"   Total collections in Qdrant: {len(collections.collections)}")

            total_points = 0
            for coll in collections.collections:
                coll_info = qdrant.get_collection(coll.name)
                points_count = coll_info.points_count
                total_points += points_count
                print(f"   - {coll.name}: {points_count} points")

            print(f"\n   Total points in Qdrant: {total_points}")

            if total_points == stats['total_embeddings']:
                print("   ✅ Verification passed!")
            else:
                print(f"   ⚠️  Expected {stats['total_embeddings']}, got {total_points}")
        except Exception as e:
            print(f"   ⚠️  Verification failed: {e}")


if __name__ == "__main__":
    main()
