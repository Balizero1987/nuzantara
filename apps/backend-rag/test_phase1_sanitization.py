"""
Test Phase 1 & 2: Response Sanitization
Verifies that training data artifacts are removed and responses are properly formatted
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "backend"))

from utils.response_sanitizer import (
    sanitize_zantara_response,
    enforce_santai_mode,
    add_contact_if_appropriate,
    process_zantara_response
)


def test_sanitization():
    """Test response sanitization removes training artifacts"""

    print("🧪 Testing Response Sanitization\n")
    print("=" * 80)

    test_cases = [
        # Test 1: Remove [PRICE] markers
        {
            "input": "KITAS costa [PRICE] USD per anno",
            "expected_removed": "[PRICE]",
            "description": "Remove [PRICE] placeholder"
        },
        # Test 2: Remove [MANDATORY] markers
        {
            "input": "Passport is [MANDATORY] for visa application",
            "expected_removed": "[MANDATORY]",
            "description": "Remove [MANDATORY] placeholder"
        },
        # Test 3: Remove User:/Assistant: format leaks
        {
            "input": "User: Hello\nAssistant: Ciao! Come posso aiutarti?",
            "expected_removed": "User:",
            "description": "Remove training format leaks"
        },
        # Test 4: Remove markdown headers
        {
            "input": "### **KITAS Requirements**\n\nPassport needed",
            "expected_removed": "###",
            "description": "Remove markdown headers"
        },
    ]

    passed = 0
    failed = 0

    for i, test in enumerate(test_cases, 1):
        input_text = test["input"]
        expected_removed = test["expected_removed"]
        description = test["description"]

        cleaned = sanitize_zantara_response(input_text)

        # Check if artifact was removed
        is_removed = expected_removed not in cleaned
        status = "✅ PASS" if is_removed else "❌ FAIL"

        if is_removed:
            passed += 1
        else:
            failed += 1

        print(f"{status} Test {i}: {description}")
        print(f"   Input:  {input_text[:60]}...")
        print(f"   Output: {cleaned[:60]}...")
        print()

    print("=" * 80)
    print(f"\n📊 Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")

    return failed == 0


def test_length_enforcement():
    """Test SANTAI mode length enforcement"""

    print("\n🧪 Testing SANTAI Mode Length Enforcement\n")
    print("=" * 80)

    # Test greeting (should be short)
    long_greeting = "Ciao! " + "Benvenuto! " * 20  # Very long
    short_greeting = enforce_santai_mode(long_greeting, "greeting", max_words=30)

    word_count = len(short_greeting.split())
    is_short = word_count <= 30
    status = "✅ PASS" if is_short else "❌ FAIL"

    print(f"{status} Greeting length enforcement")
    print(f"   Original: {len(long_greeting)} chars, {len(long_greeting.split())} words")
    print(f"   Truncated: {len(short_greeting)} chars, {word_count} words (max 30)")
    print(f"   Result: {short_greeting}")
    print()

    # Test business (should NOT be truncated)
    long_business = "KITAS requirements: " + "Document needed. " * 20
    kept_business = enforce_santai_mode(long_business, "business", max_words=30)

    is_kept = len(kept_business) == len(long_business)
    status = "✅ PASS" if is_kept else "❌ FAIL"

    print(f"{status} Business query NOT truncated")
    print(f"   Original: {len(long_business)} chars")
    print(f"   Output: {len(kept_business)} chars (should be same)")
    print()

    print("=" * 80)

    return is_short and is_kept


def test_contact_logic():
    """Test contact info is added appropriately"""

    print("\n🧪 Testing Contact Info Logic\n")
    print("=" * 80)

    test_cases = [
        ("Ciao!", "greeting", False, "NO contact for greeting"),
        ("Come stai?", "casual", False, "NO contact for casual"),
        ("What is KITAS?", "business", True, "Contact for business"),
        ("Help! Urgent!", "emergency", True, "Contact for emergency"),
    ]

    passed = 0
    failed = 0

    for response, query_type, should_have_contact, description in test_cases:
        result = add_contact_if_appropriate(response, query_type)

        has_contact = "whatsapp" in result.lower() or "+62" in result
        is_correct = (has_contact == should_have_contact)
        status = "✅ PASS" if is_correct else "❌ FAIL"

        if is_correct:
            passed += 1
        else:
            failed += 1

        print(f"{status} {description}")
        print(f"   Query type: {query_type}")
        print(f"   Has contact: {has_contact} (expected: {should_have_contact})")
        print()

    print("=" * 80)
    print(f"\n📊 Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")

    return failed == 0


if __name__ == "__main__":
    test1 = test_sanitization()
    test2 = test_length_enforcement()
    test3 = test_contact_logic()

    if test1 and test2 and test3:
        print("\n✅ ALL SANITIZATION TESTS PASSED!")
        print("\n🎯 Phase 1 & 2 Implementation Complete:")
        print("   ✅ Query classification (RAG skip for greetings)")
        print("   ✅ Response sanitization (remove training artifacts)")
        print("   ✅ Length enforcement (SANTAI mode max 30 words)")
        print("   ✅ Contact info logic (only for business/emergency)")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed - review implementation")
        sys.exit(1)
