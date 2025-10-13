#!/usr/bin/env python3
"""
Test script for new ZANTARA SYSTEM_PROMPT
Tests natural conversation vs old robotic responses
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main_cloud import SYSTEM_PROMPT

def test_prompt_structure():
    """Test that the new prompt has the right structure"""
    print("🧪 Testing SYSTEM_PROMPT Structure...")
    
    # Check for removed problematic elements (but allow them in BAD examples)
    problematic_phrases = [
        "Formato principale: MARKDOWN strutturato",
        "SANTAI mode: 2-4 frasi",
        "PIKIRAN mode: 4-6 frasi"
    ]
    
    # Check for problematic phrases NOT in BAD examples
    if "Paragraph 1" in SYSTEM_PROMPT and "❌ BAD:" not in SYSTEM_PROMPT:
        problematic_phrases.append("Paragraph 1 (not in BAD example)")
    if "Part 2" in SYSTEM_PROMPT and "❌ BAD:" not in SYSTEM_PROMPT:
        problematic_phrases.append("Part 2 (not in BAD example)")
    
    found_issues = []
    for phrase in problematic_phrases:
        if phrase in SYSTEM_PROMPT:
            found_issues.append(phrase)
    
    if found_issues:
        print(f"❌ Found problematic phrases: {found_issues}")
        return False
    else:
        print("✅ No problematic phrases found")
    
    # Check for new good elements
    good_phrases = [
        "TALK NATURALLY",
        "Like texting a knowledgeable colleague",
        "NEVER USE TEMPLATES",
        "CONTEXT-AWARE BREVITY",
        "CONVERSATIONAL FLOW"
    ]
    
    found_good = []
    for phrase in good_phrases:
        if phrase in SYSTEM_PROMPT:
            found_good.append(phrase)
    
    print(f"✅ Found good phrases: {found_good}")
    
    # Check length (should be reasonable)
    length = len(SYSTEM_PROMPT)
    print(f"📏 Prompt length: {length} characters")
    
    if length > 15000:
        print("⚠️  Prompt might be too long")
    elif length < 5000:
        print("⚠️  Prompt might be too short")
    else:
        print("✅ Prompt length looks good")
    
    return True

def test_example_responses():
    """Test example responses in the prompt"""
    print("\n🧪 Testing Example Responses...")
    
    # Check for good examples
    if '"Ciao" → "Ciao! Come posso aiutarti oggi? 😊"' in SYSTEM_PROMPT:
        print("✅ Good greeting example found")
    else:
        print("❌ Good greeting example missing")
    
    # Check for bad examples
    if "❌ BAD:" in SYSTEM_PROMPT and "✅ GOOD:" in SYSTEM_PROMPT:
        print("✅ Bad vs Good examples found")
    else:
        print("❌ Bad vs Good examples missing")
    
    # Check for template warnings
    if "NEVER USE TEMPLATES" in SYSTEM_PROMPT:
        print("✅ Template warning found")
    else:
        print("❌ Template warning missing")
    
    return True

def test_context_detection():
    """Test context detection rules"""
    print("\n🧪 Testing Context Detection...")
    
    context_rules = [
        "SIMPLE GREETINGS",
        "CASUAL QUESTIONS", 
        "BUSINESS QUESTIONS",
        "COMPLEX QUERIES"
    ]
    
    found_rules = []
    for rule in context_rules:
        if rule in SYSTEM_PROMPT:
            found_rules.append(rule)
    
    print(f"✅ Context rules found: {found_rules}")
    
    if len(found_rules) >= 3:
        print("✅ Good context detection coverage")
        return True
    else:
        print("❌ Insufficient context detection")
        return False

def main():
    """Run all tests"""
    print("🚀 ZANTARA SYSTEM_PROMPT Test Suite")
    print("=" * 50)
    
    tests = [
        test_prompt_structure,
        test_example_responses,
        test_context_detection
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! SYSTEM_PROMPT looks good.")
        return True
    else:
        print("⚠️  Some tests failed. Review the prompt.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
