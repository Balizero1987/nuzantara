"""
Test Oracle Query Endpoint Locally
Tests routing and search functionality with populated collections
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-rag" / "backend"
sys.path.insert(0, str(backend_path))

from services.search_service import SearchService

def test_oracle_queries():
    """Test various queries against Oracle collections"""

    print("\n" + "="*70)
    print("ORACLE QUERY ENDPOINT - LOCAL TESTING")
    print("="*70 + "\n")

    # Initialize SearchService
    search_service = SearchService()

    test_cases = [
        ("What are the latest tax updates?", "tax_updates"),
        ("How to calculate PPh 21?", "tax_knowledge"),
        ("Villa for sale in Canggu", "property_listings"),
        ("What is HGB ownership?", "property_knowledge"),
        ("Recent PT PMA regulation changes", "legal_updates"),
        ("VAT increase 2025", "tax_updates"),
        ("Leasehold vs freehold", "property_knowledge"),
        ("Minimum wage Bali 2025", "legal_updates"),
    ]

    for query, expected_collection in test_cases:
        print(f"📝 Query: \"{query}\"")
        print(f"   Expected Collection: {expected_collection}")

        # Get routing
        routing_stats = search_service.router.get_routing_stats(query)
        routed_to = routing_stats["selected_collection"]

        print(f"   Routed To: {routed_to}")
        print(f"   Match: {'✅' if routed_to == expected_collection else '❌'}")

        # Search the collection
        vector_db = search_service.collections[routed_to]
        try:
            results = vector_db.search(query_text=query, limit=2)

            if results and results.get("documents"):
                print(f"   Results Found: {len(results['documents'])} documents")
                print(f"   Top Result Preview: {results['documents'][0][:100]}...")
            else:
                print(f"   ⚠️  No results found (collection may be empty)")

        except Exception as e:
            print(f"   ❌ Search error: {e}")

        print()

    print("="*70)
    print("✅ Local testing complete!")
    print("="*70 + "\n")


if __name__ == "__main__":
    test_oracle_queries()
