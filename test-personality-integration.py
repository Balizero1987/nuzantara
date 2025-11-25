#!/usr/bin/env python3
"""
Test Script for ZANTARA Personality Integration

Tests the complete flow:
1. Oracle API receives query
2. Gemini 1.5 does RAG reasoning
3. Personality Service translates to appropriate voice
4. Returns personalized response

Usage:
python test-personality-integration.py
"""

import asyncio
import json
import time
from typing import Dict, Any

# Test configuration
ORACLE_API_URL = "https://nuzantara-rag.fly.dev/api/oracle"

async def test_personality_integration():
    """Test the complete personality integration"""

    print("🚀 Testing ZANTARA Multi-Personality Integration")
    print("=" * 60)

    # Test cases for different personalities
    test_cases = [
        {
            "name": "Jaksel Style - Amanda",
            "email": "amanda@balizero.com",
            "query": "Jelasin dong apa itu contract kerja di Indonesia?",
            "expected_personality": "jaksel"
        },
        {
            "name": "ZERO Style - Founder",
            "email": "zero@balizero.com",
            "query": "Spiegami il contratto di lavoro in Indonesia",
            "expected_personality": "zero"
        },
        {
            "name": "Professional Style - Zainal",
            "email": "zainal@balizero.com",
            "query": "Explain employment contracts in Indonesia",
            "expected_personality": "professional"
        },
        {
            "name": "Jaksel Style - Krisna",
            "email": "krisna@balizero.com",
            "query": "Gimana sih cara bikin PT di Bali?",
            "expected_personality": "jaksel"
        },
        {
            "name": "Italian Style - Nina",
            "email": "nina@balizero.com",
            "query": "Come si crea una società a Bali?",
            "expected_personality": "zero"  # Nina uses Italian too
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test {i}: {test_case['name']}")
        print("-" * 40)

        # Prepare request payload
        payload = {
            "query": test_case["query"],
            "user_email": test_case["email"],
            "use_ai": True,
            "include_sources": True,
            "limit": 5
        }

        try:
            import aiohttp

            async with aiohttp.ClientSession() as session:
                start_time = time.time()

                async with session.post(
                    f"{ORACLE_API_URL}/query",
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=60)
                ) as response:

                    duration = time.time() - start_time

                    if response.status == 200:
                        result = await response.json()

                        print(f"✅ Success ({duration:.2f}s)")
                        print(f"📝 Query: {test_case['query']}")
                        print(f"👤 User: {test_case['email']}")
                        print(f"🤖 Model: {result.get('model_used', 'N/A')}")
                        print(f"📚 Sources: {result.get('document_count', 0)} documents")
                        print(f"🎭 Personality detected: {test_case['expected_personality']}")
                        print(f"💬 Response preview: {result.get('answer', 'N/A')[:200]}...")

                        # Check if personality was applied
                        model_used = result.get('model_used', '')
                        if 'Zantara' in model_used or 'jaksel' in model_used.lower() or 'zero' in model_used.lower():
                            print("🎉 Personality successfully applied!")
                        else:
                            print("⚠️  Personality might not have been applied")

                    else:
                        error_text = await response.text()
                        print(f"❌ Failed ({response.status}): {error_text}")

        except Exception as e:
            print(f"❌ Error: {str(e)}")

        # Small delay between tests
        await asyncio.sleep(2)

    print("\n" + "=" * 60)
    print("🏁 Personality Integration Test Complete")

async def test_personality_endpoints():
    """Test the personality management endpoints"""

    print("\n🔧 Testing Personality Management Endpoints")
    print("-" * 40)

    import aiohttp

    async with aiohttp.ClientSession() as session:

        # Test 1: Get available personalities
        try:
            async with session.get(f"{ORACLE_API_URL}/personalities") as response:
                if response.status == 200:
                    personalities = await response.json()
                    print(f"✅ Personalities endpoint working: {len(personalities['personalities'])} profiles")

                    for personality in personalities['personalities']:
                        print(f"   📋 {personality['name']} ({personality['language']}) - {personality['team_count']} members")
                else:
                    print(f"❌ Personalities endpoint failed: {response.status}")
        except Exception as e:
            print(f"❌ Error testing personalities: {e}")

        # Test 2: Test specific personality
        try:
            test_payload = {
                "personality_type": "jaksel",
                "message": "Jelasin apa itu contract dong!"
            }

            async with session.post(
                f"{ORACLE_API_URL}/personality/test",
                params=test_payload
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Jaksel personality test working")
                    print(f"💬 Response: {result.get('response', 'N/A')[:150]}...")
                else:
                    print(f"❌ Personality test failed: {response.status}")
        except Exception as e:
            print(f"❌ Error testing personality: {e}")

async def main():
    """Main test runner"""
    print("🎭 ZANTARA Personality Integration Test Suite")
    print("=" * 60)

    # Test personality endpoints
    await test_personality_endpoints()

    # Test full integration
    await test_personality_integration()

    print("\n✨ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())