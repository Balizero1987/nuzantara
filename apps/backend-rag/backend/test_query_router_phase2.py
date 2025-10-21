"""
Test Query Router Phase 2
Verifies 9-way intelligent routing with Oracle collections
"""

import sys
from pathlib import Path

# Add parent to path
sys.path.append(str(Path(__file__).parent))

from services.query_router import QueryRouter

# Initialize router
router = QueryRouter()

# Test queries for each collection
test_queries = [
    # TAX UPDATES
    ("What are the latest tax updates for 2025?", "tax_updates"),
    ("Recent changes in PPh 21 regulations", "tax_updates"),
    ("New tax announcement from DJP", "tax_updates"),

    # TAX KNOWLEDGE
    ("How to calculate PPh 21?", "tax_knowledge"),
    ("What is the corporate tax rate in Indonesia?", "tax_knowledge"),
    ("Explain transfer pricing regulations", "tax_knowledge"),

    # LEGAL UPDATES
    ("Latest property law changes", "legal_updates"),
    ("New regulations for PT PMA", "legal_updates"),
    ("Recent legal updates for foreign investors", "legal_updates"),

    # LEGAL ARCHITECT
    ("How to set up a PT PMA?", "legal_architect"),
    ("What is the process for company incorporation?", "legal_architect"),
    ("Legal structure for foreign investment", "legal_architect"),

    # PROPERTY LISTINGS
    ("Villas for sale in Canggu", "property_listings"),
    ("Beachfront property available in Seminyak", "property_listings"),
    ("Land for rent in Ubud", "property_listings"),

    # PROPERTY KNOWLEDGE
    ("What is leasehold vs freehold?", "property_knowledge"),
    ("Explain HGB property rights", "property_knowledge"),
    ("Property ownership structures in Bali", "property_knowledge"),

    # VISA ORACLE
    ("How to get a KITAS?", "visa_oracle"),
    ("B211 visa requirements", "visa_oracle"),
    ("Retirement visa Indonesia", "visa_oracle"),

    # KBLI EYE
    ("What is the KBLI code for restaurant business?", "kbli_eye"),
    ("Business classification for software development", "kbli_eye"),
    ("OSS NIB requirements", "kbli_eye"),

    # ZANTARA BOOKS
    ("What is Plato's philosophy?", "zantara_books"),
    ("Explain SICP recursion", "zantara_books"),
    ("Indonesian culture Geertz", "zantara_books"),
]

print("=" * 80)
print("QUERY ROUTER PHASE 2 - TEST RESULTS")
print("=" * 80)
print()

correct = 0
total = len(test_queries)

for query, expected_collection in test_queries:
    result = router.route(query)
    is_correct = result == expected_collection
    correct += is_correct

    status = "✅" if is_correct else "❌"
    print(f"{status} Query: {query}")
    print(f"   Expected: {expected_collection}")
    print(f"   Got:      {result}")

    if not is_correct:
        # Print routing stats for failed cases
        stats = router.get_routing_stats(query)
        print(f"   Scores: {stats['domain_scores']}")
        print(f"   Modifiers: {stats['modifier_scores']}")

    print()

print("=" * 80)
print(f"RESULTS: {correct}/{total} ({100 * correct / total:.1f}% accuracy)")
print("=" * 80)

# Print detailed stats for a few queries
print("\n" + "=" * 80)
print("DETAILED ROUTING ANALYSIS")
print("=" * 80)

sample_queries = [
    "Latest tax updates for foreign companies",
    "Beachfront villas for sale in Canggu",
    "How to calculate PPh 21 for employees?"
]

for query in sample_queries:
    print(f"\nQuery: \"{query}\"")
    stats = router.get_routing_stats(query)
    print(f"Selected: {stats['selected_collection']}")
    print(f"Domain Scores: {stats['domain_scores']}")
    print(f"Modifier Scores: {stats['modifier_scores']}")
    print(f"Total Matches: {stats['total_matches']}")
    print(f"Matched Keywords (sample): {list(stats['matched_keywords']['tax'])[:5] if stats['matched_keywords']['tax'] else 'None'}")

print("\n✅ Phase 2 QueryRouter testing complete!")
