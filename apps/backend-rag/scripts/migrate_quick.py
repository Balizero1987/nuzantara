#!/usr/bin/env python3
"""
Quick Migration: Use existing /data/chroma_db → Qdrant
No R2 download needed (data already present from normal startup)
"""

import os
import sys
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    print("\n" + "="*70)
    print("🚀 QUICK MIGRATION: /data/chroma_db → Qdrant")
    print("="*70 + "\n")
    
    # Check if ChromaDB data exists
    chroma_path = os.getenv("CHROMA_DB_PATH", "/data/chroma_db")
    
    if not os.path.exists(chroma_path):
        logger.error(f"❌ ChromaDB not found at {chroma_path}")
        logger.error("   Backend must run first to download from R2")
        sys.exit(1)
    
    logger.info(f"✅ Found ChromaDB at: {chroma_path}")
    
    # Check if chroma.sqlite3 exists
    sqlite_file = os.path.join(chroma_path, "chroma.sqlite3")
    if not os.path.exists(sqlite_file):
        logger.error(f"❌ chroma.sqlite3 not found in {chroma_path}")
        sys.exit(1)
    
    # Import migration logic
    try:
        from migrate_r2_to_qdrant import migrate_chromadb_to_qdrant, verify_migration
    except ImportError:
        logger.error("❌ Cannot import migration functions")
        logger.info("   Make sure migrate_r2_to_qdrant.py is in scripts/")
        sys.exit(1)
    
    # Get Qdrant URL
    qdrant_url = os.getenv("QDRANT_URL", "http://qdrant.railway.internal:8080")
    logger.info(f"📡 Qdrant URL: {qdrant_url}")
    
    print("\n" + "="*70)
    print("📊 Starting Migration from Existing ChromaDB")
    print("="*70 + "\n")
    
    # Run migration
    success = migrate_chromadb_to_qdrant(chroma_path, qdrant_url)
    
    if not success:
        logger.error("\n❌ Migration failed!")
        sys.exit(1)
    
    # Verify
    print("\n" + "="*70)
    print("✅ Verifying Migration")
    print("="*70 + "\n")
    
    verify_success = verify_migration(qdrant_url)
    
    if verify_success:
        print("\n" + "="*70)
        print("🎉 MIGRATION SUCCESSFUL!")
        print("="*70)
        print("\n✅ All data migrated to Qdrant")
        print("✅ SearchService can now use Qdrant")
        print("✅ ChromaDB SPOF eliminated!\n")
        return 0
    else:
        logger.error("\n❌ Verification failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
