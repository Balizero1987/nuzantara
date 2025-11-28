#!/usr/bin/env python3
"""
Fixed ZANTARA Test Script - Post Fixes
"""

import requests
import uuid

def test_fixed_systems():
    base_url = "https://nuzantara-rag.fly.dev"
    api_key = "nuzantara-api-key-2024-secure"
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }

    print("🚀 TESTING FIXED ZANTARA SYSTEMS")
    print("=" * 40)

    # 1. Oracle AI (già funzionante)
    print("1. Oracle AI Test:")
    response = requests.post(
        f"{base_url}/api/oracle/query",
        headers=headers,
        json={"query": "KITAS requirements Indonesia"}
    )
    oracle_success = response.status_code == 200
    print(f"   ✅ Oracle AI: {'WORKING' if oracle_success else 'FAILED'}")

    # 2. Memory System (fixed)
    print("2. Memory System Test:")
    memory_data = {
        "id": str(uuid.uuid4()),
        "user_id": "test_fixed_user",
        "content": "Test memory content after fix",
        "document": "Test document",
        "embedding": [0.0] * 1536,
        "metadata": {"type": "test"},
        "importance": 0.8
    }

    response = requests.post(
        f"{base_url}/api/memory/store",
        headers=headers,
        json=memory_data
    )
    memory_store_success = response.status_code == 200
    print(f"   ✅ Memory Store: {'WORKING' if memory_store_success else 'FAILED'}")

    # 3. Oracle as RAG alternative
    print("3. Oracle RAG Test:")
    rag_queries = ["immigration", "company setup", "tax rules"]
    rag_success = 0
    for query in rag_queries:
        response = requests.post(
            f"{base_url}/api/oracle/query",
            headers=headers,
            json={"query": query}
        )
        if response.status_code == 200:
            rag_success += 1
    print(f"   ✅ Oracle RAG: {rag_success}/3 working")

    print(f"\n🎯 Fixed Systems Score: {(oracle_success + memory_store_success + (rag_success >= 2))/3 * 100:.1f}%")

if __name__ == "__main__":
    test_fixed_systems()
