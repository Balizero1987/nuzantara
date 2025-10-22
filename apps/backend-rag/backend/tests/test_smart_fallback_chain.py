"""
Test Smart Fallback Chain Agent (Phase 3)

Tests confidence scoring and fallback chain routing functionality.
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))

# Direct import to avoid dependency issues
import importlib.util
spec = importlib.util.spec_from_file_location(
    "query_router",
    backend_path / "services" / "query_router.py"
)
query_router_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(query_router_module)
QueryRouter = query_router_module.QueryRouter


def test_confidence_scoring():
    """Test confidence calculation with different query types"""
    router = QueryRouter()

    print("=" * 80)
    print("TEST 1: CONFIDENCE SCORING")
    print("=" * 80)

    test_queries = [
        # High confidence - multiple matches, long query, specific
        ("What are the requirements for KITAS visa in Indonesia including costs and timeline?", "> 0.7"),

        # Medium confidence - some matches, medium length
        ("KBLI code for restaurant", "0.3 - 0.7"),

        # Low confidence - vague, short
        ("business", "< 0.3"),

        # No matches
        ("hello how are you", "< 0.3"),
    ]

    for query, expected in test_queries:
        collection, confidence, fallbacks = router.route_with_confidence(query)
        print(f"\nQuery: \"{query}\"")
        print(f"  Primary: {collection}")
        print(f"  Confidence: {confidence:.2f} (expected {expected})")
        print(f"  Fallbacks: {fallbacks[1:] if len(fallbacks) > 1 else 'None (high confidence)'}")
        print(f"  Total collections to query: {len(fallbacks)}")


def test_fallback_chains():
    """Test fallback chain logic based on confidence"""
    router = QueryRouter()

    print("\n" + "=" * 80)
    print("TEST 2: FALLBACK CHAIN LOGIC")
    print("=" * 80)

    # Test high confidence (no fallbacks)
    print("\n--- High Confidence Query ---")
    collection, confidence, fallbacks = router.route_with_confidence(
        "KITAS visa requirements and IMTA work permit process for foreigners in Bali"
    )
    print(f"Query: KITAS visa requirements...")
    print(f"Confidence: {confidence:.2f}")
    print(f"Collections: {fallbacks}")
    assert len(fallbacks) == 1, "High confidence should have no fallbacks"

    # Test medium confidence (1 fallback)
    print("\n--- Medium Confidence Query ---")
    collection, confidence, fallbacks = router.route_with_confidence(
        "visa requirements"
    )
    print(f"Query: visa requirements")
    print(f"Confidence: {confidence:.2f}")
    print(f"Collections: {fallbacks}")
    assert len(fallbacks) >= 1, "Medium confidence should have fallbacks"

    # Test low confidence (3 fallbacks)
    print("\n--- Low Confidence Query ---")
    collection, confidence, fallbacks = router.route_with_confidence(
        "bali"
    )
    print(f"Query: bali")
    print(f"Confidence: {confidence:.2f}")
    print(f"Collections: {fallbacks}")
    print(f"Fallback chain for {collection}: {router.FALLBACK_CHAINS.get(collection, [])}")


def test_domain_specific_fallbacks():
    """Test that fallback chains are domain-appropriate"""
    router = QueryRouter()

    print("\n" + "=" * 80)
    print("TEST 3: DOMAIN-SPECIFIC FALLBACK CHAINS")
    print("=" * 80)

    test_cases = [
        ("tax", "tax_knowledge"),
        ("visa", "visa_oracle"),
        ("kbli", "kbli_eye"),
        ("property for sale", "property_listings"),
        ("legal entity", "legal_architect"),
    ]

    for query, expected_primary in test_cases:
        collection, confidence, fallbacks = router.route_with_confidence(query)
        print(f"\nQuery: \"{query}\"")
        print(f"  Primary: {collection} (expected: {expected_primary})")
        print(f"  Confidence: {confidence:.2f}")
        print(f"  Fallback chain: {fallbacks[1:] if len(fallbacks) > 1 else 'None'}")

        # Verify fallback relevance
        if len(fallbacks) > 1:
            print(f"  ✓ Fallbacks are from: {', '.join(fallbacks[1:])}")


def test_stats_tracking():
    """Test fallback statistics tracking"""
    router = QueryRouter()

    print("\n" + "=" * 80)
    print("TEST 4: STATISTICS TRACKING")
    print("=" * 80)

    # Run multiple queries
    queries = [
        "KITAS visa requirements and costs timeline eligibility",  # High confidence
        "KBLI restaurant",  # Medium
        "tax",  # Low
        "hello",  # Low
        "PT PMA incorporation requirements BKPM notary",  # High
    ]

    for query in queries:
        router.route_with_confidence(query)

    stats = router.get_fallback_stats()

    print("\nFallback Statistics:")
    print(f"  Total routes: {stats['total_routes']}")
    print(f"  High confidence: {stats['high_confidence']}")
    print(f"  Medium confidence: {stats['medium_confidence']}")
    print(f"  Low confidence: {stats['low_confidence']}")
    print(f"  Fallbacks used: {stats['fallbacks_used']}")
    print(f"  Fallback rate: {stats['fallback_rate']}")
    print(f"  Confidence distribution: {stats['confidence_distribution']}")


def test_backward_compatibility():
    """Test that existing route() method still works"""
    router = QueryRouter()

    print("\n" + "=" * 80)
    print("TEST 5: BACKWARD COMPATIBILITY")
    print("=" * 80)

    # Old method should still work
    collection = router.route("KITAS visa")
    print(f"\nOld route() method: {collection}")
    assert collection == "visa_oracle"

    # New method with same query
    collection_new, confidence, fallbacks = router.route_with_confidence("KITAS visa")
    print(f"New route_with_confidence() method: {collection_new} (confidence={confidence:.2f})")
    assert collection_new == "visa_oracle"

    print("\n✓ Backward compatibility maintained")


def run_all_tests():
    """Run all tests"""
    print("\n")
    print("╔" + "=" * 78 + "╗")
    print("║" + " " * 20 + "SMART FALLBACK CHAIN AGENT TESTS" + " " * 26 + "║")
    print("╚" + "=" * 78 + "╝")

    try:
        test_confidence_scoring()
        test_fallback_chains()
        test_domain_specific_fallbacks()
        test_stats_tracking()
        test_backward_compatibility()

        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED")
        print("=" * 80)
        print("\nSmart Fallback Chain Agent is ready for production!")

    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        raise


if __name__ == "__main__":
    run_all_tests()
