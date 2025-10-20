#!/usr/bin/env python3
"""
Test script for QueryRouter multi-collection routing
Tests keyword-based routing before deploying to production
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.query_router import QueryRouter


def test_routing():
    """Test routing with various queries"""
    router = QueryRouter()

    # Test cases: (query, expected_collection)
    test_cases = [
        # Bali Zero operational queries
        ("What is B211A visa?", "bali_zero_agents"),
        ("How do I apply for KITAS?", "bali_zero_agents"),
        ("What are the requirements for PT PMA formation?", "bali_zero_agents"),
        ("KBLI code for restaurant business", "bali_zero_agents"),
        ("Indonesian tax compliance for foreigners", "bali_zero_agents"),
        ("Bali Zero pricing for visa services", "bali_zero_agents"),
        ("What is NPWP and how to get one?", "bali_zero_agents"),
        ("OSS risk-based licensing system", "bali_zero_agents"),

        # Philosophical/technical book queries
        ("Explain Plato's Republic", "zantara_books"),
        ("What is Aristotle's concept of ethics?", "zantara_books"),
        ("Summarize the Mahabharata", "zantara_books"),
        ("Geertz religion of java analysis", "zantara_books"),
        ("Design patterns in software engineering", "zantara_books"),
        ("SICP chapter on recursion", "zantara_books"),
        ("Machine learning probabilistic models", "zantara_books"),
        ("Shakespeare's Hamlet analysis", "zantara_books"),

        # Ambiguous (should default to bali_zero_agents)
        ("Tell me about Bali", "bali_zero_agents"),
        ("Indonesia general information", "bali_zero_agents"),
    ]

    print("=" * 80)
    print("QUERY ROUTING TEST")
    print("=" * 80)
    print()

    passed = 0
    failed = 0

    for query, expected in test_cases:
        result = router.route(query)
        status = "✅ PASS" if result == expected else "❌ FAIL"

        if result == expected:
            passed += 1
        else:
            failed += 1

        print(f"{status} | Query: '{query}'")
        print(f"       | Expected: {expected}, Got: {result}")
        print()

    print("=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    print("=" * 80)
    print()

    # Show detailed routing stats for a few queries
    print("=" * 80)
    print("DETAILED ROUTING ANALYSIS")
    print("=" * 80)
    print()

    sample_queries = [
        "What is B211A visa?",
        "Explain Plato's Republic",
        "KBLI code for software development"
    ]

    for query in sample_queries:
        stats = router.get_routing_stats(query)
        print(f"Query: '{query}'")
        print(f"  Collection: {stats['selected_collection']}")
        print(f"  Bali Zero score: {stats['bali_zero_score']} (matches: {stats['bali_zero_matches'][:3]})")
        print(f"  Books score: {stats['books_score']} (matches: {stats['books_matches'][:3]})")
        print(f"  Method: {stats['routing_method']}")
        print()

    return failed == 0


if __name__ == "__main__":
    success = test_routing()
    sys.exit(0 if success else 1)
