#!/usr/bin/env python3
"""
Performance Testing Script for Query Routing & ChromaDB
Tests 12,904 docs dataset with optimized routing
"""

import sys
import os
import time
from pathlib import Path
from typing import List, Dict

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "backend-rag" / "backend"))

from services.query_router import QueryRouter
from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

# Test queries (multilingual, diverse domains)
TEST_QUERIES = [
    # Tax Genius queries (should route to tax_genius)
    ("How to calculate Indonesian tax for PT PMA?", "tax_genius"),
    ("Tax calculation example for PPh 21", "tax_genius"),
    ("Indonesian tax procedure step by step", "tax_genius"),
    ("Bali Zero tax service pricelist", "tax_genius"),

    # Tax Knowledge queries (should route to tax_knowledge)
    ("What is PPh 21 in Indonesia?", "tax_knowledge"),
    ("Indonesian tax regulations overview", "tax_knowledge"),
    ("NPWP requirements", "tax_knowledge"),

    # Legal Architect queries (should route to legal_architect or legal_updates)
    ("Indonesian real estate case law for foreigners", "legal_architect"),
    ("Property ownership regulations Indonesia", "legal_architect"),
    ("PT PMA company formation requirements", "legal_architect"),

    # KBLI queries (should route to kbli_comprehensive or kbli_eye)
    ("KBLI automotive manufacturing code", "kbli_comprehensive"),
    ("Business classification restaurant Bali", "kbli_comprehensive"),
    ("OSS NIB business license", "kbli_comprehensive"),

    # Visa queries (should route to visa_oracle)
    ("KITAS E23 working permit price", "visa_oracle"),
    ("Visa requirements for Indonesia", "visa_oracle"),

    # Property queries (should route to property_knowledge)
    ("Real estate investment Bali", "property_knowledge"),
    ("Villa ownership structure Indonesia", "property_knowledge")
]

def test_routing(router: QueryRouter):
    """Test query routing accuracy"""
    print("\n" + "=" * 80)
    print("🎯 QUERY ROUTING ACCURACY TEST")
    print("=" * 80)

    correct_routes = 0
    total_routes = len(TEST_QUERIES)

    results = []

    for query, expected_collection in TEST_QUERIES:
        routed_collection, confidence, fallbacks = router.route_with_confidence(query)
        is_correct = routed_collection == expected_collection

        if is_correct:
            correct_routes += 1
            status = "✅"
        else:
            status = "❌"

        results.append({
            "query": query,
            "expected": expected_collection,
            "routed": routed_collection,
            "correct": is_correct,
            "confidence": confidence,
            "fallbacks": len(fallbacks) - 1
        })

        print(f"{status} Query: '{query[:60]}...'")
        print(f"   Expected: {expected_collection}")
        print(f"   Routed:   {routed_collection} (confidence={confidence:.2f})")
        if not is_correct:
            print(f"   ⚠️  MISMATCH!")
        print()

    accuracy = (correct_routes / total_routes * 100) if total_routes > 0 else 0

    print("=" * 80)
    print(f"📊 ROUTING ACCURACY: {correct_routes}/{total_routes} ({accuracy:.1f}%)")
    print("=" * 80)

    return accuracy, results

def test_search_performance(embedder: EmbeddingsGenerator, chroma_path: str):
    """Test ChromaDB search performance with 12,904 docs"""
    print("\n" + "=" * 80)
    print("⚡ CHROMADB SEARCH PERFORMANCE TEST (12,904 docs)")
    print("=" * 80)

    collections_to_test = [
        "tax_genius",
        "legal_architect",
        "kbli_comprehensive",
        "visa_oracle",
        "property_knowledge"
    ]

    test_queries_performance = [
        "How to calculate tax in Indonesia?",
        "Real estate law for foreigners",
        "KBLI restaurant business code",
        "KITAS E23 working permit",
        "Property investment Bali"
    ]

    performance_results = []

    for collection_name in collections_to_test:
        try:
            client = ChromaDBClient(persist_directory=chroma_path, collection_name=collection_name)

            # Get collection size
            collection_size = client.collection.count()

            print(f"\n📂 Collection: {collection_name} ({collection_size} docs)")

            collection_times = []

            for query in test_queries_performance:
                # Generate embedding
                start_time = time.time()
                query_embedding = embedder.generate_query_embedding(query)
                embedding_time = time.time() - start_time

                # Search
                start_time = time.time()
                results = client.search(query_embedding=query_embedding, limit=5)
                search_time = time.time() - start_time

                total_time = embedding_time + search_time
                collection_times.append(total_time)

                num_results = len(results.get("documents", []))
                avg_distance = sum(results.get("distances", [])) / len(results.get("distances", [])) if results.get("distances") else 0

                print(f"   Query: '{query[:50]}...'")
                print(f"   Time:  {total_time*1000:.1f}ms (embed: {embedding_time*1000:.1f}ms, search: {search_time*1000:.1f}ms)")
                print(f"   Results: {num_results}, Avg distance: {avg_distance:.4f}")

            avg_time = sum(collection_times) / len(collection_times) if collection_times else 0
            print(f"   ⏱️  Average time: {avg_time*1000:.1f}ms")

            performance_results.append({
                "collection": collection_name,
                "size": collection_size,
                "avg_time_ms": avg_time * 1000,
                "times": collection_times
            })

        except Exception as e:
            print(f"   ❌ Error testing {collection_name}: {e}")

    print("\n" + "=" * 80)
    print("📊 PERFORMANCE SUMMARY")
    print("=" * 80)

    total_docs = sum(r["size"] for r in performance_results)
    overall_avg = sum(r["avg_time_ms"] for r in performance_results) / len(performance_results) if performance_results else 0

    print(f"Total documents tested: {total_docs}")
    print(f"Overall avg query time: {overall_avg:.1f}ms")
    print(f"Performance target: <500ms (✅ PASS)" if overall_avg < 500 else f"Performance target: <500ms (❌ FAIL)")

    return performance_results

def main():
    print("🚀 Query Routing & ChromaDB Performance Test Suite")
    print("=" * 80)

    # Initialize components
    print("\n📊 Initializing components...")
    router = QueryRouter()
    embedder = EmbeddingsGenerator()
    chroma_path = os.getenv("CHROMA_DB_PATH", "/Users/antonellosiano/Desktop/DATABASE/CHROMADB_BACKUP/chroma_db")
    print(f"   ChromaDB path: {chroma_path}")
    print("   ✅ Ready")

    # Test 1: Routing Accuracy
    routing_accuracy, routing_results = test_routing(router)

    # Test 2: Search Performance
    performance_results = test_search_performance(embedder, chroma_path)

    # Final Summary
    print("\n" + "=" * 80)
    print("✅ TEST SUITE COMPLETE")
    print("=" * 80)
    print(f"Routing Accuracy:        {routing_accuracy:.1f}%")
    print(f"Avg Search Performance:  {sum(r['avg_time_ms'] for r in performance_results) / len(performance_results):.1f}ms")
    print("=" * 80)

    # Pass/Fail criteria
    routing_pass = routing_accuracy >= 80.0
    performance_pass = all(r["avg_time_ms"] < 500 for r in performance_results)

    if routing_pass and performance_pass:
        print("🎉 ALL TESTS PASSED")
        return 0
    else:
        print("⚠️  SOME TESTS FAILED")
        if not routing_pass:
            print("   - Routing accuracy below 80%")
        if not performance_pass:
            print("   - Search performance above 500ms threshold")
        return 1

if __name__ == "__main__":
    exit(main())
