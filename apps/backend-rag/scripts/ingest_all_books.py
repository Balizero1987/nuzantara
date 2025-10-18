#!/usr/bin/env python3
"""
ZANTARA RAG - Batch Book Ingestion Script
Ingest all books from data/raw_books/ directory with progress tracking
"""

import os
import sys
from pathlib import Path
from tqdm import tqdm
import logging
import asyncio
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.ingestion_service import IngestionService
from core.vector_db import ChromaDBClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def ingest_book_with_retry(service: IngestionService, book_path: Path, max_retries: int = 2):
    """Ingest a book with retry logic"""
    for attempt in range(max_retries + 1):
        try:
            result = await service.ingest_book(str(book_path))
            return result
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"Retry {attempt + 1}/{max_retries} for {book_path.name}: {e}")
                await asyncio.sleep(2)
            else:
                logger.error(f"Failed after {max_retries} retries: {book_path.name}")
                return {
                    "success": False,
                    "book_title": book_path.stem,
                    "error": str(e)
                }


async def main():
    """Ingest all books with progress bar"""

    print("=" * 70)
    print("📚 ZANTARA RAG - Batch Book Ingestion")
    print("=" * 70)
    print()

    # Setup
    books_dir = Path("data/raw_books")

    if not books_dir.exists():
        print(f"❌ Error: Directory not found: {books_dir}")
        print(f"   Please create it and add your books.")
        return

    # Initialize service
    print("🔧 Initializing ingestion service...")
    service = IngestionService()

    # Get all PDF/EPUB files
    pdf_files = list(books_dir.glob("*.pdf"))
    epub_files = list(books_dir.glob("*.epub"))
    all_books = pdf_files + epub_files

    if not all_books:
        print(f"❌ No books found in {books_dir}")
        print(f"   Supported formats: .pdf, .epub")
        return

    print(f"✅ Found {len(all_books)} books ({len(pdf_files)} PDF, {len(epub_files)} EPUB)")
    print()

    # Confirm
    response = input(f"Proceed with ingestion? This may take 30-60 minutes. (y/N): ")
    if response.lower() != 'y':
        print("Cancelled.")
        return

    print()
    print("🚀 Starting ingestion...")
    print()

    # Track stats
    start_time = datetime.now()
    successful = 0
    failed = 0
    total_chunks = 0
    tier_counts = {"S": 0, "A": 0, "B": 0, "C": 0, "D": 0}

    # Process with progress bar
    with tqdm(total=len(all_books), desc="Ingesting books", unit="book") as pbar:
        for book_path in all_books:
            try:
                result = await ingest_book_with_retry(service, book_path)

                if result.get("success"):
                    successful += 1
                    chunks = result.get("chunks_created", 0)
                    total_chunks += chunks
                    tier = result.get("tier", "Unknown")
                    if tier in tier_counts:
                        tier_counts[tier] += 1

                    tqdm.write(
                        f"✅ {book_path.name}: "
                        f"{chunks} chunks (Tier {tier})"
                    )
                else:
                    failed += 1
                    error = result.get("error", "Unknown error")
                    tqdm.write(f"❌ {book_path.name}: {error}")

            except Exception as e:
                failed += 1
                tqdm.write(f"❌ {book_path.name}: {str(e)}")

            pbar.update(1)

    duration = (datetime.now() - start_time).total_seconds()

    # Final summary
    print()
    print("=" * 70)
    print("🎉 Ingestion Complete!")
    print("=" * 70)
    print()
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    print(f"📊 Total chunks created: {total_chunks:,}")
    print(f"⏱️  Duration: {duration:.1f} seconds ({duration/60:.1f} minutes)")
    print()
    print("📚 Tier Distribution:")
    for tier, count in sorted(tier_counts.items()):
        if count > 0:
            print(f"   Tier {tier}: {count} books")
    print()

    # Database stats
    print("🔍 Querying database stats...")
    try:
        db = ChromaDBClient()
        stats = db.get_collection_stats()

        print(f"📊 Database: {stats['collection_name']}")
        print(f"   Total documents: {stats['total_documents']:,}")
        print(f"   Location: {stats['persist_directory']}")

        if stats.get('tiers_distribution'):
            print(f"   Tiers in DB: {stats['tiers_distribution']}")

    except Exception as e:
        print(f"⚠️  Could not get database stats: {e}")

    print()
    print("✨ Ready for search!")
    print("   Run: python scripts/test_search.py")
    print("   Or start API: uvicorn backend.app.main:app --reload")
    print()


if __name__ == "__main__":
    asyncio.run(main())