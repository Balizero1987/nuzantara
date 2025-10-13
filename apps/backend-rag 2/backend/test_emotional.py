"""
Test Emotional Attunement Service - Phase 4
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

from services.emotional_attunement import EmotionalAttunementService, EmotionalState, ToneStyle


def test_emotional_attunement():
    """Test emotional state detection and tone adaptation"""
    service = EmotionalAttunementService()

    print("🧪 Testing EmotionalAttunementService\n")
    print("=" * 70)

    # Test 1: Stressed state
    print("\n📝 Test 1: Stressed State Detection")
    message = "URGENT!! I need help ASAP with my visa application! It's broken!"
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    print(f"   Indicators: {profile.detected_indicators[:3]}")
    assert profile.detected_state in [EmotionalState.STRESSED, EmotionalState.URGENT], \
        f"Expected stressed/urgent, got {profile.detected_state}"
    assert profile.suggested_tone in [ToneStyle.ENCOURAGING, ToneStyle.DIRECT]
    print("   ✅ PASS")

    # Test 2: Excited state
    print("\n📝 Test 2: Excited State Detection")
    message = "This is AMAZING!! I love the new features! Fantastic work!!"
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.detected_state == EmotionalState.EXCITED
    assert profile.suggested_tone == ToneStyle.WARM
    print("   ✅ PASS")

    # Test 3: Confused state
    print("\n📝 Test 3: Confused State Detection")
    message = "I'm confused about how this works. What does Sub Rosa mean? How do I use it?"
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.detected_state == EmotionalState.CONFUSED
    assert profile.suggested_tone == ToneStyle.SIMPLE
    print("   ✅ PASS")

    # Test 4: Curious state
    print("\n📝 Test 4: Curious State Detection")
    message = "I'm curious about the technical implementation. How does the RAG system work?"
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.detected_state == EmotionalState.CURIOUS
    assert profile.suggested_tone == ToneStyle.TECHNICAL
    print("   ✅ PASS")

    # Test 5: Grateful state
    print("\n📝 Test 5: Grateful State Detection")
    message = "Thank you so much for your help! I really appreciate it."
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.detected_state == EmotionalState.GRATEFUL
    assert profile.suggested_tone == ToneStyle.WARM
    print("   ✅ PASS")

    # Test 6: Neutral state (no strong indicators)
    print("\n📝 Test 6: Neutral State Detection")
    message = "Please send me the PT PMA application documents."
    profile = service.analyze_message(message)
    print(f"   Message: {message[:60]}...")
    print(f"   Detected: {profile.detected_state.value} (confidence: {profile.confidence:.2f})")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.detected_state == EmotionalState.NEUTRAL
    assert profile.suggested_tone == ToneStyle.PROFESSIONAL
    print("   ✅ PASS")

    # Test 7: Collaborator preferences override
    print("\n📝 Test 7: Collaborator Preference Override")
    message = "Tell me about the new system."
    preferences = {
        "preferred_tone": "warm",
        "formality": "casual"
    }
    profile = service.analyze_message(message, collaborator_preferences=preferences)
    print(f"   Message: {message}")
    print(f"   Preferences: {preferences}")
    print(f"   Detected: {profile.detected_state.value}")
    print(f"   Suggested Tone: {profile.suggested_tone.value}")
    assert profile.suggested_tone == ToneStyle.WARM, "Preference should override neutral tone"
    print("   ✅ PASS (preference override working)")

    # Test 8: Enhanced system prompt
    print("\n📝 Test 8: Enhanced System Prompt Generation")
    base_prompt = "You are ZANTARA, an AI assistant."
    message = "HELP!! This is urgent!"
    profile = service.analyze_message(message)
    enhanced = service.build_enhanced_system_prompt(
        base_prompt=base_prompt,
        emotional_profile=profile,
        collaborator_name="Zero"
    )
    print(f"   Base prompt length: {len(base_prompt)} chars")
    print(f"   Enhanced prompt length: {len(enhanced)} chars")
    assert "EMOTIONAL ATTUNEMENT" in enhanced
    assert "Zero" in enhanced
    assert profile.detected_state.value in enhanced.lower()
    print(f"   Contains emotional context: ✅")
    print(f"   Contains collaborator name: ✅")
    print("   ✅ PASS")

    # Test 9: Get stats
    print("\n📝 Test 9: Service Statistics")
    stats = service.get_stats()
    print(f"   Stats: {stats}")
    assert stats["supported_states"] == len(EmotionalState)
    assert stats["supported_tones"] == len(ToneStyle)
    assert len(stats["states"]) > 0
    print("   ✅ PASS")

    # Test 10: Tone prompts
    print("\n📝 Test 10: Tone Prompt Generation")
    for tone in ToneStyle:
        prompt = service.get_tone_prompt(tone)
        print(f"   {tone.value}: {prompt[:50]}...")
        assert len(prompt) > 0
    print("   ✅ PASS")

    print("\n" + "=" * 70)
    print("🎉 PHASE 4 EMOTIONAL ATTUNEMENT TESTS PASSED!")
    print("=" * 70)


if __name__ == "__main__":
    test_emotional_attunement()
