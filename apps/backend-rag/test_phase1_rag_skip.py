"""
Test Phase 1: Query Classification & RAG Skip
Verifies that RAG is skipped for greetings/casual and enabled for business/emergency
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from utils.response_sanitizer import classify_query_type


def test_query_classification():
    """Test query classification for different message types"""

    print("🧪 Testing Query Classification & RAG Skip Logic\n")
    print("=" * 70)

    test_cases = [
        # Greetings (NO RAG expected)
        ("Ciao", "greeting", "NO RAG"),
        ("Hello", "greeting", "NO RAG"),
        ("Hi", "greeting", "NO RAG"),
        ("Buongiorno", "greeting", "NO RAG"),

        # Casual (NO RAG expected)
        ("Come stai?", "casual", "NO RAG"),
        ("How are you?", "casual", "NO RAG"),
        ("What's up?", "casual", "NO RAG"),

        # Business (RAG expected)
        ("What is KITAS?", "business", "RAG ENABLED"),
        ("How much does PT PMA cost?", "business", "RAG ENABLED"),
        ("Tell me about visa requirements", "business", "RAG ENABLED"),
        ("Quanto costa il KITAS?", "business", "RAG ENABLED"),

        # Emergency (RAG expected)
        ("Help! My visa expired!", "emergency", "RAG ENABLED"),
        ("Urgent: lost passport", "emergency", "RAG ENABLED"),
        ("Emergency visa problem", "emergency", "RAG ENABLED"),
    ]

    passed = 0
    failed = 0

    for message, expected_type, rag_status in test_cases:
        actual_type = classify_query_type(message)

        # Determine RAG usage
        will_use_rag = actual_type in ["business", "emergency"]
        actual_rag = "RAG ENABLED" if will_use_rag else "NO RAG"

        # Check if classification is correct
        is_correct = (actual_type == expected_type)
        status = "✅ PASS" if is_correct else "❌ FAIL"

        if is_correct:
            passed += 1
        else:
            failed += 1

        print(f"{status} | {message:40} | Type: {actual_type:12} | {actual_rag}")

    print("=" * 70)
    print(f"\n📊 Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")

    if failed == 0:
        print("✅ All query classification tests passed!")
        print("\n🎯 RAG Skip Logic:")
        print("   - Greetings/Casual → RAG SKIPPED (fast response)")
        print("   - Business/Emergency → RAG ENABLED (enhanced context)")
        return True
    else:
        print(f"❌ {failed} test(s) failed - please review classification logic")
        return False


if __name__ == "__main__":
    success = test_query_classification()
    sys.exit(0 if success else 1)
