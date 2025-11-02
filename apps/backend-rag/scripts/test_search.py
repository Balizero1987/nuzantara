#!/usr/bin/env python3
"""
ZANTARA RAG - Search Testing Script
Test semantic search functionality with various queries
"""

import sys
from pathlib import Path
import asyncio

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.search_service import SearchService
from core.vector_db import ChromaDBClient


async def test_queries():
    """Test various queries at different access levels"""

    print("=" * 70)
    print("🔍 ZANTARA RAG - Search Test Suite")
    print("=" * 70)
    print()

    # Check database first
    print("📊 Checking database...")
    try:
        db = ChromaDBClient()
        stats = db.get_collection_stats()
        print(f"✅ Database: {stats['total_documents']:,} documents indexed")
        print()
    except Exception as e:
        print(f"❌ Database error: {e}")
        print("   Make sure you've run: python scripts/ingest_all_books.py")
        return

    # Initialize search service
    print("🚀 Initializing search service...")
    service = SearchService()
    print("✅ Search service ready")
    print()

    # Test cases: (query, level, expected_tier_access)
    test_cases = [
        ("What is consciousness?", 0, "Level 0 (Tier S only)"),
        ("Explain quantum mechanics", 1, "Level 1 (Tiers S + A)"),
        ("How to apply for KITAS visa in Bali?", 2, "Level 2 (Tiers S + A + B + C)"),
        ("Indonesian philosophy and gotong royong", 3, "Level 3 (All tiers)"),
        ("Meditation techniques", 1, "Level 1 (Tiers S + A)"),
    ]

    for i, (query, level, description) in enumerate(test_cases, 1):
        print("─" * 70)
        print(f"Test {i}: {description}")
        print(f"Query: '{query}'")
        print("─" * 70)

        try:
            results = await service.search(
                query=query,
                user_level=level,
                limit=3
            )

            found = results["results"]["total_found"]
            print(f"✅ Found {found} results")
            print()

            if found > 0:
                for j, idx in enumerate(range(min(3, found)), 1):
                    doc = results["results"]["documents"][idx] if idx < len(results["results"]["documents"]) else None
                    meta = results["results"]["metadatas"][idx] if idx < len(results["results"]["metadatas"]) else None
                    dist = results["results"]["distances"][idx] if idx < len(results["results"]["distances"]) else None

                    if doc and meta:
                        similarity = 1 / (1 + dist) if dist is not None else 0

                        print(f"{j}. {meta.get('book_title', 'Unknown Title')}")
                        print(f"   Author: {meta.get('book_author', 'Unknown')}")
                        print(f"   Tier: {meta.get('tier', '?')}")
                        print(f"   Similarity: {similarity:.3f}")
                        print(f"   Text: {doc[:150]}...")
                        print()
            else:
                print("   No results found. Try ingesting more books.")
                print()

        except Exception as e:
            print(f"❌ Search failed: {e}")
            print()

    print("=" * 70)
    print("✅ Test suite complete!")
    print()
    print("💡 Next steps:")
    print("   • Start API: uvicorn backend.app.main:app --reload")
    print("   • Test endpoint: curl -X POST http://localhost:8000/search")
    print("   • View docs: http://localhost:8000/docs")
    print()


if __name__ == "__main__":
    asyncio.run(test_queries())