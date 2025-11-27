#!/usr/bin/env python3
"""
Migrate ChromaDB from Cloudflare R2 to Qdrant on Fly.io

This script:
1. Downloads ChromaDB from R2 (nuzantaradb/chroma_db/)
2. Connects to Qdrant (Fly.io internal network)
3. Migrates all 14 collections (~14,365 documents)
4. Verifies data integrity

Usage:
    export R2_ACCESS_KEY_ID=xxx
    export R2_SECRET_ACCESS_KEY=xxx
    export R2_ENDPOINT_URL=https://xxx.r2.cloudflarestorage.com
    export QDRANT_URL=https://nuzantara-qdrant.fly.dev

    python scripts/migrate_r2_to_qdrant.py [--dry-run]
"""

import argparse
import logging
import os
import shutil
import sys
import tempfile

# Check dependencies
try:
    import boto3
    from botocore.exceptions import ClientError
except ImportError:
    print("❌ boto3 not installed: pip install boto3")
    sys.exit(1)

try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
except ImportError:
    print("❌ chromadb not installed: pip install chromadb")
    sys.exit(1)

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams
except ImportError:
    print("❌ qdrant-client not installed: pip install qdrant-client")
    sys.exit(1)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class R2ToQdrantMigrator:
    """Migrate ChromaDB from Cloudflare R2 to Qdrant"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.temp_dir = None

        # R2 Configuration
        self.r2_access_key = os.getenv("R2_ACCESS_KEY_ID")
        self.r2_secret_key = os.getenv("R2_SECRET_ACCESS_KEY")
        self.r2_endpoint = os.getenv("R2_ENDPOINT_URL")
        self.bucket_name = "nuzantaradb"
        self.source_prefix = "chroma_db/"

        if not all([self.r2_access_key, self.r2_secret_key, self.r2_endpoint]):
            raise ValueError("R2 credentials not found in environment")

        # Qdrant Configuration
        self.qdrant_url = os.getenv("QDRANT_URL")
        if not self.qdrant_url:
            raise ValueError("QDRANT_URL environment variable not set")

        logger.info(f"R2 Bucket: {self.bucket_name}/{self.source_prefix}")
        logger.info(f"Qdrant URL: {self.qdrant_url}")
        logger.info(f"Dry run: {dry_run}")

    def download_chromadb_from_r2(self) -> str:
        """Download ChromaDB from R2 to temp directory"""
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info("📥 STEP 1: Downloading ChromaDB from Cloudflare R2")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        if self.dry_run:
            logger.info("[DRY RUN] Would download from R2")
            # Create empty temp dir for dry run
            self.temp_dir = tempfile.mkdtemp()
            return self.temp_dir

        try:
            # Create temp directory
            self.temp_dir = tempfile.mkdtemp()
            logger.info(f"Temp directory: {self.temp_dir}")

            # Initialize S3 client for R2
            s3_client = boto3.client(
                "s3",
                endpoint_url=self.r2_endpoint,
                aws_access_key_id=self.r2_access_key,
                aws_secret_access_key=self.r2_secret_key,
                region_name="auto",
            )

            # List and download files
            paginator = s3_client.get_paginator("list_objects_v2")
            file_count = 0

            for page in paginator.paginate(Bucket=self.bucket_name, Prefix=self.source_prefix):
                for obj in page.get("Contents", []):
                    key = obj["Key"]

                    # Skip directory markers
                    if key.endswith("/"):
                        continue

                    # Calculate local path
                    relative_path = key[len(self.source_prefix) :]
                    local_file = os.path.join(self.temp_dir, relative_path)

                    # Create directory if needed
                    os.makedirs(os.path.dirname(local_file), exist_ok=True)

                    # Download file
                    logger.info(f"Downloading: {key}")
                    s3_client.download_file(self.bucket_name, key, local_file)
                    file_count += 1

            logger.info(f"✅ Downloaded {file_count} files from R2")
            return self.temp_dir

        except ClientError as e:
            logger.error(f"❌ Failed to download from R2: {e}")
            raise

    def migrate_to_qdrant(self, chroma_path: str):
        """Migrate ChromaDB collections to Qdrant"""
        logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info("🚀 STEP 2: Migrating ChromaDB → Qdrant")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        # Initialize ChromaDB
        if self.dry_run:
            logger.info("[DRY RUN] Would initialize ChromaDB from R2 download")
            logger.info("[DRY RUN] Would connect to Qdrant")
            logger.info("[DRY RUN] Would migrate 14 collections")
            return {"success": 0, "failed": 0, "total_docs": 0}

        try:
            chroma_client = chromadb.PersistentClient(
                path=chroma_path, settings=ChromaSettings(anonymized_telemetry=False)
            )

            # Initialize Qdrant
            qdrant_client = QdrantClient(
                url=self.qdrant_url,
                timeout=120,  # 2 minute timeout
            )

            # Get all collections
            collections = chroma_client.list_collections()
            logger.info(f"Found {len(collections)} collections to migrate")

            success_count = 0
            failed_count = 0
            total_docs = 0

            for coll in collections:
                logger.info(f"\n{'='*60}")
                logger.info(f"📦 Migrating: {coll.name}")
                logger.info(f"{'='*60}")

                try:
                    # Get all documents
                    result = coll.get(include=["embeddings", "documents", "metadatas"])
                    doc_count = len(result["ids"])

                    logger.info(f"   Documents: {doc_count}")

                    if doc_count == 0:
                        logger.warning("   ⚠️  Empty collection, skipping")
                        continue

                    # Get vector dimension
                    vector_size = len(result["embeddings"][0])
                    logger.info(f"   Vector size: {vector_size}")

                    # Create collection in Qdrant
                    logger.info("   Creating Qdrant collection...")
                    try:
                        qdrant_client.create_collection(
                            collection_name=coll.name,
                            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
                        )
                        logger.info("   ✅ Collection created")
                    except Exception as e:
                        if "already exists" in str(e).lower():
                            logger.info("   ℹ️  Collection exists, continuing...")
                        else:
                            raise

                    # Prepare points for Qdrant
                    points = []
                    for i, (id, emb, doc, meta) in enumerate(
                        zip(
                            result["ids"],
                            result["embeddings"],
                            result["documents"],
                            result["metadatas"],
                        )
                    ):
                        payload = meta or {}
                        payload["document"] = doc
                        payload["source_id"] = id
                        points.append(PointStruct(id=i, vector=emb, payload=payload))

                    # Upload to Qdrant in batches
                    batch_size = 100
                    logger.info(f"   Uploading {len(points)} points in batches of {batch_size}...")

                    for i in range(0, len(points), batch_size):
                        batch = points[i : i + batch_size]
                        qdrant_client.upsert(collection_name=coll.name, points=batch)
                        logger.info(f"   Progress: {min(i+batch_size, len(points))}/{len(points)}")

                    logger.info(f"   ✅ Migration complete: {doc_count} documents")
                    success_count += 1
                    total_docs += doc_count

                except Exception as e:
                    logger.error(f"   ❌ Failed: {e}")
                    failed_count += 1

            return {"success": success_count, "failed": failed_count, "total_docs": total_docs}

        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            raise

    def verify_migration(self):
        """Verify migration success"""
        logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        logger.info("✅ STEP 3: Verifying Migration")
        logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

        if self.dry_run:
            logger.info("[DRY RUN] Would verify collections in Qdrant")
            return

        try:
            qdrant_client = QdrantClient(url=self.qdrant_url)
            collections = qdrant_client.get_collections()

            logger.info(f"Qdrant collections: {len(collections.collections)}")
            for coll in collections.collections:
                info = qdrant_client.get_collection(coll.name)
                logger.info(f"   - {coll.name}: {info.points_count} points")

        except Exception as e:
            logger.error(f"❌ Verification failed: {e}")

    def cleanup(self):
        """Clean up temp directory"""
        if self.temp_dir and os.path.exists(self.temp_dir):
            logger.info(f"🧹 Cleaning up temp directory: {self.temp_dir}")
            shutil.rmtree(self.temp_dir)

    def run(self):
        """Run complete migration"""
        try:
            logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            logger.info("🚀 R2 → QDRANT MIGRATION")
            logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

            # Download from R2
            chroma_path = self.download_chromadb_from_r2()

            # Migrate to Qdrant
            results = self.migrate_to_qdrant(chroma_path)

            # Verify
            self.verify_migration()

            # Summary
            logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            logger.info("📊 MIGRATION SUMMARY")
            logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            logger.info(f"✅ Successful: {results['success']}")
            logger.info(f"❌ Failed: {results['failed']}")
            logger.info(f"📊 Total documents: {results['total_docs']}")

            if self.dry_run:
                logger.info("\n[DRY RUN] No changes were made")
            else:
                logger.info("\n🎉 MIGRATION COMPLETE!")

        finally:
            self.cleanup()


def main():
    parser = argparse.ArgumentParser(description="Migrate ChromaDB from R2 to Qdrant")
    parser.add_argument("--dry-run", action="store_true", help="Run without making changes")
    args = parser.parse_args()

    try:
        migrator = R2ToQdrantMigrator(dry_run=args.dry_run)
        migrator.run()
    except KeyboardInterrupt:
        logger.info("\n⚠️  Migration interrupted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
