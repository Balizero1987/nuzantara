#!/usr/bin/env python3
"""
LLAMA vs Claude Comparison Test
Tests ZANTARA LLAMA 3.1 8B against Claude on real queries

Usage:
    python test_llama_vs_claude.py --quick    # 5 test queries
    python test_llama_vs_claude.py --full     # 20 test queries
    python test_llama_vs_claude.py --query "Ciao, come stai?"
"""

import asyncio
import sys
import os
import time
import argparse
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "apps" / "backend-rag" / "backend"))

from llm.zantara_client import ZantaraClient
from services.claude_haiku_service import ClaudeHaikuService
from services.claude_sonnet_service import ClaudeSonnetService


# Test queries covering different scenarios
TEST_QUERIES = {
    "greeting_it": {
        "query": "Ciao",
        "expected_ai": "haiku",
        "category": "greeting"
    },
    "greeting_en": {
        "query": "Hello",
        "expected_ai": "haiku",
        "category": "greeting"
    },
    "casual_it": {
        "query": "Come stai oggi?",
        "expected_ai": "haiku",
        "category": "casual"
    },
    "casual_en": {
        "query": "How are you doing?",
        "expected_ai": "haiku",
        "category": "casual"
    },
    "simple_business_it": {
        "query": "Cos'è il KITAS?",
        "expected_ai": "haiku/sonnet",
        "category": "business_simple"
    },
    "simple_business_en": {
        "query": "What is KITAS?",
        "expected_ai": "haiku/sonnet",
        "category": "business_simple"
    },
    "complex_business_it": {
        "query": "Come posso aprire una PT PMA a Bali? Quali sono i requisiti e i costi?",
        "expected_ai": "sonnet",
        "category": "business_complex"
    },
    "complex_business_en": {
        "query": "How do I open a PT PMA in Bali? What are the requirements and costs?",
        "expected_ai": "sonnet",
        "category": "business_complex"
    },
    "emotional_id": {
        "query": "aku malu bertanya tentang visa",
        "expected_ai": "haiku",
        "category": "emotional"
    },
    "team_member": {
        "query": "chi sono io?",
        "expected_ai": "haiku",
        "category": "casual"
    }
}

QUICK_TEST = ["greeting_it", "casual_it", "simple_business_en", "complex_business_it", "emotional_id"]


class LLAMAvsClaudeTest:
    """Test LLAMA against Claude"""

    def __init__(self):
        self.llama = None
        self.haiku = None
        self.sonnet = None

    async def initialize(self):
        """Initialize AI clients"""
        print("🚀 Initializing AI clients...\n")

        # Check environment
        runpod_endpoint = os.getenv("RUNPOD_LLAMA_ENDPOINT")
        runpod_key = os.getenv("RUNPOD_API_KEY")
        hf_key = os.getenv("HF_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        # Initialize LLAMA
        try:
            self.llama = ZantaraClient(
                runpod_endpoint=runpod_endpoint,
                runpod_api_key=runpod_key,
                hf_api_key=hf_key
            )
            print("✅ LLAMA client initialized")
        except Exception as e:
            print(f"❌ LLAMA initialization failed: {e}")
            print("   Set RUNPOD_LLAMA_ENDPOINT + RUNPOD_API_KEY or HF_API_KEY")
            self.llama = None

        # Initialize Claude
        try:
            self.haiku = ClaudeHaikuService(api_key=anthropic_key)
            self.sonnet = ClaudeSonnetService(api_key=anthropic_key)
            print("✅ Claude clients initialized (Haiku + Sonnet)")
        except Exception as e:
            print(f"❌ Claude initialization failed: {e}")
            print("   Set ANTHROPIC_API_KEY")
            self.haiku = None
            self.sonnet = None

        print()

        # Check what's available
        if not self.llama:
            print("⚠️  LLAMA not available - cannot run comparison")
            return False

        if not self.haiku or not self.sonnet:
            print("⚠️  Claude not available - cannot run comparison")
            return False

        return True

    async def test_query(self, query: str, category: str = "unknown") -> dict:
        """Test a single query on both LLAMA and Claude"""
        print(f"📝 Query: \"{query}\"")
        print(f"   Category: {category}")
        print()

        results = {}

        # Test LLAMA
        if self.llama:
            print("   🦙 Testing LLAMA...")
            start = time.time()
            try:
                llama_response = await self.llama.chat_async(
                    messages=[{"role": "user", "content": query}],
                    max_tokens=300
                )
                llama_latency = (time.time() - start) * 1000

                results["llama"] = {
                    "response": llama_response.get("text", ""),
                    "latency_ms": llama_latency,
                    "tokens": llama_response.get("tokens", 0),
                    "provider": llama_response.get("provider", "unknown"),
                    "success": True
                }

                print(f"      ✅ {llama_latency:.0f}ms | {len(results['llama']['response'])} chars")
                print(f"      → {results['llama']['response'][:100]}...")

            except Exception as e:
                results["llama"] = {
                    "response": "",
                    "latency_ms": (time.time() - start) * 1000,
                    "error": str(e),
                    "success": False
                }
                print(f"      ❌ Error: {e}")

        print()

        # Test Claude (Haiku for casual, Sonnet for business)
        claude_service = self.haiku if category in ["greeting", "casual", "emotional"] else self.sonnet
        claude_name = "Haiku" if claude_service == self.haiku else "Sonnet"

        print(f"   🤖 Testing Claude {claude_name}...")
        start = time.time()
        try:
            claude_response = await claude_service.conversational(
                message=query,
                user_id="test_user",
                max_tokens=300
            )
            claude_latency = (time.time() - start) * 1000

            results["claude"] = {
                "response": claude_response.get("text", ""),
                "latency_ms": claude_latency,
                "tokens": claude_response.get("tokens", {}),
                "model": claude_response.get("model", "unknown"),
                "success": True
            }

            print(f"      ✅ {claude_latency:.0f}ms | {len(results['claude']['response'])} chars")
            print(f"      → {results['claude']['response'][:100]}...")

        except Exception as e:
            results["claude"] = {
                "response": "",
                "latency_ms": (time.time() - start) * 1000,
                "error": str(e),
                "success": False
            }
            print(f"      ❌ Error: {e}")

        print()

        # Comparison
        if results.get("llama", {}).get("success") and results.get("claude", {}).get("success"):
            llama_len = len(results["llama"]["response"])
            claude_len = len(results["claude"]["response"])
            length_ratio = llama_len / max(claude_len, 1)

            latency_diff = results["llama"]["latency_ms"] - results["claude"]["latency_ms"]

            print(f"   📊 Comparison:")
            print(f"      Latency: LLAMA {results['llama']['latency_ms']:.0f}ms vs Claude {results['claude']['latency_ms']:.0f}ms ({latency_diff:+.0f}ms)")
            print(f"      Length: LLAMA {llama_len} vs Claude {claude_len} ({length_ratio:.2f}x)")

        print("-" * 80)
        print()

        return results

    async def run_tests(self, test_list: list):
        """Run multiple tests"""
        all_results = {}

        for test_id in test_list:
            test = TEST_QUERIES.get(test_id)
            if not test:
                print(f"⚠️  Test '{test_id}' not found")
                continue

            results = await self.test_query(
                query=test["query"],
                category=test["category"]
            )

            all_results[test_id] = {
                "query": test["query"],
                "category": test["category"],
                "results": results
            }

            # Small delay between tests
            await asyncio.sleep(1)

        return all_results

    def print_summary(self, all_results: dict):
        """Print summary statistics"""
        print("=" * 80)
        print("📊 SUMMARY STATISTICS")
        print("=" * 80)
        print()

        llama_successes = sum(1 for r in all_results.values() if r["results"].get("llama", {}).get("success"))
        claude_successes = sum(1 for r in all_results.values() if r["results"].get("claude", {}).get("success"))
        total = len(all_results)

        print(f"✅ Success rates:")
        print(f"   LLAMA: {llama_successes}/{total} ({llama_successes/total*100:.1f}%)")
        print(f"   Claude: {claude_successes}/{total} ({claude_successes/total*100:.1f}%)")
        print()

        # Latency stats (only successful)
        llama_latencies = [r["results"]["llama"]["latency_ms"] for r in all_results.values()
                          if r["results"].get("llama", {}).get("success")]
        claude_latencies = [r["results"]["claude"]["latency_ms"] for r in all_results.values()
                           if r["results"].get("claude", {}).get("success")]

        if llama_latencies:
            print(f"⏱️  Latency (avg):")
            print(f"   LLAMA: {sum(llama_latencies)/len(llama_latencies):.0f}ms")
            print(f"   Claude: {sum(claude_latencies)/len(claude_latencies):.0f}ms")
            print()

        # Recommendation
        print("🎯 RECOMMENDATION:")
        if llama_successes / total < 0.8:
            print("   ❌ NOT READY: LLAMA success rate too low (<80%)")
        elif sum(llama_latencies)/len(llama_latencies) > 2000:
            print("   ⚠️  CAUTION: LLAMA latency very high (>2s avg)")
        elif llama_successes == total and sum(llama_latencies)/len(llama_latencies) < 1000:
            print("   ✅ LOOKS GOOD: LLAMA ready for shadow mode testing")
        else:
            print("   🤔 MIXED: Review individual responses before deciding")

        print()


async def main():
    parser = argparse.ArgumentParser(description="Test LLAMA vs Claude")
    parser.add_argument("--quick", action="store_true", help="Run 5 quick tests")
    parser.add_argument("--full", action="store_true", help="Run all tests")
    parser.add_argument("--query", type=str, help="Test specific query")
    parser.add_argument("--category", default="unknown", help="Query category")

    args = parser.parse_args()

    tester = LLAMAvsClaudeTest()

    if not await tester.initialize():
        print("\n❌ Cannot run tests - missing API keys")
        return

    if args.query:
        # Single query test
        await tester.test_query(args.query, args.category)

    elif args.quick:
        # Quick test
        print("🏃 Running QUICK test (5 queries)...\n")
        results = await tester.run_tests(QUICK_TEST)
        tester.print_summary(results)

    elif args.full:
        # Full test
        print("🔍 Running FULL test (all queries)...\n")
        results = await tester.run_tests(list(TEST_QUERIES.keys()))
        tester.print_summary(results)

    else:
        # Default: quick test
        print("🏃 Running QUICK test (use --full for all queries)...\n")
        results = await tester.run_tests(QUICK_TEST)
        tester.print_summary(results)


if __name__ == "__main__":
    asyncio.run(main())
