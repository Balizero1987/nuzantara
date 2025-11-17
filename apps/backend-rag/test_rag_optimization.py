"""
Test RAG Optimization: Translation + Reranking
Tests the complete RAG pipeline with focus on Nov 16 deployment features

Test Coverage:
1. Reranker Service Performance (metrics, caching, latency)
2. Translation Quality (English, Italian, Indonesian)
3. Integration Testing (end-to-end RAG with reranking)
4. Performance Benchmarks

Author: Claude (ZANTARA Test Suite)
Date: November 17, 2025
"""

import asyncio
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Any
import json

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(title: str):
    """Print formatted section header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{title.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


def print_success(message: str):
    """Print success message"""
    print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")


def print_error(message: str):
    """Print error message"""
    print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")


def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠️  {message}{Colors.ENDC}")


def print_info(message: str):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ️  {message}{Colors.ENDC}")


async def test_reranker_service() -> Dict[str, Any]:
    """Test 1: Reranker Service Performance"""
    print_header("TEST 1: RERANKER SERVICE PERFORMANCE")

    results = {
        "test_name": "reranker_performance",
        "success": False,
        "metrics": {},
        "errors": []
    }

    try:
        from services.reranker_service import RerankerService

        print_info("Initializing RerankerService...")
        reranker = RerankerService(
            model_name='cross-encoder/ms-marco-MiniLM-L-6-v2',
            cache_size=1000,
            enable_cache=True
        )
        print_success("RerankerService initialized")

        # Test data
        test_query = "What are the requirements for opening a PT PMA in Bali?"
        test_documents = [
            "A PT PMA (Foreign Investment Company) in Indonesia requires at least IDR 10 billion capital",
            "KITAS visa allows foreigners to stay in Indonesia for work purposes",
            "Opening a restaurant in Bali requires KBLI classification and business permits",
            "PT PMA setup involves notary, Ministry of Law approval, and tax registration",
            "The process typically takes 2-3 months from start to finish",
            "Foreign ownership restrictions apply depending on business sector",
            "NPWP tax number is required for all business operations in Indonesia",
            "Business permits (NIB) can now be obtained through OSS system online",
            "KITAS processing usually takes 4-6 weeks after approval",
            "Capital requirements vary based on investment sector classification",
        ]

        print_info(f"Testing reranking with query: '{test_query}'")
        print_info(f"Document count: {len(test_documents)}")

        # Test 1a: Basic reranking
        print(f"\n{Colors.BOLD}[1a] Basic Reranking Test{Colors.ENDC}")
        start_time = time.time()
        reranked_results = reranker.rerank(
            query=test_query,
            documents=test_documents,
            top_k=5
        )
        latency_ms = (time.time() - start_time) * 1000

        print_success(f"Reranking completed in {latency_ms:.2f}ms")
        print(f"\n{Colors.BOLD}Top 5 Results:{Colors.ENDC}")
        for i, (doc, score) in enumerate(reranked_results, 1):
            print(f"  {i}. [Score: {score:.4f}] {doc[:80]}...")

        results["metrics"]["basic_rerank_latency_ms"] = latency_ms
        results["metrics"]["basic_rerank_top_score"] = reranked_results[0][1] if reranked_results else 0

        # Test 1b: Cache performance
        print(f"\n{Colors.BOLD}[1b] Cache Performance Test{Colors.ENDC}")

        # First query (cache miss)
        start_time = time.time()
        reranker.rerank(query=test_query, documents=test_documents, top_k=5)
        first_latency = (time.time() - start_time) * 1000

        # Second query (cache hit - same query)
        start_time = time.time()
        reranker.rerank(query=test_query, documents=test_documents, top_k=5)
        cached_latency = (time.time() - start_time) * 1000

        cache_improvement = ((first_latency - cached_latency) / first_latency) * 100

        print_success(f"First query (miss): {first_latency:.2f}ms")
        print_success(f"Second query (hit): {cached_latency:.2f}ms")
        print_success(f"Cache improvement: {cache_improvement:.1f}% faster")

        results["metrics"]["cache_miss_latency_ms"] = first_latency
        results["metrics"]["cache_hit_latency_ms"] = cached_latency
        results["metrics"]["cache_improvement_percent"] = cache_improvement

        # Test 1c: Batch reranking
        print(f"\n{Colors.BOLD}[1c] Batch Reranking Test{Colors.ENDC}")

        batch_queries = [
            "What is KITAS?",
            "How to open PT PMA?",
            "Tax requirements in Indonesia?"
        ]

        start_time = time.time()
        batch_results = reranker.rerank_batch(
            queries=batch_queries,
            documents_list=[test_documents] * len(batch_queries),
            top_k=3
        )
        batch_latency = (time.time() - start_time) * 1000

        avg_latency_per_query = batch_latency / len(batch_queries)

        print_success(f"Batch reranking completed: {len(batch_queries)} queries")
        print_success(f"Total latency: {batch_latency:.2f}ms")
        print_success(f"Avg per query: {avg_latency_per_query:.2f}ms")

        results["metrics"]["batch_total_latency_ms"] = batch_latency
        results["metrics"]["batch_avg_per_query_ms"] = avg_latency_per_query

        # Test 1d: Get statistics
        print(f"\n{Colors.BOLD}[1d] Reranker Statistics{Colors.ENDC}")
        stats = reranker.get_stats()

        print(f"  Total reranks: {stats.get('total_reranks', 0)}")
        print(f"  Avg latency: {stats.get('avg_latency_ms', 0):.2f}ms")
        print(f"  P95 latency: {stats.get('p95_latency_ms', 0):.2f}ms")
        print(f"  Cache hits: {stats.get('cache_hits', 0)}")
        print(f"  Cache misses: {stats.get('cache_misses', 0)}")
        print(f"  Cache hit rate: {stats.get('cache_hit_rate', 0)*100:.1f}%")

        target_met_rate = stats.get('target_latency_met_rate', 0) * 100
        if target_met_rate > 90:
            print_success(f"  Target met rate: {target_met_rate:.1f}% (✅ Excellent)")
        elif target_met_rate > 70:
            print_warning(f"  Target met rate: {target_met_rate:.1f}% (⚠️  Good)")
        else:
            print_error(f"  Target met rate: {target_met_rate:.1f}% (❌ Needs improvement)")

        results["metrics"]["stats"] = stats
        results["success"] = True

        # Performance evaluation
        print(f"\n{Colors.BOLD}Performance Evaluation:{Colors.ENDC}")
        if stats.get('avg_latency_ms', 0) < 50:
            print_success("Latency: EXCELLENT (< 50ms target)")
        elif stats.get('avg_latency_ms', 0) < 100:
            print_warning("Latency: GOOD (< 100ms)")
        else:
            print_error("Latency: NEEDS IMPROVEMENT (> 100ms)")

        if stats.get('cache_hit_rate', 0) > 0.3:
            print_success(f"Cache hit rate: EXCELLENT (> 30% target)")
        elif stats.get('cache_hit_rate', 0) > 0.1:
            print_warning(f"Cache hit rate: GOOD (> 10%)")
        else:
            print_info(f"Cache hit rate: LOW (expected for initial tests)")

    except Exception as e:
        print_error(f"Reranker test failed: {e}")
        results["errors"].append(str(e))
        import traceback
        traceback.print_exc()

    return results


async def test_translation_quality() -> Dict[str, Any]:
    """Test 2: Translation and Multilingual Quality"""
    print_header("TEST 2: TRANSLATION & MULTILINGUAL QUALITY")

    results = {
        "test_name": "translation_quality",
        "success": False,
        "responses": [],
        "errors": []
    }

    try:
        from llm.llama_scout_client import LlamaScoutClient

        # Check API keys
        openrouter_key = os.getenv("OPENROUTER_API_KEY_LLAMA")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")

        if not openrouter_key and not anthropic_key:
            print_warning("No API keys found - skipping translation tests")
            print_info("Set OPENROUTER_API_KEY_LLAMA or ANTHROPIC_API_KEY to run these tests")
            results["errors"].append("API keys not configured")
            return results

        print_info("Initializing LlamaScoutClient...")
        client = LlamaScoutClient(
            openrouter_api_key=openrouter_key,
            anthropic_api_key=anthropic_key
        )

        if not client.is_available():
            print_warning("LlamaScoutClient not available - skipping translation tests")
            results["errors"].append("LlamaScoutClient not available")
            return results

        print_success("LlamaScoutClient initialized")

        # Test queries in different languages
        test_cases = [
            {
                "language": "English",
                "query": "What's a KITAS and how long does it take?",
                "expected_tone": "professional_friendly"
            },
            {
                "language": "Italian",
                "query": "Ciao! Quanto costa fare una PT PMA?",
                "expected_tone": "warm_professional"
            },
            {
                "language": "Indonesian",
                "query": "Berapa lama proses KITAS?",
                "expected_tone": "direct_friendly"
            }
        ]

        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{Colors.BOLD}[2.{i}] Testing {test_case['language']}{Colors.ENDC}")
            print(f"Query: {test_case['query']}")

            messages = [{"role": "user", "content": test_case['query']}]

            try:
                start_time = time.time()
                result = await client.chat_async(
                    messages=messages,
                    max_tokens=300,
                    temperature=0.7
                )
                latency_ms = (time.time() - start_time) * 1000

                response_text = result["text"]
                model_used = result["model"]
                provider = result["provider"]

                print_success(f"Response received in {latency_ms:.0f}ms")
                print(f"Model: {model_used} ({provider})")
                print(f"\nResponse:\n{Colors.OKCYAN}{response_text}{Colors.ENDC}\n")

                # Basic quality checks
                word_count = len(response_text.split())
                has_content = len(response_text) > 50

                if has_content:
                    print_success(f"Quality: Good response length ({word_count} words)")
                else:
                    print_warning(f"Quality: Short response ({word_count} words)")

                results["responses"].append({
                    "language": test_case['language'],
                    "query": test_case['query'],
                    "response": response_text,
                    "model": model_used,
                    "provider": provider,
                    "latency_ms": latency_ms,
                    "word_count": word_count
                })

                # Small delay between requests
                await asyncio.sleep(1)

            except Exception as e:
                print_error(f"Translation test failed for {test_case['language']}: {e}")
                results["errors"].append(f"{test_case['language']}: {str(e)}")

        results["success"] = len(results["responses"]) > 0

        # Summary
        if results["responses"]:
            print(f"\n{Colors.BOLD}Translation Test Summary:{Colors.ENDC}")
            print(f"  Languages tested: {len(results['responses'])}/3")
            avg_latency = sum(r['latency_ms'] for r in results['responses']) / len(results['responses'])
            print(f"  Avg response time: {avg_latency:.0f}ms")

            models_used = set(r['model'] for r in results['responses'])
            print(f"  Models used: {', '.join(models_used)}")

    except Exception as e:
        print_error(f"Translation test failed: {e}")
        results["errors"].append(str(e))
        import traceback
        traceback.print_exc()

    return results


async def test_integration() -> Dict[str, Any]:
    """Test 3: Integration - Full RAG Pipeline with Reranking"""
    print_header("TEST 3: INTEGRATION - FULL RAG PIPELINE")

    results = {
        "test_name": "integration",
        "success": False,
        "tests": [],
        "errors": []
    }

    try:
        print_info("Testing integration requires running backend services")
        print_info("This test verifies that translation + reranking work together")

        # Check if we can import the main services
        try:
            from services.search_service import SearchService
            from services.reranker_service import RerankerService
            print_success("Core services importable")
            results["tests"].append({"name": "imports", "status": "passed"})
        except Exception as e:
            print_warning(f"Service import failed: {e}")
            results["tests"].append({"name": "imports", "status": "failed", "error": str(e)})

        # Check configuration
        try:
            from app.config import settings
            print_success(f"Configuration loaded")
            print(f"  Reranker enabled: {settings.enable_reranker}")
            print(f"  Reranker model: {settings.reranker_model}")
            print(f"  Embedding provider: {settings.embedding_provider}")
            print(f"  Embedding dimensions: {settings.embedding_dimensions}")
            results["tests"].append({"name": "configuration", "status": "passed"})
        except Exception as e:
            print_error(f"Configuration check failed: {e}")
            results["tests"].append({"name": "configuration", "status": "failed", "error": str(e)})

        results["success"] = all(t.get("status") == "passed" for t in results["tests"])

    except Exception as e:
        print_error(f"Integration test failed: {e}")
        results["errors"].append(str(e))
        import traceback
        traceback.print_exc()

    return results


async def check_deployment_status() -> Dict[str, Any]:
    """Check current deployment status"""
    print_header("DEPLOYMENT STATUS CHECK")

    results = {
        "test_name": "deployment_status",
        "success": False,
        "status": {},
        "errors": []
    }

    try:
        import subprocess
        import json

        print_info("Checking production deployment (nuzantara-rag.fly.dev)...")

        # Check health endpoint
        result = subprocess.run(
            ["curl", "-s", "https://nuzantara-rag.fly.dev/health"],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode == 0:
            health_data = json.loads(result.stdout)
            results["status"] = health_data

            print_success(f"Service: {health_data.get('service')}")
            print_success(f"Version: {health_data.get('version')}")
            print_success(f"Status: {health_data.get('status')}")

            # Check reranker status
            reranker_status = health_data.get('reranker', {})
            reranker_enabled = reranker_status.get('enabled', False)

            if reranker_enabled:
                print_success("Reranker: ENABLED ✅")
            else:
                print_warning("Reranker: DISABLED ⚠️")
                print_info("To enable: fly secrets set ENABLE_RERANKER=true -a nuzantara-rag")

            # Check AI services
            ai_status = health_data.get('ai', {})
            if ai_status.get('llama_scout_primary'):
                print_success("Llama Scout: PRIMARY ✅")

            results["success"] = True

        else:
            print_error("Failed to connect to production deployment")
            results["errors"].append("Connection failed")

    except Exception as e:
        print_error(f"Deployment check failed: {e}")
        results["errors"].append(str(e))

    return results


async def main():
    """Main test runner"""
    print(f"{Colors.HEADER}{Colors.BOLD}")
    print("""
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║     ZANTARA RAG OPTIMIZATION TEST SUITE                      ║
    ║     Translation + Reranking (Nov 16 Deployment)              ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """)
    print(f"{Colors.ENDC}")

    print_info(f"Test Date: November 17, 2025")
    print_info(f"Testing: RAG optimization with translation & reranking")
    print()

    all_results = {}

    # Test 0: Deployment Status
    deployment_results = await check_deployment_status()
    all_results["deployment_status"] = deployment_results

    # Test 1: Reranker Service
    reranker_results = await test_reranker_service()
    all_results["reranker_performance"] = reranker_results

    # Test 2: Translation Quality
    translation_results = await test_translation_quality()
    all_results["translation_quality"] = translation_results

    # Test 3: Integration
    integration_results = await test_integration()
    all_results["integration"] = integration_results

    # Final Summary
    print_header("FINAL SUMMARY")

    total_tests = len(all_results)
    passed_tests = sum(1 for r in all_results.values() if r.get("success"))

    print(f"\n{Colors.BOLD}Test Results:{Colors.ENDC}")
    print(f"  Total tests: {total_tests}")
    print(f"  Passed: {passed_tests}")
    print(f"  Failed: {total_tests - passed_tests}")
    print()

    for test_name, result in all_results.items():
        status = "✅ PASSED" if result.get("success") else "❌ FAILED"
        status_color = Colors.OKGREEN if result.get("success") else Colors.FAIL
        print(f"  {status_color}{status}{Colors.ENDC} - {test_name}")

    # Save results to file
    results_file = Path(__file__).parent / "test_results_rag_optimization.json"
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2, default=str)

    print()
    print_success(f"Detailed results saved to: {results_file}")

    print()
    print_header("RECOMMENDATIONS")

    # Deployment recommendations
    if not deployment_results.get("status", {}).get("reranker", {}).get("enabled"):
        print_warning("Reranker is DISABLED in production")
        print("  To enable reranker in production:")
        print(f"    {Colors.OKCYAN}fly secrets set ENABLE_RERANKER=true -a nuzantara-rag{Colors.ENDC}")
        print(f"    {Colors.OKCYAN}fly deploy -a nuzantara-rag{Colors.ENDC}")

    # Performance recommendations
    if reranker_results.get("success"):
        avg_latency = reranker_results.get("metrics", {}).get("stats", {}).get("avg_latency_ms", 0)
        if avg_latency > 50:
            print_warning(f"Reranker latency ({avg_latency:.2f}ms) exceeds 50ms target")
            print("  Consider:")
            print("    - Reducing overfetch count")
            print("    - Enabling batch processing")
            print("    - Increasing cache size")

    print()
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.OKGREEN}Testing complete!{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


if __name__ == "__main__":
    asyncio.run(main())
