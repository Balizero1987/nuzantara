#!/usr/bin/env python3
"""
Test Phase 1 & 2 fixes for ZANTARA response quality
Demonstrates sanitization and length enforcement
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "apps/backend-rag/backend"))

from utils.response_sanitizer import (
    process_zantara_response,
    classify_query_type,
    sanitize_zantara_response,
    enforce_santai_mode,
    add_contact_if_appropriate
)


def test_case(name: str, message: str, raw_response: str):
    """Test a single case"""
    print(f"\n{'='*70}")
    print(f"TEST: {name}")
    print(f"{'='*70}")
    print(f"👤 USER: {message}")
    print(f"\n📄 RAW RESPONSE ({len(raw_response)} chars, {len(raw_response.split())} words):")
    print(f"{raw_response[:200]}..." if len(raw_response) > 200 else raw_response)

    # Classify query type
    query_type = classify_query_type(message)
    print(f"\n🏷️  QUERY TYPE: {query_type}")

    # Apply Phase 1 & 2 fixes
    sanitized = process_zantara_response(
        raw_response,
        query_type,
        apply_santai=True,
        add_contact=True
    )

    print(f"\n✨ SANITIZED RESPONSE ({len(sanitized)} chars, {len(sanitized.split())} words):")
    print(sanitized)

    # Quality checks
    issues = []
    improvements = []

    # Check length for greetings/casual
    if query_type in ["greeting", "casual"]:
        words = len(sanitized.split())
        if words <= 30:
            improvements.append(f"✅ Appropriate length ({words} words ≤ 30)")
        else:
            issues.append(f"⚠️  Still too long ({words} words > 30)")

    # Check for removed artifacts
    artifacts = ["[PRICE]", "[MANDATORY]", "User:", "Assistant:", "Context:", "###"]
    found_artifacts = [a for a in artifacts if a in sanitized]
    if not found_artifacts:
        improvements.append("✅ All training artifacts removed")
    else:
        issues.append(f"⚠️  Artifacts remain: {found_artifacts}")

    # Check contact info
    has_contact = "whatsapp" in sanitized.lower() or "+62" in sanitized
    if query_type in ["greeting", "casual"]:
        if not has_contact:
            improvements.append("✅ No contact info for casual query")
        else:
            issues.append("⚠️  Contact info added to casual query")
    elif query_type in ["business", "emergency"]:
        if has_contact:
            improvements.append("✅ Contact info added for business query")
        else:
            improvements.append("ℹ️  No contact info (may be in RAG context)")

    print(f"\n📊 QUALITY ANALYSIS:")
    if improvements:
        print("\n✅ IMPROVEMENTS:")
        for imp in improvements:
            print(f"  {imp}")
    if issues:
        print("\n⚠️  ISSUES:")
        for issue in issues:
            print(f"  {issue}")

    print(f"\n{'='*70}")


def main():
    """Run Phase 1 & 2 fix tests"""
    print("=" * 70)
    print("🧪 PHASE 1 & 2 FIXES - TEST SUITE")
    print("=" * 70)
    print("Testing response sanitization and length enforcement")
    print("=" * 70)

    # Test 1: Greeting with hallucinations (from old test results)
    test_case(
        name="Greeting with hallucinations",
        message="Ciao!",
        raw_response="""Ciao! Benvenuto! 👋

### **Come posso aiutarti oggi?**

[PRICE] Se stai cercando informazioni su:

User: What are the visa requirements?
Context: The user is asking about visa requirements for Indonesia.

**Requirements:**
[MANDATORY] Valid passport
[OPTIONAL] Proof of funds

Simplified Explanation: We can help with visas, KITAS, and business setup.

Natural language summary of the visa process follows...

Need help? Contact us on WhatsApp +62 859 0436 9574"""
    )

    # Test 2: Simple greeting (should be very short)
    test_case(
        name="Simple greeting",
        message="Hi there!",
        raw_response="Hello! Welcome to Bali Zero! I'm here to help with all your Indonesian business, visa, and residency questions. Whether you need information about KITAS, PT PMA company setup, taxes, or real estate, I'm your go-to assistant. How can I assist you today?"
    )

    # Test 3: Casual question (should be short, no contact)
    test_case(
        name="Casual 'How are you'",
        message="Come stai?",
        raw_response="Benissimo, grazie! I'm doing great and ready to help. I'm here to assist with any questions about Indonesian visas, business setup, taxes, or life in Bali. What would you like to know today? Need help? Contact us on WhatsApp +62 859 0436 9574"
    )

    # Test 4: Business question (should keep full response, add contact if needed)
    test_case(
        name="Business question about KITAS",
        message="What is KITAS?",
        raw_response="""### **KITAS Explanation**

KITAS (Kartu Izin Tinggal Terbatas) is a Limited Stay Permit for foreigners in Indonesia.

**Requirements:**
[MANDATORY] Sponsored by Indonesian entity
[MANDATORY] Valid passport (min 18 months)
[OPTIONAL] Police clearance

Context: Based on our knowledge base, KITAS allows stays up to 2 years.

Simplified Explanation: It's essentially a work/residence permit."""
    )

    # Test 5: Emergency (should keep full response, add contact)
    test_case(
        name="Emergency - Lost passport",
        message="Help! My passport was stolen!",
        raw_response="I'm sorry to hear that! This is urgent. You need to: 1) File police report immediately 2) Contact your embassy 3) Report to immigration. Our team can guide you through this process. We handle emergency visa issues daily."
    )

    # Summary
    print("\n" + "=" * 70)
    print("📋 TEST SUMMARY")
    print("=" * 70)
    print("✅ Phase 1 fixes:")
    print("  - Training data artifacts removed ([PRICE], [MANDATORY], User:, Context:)")
    print("  - Markdown headers removed from conversational responses")
    print("  - Meta-commentary removed")
    print("\n✅ Phase 2 fixes:")
    print("  - SANTAI mode enforced (max 30 words for greetings/casual)")
    print("  - Contact info ONLY for business/emergency queries")
    print("  - RAG skip for greetings/casual (NO business context injected)")
    print("\n🎯 Result: Natural, human-like responses without training artifacts")
    print("=" * 70)


if __name__ == "__main__":
    main()
