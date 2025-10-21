#!/usr/bin/env python3
"""
Test Conversation Quality Improvements
Tests login/logout detection, identity queries, and personalized greetings
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent / "apps" / "backend-rag" / "backend"))

from services.intelligent_router import IntelligentRouter
from services.claude_haiku_service import ClaudeHaikuService
from services.claude_sonnet_service import ClaudeSonnetService
import asyncio
import os

# Test cases
TEST_CASES = [
    {
        "message": "login",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Login detection"
    },
    {
        "message": "logout",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Logout detection"
    },
    {
        "message": "who am i",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Identity query (English)"
    },
    {
        "message": "siapa aku",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Identity query (Indonesian)"
    },
    {
        "message": "chi sono",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Identity query (Italian)"
    },
    {
        "message": "ciao",
        "expected_category": "greeting",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Greeting with memory flag"
    },
    {
        "message": "hello",
        "expected_category": "greeting",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Greeting with memory flag"
    },
    {
        "message": "do you know me",
        "expected_category": "session_state",
        "expected_ai": "haiku",
        "expected_memory_required": True,
        "description": "Recognition query"
    },
]


async def test_intent_classification():
    """Test intelligent router intent classification"""
    
    print("=" * 80)
    print("TESTING INTENT CLASSIFICATION - Session State Detection")
    print("=" * 80)
    print()
    
    # Initialize services (without API keys for classification test)
    os.environ["ANTHROPIC_API_KEY"] = "dummy-key-for-testing"
    
    haiku = ClaudeHaikuService()
    sonnet = ClaudeSonnetService()
    router = IntelligentRouter(
        llama_client=None,
        haiku_service=haiku,
        sonnet_service=sonnet
    )
    
    passed = 0
    failed = 0
    
    for i, test in enumerate(TEST_CASES, 1):
        print(f"Test {i}: {test['description']}")
        print(f"   Message: '{test['message']}'")
        
        # Classify intent
        result = await router.classify_intent(test['message'])
        
        # Check category
        category_match = result['category'] == test['expected_category']
        ai_match = result['suggested_ai'] == test['expected_ai']
        memory_match = result.get('require_memory', False) == test['expected_memory_required']
        
        if category_match and ai_match and memory_match:
            print(f"   ✅ PASS")
            print(f"      Category: {result['category']}")
            print(f"      AI: {result['suggested_ai']}")
            print(f"      Memory Required: {result.get('require_memory', False)}")
            passed += 1
        else:
            print(f"   ❌ FAIL")
            print(f"      Expected: category={test['expected_category']}, ai={test['expected_ai']}, memory={test['expected_memory_required']}")
            print(f"      Got: category={result['category']}, ai={result['suggested_ai']}, memory={result.get('require_memory', False)}")
            failed += 1
        
        print()
    
    print("=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed out of {len(TEST_CASES)} tests")
    print("=" * 80)
    print()
    
    return passed == len(TEST_CASES)


async def test_system_prompts():
    """Test that system prompts include session handling instructions"""
    
    print("=" * 80)
    print("TESTING SYSTEM PROMPTS - Session Handling Instructions")
    print("=" * 80)
    print()
    
    os.environ["ANTHROPIC_API_KEY"] = "dummy-key-for-testing"
    
    # Check Haiku
    print("1. Claude Haiku Service")
    haiku = ClaudeHaikuService()
    haiku_prompt = haiku._build_system_prompt()
    
    checks_haiku = {
        "LOGIN detection": "LOGIN Detection" in haiku_prompt,
        "LOGOUT detection": "LOGOUT Detection" in haiku_prompt,
        "IDENTITY query": "IDENTITY Query" in haiku_prompt,
        "PERSONALIZED greetings": "PERSONALIZED GREETINGS" in haiku_prompt or "use memory context" in haiku_prompt.lower(),
        "DEA in team list": "DEA" in haiku_prompt
    }
    
    for check, passed in checks_haiku.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {check}")
    
    print()
    
    # Check Sonnet
    print("2. Claude Sonnet Service")
    sonnet = ClaudeSonnetService()
    sonnet_prompt = sonnet._build_system_prompt()
    
    checks_sonnet = {
        "SESSION STATE AWARENESS": "SESSION STATE AWARENESS" in sonnet_prompt,
        "LOGIN detection": "LOGIN Detection" in sonnet_prompt,
        "LOGOUT detection": "LOGOUT Detection" in sonnet_prompt,
        "IDENTITY query": "IDENTITY Query" in sonnet_prompt,
        "PERSONALIZED greetings": "PERSONALIZED GREETINGS" in sonnet_prompt,
        "DEA in team list": "DEA" in sonnet_prompt
    }
    
    for check, passed in checks_sonnet.items():
        status = "✅" if passed else "❌"
        print(f"   {status} {check}")
    
    print()
    print("=" * 80)
    
    all_passed = all(checks_haiku.values()) and all(checks_sonnet.values())
    
    if all_passed:
        print("✅ All system prompt checks PASSED")
    else:
        print("❌ Some system prompt checks FAILED")
    
    print("=" * 80)
    print()
    
    return all_passed


async def main():
    """Run all tests"""
    
    print("\n")
    print("🧪 CONVERSATION QUALITY IMPROVEMENT - TEST SUITE")
    print("=" * 80)
    print()
    
    # Test 1: Intent classification
    test1_passed = await test_intent_classification()
    
    # Test 2: System prompts
    test2_passed = await test_system_prompts()
    
    # Final summary
    print("\n")
    print("=" * 80)
    print("FINAL SUMMARY")
    print("=" * 80)
    print()
    
    if test1_passed and test2_passed:
        print("✅ ALL TESTS PASSED!")
        print()
        print("Next steps:")
        print("1. Deploy changes to Railway")
        print("2. Test online at zantara.balizero.com")
        print("3. Verify with real user (Dea)")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        print()
        print("Please review the failures above and fix the issues.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
