#!/usr/bin/env python3
"""
ZANTARA KB Collection Remapping Script
FIX CRITICAL: Move 8,122 chunks from 'zantara_memories' to correct domain collections

Issue: Migration script stored all data in wrong collection
Solution: Remap chunks to 5 correct collections based on metadata

Author: Claude Code Assistant
Created: 2025-11-03
Status: CRITICAL FIX
"""

import os
import sys
import requests
import json
import time
from typing import Dict, List, Any, Optional
from pathlib import Path
import logging

# Configuration
RAG_BACKEND = "https://nuzantara-rag.fly.dev"
LOG_FILE = "collection_remap_log.txt"
BATCH_SIZE = 50  # Process in batches to avoid timeouts

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class CollectionRemapper:
    """Fix collection mapping issue by moving chunks to correct collections"""

    def __init__(self):
        self.backend_url = RAG_BACKEND
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        })

        # Statistics
        self.stats = {
            "total_chunks_read": 0,
            "chunks_migrated": {},
            "errors": 0,
            "batches_processed": 0
        }

        logger.info("🔧 Collection Remapper initialized")
        logger.info(f"🎯 Target: {self.backend_url}")

    def get_all_chunks_from_collection(self, collection_name: str = "zantara_memories") -> List[Dict]:
        """Get all chunks from a collection using batch processing"""
        logger.info(f"📖 Reading all chunks from collection: {collection_name}")

        all_chunks = []
        offset = 0
        limit = 100  # Get 100 chunks at a time

        while True:
            try:
                # Use the memory API to get chunks
                response = self.session.post(
                    f"{self.backend_url}/api/memory/search",
                    json={
                        "query": "",  # Empty query to get all
                        "limit": limit,
                        "offset": offset,
                        "collection_filter": {"collection": collection_name}
                    },
                    timeout=30
                )

                if not response.ok:
                    logger.error(f"❌ Failed to get chunks batch: {response.status_code}")
                    break

                data = response.json()
                chunks = data.get("results", [])

                if not chunks:
                    logger.info("✅ All chunks retrieved")
                    break

                all_chunks.extend(chunks)
                offset += limit

                logger.info(f"📚 Retrieved {len(chunks)} chunks (total: {len(all_chunks)})")

                # Small delay to avoid overwhelming the backend
                time.sleep(0.1)

            except Exception as e:
                logger.error(f"❌ Error getting chunk batch: {e}")
                self.stats["errors"] += 1
                break

        self.stats["total_chunks_read"] = len(all_chunks)
        logger.info(f"🎉 Total chunks read: {len(all_chunks)}")
        return all_chunks

    def extract_target_collection(self, chunk: Dict) -> str:
        """Determine correct collection for chunk based on metadata"""
        metadata = chunk.get("metadata", {})

        # Check if collection is explicitly set in metadata
        if "collection" in metadata:
            return metadata["collection"]

        # Try to determine from source file path
        source = metadata.get("source", "")
        if "visa" in source.lower():
            return "visa_oracle"
        elif "tax" in source.lower():
            return "tax_genius"
        elif "legal" in source.lower():
            return "legal_architect"
        elif "kbli" in source.lower():
            return "kbli_eye"
        elif "book" in source.lower() or "zantara" in source.lower():
            return "zantara_books"

        # Default fallback based on content analysis
        content = chunk.get("content", "").lower()
        if any(keyword in content for keyword in ["visa", "kitas", "kitap", "immigration"]):
            return "visa_oracle"
        elif any(keyword in content for keyword in ["tax", "pajak", "npwp", "pph"]):
            return "tax_genius"
        elif any(keyword in content for keyword in ["legal", "law", "contract", "court"]):
            return "legal_architect"
        elif any(keyword in content for keyword in ["kbli", "business", "company", "investment"]):
            return "kbli_eye"

        # Default to zantara_books if unsure
        return "zantara_books"

    def create_collection_if_not_exists(self, collection_name: str):
        """Ensure target collection exists"""
        try:
            # Try to access the collection - this should create it if it doesn't exist
            response = self.session.post(
                f"{self.backend_url}/api/memory/init",
                json={"collection_name": collection_name},
                timeout=15
            )

            if response.ok:
                logger.info(f"✅ Collection ready: {collection_name}")
            else:
                logger.warning(f"⚠️ Collection init response: {response.status_code}")

        except Exception as e:
            logger.warning(f"⚠️ Could not init collection {collection_name}: {e}")

    def store_chunks_in_collection(self, chunks: List[Dict], target_collection: str) -> bool:
        """Store chunks in the correct collection"""
        logger.info(f"📤 Storing {len(chunks)} chunks in collection: {target_collection}")

        try:
            # Process in smaller batches
            for i in range(0, len(chunks), BATCH_SIZE):
                batch = chunks[i:i + BATCH_SIZE]

                # Prepare batch for storage
                storage_batch = []
                for chunk in batch:
                    # Ensure metadata includes correct collection
                    metadata = chunk.get("metadata", {})
                    metadata["collection"] = target_collection
                    metadata["remapped_at"] = time.time()
                    metadata["remapped_from"] = "zantara_memories"

                    storage_batch.append({
                        "id": chunk.get("id", f"chunk_{int(time.time())}_{len(storage_batch)}"),
                        "document": chunk.get("content", chunk.get("text", "")),
                        "metadata": metadata
                    })

                # Store the batch
                response = self.session.post(
                    f"{self.backend_url}/api/memory/store",
                    json={"documents": storage_batch},
                    timeout=60
                )

                if response.ok:
                    result = response.json()
                    stored = result.get("stored", 0)
                    logger.info(f"✅ Batch {self.stats['batches_processed'] + 1}: {stored}/{len(batch)} chunks stored")
                    self.stats["batches_processed"] += 1
                else:
                    logger.error(f"❌ Batch storage failed: {response.status_code} - {response.text}")
                    self.stats["errors"] += 1
                    return False

                # Small delay between batches
                time.sleep(0.2)

            return True

        except Exception as e:
            logger.error(f"❌ Error storing chunks in {target_collection}: {e}")
            self.stats["errors"] += 1
            return False

    def run_remap(self):
        """Execute the complete remapping process"""
        logger.info("🚀 Starting collection remapping process...")

        # Step 1: Get all chunks from zantara_memories
        all_chunks = self.get_all_chunks_from_collection()

        if not all_chunks:
            logger.error("❌ No chunks found to remap!")
            return False

        logger.info(f"📊 Processing {len(all_chunks)} total chunks...")

        # Step 2: Group chunks by target collection
        chunks_by_collection = {}

        for chunk in all_chunks:
            target_collection = self.extract_target_collection(chunk)

            if target_collection not in chunks_by_collection:
                chunks_by_collection[target_collection] = []

            chunks_by_collection[target_collection].append(chunk)

        # Show distribution
        logger.info("📋 Chunk distribution by collection:")
        for collection, chunks in chunks_by_collection.items():
            logger.info(f"  - {collection}: {len(chunks)} chunks")

        # Step 3: Remap chunks to correct collections
        success = True

        for collection, chunks in chunks_by_collection.items():
            logger.info(f"🔄 Processing collection: {collection}")

            # Ensure collection exists
            self.create_collection_if_not_exists(collection)

            # Store chunks in correct collection
            if self.store_chunks_in_collection(chunks, collection):
                self.stats["chunks_migrated"][collection] = len(chunks)
                logger.info(f"✅ Successfully migrated {len(chunks)} chunks to {collection}")
            else:
                logger.error(f"❌ Failed to migrate chunks to {collection}")
                success = False

        # Step 4: Final report
        logger.info("🎉 Collection remapping completed!")
        logger.info("=" * 50)
        logger.info("📊 FINAL REPORT:")
        logger.info(f"  - Total chunks read: {self.stats['total_chunks_read']}")
        logger.info(f"  - Batches processed: {self.stats['batches_processed']}")
        logger.info(f"  - Errors encountered: {self.stats['errors']}")
        logger.info("  - Chunks migrated by collection:")

        for collection, count in self.stats["chunks_migrated"].items():
            logger.info(f"    * {collection}: {count} chunks")

        logger.info("=" * 50)

        if success:
            logger.info("✅ Collection remapping completed successfully!")
            logger.info("🧪 Test search functionality now")
        else:
            logger.error("❌ Collection remapping completed with errors!")

        return success

def main():
    """Main execution function"""
    print("🔧 ZANTARA Collection Remapping Tool")
    print("=" * 50)
    print("🎯 Purpose: Fix critical collection mapping issue")
    print("📊 Moving 8,122+ chunks to correct collections")
    print("=" * 50)

    # Confirm with user
    confirm = input("❓ Do you want to proceed with collection remapping? (y/N): ")
    if confirm.lower() != 'y':
        print("❌ Operation cancelled by user")
        return

    # Run the remapping
    remapper = CollectionRemapper()
    success = remapper.run_remap()

    if success:
        print("\n🎉 SUCCESS! Collection remapping completed!")
        print("🧪 You can now test the KB search functionality")
    else:
        print("\n❌ FAILURE! Collection remapping encountered errors")
        print("🔍 Check the log file for details")

if __name__ == "__main__":
    main()