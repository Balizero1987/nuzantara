#!/usr/bin/env python3
"""
Quick integration test for Llama 4 Scout + Haiku fallback
Tests the new LlamaScoutClient integration with real query
"""

import asyncio
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from llm.llama_scout_client import LlamaScoutClient


async def test_llama_scout_integration():
    """Test LlamaScoutClient with a simple query"""

    print("=" * 60)
    print("LLAMA 4 SCOUT + HAIKU 4.5 INTEGRATION TEST")
    print("=" * 60)
    print()

    # Get API keys from environment
    openrouter_key = os.getenv("OPENROUTER_API_KEY_LLAMA")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    print("🔑 API Keys:")
    print(f"   OpenRouter (Llama): {'✅ Found' if openrouter_key else '❌ Missing'}")
    print(f"   Anthropic (Haiku):  {'✅ Found' if anthropic_key else '❌ Missing'}")
    print()

    if not (openrouter_key or anthropic_key):
        print("❌ ERROR: No API keys configured!")
        print("   Set OPENROUTER_API_KEY_LLAMA and/or ANTHROPIC_API_KEY")
        return

    # Initialize client
    print("🚀 Initializing LlamaScoutClient...")
    client = LlamaScoutClient(
        openrouter_api_key=openrouter_key,
        anthropic_api_key=anthropic_key,
        force_haiku=False  # Try Llama first
    )
    print()

    # Test query
    test_query = "What documents do I need to set up a PT PMA in Indonesia?"
    print(f"💬 Test Query: \"{test_query}\"")
    print()

    # Test 1: Simple conversational response
    print("=" * 60)
    print("TEST 1: Conversational Response")
    print("=" * 60)

    try:
        print("⏳ Calling conversational()...")
        result = await client.conversational(
            message=test_query,
            user_id="test-user",
            conversation_history=None,
            max_tokens=200
        )

        print()
        print(f"✅ SUCCESS!")
        print(f"   AI Used: {result['ai_used']}")
        print(f"   Model: {result['model']}")
        print(f"   Provider: {result['provider']}")
        print(f"   Tokens: Input={result['tokens']['input']}, Output={result['tokens']['output']}")
        print()
        print(f"📝 Response Preview:")
        print(f"   {result['text'][:200]}...")
        print()

    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return

    # Test 2: Streaming response
    print("=" * 60)
    print("TEST 2: Streaming Response")
    print("=" * 60)

    try:
        print("⏳ Calling stream()...")
        print()
        print("📝 Streaming response:")
        print("   ", end="", flush=True)

        chunk_count = 0
        full_response = ""

        async for chunk in client.stream(
            message="Briefly explain KITAS process",
            user_id="test-user",
            max_tokens=150
        ):
            print(chunk, end="", flush=True)
            full_response += chunk
            chunk_count += 1

        print()
        print()
        print(f"✅ Stream completed: {chunk_count} chunks, {len(full_response)} chars")
        print()

    except Exception as e:
        print(f"❌ Stream FAILED: {e}")
        import traceback
        traceback.print_exc()
        return

    # Test 3: Get metrics
    print("=" * 60)
    print("TEST 3: Performance Metrics")
    print("=" * 60)

    metrics = client.get_metrics()
    print(f"📊 Metrics:")
    print(f"   Total Requests: {metrics['total_requests']}")
    print(f"   Llama Success Rate: {metrics['llama_success_rate']}")
    print(f"   Haiku Fallback Count: {metrics['haiku_fallback_count']}")
    print(f"   Total Cost Saved: {metrics['total_cost_saved_usd']}")
    print(f"   Avg Savings/Query: {metrics['avg_savings_per_query']}")
    print()

    print("=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print()
    print("🎯 Llama 4 Scout integration is READY for production")
    print()


if __name__ == "__main__":
    asyncio.run(test_llama_scout_integration())
