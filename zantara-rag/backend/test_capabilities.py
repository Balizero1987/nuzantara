"""
Test Collaborative Capabilities - Phase 5
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.collaborative_capabilities import CollaborativeCapabilitiesService


async def test_collaborative_capabilities():
    """Test 10 collaborative capabilities"""
    service = CollaborativeCapabilitiesService()

    print("🧪 Testing CollaborativeCapabilitiesService\n")
    print("=" * 70)

    # Test 1: Create profile
    print("\n📝 Test 1: Create Collaborative Profile")
    profile = await service.get_profile("zero")
    print(f"   User ID: {profile.user_id}")
    print(f"   Personality Traits: {list(profile.personality_traits.keys())}")
    print(f"   Cognitive Style: {profile.cognitive_style}")
    print(f"   Trust Score: {profile.trust_score}")
    assert profile.user_id == "zero"
    assert len(profile.personality_traits) == 5
    print("   ✅ PASS")

    # Test 2: Update from interaction
    print("\n📝 Test 2: Update Profile from Interaction")
    message = "I'm curious about how the collaborative system works. This is fascinating!"
    profile = await service.update_from_interaction(
        user_id="zero",
        message=message,
        emotional_state="curious",
        response_quality=0.9
    )
    print(f"   Message: {message[:60]}...")
    print(f"   Openness (increased): {profile.personality_traits['openness']:.3f}")
    print(f"   Trust Score (increased): {profile.trust_score:.3f}")
    assert profile.personality_traits['openness'] > 0.5
    assert profile.trust_score > 0.5
    print("   ✅ PASS")

    # Test 3: Communication style detection
    print("\n📝 Test 3: Communication Style Detection")
    long_message = " ".join(["This is a long message"] * 20)  # 60+ words
    profile = await service.update_from_interaction(
        user_id="zero",
        message=long_message,
        emotional_state="neutral"
    )
    print(f"   Long message ({len(long_message.split())} words)")
    print(f"   Verbosity: {profile.communication_preferences['verbosity']}")
    assert profile.communication_preferences['verbosity'] == "high"
    print("   ✅ PASS")

    # Test 4: Needs anticipation
    print("\n📝 Test 4: Needs Anticipation")
    message = "How does the RAG system work exactly?"
    profile = await service.update_from_interaction(
        user_id="zero",
        message=message,
        emotional_state="curious"
    )
    print(f"   Message: {message}")
    print(f"   Anticipated Needs: {profile.anticipated_needs}")
    assert "technical documentation" in profile.anticipated_needs
    print("   ✅ PASS")

    # Test 5: Get capability summary
    print("\n📝 Test 5: Get Capability Summary")
    summary = await service.get_capability_summary("zero")
    print(f"   User: {summary['user_id']}")
    print(f"   Capabilities tracked: {len(summary['capabilities'])}")
    capabilities = summary['capabilities']
    print(f"   1. Personality: {capabilities['1_personality_profiling']['cognitive_style']}")
    print(f"   2. Communication: {capabilities['2_communication_style']['preferences']['verbosity']}")
    print(f"   4. Needs: {capabilities['4_needs_anticipation']['anticipated']}")
    print(f"   9. Trust: {capabilities['9_trust_level']['score']:.2f}")
    assert len(summary['capabilities']) == 10
    print("   ✅ PASS")

    # Test 6: Synergy calculation
    print("\n📝 Test 6: Synergy Calculation")
    # Create second profile
    await service.get_profile("amanda")
    await service.update_from_interaction(
        user_id="amanda",
        message="Thanks for the help!",
        emotional_state="grateful",
        response_quality=0.8
    )

    synergy = await service.calculate_synergy("zero", "amanda")
    print(f"   Synergy between Zero and Amanda: {synergy:.2f}")
    assert 0.0 <= synergy <= 1.0
    print("   ✅ PASS")

    # Test 7: Multiple profiles
    print("\n📝 Test 7: Multiple Profiles")
    users = ["zero", "amanda", "marisabel", "clara"]
    for user in users:
        await service.get_profile(user)

    stats = service.get_stats()
    print(f"   Total profiles: {stats['total_profiles']}")
    print(f"   Capabilities tracked: {stats['capabilities_tracked']}")
    assert stats['total_profiles'] >= 4
    assert stats['capabilities_tracked'] == 10
    print("   ✅ PASS")

    # Test 8: Trust score progression
    print("\n📝 Test 8: Trust Score Progression")
    initial_trust = profile.trust_score
    for i in range(5):
        profile = await service.update_from_interaction(
            user_id="zero",
            message="test",
            emotional_state="neutral",
            response_quality=0.9  # High quality interactions
        )
    final_trust = profile.trust_score
    print(f"   Initial trust: {initial_trust:.3f}")
    print(f"   Final trust (after 5 interactions): {final_trust:.3f}")
    print(f"   Increase: {final_trust - initial_trust:.3f}")
    assert final_trust > initial_trust
    print("   ✅ PASS")

    # Test 9: All 10 capabilities present
    print("\n📝 Test 9: Verify All 10 Capabilities")
    summary = await service.get_capability_summary("zero")
    expected_capabilities = [
        "1_personality_profiling",
        "2_communication_style",
        "3_synergy_mapping",
        "4_needs_anticipation",
        "5_knowledge_transfer",
        "6_conflict_resolution",
        "7_growth_trajectory",
        "8_collaborative_rhythm",
        "9_trust_level",
        "10_creative_catalyst"
    ]
    for cap in expected_capabilities:
        assert cap in summary['capabilities'], f"Missing capability: {cap}"
        print(f"   ✅ {cap}")
    print("   ✅ PASS")

    print("\n" + "=" * 70)
    print("🎉 PHASE 5 COLLABORATIVE CAPABILITIES TESTS PASSED!")
    print("=" * 70)
    print("\n10 Capabilities:")
    print("  1. Personality Profiling")
    print("  2. Communication Style Adaptation")
    print("  3. Synergy Mapping")
    print("  4. Needs Anticipation")
    print("  5. Knowledge Transfer Optimization")
    print("  6. Conflict Resolution Patterns")
    print("  7. Growth Trajectory Analysis")
    print("  8. Collaborative Rhythm Detection")
    print("  9. Trust Level Calibration")
    print("  10. Creative Catalyst Matching")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test_collaborative_capabilities())
