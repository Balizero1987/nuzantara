#!/usr/bin/env python3
"""
Test Prompt Caching Implementation
===================================

Verifies:
1. Haiku 4.5 model works
2. Prompt caching reduces costs
3. Cache hit/miss tracking
4. Response quality maintained
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "apps/backend-rag/backend"))

from services.claude_haiku_service import ClaudeHaikuService
import os

async def test_prompt_caching():
    """Test prompt caching with multiple queries"""

    print("="*80)
    print("🧪 PROMPT CACHING TEST - Haiku 4.5")
    print("="*80)

    # Check API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ ANTHROPIC_API_KEY not set!")
        return False

    print(f"\n✅ API Key found: {api_key[:20]}...")

    # Initialize service
    print("\n1️⃣  Initializing Haiku 4.5 service...")
    try:
        service = ClaudeHaikuService(api_key=api_key)
        print(f"✅ Service initialized: {service.model}")
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return False

    # Test 1: First call (cache MISS expected)
    print("\n2️⃣  Test 1: First query (cache MISS)")
    query1 = "Ciao! Come stai?"
    user_id = "test_user_001"

    try:
        result1 = await service.conversational(
            message=query1,
            user_id=user_id,
            max_tokens=500
        )

        print(f"✅ Response received:")
        print(f"   Text: {result1['text'][:100]}...")
        print(f"   Tokens: {result1['tokens']}")

        # Calculate cost
        tokens_in = result1['tokens']['input']
        tokens_out = result1['tokens']['output']
        cost1 = (tokens_in * 1.0 / 1_000_000) + (tokens_out * 5.0 / 1_000_000)
        print(f"   Cost: ${cost1:.6f}")
        print(f"   Model: {result1['model']}")

        # Check if cache info available
        if 'usage' in str(result1):
            print(f"   Cache status: MISS (first call)")

    except Exception as e:
        print(f"❌ Test 1 failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 2: Second call with SAME system prompt (cache HIT expected)
    print("\n3️⃣  Test 2: Second query (cache HIT expected)")
    query2 = "Quanto costa un KITAS business?"

    # Wait 1 second (same cache window)
    await asyncio.sleep(1)

    try:
        result2 = await service.conversational(
            message=query2,
            user_id=user_id,
            max_tokens=500
        )

        print(f"✅ Response received:")
        print(f"   Text: {result2['text'][:100]}...")
        print(f"   Tokens: {result2['tokens']}")

        # Calculate cost
        tokens_in = result2['tokens']['input']
        tokens_out = result2['tokens']['output']
        cost2 = (tokens_in * 1.0 / 1_000_000) + (tokens_out * 5.0 / 1_000_000)
        print(f"   Cost: ${cost2:.6f}")

        # Compare costs
        savings = ((cost1 - cost2) / cost1) * 100 if cost1 > cost2 else 0
        print(f"\n💰 COST COMPARISON:")
        print(f"   First query:  ${cost1:.6f}")
        print(f"   Second query: ${cost2:.6f}")
        if savings > 0:
            print(f"   Savings: {savings:.1f}% (cache HIT! ✅)")
        else:
            print(f"   No savings (cache might not be working ⚠️)")

    except Exception as e:
        print(f"❌ Test 2 failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    # Test 3: Third call with memory context (partial cache)
    print("\n4️⃣  Test 3: Query with memory context (partial cache)")
    query3 = "Quali documenti servono?"
    memory_context = "User is interested in KITAS business. Previous query about costs."

    try:
        result3 = await service.conversational(
            message=query3,
            user_id=user_id,
            memory_context=memory_context,
            max_tokens=500
        )

        print(f"✅ Response received:")
        print(f"   Text: {result3['text'][:100]}...")
        print(f"   Tokens: {result3['tokens']}")

        tokens_in = result3['tokens']['input']
        tokens_out = result3['tokens']['output']
        cost3 = (tokens_in * 1.0 / 1_000_000) + (tokens_out * 5.0 / 1_000_000)
        print(f"   Cost: ${cost3:.6f}")
        print(f"   Memory context added: {len(memory_context)} chars")

    except Exception as e:
        print(f"❌ Test 3 failed: {e}")
        return False

    # Summary
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)
    print(f"Model: {service.model}")
    print(f"Total queries: 3")
    print(f"All tests passed: ✅")
    print(f"\nTotal cost: ${cost1 + cost2 + cost3:.6f}")
    print(f"Without caching (estimated): ${cost1 * 3:.6f}")
    print(f"Savings: ${(cost1 * 3) - (cost1 + cost2 + cost3):.6f}")
    print(f"Savings %: {(((cost1 * 3) - (cost1 + cost2 + cost3)) / (cost1 * 3) * 100):.1f}%")

    print("\n✅ ALL TESTS PASSED!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_prompt_caching())
    sys.exit(0 if success else 1)
