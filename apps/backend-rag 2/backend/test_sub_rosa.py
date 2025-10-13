"""
Test Sub Rosa Protocol - Phase 3
Tests content filtering by tier and topic
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.sub_rosa_mapper import SubRosaMapper


def test_sub_rosa_mapper():
    """Test Sub Rosa tier and topic filtering"""
    mapper = SubRosaMapper()

    print("🧪 Testing SubRosaMapper\n")
    print("=" * 60)

    # Test 1: Tier mapping
    print("\n📝 Test 1: Sub Rosa Level → Tier Mapping")
    for level in [0, 1, 2, 3]:
        tiers = mapper.get_allowed_tiers(level)
        print(f"   L{level}: {tiers}")

    assert mapper.get_allowed_tiers(0) == ["D", "C"]
    assert mapper.get_allowed_tiers(1) == ["D", "C", "B"]
    assert mapper.get_allowed_tiers(2) == ["D", "C", "B", "A"]
    assert mapper.get_allowed_tiers(3) == ["D", "C", "B", "A", "S"]
    print("   ✅ PASS")

    # Test 2: Public topics (always accessible)
    print("\n📝 Test 2: Public Topics (always accessible)")
    public_topics = ["visa", "b211a", "kitas", "business_indonesia", "travel"]
    for level in [0, 1, 2, 3]:
        for topic in public_topics:
            assert mapper.can_access_topic(level, topic), f"L{level} should access {topic}"
    print(f"   Topics: {public_topics}")
    print("   ✅ All levels can access public topics")

    # Test 3: Sacred topics (L2+ required)
    print("\n📝 Test 3: Sacred Topics (L2+ required)")
    sacred_topics = ["ritual", "tantra", "kundalini", "magic", "kabbalah_practice"]

    # L0 and L1 should NOT access
    for level in [0, 1]:
        for topic in sacred_topics:
            assert not mapper.can_access_topic(level, topic), f"L{level} should NOT access {topic}"
    print(f"   L0/L1: ❌ Blocked")

    # L2 and L3 should access
    for level in [2, 3]:
        for topic in sacred_topics:
            assert mapper.can_access_topic(level, topic), f"L{level} should access {topic}"
    print(f"   L2/L3: ✅ Allowed")
    print("   ✅ PASS")

    # Test 4: Supreme sacred topics (L3 only)
    print("\n📝 Test 4: Supreme Sacred Topics (L3 only)")
    supreme_topics = ["inner_alchemy", "theurgy", "advaita_vedanta", "guenon_metaphysics"]

    # L0, L1, L2 should NOT access
    for level in [0, 1, 2]:
        for topic in supreme_topics:
            assert not mapper.can_access_topic(level, topic), f"L{level} should NOT access {topic}"
    print(f"   L0/L1/L2: ❌ Blocked")

    # L3 should access
    for topic in supreme_topics:
        assert mapper.can_access_topic(3, topic), f"L3 should access {topic}"
    print(f"   L3: ✅ Allowed")
    print("   ✅ PASS")

    # Test 5: Filter results by topics
    print("\n📝 Test 5: Filter Results by Topics")

    mock_results = [
        {
            "text": "Visa B211A information...",
            "metadata": {"title": "Visa Guide", "topics": ["visa", "b211a"]},
            "score": 0.95
        },
        {
            "text": "Tantric practices require initiation...",
            "metadata": {"title": "Tantra Manual", "topics": ["tantra", "ritual"]},
            "score": 0.92
        },
        {
            "text": "Advaita Vedanta supreme non-duality...",
            "metadata": {"title": "Guénon Metaphysics", "topics": ["advaita_vedanta", "guenon_metaphysics"]},
            "score": 0.90
        },
        {
            "text": "Indonesian business formation...",
            "metadata": {"title": "PT PMA Guide", "topics": ["business_indonesia", "pt_pma"]},
            "score": 0.88
        }
    ]

    # L0 (Public) - Should only get visa and business
    l0_filtered = mapper.filter_results_by_topics(mock_results, 0)
    assert len(l0_filtered) == 2, f"L0 should get 2 results, got {len(l0_filtered)}"
    print(f"   L0 (Public): {len(l0_filtered)} results (visa, business)")

    # L2 (Practitioner) - Should get visa, business, tantra (but NOT supreme)
    l2_filtered = mapper.filter_results_by_topics(mock_results, 2)
    assert len(l2_filtered) == 3, f"L2 should get 3 results, got {len(l2_filtered)}"
    print(f"   L2 (Practitioner): {len(l2_filtered)} results (+ tantra)")

    # L3 (Initiated) - Should get all
    l3_filtered = mapper.filter_results_by_topics(mock_results, 3)
    assert len(l3_filtered) == 4, f"L3 should get 4 results, got {len(l3_filtered)}"
    print(f"   L3 (Initiated): {len(l3_filtered)} results (all)")

    print("   ✅ PASS")

    # Test 6: Content summary
    print("\n📝 Test 6: Content Access Summary")
    for level in [0, 1, 2, 3]:
        summary = mapper.get_content_summary(level)
        print(f"   L{level}: {summary['description']}")
        print(f"        Tiers: {summary['allowed_tiers']}")
        print(f"        Sacred L2+: {summary['sacred_topics_l2']}")
        print(f"        Supreme L3: {summary['supreme_sacred_l3']}")
    print("   ✅ PASS")

    print("\n" + "=" * 60)
    print("🎉 PHASE 3 SUB ROSA PROTOCOL TESTS PASSED!")
    print("=" * 60)


if __name__ == "__main__":
    test_sub_rosa_mapper()
