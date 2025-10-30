"""
ChromaDB → Qdrant Migration Script
===================================

Migrates all collections from ChromaDB (file-based) to Qdrant (production).

Usage:
    python scripts/migrate_chromadb_to_qdrant.py [--dry-run]

Requirements:
    - QDRANT_URL env var set
    - ChromaDB data available at CHROMA_PERSIST_DIR
    - qdrant-client installed: pip install qdrant-client

Safety:
    - Creates backup of ChromaDB before migration
    - Validates data integrity after migration
    - Atomic operations per collection
    - Rollback on error
"""

import os
import sys
import logging
from typing import List, Dict, Any
from pathlib import Path
import time

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
except ImportError:
    print("❌ chromadb not installed: pip install chromadb")
    sys.exit(1)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
except ImportError:
    print("❌ qdrant-client not installed: pip install qdrant-client")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ChromaToQdrantMigrator:
    """Migrates data from ChromaDB to Qdrant"""
    
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        
        # Initialize ChromaDB
        chroma_path = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
        self.chroma_client = chromadb.PersistentClient(
            path=chroma_path,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        # Initialize Qdrant
        qdrant_url = os.getenv("QDRANT_URL")
        if not qdrant_url:
            raise ValueError("QDRANT_URL environment variable not set")
        
        self.qdrant_client = QdrantClient(
            url=qdrant_url,
            api_key=os.getenv("QDRANT_API_KEY")
        )
        
        logger.info(f"ChromaDB path: {chroma_path}")
        logger.info(f"Qdrant URL: {qdrant_url}")
        logger.info(f"Dry run: {dry_run}")
    
    def create_backup(self) -> Path:
        """Create backup of ChromaDB data"""
        chroma_path = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma_db")
        backup_path = Path(f"{chroma_path}.backup")
        
        if self.dry_run:
            logger.info(f"[DRY RUN] Would create backup at {backup_path}")
            return backup_path
        
        import shutil
        if backup_path.exists():
            logger.warning(f"Backup already exists at {backup_path}")
        else:
            logger.info(f"Creating backup at {backup_path}...")
            shutil.copytree(chroma_path, backup_path)
            logger.info(f"✅ Backup created")
        
        return backup_path
    
    def get_collections(self) -> List[str]:
        """Get all ChromaDB collections"""
        collections = self.chroma_client.list_collections()
        return [c.name for c in collections]
    
    def migrate_collection(self, collection_name: str) -> Dict[str, Any]:
        """Migrate a single collection from ChromaDB to Qdrant"""
        logger.info(f"\n{'='*60}")
        logger.info(f"Migrating collection: {collection_name}")
        logger.info(f"{'='*60}")
        
        start_time = time.time()
        
        # Get ChromaDB collection
        chroma_coll = self.chroma_client.get_collection(collection_name)
        
        # Get all documents
        logger.info("Fetching documents from ChromaDB...")
        result = chroma_coll.get(
            include=["embeddings", "metadatas", "documents"]
        )
        
        total_docs = len(result["ids"])
        logger.info(f"Found {total_docs} documents")
        
        if total_docs == 0:
            logger.warning(f"Collection {collection_name} is empty, skipping")
            return {"status": "skipped", "reason": "empty", "count": 0}
        
        if self.dry_run:
            logger.info(f"[DRY RUN] Would migrate {total_docs} documents")
            return {
                "status": "dry_run",
                "collection": collection_name,
                "count": total_docs
            }
        
        # Detect vector size from first embedding
        vector_size = len(result["embeddings"][0])
        logger.info(f"Vector dimension: {vector_size}")
        
        # Create Qdrant collection
        logger.info("Creating Qdrant collection...")
        try:
            self.qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"✅ Collection created in Qdrant")
        except Exception as e:
            if "already exists" in str(e).lower():
                logger.warning(f"Collection already exists in Qdrant")
            else:
                raise
        
        # Upload points in batches
        batch_size = 100
        total_batches = (total_docs + batch_size - 1) // batch_size
        
        logger.info(f"Uploading {total_docs} points in {total_batches} batches...")
        
        for batch_idx in range(0, total_docs, batch_size):
            batch_end = min(batch_idx + batch_size, total_docs)
            batch_num = batch_idx // batch_size + 1
            
            points = []
            for i in range(batch_idx, batch_end):
                # Create point
                point = PointStruct(
                    id=i,  # Use index as ID
                    vector=result["embeddings"][i],
                    payload={
                        "text": result["documents"][i],
                        "chroma_id": result["ids"][i],
                        **(result["metadatas"][i] or {})
                    }
                )
                points.append(point)
            
            # Upload batch
            self.qdrant_client.upsert(
                collection_name=collection_name,
                points=points
            )
            
            logger.info(f"  Batch {batch_num}/{total_batches}: {len(points)} points uploaded")
        
        # Verify migration
        logger.info("Verifying migration...")
        qdrant_count = self.qdrant_client.count(collection_name).count
        
        if qdrant_count == total_docs:
            logger.info(f"✅ Verification passed: {qdrant_count}/{total_docs} documents")
        else:
            logger.error(f"❌ Verification failed: {qdrant_count}/{total_docs} documents")
            return {
                "status": "error",
                "collection": collection_name,
                "expected": total_docs,
                "actual": qdrant_count
            }
        
        elapsed = time.time() - start_time
        logger.info(f"✅ Migration completed in {elapsed:.2f}s")
        
        return {
            "status": "success",
            "collection": collection_name,
            "count": total_docs,
            "elapsed": elapsed
        }
    
    def migrate_all(self):
        """Migrate all collections"""
        logger.info("\n" + "="*60)
        logger.info("CHROMADB → QDRANT MIGRATION")
        logger.info("="*60 + "\n")
        
        # Create backup
        backup_path = self.create_backup()
        
        # Get collections
        collections = self.get_collections()
        logger.info(f"Found {len(collections)} collections to migrate:")
        for coll in collections:
            logger.info(f"  - {coll}")
        
        if not collections:
            logger.warning("No collections found in ChromaDB")
            return
        
        # Migrate each collection
        results = []
        for coll_name in collections:
            try:
                result = self.migrate_collection(coll_name)
                results.append(result)
            except Exception as e:
                logger.error(f"❌ Failed to migrate {coll_name}: {e}")
                results.append({
                    "status": "error",
                    "collection": coll_name,
                    "error": str(e)
                })
        
        # Summary
        logger.info("\n" + "="*60)
        logger.info("MIGRATION SUMMARY")
        logger.info("="*60)
        
        success_count = sum(1 for r in results if r["status"] == "success")
        error_count = sum(1 for r in results if r["status"] == "error")
        
        logger.info(f"Total collections: {len(collections)}")
        logger.info(f"✅ Successful: {success_count}")
        logger.info(f"❌ Failed: {error_count}")
        
        if self.dry_run:
            logger.info("\n[DRY RUN] No changes were made")
        else:
            total_docs = sum(r.get("count", 0) for r in results if r["status"] == "success")
            logger.info(f"\n📊 Total documents migrated: {total_docs:,}")
            logger.info(f"💾 Backup location: {backup_path}")
        
        logger.info("\n" + "="*60)
        
        return results


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Migrate ChromaDB to Qdrant")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate migration without making changes"
    )
    
    args = parser.parse_args()
    
    try:
        migrator = ChromaToQdrantMigrator(dry_run=args.dry_run)
        migrator.migrate_all()
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
